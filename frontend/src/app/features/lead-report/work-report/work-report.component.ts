import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { ApiService } from '../../../core/services/api.service';
import { SystemSettingsService } from '../../../core/services/system-settings.service';
import { AuthService } from '../../../core/services/auth.service';

function easeOutQuint(t: number) { return 1 - Math.pow(1 - t, 5); }

Chart.register(...registerables);

@Component({
  selector: 'app-work-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './work-report.component.html',
  styleUrls: ['./work-report.component.css']
})
export class WorkReportComponent implements OnInit {
  dateRange: string = 'this_month';
  selectedAgent: string = 'all';

  totalLeads = 0;
  followUpsCompleted = 0;
  totalConversions = 0;
  conversionRate = 0;

  kpi_totalLeads = 0;
  kpi_followUpsCompleted = 0;
  kpi_totalConversions = 0;
  kpi_conversionRate = 0;

  activityChart: any;
  funnelChart: any;
  agentChart: any;

  recentActivities: any[] = [];
  totalRecentActivities: number = 0;
  agents: any[] = [];

  // Pagination
  currentPage: number = 1;
  pageSize: number = 5;

  get totalPages(): number {
    return Math.ceil(this.totalRecentActivities / this.pageSize) || 1;
  }

  get paginationStart(): number {
    if (this.totalRecentActivities === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalRecentActivities);
  }

