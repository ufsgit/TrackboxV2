import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { ApiService } from '../../../core/services/api.service';

Chart.register(...registerables);

@Component({
  selector: 'app-status-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="report-container flex flex-col gap-20">
      <div class="flex justify-between items-center" style="flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 class="fw-bold mb-1">Status Report</h2>
          <p class="text-muted mb-0">Overview of your sales pipeline and lead stages</p>
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

      <div class="grid grid-3">
        <div class="kpi-card" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-info-soft text-info"><i class="bi bi-funnel"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Open Leads</h6>
            <h3 class="kpi-value">{{ openLeads | number }}</h3>
            <span class="kpi-trend text-muted">Currently active</span>
          </div>
        </div>
        <div class="kpi-card" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-success-soft text-success"><i class="bi bi-check-circle-fill"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Closed Won</h6>
            <h3 class="kpi-value">{{ closedWon | number }}</h3>
            <span class="kpi-trend text-success"><i class="bi bi-arrow-up-right"></i> 14%</span>
          </div>
        </div>
        <div class="kpi-card" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-danger-soft text-danger"><i class="bi bi-x-circle-fill"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Closed Lost</h6>
            <h3 class="kpi-value">{{ closedLost | number }}</h3>
            <span class="kpi-trend text-danger"><i class="bi bi-arrow-up-right"></i> 3%</span>
          </div>
        </div>
      </div>

      <div class="grid" style="grid-template-columns: 2fr 1fr;">
        <div class="chart-card h-100">
          <div class="chart-header">
            <h5>Pipeline Funnel</h5>
          </div>
          <div class="chart-body" style="position: relative; height: 300px; width: 100%;">
            <canvas id="pipelineChart"></canvas>
          </div>
        </div>
        <div class="chart-card h-100">
          <div class="chart-header">
            <h5>Sales Loss Reasons</h5>
          </div>
          <div class="chart-body" style="position: relative; height: 300px; width: 100%;">
            <canvas id="lossReasonChart"></canvas>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-header border-bottom pb-3 mb-3">
          <h5>Stale Leads (Action Required)</h5>
        </div>
        <div style="overflow: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Lead Name</th>
                <th>Current Status</th>
                <th>Days in Status</th>
                <th>Assigned To</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let lead of staleLeads">
                <td class="fw-semibold">{{ lead.name }}</td>
                <td>
                  <span class="badge" [ngClass]="{'badge-warning': lead.status === 'Contacted', 'badge-info': lead.status === 'New'}">
                    {{ lead.status }}
                  </span>
                </td>
                <td class="text-danger fw-bold">{{ lead.days }} Days</td>
                <td>{{ lead.assignedTo }}</td>
                <td>
                  <button class="btn btn-sm btn-primary">Follow-up</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class StatusReportComponent implements OnInit {
  dateRange: string = 'this_month';

  openLeads = 0;
  closedWon = 0;
  closedLost = 0;

  pipelineChart: any;
  lossReasonChart: any;

  staleLeads: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.api.get(`/reports/leads/status?dateRange=${this.dateRange}`).subscribe({
      next: (res: any) => {
        if (res.success) {
          const data = res.data;
          this.openLeads = data.openLeads;
          this.closedWon = data.closedWon;
          this.closedLost = data.closedLost;
          this.staleLeads = data.staleLeads;

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
    if (this.pipelineChart) this.pipelineChart.destroy();
    if (this.lossReasonChart) this.lossReasonChart.destroy();

    this.initPipelineChart(data.pipelineLabels, data.pipelineValues);
    this.initLossReasonChart(data.lossLabels, data.lossValues);
  }

  initPipelineChart(labels: string[], values: number[]) {
    const ctx = document.getElementById('pipelineChart') as HTMLCanvasElement;
    if (!ctx) return;
    this.pipelineChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Leads',
          data: values,
          backgroundColor: [
            '#9CA3AF',
            '#3B82F6',
            '#F59E0B',
            '#8B5CF6',
            '#10B981'
          ],
          borderRadius: 4
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  }

  initLossReasonChart(labels: string[], values: number[]) {
    const ctx = document.getElementById('lossReasonChart') as HTMLCanvasElement;
    if (!ctx) return;
    this.lossReasonChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: ['#EF4444', '#F97316', '#6B7280', '#9CA3AF']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
}
