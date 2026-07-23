import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { ApiService } from '../../../core/services/api.service';

Chart.register(...registerables);

function easeOutQuint(t: number) { return 1 - Math.pow(1 - t, 5); }

@Component({
  selector: 'app-status-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes cardIn { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes shimmerSweep { from { background-position: 250% 0; } to { background-position: -250% 0; } }
    @keyframes pulseGlow { 0%, 100% { transform: scale(1); opacity: .1; } 50% { transform: scale(1.4); opacity: .2; } }
    @keyframes rowIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
    .kpi-row .kpi-card { position: relative; overflow: hidden; animation: cardIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .kpi-row .kpi-card:nth-child(1) { animation-delay: 0.08s; }
    .kpi-row .kpi-card:nth-child(2) { animation-delay: 0.18s; }
    .kpi-row .kpi-card:nth-child(3) { animation-delay: 0.28s; }
    .kpi-glow { position: absolute; right: -22px; top: -22px; width: 110px; height: 110px; border-radius: 50%; pointer-events: none; animation: pulseGlow 3.2s ease-in-out infinite; }
    .kpi-blue .kpi-glow { background: #3b82f6; }
    .kpi-green .kpi-glow { background: #22c55e; }
    .kpi-red .kpi-glow { background: #ef4444; }
    .kpi-shimmer { position: absolute; inset: 0; background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,.55) 50%, transparent 70%); background-size: 250% 100%; animation: shimmerSweep 1.8s ease-out 0.2s both; pointer-events: none; }
    .chart-card { animation: fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .grid:nth-of-type(2) .chart-card:nth-child(1) { animation-delay: 0.2s; }
    .grid:nth-of-type(2) .chart-card:nth-child(2) { animation-delay: 0.3s; }
    .table-row { animation: rowIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: calc(0.4s + var(--row-i, 0) * 0.07s); }
  `],
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

      <div class="grid grid-3 kpi-row">
        <div class="kpi-card kpi-blue" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-info-soft text-info"><i class="bi bi-funnel"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Open Leads</h6>
            <h3 class="kpi-value">{{ kpi_openLeads | number }}</h3>
            <span class="kpi-trend text-muted">Currently active</span>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
        </div>
        <div class="kpi-card kpi-green" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-success-soft text-success"><i class="bi bi-check-circle-fill"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Closed Won</h6>
            <h3 class="kpi-value">{{ kpi_closedWon | number }}</h3>
            <span class="kpi-trend text-success"><i class="bi bi-arrow-up-right"></i> 14%</span>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
        </div>
        <div class="kpi-card kpi-red" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-danger-soft text-danger"><i class="bi bi-x-circle-fill"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Closed Lost</h6>
            <h3 class="kpi-value">{{ kpi_closedLost | number }}</h3>
            <span class="kpi-trend text-danger"><i class="bi bi-arrow-up-right"></i> 3%</span>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
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
              <tr *ngFor="let lead of staleLeads; let i = index" class="table-row" [style.--row-i]="i">
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

  kpi_openLeads = 0;
  kpi_closedWon = 0;
  kpi_closedLost = 0;

  pipelineChart: any;
  lossReasonChart: any;

  staleLeads: any[] = [];

  constructor(
    private api: ApiService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

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
          data: values.map(() => 0),
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
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        plugins: { legend: { display: false } },
        animation: { duration: 1200, easing: 'easeOutQuart' }
      }
    });
    setTimeout(() => {
      this.pipelineChart.data.datasets[0].data = values;
      this.pipelineChart.update();
    }, 600);
  }

  initLossReasonChart(labels: string[], values: number[]) {
    const ctx = document.getElementById('lossReasonChart') as HTMLCanvasElement;
    if (!ctx) return;
    this.lossReasonChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values.map(() => 0),
          backgroundColor: ['#EF4444', '#F97316', '#6B7280', '#9CA3AF']
        }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        animation: { duration: 1200, easing: 'easeOutQuart' }
      }
    });
    setTimeout(() => {
      this.lossReasonChart.data.datasets[0].data = values;
      this.lossReasonChart.update();
    }, 600);
  }

  animateKPIs() {
    this.ngZone.runOutsideAngular(() => {
      this.countUp(0, this.openLeads, 1200, 0, v => { this.kpi_openLeads = v; this.cdr.detectChanges(); });
      this.countUp(0, this.closedWon, 1200, 0, v => { this.kpi_closedWon = v; this.cdr.detectChanges(); });
      this.countUp(0, this.closedLost, 1200, 0, v => { this.kpi_closedLost = v; this.cdr.detectChanges(); });
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

