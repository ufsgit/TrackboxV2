import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { ApiService } from '../../../core/services/api.service';


Chart.register(...registerables);

function easeOutQuint(t: number) { return 1 - Math.pow(1 - t, 5); }

@Component({
  selector: 'app-enquiry-report',
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
    .kpi-row .kpi-card:nth-child(4) { animation-delay: 0.38s; }
    .kpi-glow { position: absolute; right: -22px; top: -22px; width: 110px; height: 110px; border-radius: 50%; pointer-events: none; animation: pulseGlow 3.2s ease-in-out infinite; }
    .kpi-blue .kpi-glow { background: #3b82f6; }
    .kpi-green .kpi-glow { background: #22c55e; }
    .kpi-orange .kpi-glow { background: #f97316; }
    .kpi-purple .kpi-glow { background: #a855f7; }
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
          <h2 class="fw-bold mb-1">Enquiry Report</h2>
          <p class="text-muted mb-0">Discover where leads originate and what they want</p>
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

      <div class="grid grid-4 kpi-row">
        <div class="kpi-card kpi-blue" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-primary-soft text-primary"><i class="bi bi-box-arrow-in-right"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Total Enquiries</h6>
            <h3 class="kpi-value">{{ kpi_totalEnquiries | number }}</h3>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
        </div>
        <div class="kpi-card kpi-orange" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-warning-soft text-warning"><i class="bi bi-currency-dollar"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">High-Value Enquiries</h6>
            <h3 class="kpi-value">{{ kpi_highValue }}</h3>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
        </div>
        <div class="kpi-card kpi-green" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-success-soft text-success"><i class="bi bi-facebook"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Top Source</h6>
            <h3 class="kpi-value" style="font-size: 1.25rem;">{{ topSource }}</h3>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
        </div>
        <div class="kpi-card kpi-purple" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-info-soft text-info"><i class="bi bi-lightning-fill"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Avg Lead Score</h6>
            <h3 class="kpi-value">{{ kpi_avgLeadScore }}/100</h3>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
        </div>
      </div>

      <div class="grid" style="grid-template-columns: 1fr 2fr;">
        <div class="chart-card h-100">
          <div class="chart-header">
            <h5>Enquiries by Source</h5>
          </div>
          <div class="chart-body" style="position: relative; height: 300px; width: 100%;">
            <canvas id="sourceChart"></canvas>
          </div>
        </div>
        <div class="chart-card h-100">
          <div class="chart-header">
            <h5>Product/Service Categories</h5>
          </div>
          <div class="chart-body" style="position: relative; height: 300px; width: 100%;">
            <canvas id="categoryChart"></canvas>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-header border-bottom pb-3 mb-3">
          <h5>Recent High-Value Enquiries</h5>
        </div>
        <div style="overflow: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Lead Name</th>
                <th>Source</th>
                <th>Product/Service</th>
                <th>Score</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let eq of recentEnquiries; let i = index" class="table-row" [style.--row-i]="i">
                <td class="fw-semibold">{{ eq.name }}</td>
                <td><span class="badge badge-info">{{ eq.source }}</span></td>
                <td>{{ eq.product }}</td>
                <td>
                  <div style="width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin-top: 4px;">
                    <div [style.width.%]="eq.score" [ngStyle]="{'background-color': eq.score > 80 ? '#10B981' : '#F59E0B'}" style="height: 100%;"></div>
                  </div>
                  <span class="small text-muted">{{ eq.score }}</span>
                </td>
                <td class="text-muted small">{{ eq.date | date:'mediumDate' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class EnquiryReportComponent implements OnInit {
  dateRange: string = 'this_month';

  totalEnquiries = 0;
  highValue = 0;
  topSource = 'Loading...';
  avgLeadScore = 0;

  kpi_totalEnquiries = 0;
  kpi_highValue = 0;
  kpi_avgLeadScore = 0;

  sourceChart: any;
  categoryChart: any;

  recentEnquiries: any[] = [];

  constructor(
    private api: ApiService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.api.get(`/reports/leads/enquiries?dateRange=${this.dateRange}`).subscribe({
      next: (res: any) => {
        if (res.success) {
          const data = res.data;
          this.totalEnquiries = data.totalEnquiries;
          this.highValue = data.highValue;
          this.topSource = data.topSource;
          this.avgLeadScore = data.avgLeadScore;
          this.recentEnquiries = data.recentEnquiries;

          this.animateKPIs();
          this.updateCharts(data.sources, data.categories);
        }
      },
      error: (err: any) => console.error(err)
    });
  }

  onFilterChange() {
    this.fetchData();
  }

  updateCharts(sources: any[], categories: any[]) {
    if (this.sourceChart) this.sourceChart.destroy();
    if (this.categoryChart) this.categoryChart.destroy();

    this.initSourceChart(sources);
    this.initCategoryChart(categories);
  }

  initSourceChart(sources: any[]) {
    const ctx = document.getElementById('sourceChart') as HTMLCanvasElement;
    if (!ctx) return;
    const realData = sources.map(s => s.value);
    this.sourceChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: sources.map(s => s.label),
        datasets: [{
          data: realData.map(() => 0),
          backgroundColor: ['#1877F2', '#10B981', '#EA4335', '#F59E0B', '#8B5CF6']
        }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        animation: {
          duration: 1200,
          easing: 'easeOutQuart'
        }
      }
    });
    setTimeout(() => {
      this.sourceChart.data.datasets[0].data = realData;
      this.sourceChart.update();
    }, 600);
  }

  initCategoryChart(categories: any[]) {
    const ctx = document.getElementById('categoryChart') as HTMLCanvasElement;
    if (!ctx) return;
    const realData = categories.map(c => c.value);
    this.categoryChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: categories.map(c => c.label),
        datasets: [{
          label: 'Enquiries',
          data: realData.map(() => 0),
          backgroundColor: '#4F46E5',
          borderRadius: 4
        }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        plugins: { legend: { display: false } },
        animation: {
          duration: 1200,
          easing: 'easeOutQuart'
        }
      }
    });
    setTimeout(() => {
      this.categoryChart.data.datasets[0].data = realData;
      this.categoryChart.update();
    }, 600);
  }

  animateKPIs() {
    this.ngZone.runOutsideAngular(() => {
      this.countUp(0, this.totalEnquiries, 1200, 0, v => { this.kpi_totalEnquiries = v; this.cdr.detectChanges(); });
      this.countUp(0, this.highValue, 1200, 0, v => { this.kpi_highValue = v; this.cdr.detectChanges(); });
      this.countUp(0, this.avgLeadScore, 1200, 0, v => { this.kpi_avgLeadScore = v; this.cdr.detectChanges(); });
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

