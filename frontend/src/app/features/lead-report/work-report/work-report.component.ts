import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { ApiService } from '../../../core/services/api.service';
import { SystemSettingsService } from '../../../core/services/system-settings.service';
import { AuthService } from '../../../core/services/auth.service';

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

  activityChart: any;
  funnelChart: any;
  agentChart: any;

  recentActivities: any[] = [];
  agents: any[] = [];

  constructor(
    private api: ApiService,
    private systemSettingsService: SystemSettingsService,
    private auth: AuthService
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
          this.totalLeads = data.totalLeads;
          this.followUpsCompleted = data.followUpsCompleted;
          this.totalConversions = data.totalConversions;
          this.conversionRate = data.conversionRate;
          this.recentActivities = data.recentActivities;
          
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
    
    const randomData = () => Array.from({length: 7}, () => Math.floor(Math.random() * 50) + 10);
    
    this.activityChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Calls Made',
            data: randomData(),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Emails Sent',
            data: randomData(),
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
        plugins: {
          legend: { position: 'bottom' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  initFunnelChart(labels: string[], values: number[]) {
    const ctx = document.getElementById('funnelChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.funnelChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.length ? labels : ['No Data'],
        datasets: [{
          label: 'Count',
          data: values.length ? values : [0],
          backgroundColor: [
            '#94a3b8',
            '#60a5fa',
            '#f59e0b',
            '#10b981'
          ],
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y', // horizontal bar
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Lead Conversion Funnel' }
        },
        scales: {
          x: { beginAtZero: true }
        }
      }
    });
  }

  initAgentChart(labels: string[], leads: number[], convs: number[]) {
    const ctx = document.getElementById('agentChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.agentChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.length ? labels : ['No Data'],
        datasets: [
          {
            label: 'Leads Handled',
            data: leads.length ? leads : [0],
            backgroundColor: '#818cf8',
            borderRadius: 4
          },
          {
            label: 'Conversions',
            data: convs.length ? convs : [0],
            backgroundColor: '#10b981',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
}

