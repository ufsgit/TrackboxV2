import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-employee-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="report-container flex flex-col gap-20">
      <div class="flex justify-between items-center" style="flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 class="fw-bold mb-1">Employee Report</h2>
          <p class="text-muted mb-0">Monitor agent performance and activity levels</p>
        </div>
        
        <div class="flex items-center gap-16" style="flex-wrap: wrap;">
          <select class="form-select premium-select shadow-sm" [(ngModel)]="dateRange" (change)="onFilterChange()">
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
          </select>
          <button class="btn btn-primary shadow-sm" (click)="onFilterChange()">
            <i class="bi bi-arrow-clockwise me-2"></i> Refresh
          </button>
        </div>
      </div>

      <div class="grid grid-4">
        <div class="kpi-card" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-primary-soft text-primary"><i class="bi bi-person-badge-fill"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Active Agents</h6>
            <h3 class="kpi-value">{{ activeAgents }}</h3>
          </div>
        </div>
        <div class="kpi-card" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-warning-soft text-warning"><i class="bi bi-list-task"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Total Tasks Completed</h6>
            <h3 class="kpi-value">{{ totalTasks }}</h3>
          </div>
        </div>
        <div class="kpi-card" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-success-soft text-success"><i class="bi bi-star-fill"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Top Performer</h6>
            <h3 class="kpi-value" style="font-size: 1.25rem;">{{ topPerformer }}</h3>
            <span class="kpi-trend text-muted">Most conversions</span>
          </div>
        </div>
        <div class="kpi-card" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-info-soft text-info"><i class="bi bi-speedometer2"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Avg Leads per Agent</h6>
            <h3 class="kpi-value">{{ avgLeads }}</h3>
          </div>
        </div>
      </div>

      <div class="grid" style="grid-template-columns: 2fr 1fr;">
        <div class="chart-card h-100">
          <div class="chart-header">
            <h5>Agent Performance Comparison</h5>
          </div>
          <div class="chart-body" style="position: relative; height: 300px; width: 100%;">
            <canvas id="performanceChart"></canvas>
          </div>
        </div>
        <div class="chart-card h-100">
          <div class="chart-header">
            <h5>Activity Breakdown</h5>
          </div>
          <div class="chart-body" style="position: relative; height: 300px; width: 100%;">
            <canvas id="activityRadarChart"></canvas>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-header border-bottom pb-3 mb-3">
          <h5>Agent Detail Logs</h5>
        </div>
        <div style="overflow: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Agent Name</th>
                <th>Leads Assigned</th>
                <th>Follow-ups</th>
                <th>Conversions</th>
                <th>Win Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let agent of agentDetails">
                <td>
                  <div class="flex items-center gap-8">
                    <div class="avatar-sm bg-primary-soft text-primary" style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                      {{ agent.name.charAt(0) }}
                    </div>
                    <span class="fw-semibold">{{ agent.name }}</span>
                  </div>
                </td>
                <td>{{ agent.assigned }}</td>
                <td>{{ agent.followups }}</td>
                <td>{{ agent.conversions }}</td>
                <td>
                  <span class="badge badge-success">{{ agent.winRate }}%</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class EmployeeReportComponent implements OnInit {
  dateRange: string = 'this_month';

  activeAgents = 14;
  totalTasks = 2140;
  topPerformer = 'Alice Smith';
  avgLeads = 42;

  performanceChart: any;
  activityRadarChart: any;

  agentDetails = [
    { name: 'Alice Smith', assigned: 150, followups: 120, conversions: 25, winRate: 16.6 },
    { name: 'Bob Johnson', assigned: 130, followups: 90, conversions: 12, winRate: 9.2 },
    { name: 'Charlie Brown', assigned: 180, followups: 160, conversions: 22, winRate: 12.2 },
    { name: 'Diana Prince', assigned: 105, followups: 100, conversions: 18, winRate: 17.1 },
    { name: 'Eva Green', assigned: 90, followups: 85, conversions: 15, winRate: 16.6 }
  ];

  ngOnInit() {
    setTimeout(() => {
      this.initPerformanceChart();
      this.initRadarChart();
    }, 100);
  }

  onFilterChange() {
    this.totalTasks = Math.floor(Math.random() * 3000) + 1000;
    if (this.performanceChart) this.performanceChart.destroy();
    if (this.activityRadarChart) this.activityRadarChart.destroy();
    this.initPerformanceChart();
    this.initRadarChart();
  }

  initPerformanceChart() {
    const ctx = document.getElementById('performanceChart') as HTMLCanvasElement;
    if (!ctx) return;
    this.performanceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.agentDetails.map(a => a.name),
        datasets: [
          {
            label: 'Leads Assigned',
            data: this.agentDetails.map(a => a.assigned),
            backgroundColor: '#818CF8',
            borderRadius: 4
          },
          {
            label: 'Conversions',
            data: this.agentDetails.map(a => a.conversions),
            backgroundColor: '#10B981',
            borderRadius: 4
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  initRadarChart() {
    const ctx = document.getElementById('activityRadarChart') as HTMLCanvasElement;
    if (!ctx) return;
    this.activityRadarChart = new Chart(ctx, {
      type: 'polarArea',
      data: {
        labels: ['Calls', 'Emails', 'Meetings', 'Chats'],
        datasets: [{
          data: [120, 80, 45, 200],
          backgroundColor: [
            'rgba(79, 70, 229, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(59, 130, 246, 0.7)'
          ]
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
  }
}
