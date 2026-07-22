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
  agents: any[] = [];

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
    let url = `/reports/work?dateRange=${this.dateRange}`;
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
          
          this.animateKPIs();
          this.updateCharts(data);
        }
      },
      error: (err: any) => console.error(err)
    });
  }

  onFilterChange() {
    this.fetchData();
  }

  updateCharts(data: any) {
    if (this.activityChart) this.activityChart.destroy();
    if (this.funnelChart) this.funnelChart.destroy();
    if (this.agentChart) this.agentChart.destroy();
    
    // We keep activity chart with dummy line data for now
    this.initActivityChart();
    
    const funnelLabels = data.funnelData.map((d: any) => d.name);
    const funnelValues = data.funnelData.map((d: any) => d.count);
    this.initFunnelChart(funnelLabels, funnelValues);
    
    const agentLabels = data.agentData.map((d: any) => d.agent);
    const leadsHandled = data.agentData.map((d: any) => d.leadsHandled);
    const conversions = data.agentData.map((d: any) => d.conversions);
    this.initAgentChart(agentLabels, leadsHandled, conversions);
  }

  initActivityChart() {
    const ctx = document.getElementById('activityChart') as HTMLCanvasElement;
    if (!ctx) return;
    const callsData = Array.from({length: 7}, () => Math.floor(Math.random() * 50) + 10);
    const emailsData = Array.from({length: 7}, () => Math.floor(Math.random() * 50) + 10);
    this.activityChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Calls Made',
            data: [0, 0, 0, 0, 0, 0, 0],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Emails Sent',
            data: [0, 0, 0, 0, 0, 0, 0],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
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
      this.activityChart.data.datasets[0].data = callsData;
      this.activityChart.data.datasets[1].data = emailsData;
      this.activityChart.update();
    }, 600);
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

