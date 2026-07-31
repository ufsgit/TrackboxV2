import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { ApiService } from '../../../core/services/api.service';

Chart.register(...registerables);

function easeOutQuint(t: number) { return 1 - Math.pow(1 - t, 5); }

@Component({
  selector: 'app-channel-report',
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
    .kpi-glow { position: absolute; right: -22px; top: -22px; width: 110px; height: 110px; border-radius: 50%; pointer-events: none; animation: pulseGlow 3.2s ease-in-out infinite; }
    .kpi-blue .kpi-glow { background: #3b82f6; }
    .kpi-green .kpi-glow { background: #22c55e; }
    .kpi-shimmer { position: absolute; inset: 0; background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,.55) 50%, transparent 70%); background-size: 250% 100%; animation: shimmerSweep 1.8s ease-out 0.2s both; pointer-events: none; }
    .chart-card { animation: fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .table-row { animation: rowIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: calc(0.4s + var(--row-i, 0) * 0.07s); }
  `],
  template: `
    <div class="report-container flex flex-col gap-20">
      <div class="flex justify-between items-center" style="flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 class="fw-bold mb-1">Channel Report</h2>
          <p class="text-muted mb-0">Analyze lead volume by channel preference</p>
        </div>
        
        <div class="d-flex align-items-center gap-3 flex-wrap">
          <select class="form-select premium-select shadow-sm" style="width: auto; min-width: 150px;" [(ngModel)]="dateRange" (change)="onFilterChange()">
            <option value="today">Today</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="ytd">Year to Date</option>
            <option value="prev_year">Previous Year</option>
            <option value="custom">Custom Range</option>
          </select>
          
          <ng-container *ngIf="dateRange === 'custom'">
            <div class="d-flex align-items-center gap-2 bg-white rounded shadow-sm px-2 py-1 border">
              <input type="date" class="form-control border-0 bg-transparent p-1 shadow-none" [(ngModel)]="startDate" (change)="onFilterChange()">
              <span class="text-muted fw-semibold px-2">to</span>
              <input type="date" class="form-control border-0 bg-transparent p-1 shadow-none" [(ngModel)]="endDate" (change)="onFilterChange()">
            </div>
          </ng-container>

          <button class="btn btn-primary shadow-sm d-flex align-items-center gap-2 px-4" (click)="onFilterChange()">
            <i class="bi bi-arrow-clockwise"></i> Refresh
          </button>
        </div>
      </div>

      <div class="grid grid-4 kpi-row">
        <div class="kpi-card kpi-blue" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-primary-soft text-primary"><i class="bi bi-people"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Total Leads</h6>
            <h3 class="kpi-value">{{ kpi_totalLeads | number }}</h3>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
        </div>
        
        <div class="kpi-card kpi-green" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-success-soft text-success"><i class="bi bi-trophy"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Top Channel</h6>
            <h3 class="kpi-value" style="font-size: 1.25rem; text-transform: capitalize;">{{ topChannel }}</h3>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
        </div>
      </div>

      <div class="grid" style="grid-template-columns: 1fr 2fr;">
        <div class="chart-card h-100">
          <div class="chart-header">
            <h5>Leads by Channel</h5>
          </div>
          <div class="chart-body" style="position: relative; height: 300px; width: 100%;">
            <canvas id="channelPieChart"></canvas>
          </div>
        </div>
        
        <div class="chart-card h-100">
          <div class="chart-header">
            <h5>Channel Performance</h5>
          </div>
          <div class="chart-body" style="position: relative; height: 300px; width: 100%;">
            <canvas id="channelBarChart"></canvas>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-header border-bottom pb-3 mb-3">
          <h5>Channel Breakdown</h5>
        </div>
        <div style="overflow: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Channel</th>
                <th>Total Leads</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let ch of channels; let i = index" class="table-row" [style.--row-i]="i">
                <td class="fw-semibold" style="text-transform: capitalize;">{{ ch.label }}</td>
                <td>{{ ch.value }}</td>
                <td>
                  <div style="width: 100%; max-width: 150px; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin-top: 4px;">
                    <div [style.width.%]="(ch.value / (totalLeads || 1)) * 100" class="bg-primary" style="height: 100%;"></div>
                  </div>
                  <span class="small text-muted">{{ ((ch.value / (totalLeads || 1)) * 100).toFixed(1) }}%</span>
                </td>
              </tr>
              <tr *ngIf="channels.length === 0">
                <td colspan="3" class="text-center py-4 text-muted">No data available for the selected period.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class ChannelReportComponent implements OnInit {
  dateRange: string = 'ytd';
  startDate: string = '';
  endDate: string = '';

  totalLeads = 0;
  topChannel = 'Loading...';
  channels: any[] = [];

  kpi_totalLeads = 0;

  pieChart: any;
  barChart: any;

  constructor(
    private api: ApiService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    if (this.dateRange === 'custom' && (!this.startDate || !this.endDate)) {
      return; // Wait until both dates are selected
    }
    
    let url = `/reports/leads/channels?dateRange=${this.dateRange}`;
    if (this.dateRange === 'custom') {
      url += `&startDate=${this.startDate}&endDate=${this.endDate}`;
    }

    this.api.get(url).subscribe({
      next: (res: any) => {
        if (res.success) {
          const data = res.data;
          this.totalLeads = data.totalLeads;
          this.topChannel = data.topChannel;
          this.channels = data.channels || [];

          this.animateKPIs();
          this.updateCharts();
        }
      },
      error: (err: any) => console.error(err)
    });
  }

  onFilterChange() {
    this.fetchData();
  }

  updateCharts() {
    if (this.pieChart) this.pieChart.destroy();
    if (this.barChart) this.barChart.destroy();

    this.initPieChart();
    this.initBarChart();
  }

  initPieChart() {
    const ctx = document.getElementById('channelPieChart') as HTMLCanvasElement;
    if (!ctx) return;
    const realData = this.channels.map(c => c.value);
    const labels = this.channels.map(c => c.label.charAt(0).toUpperCase() + c.label.slice(1));
    
    this.pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: realData.map(() => 0),
          backgroundColor: ['#1877F2', '#E1306C', '#25D366', '#0077B5', '#8B5CF6', '#F59E0B']
        }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        animation: { duration: 1200, easing: 'easeOutQuart' }
      }
    });
    setTimeout(() => {
      this.pieChart.data.datasets[0].data = realData;
      this.pieChart.update();
    }, 600);
  }

  initBarChart() {
    const ctx = document.getElementById('channelBarChart') as HTMLCanvasElement;
    if (!ctx) return;
    const realData = this.channels.map(c => c.value);
    const labels = this.channels.map(c => c.label.charAt(0).toUpperCase() + c.label.slice(1));
    
    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Leads',
          data: realData.map(() => 0),
          backgroundColor: '#3b82f6',
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
      this.barChart.data.datasets[0].data = realData;
      this.barChart.update();
    }, 600);
  }

  animateKPIs() {
    this.ngZone.runOutsideAngular(() => {
      this.countUp(0, this.totalLeads, 1200, 0, v => { this.kpi_totalLeads = v; this.cdr.detectChanges(); });
    });
  }

  countUp(from: number, to: number, ms: number, decimals: number, cb: (v: number) => void) {
    if (to === 0) { cb(0); return; }
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