  get pages(): number[] {
    const list: number[] = [];
    const total = this.totalPages;
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(total, start + 4);
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    for (let i = start; i <= end; i++) {
      list.push(i);
    }
    return list;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.fetchData();
    }
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.fetchData();
  }

  constructor(
    private api: ApiService,
    private systemSettingsService: SystemSettingsService,
    private auth: AuthService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchData();
    this.loadAgents();
  }

  loadAgents() {
    this.systemSettingsService.getTeams().subscribe({
      next: (res: any) => {
        if (res.success) {
          const allAgents = res.data;
          this.auth.currentUser$.subscribe(user => {
            if (user) {
              const currentUserObj = allAgents.find((a: any) => a.id === user.id);
              if (currentUserObj && currentUserObj.member_ids) {
                // Only show agents that are in the current user's personal team members array
                this.agents = allAgents.filter((a: any) => currentUserObj.member_ids.includes(a.id));
              } else {
                this.agents = [];
              }
            }
          });
        }
      },
      error: (err: any) => console.error('Error loading agents', err)
    });
  }

  fetchData() {
    let url = `/reports/work?dateRange=${this.dateRange}&page=${this.currentPage}&limit=${this.pageSize}`;
    if (this.selectedAgent !== 'all') {
      url += `&agent=${this.selectedAgent}`;
    }
    this.api.get(url).subscribe({
      next: (res: any) => {
        if (res.success) {
          const data = res.data;
          this.totalLeads = data.totalLeads || 0;
          this.followUpsCompleted = data.followUpsCompleted || 0;
          this.totalConversions = data.totalConversions || 0;
          this.conversionRate = data.conversionRate || 0;
          this.recentActivities = data.recentActivities || [];
          this.totalRecentActivities = data.recentActivitiesTotal || 0;
          
          this.animateKPIs();
          this.updateCharts(data);
        }
      },
      error: (err: any) => console.error(err)
    });
  }

  onFilterChange() {
    this.currentPage = 1;
    this.fetchData();
  }

  updateCharts(data: any) {
    if (this.activityChart) this.activityChart.destroy();
    if (this.funnelChart) this.funnelChart.destroy();
    if (this.agentChart) this.agentChart.destroy();
    
    const funnelLabels = data.funnelData.map((d: any) => d.name);
    const funnelValues = data.funnelData.map((d: any) => d.count);
    this.initFunnelChart(funnelLabels, funnelValues);
    
    const agentLabels = data.agentData.map((d: any) => d.agent);
    const leadsHandled = data.agentData.map((d: any) => d.leadsHandled);
    const conversions = data.agentData.map((d: any) => d.conversions);
    this.initAgentChart(agentLabels, leadsHandled, conversions);

    if (data.activityLabels && data.activityData) {
      this.initActivityChart(data.activityLabels, data.activityData, data.followUpTrendData);
    } else {
      this.initActivityChart([], []);
    }
  }

  initActivityChart(labels: string[], callsData: number[], followUpData?: number[]) {
    const ctx = document.getElementById('activityChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    if (this.activityChart) {
      this.activityChart.destroy();
      this.activityChart = null;
    }
    
    const realLabels = labels.length ? labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const realCallsData = callsData.length ? callsData : [0, 0, 0, 0, 0, 0, 0];
    const realFollowUpData = followUpData && followUpData.length ? followUpData : [];

    const datasets: any[] = [
      {
        label: 'Leads Received',
        data: realCallsData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.12)',
        borderWidth: 2.5,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#3b82f6',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ];

    if (realFollowUpData.length) {
      datasets.push({
        label: 'Follow-ups Completed',
        data: realFollowUpData,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.08)',
        borderWidth: 2.5,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#8b5cf6',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      });
    }

    this.activityChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: realLabels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              boxWidth: 12,
              font: { family: 'Plus Jakarta Sans', size: 12, weight: 'bold' },
              color: '#475569'
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleFont: { size: 13, family: 'Plus Jakarta Sans', weight: 'bold' },
            bodyFont: { size: 13, family: 'Plus Jakarta Sans' },
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0, color: '#94a3b8' },
            grid: { color: 'rgba(226, 232, 240, 0.6)' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8', font: { size: 11 } }
          }
        },
        animation: { duration: 1000, easing: 'easeOutQuart' }
      }
    });
  }

  initFunnelChart(labels: string[], values: number[]) {
    const ctx = document.getElementById('funnelChart') as HTMLCanvasElement;
    if (!ctx) return;
    const realLabels = labels.length ? labels : ['No Data'];
    const realValues = values.length ? values : [0];
    this.funnelChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: realLabels,
        datasets: [{
          label: 'Count',
          data: realValues.map(() => 0),
          backgroundColor: ['#94a3b8', '#60a5fa', '#f59e0b', '#10b981'],
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Lead Conversion Funnel' }
        },
        scales: { x: { beginAtZero: true } },
        animation: { duration: 1200, easing: 'easeOutQuart' }
      }
    });
    setTimeout(() => {
      this.funnelChart.data.datasets[0].data = realValues;
      this.funnelChart.update();
    }, 600);
  }

  initAgentChart(labels: string[], leads: number[], convs: number[]) {
    const ctx = document.getElementById('agentChart') as HTMLCanvasElement;
    if (!ctx) return;
    const realLabels = labels.length ? labels : ['No Data'];
    const realLeads = leads.length ? leads : [0];
    const realConvs = convs.length ? convs : [0];
    this.agentChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: realLabels,
        datasets: [
          {
            label: 'Leads Handled',
            data: realLeads.map(() => 0),
            backgroundColor: '#818cf8',
            borderRadius: 4
          },
          {
            label: 'Conversions',
            data: realConvs.map(() => 0),
            backgroundColor: '#10b981',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true } },
        animation: { duration: 1200, easing: 'easeOutQuart' }
      }
    });
    setTimeout(() => {
      this.agentChart.data.datasets[0].data = realLeads;
      this.agentChart.data.datasets[1].data = realConvs;
      this.agentChart.update();
    }, 600);
  }

  animateKPIs() {
    this.ngZone.runOutsideAngular(() => {
      this.countUp(0, this.totalLeads, 1200, 0, v => { this.kpi_totalLeads = v; this.cdr.detectChanges(); });
      this.countUp(0, this.followUpsCompleted, 1200, 0, v => { this.kpi_followUpsCompleted = v; this.cdr.detectChanges(); });
      this.countUp(0, this.totalConversions, 1200, 0, v => { this.kpi_totalConversions = v; this.cdr.detectChanges(); });
      this.countUp(0, this.conversionRate, 1200, 1, v => { this.kpi_conversionRate = v; this.cdr.detectChanges(); });
    });
  }

  countUp(from: number, to: number, ms: number, decimals: number, cb: (v: number) => void) {
    const startTime = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - startTime) / ms, 1);
      const eased = easeOutQuint(p);
      cb(+(from + (to - from) * eased).toFixed(decimals));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}


