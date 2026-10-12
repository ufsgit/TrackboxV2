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

    /* Modern Pagination */
    .pagination-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
      margin-top: 16px;
    }
    .pagination-info { font-size: 0.85rem; color: #64748b; }
    .filter-select {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 5px 10px;
      font-size: 0.82rem;
      color: #334155;
      background: #fff;
      outline: none;
      cursor: pointer;
    }
    .filter-select:focus { border-color: #6366f1; }
    .pag-btn {
      min-width: 32px;
      height: 32px;
      padding: 0 8px;
      border: 1px solid #e2e8f0;
      background: white;
      border-radius: 8px;
      color: #475569;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }
    .pag-btn:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; color: #1e293b; }
    .pag-btn.active { background: #6366f1; border-color: #6366f1; color: #fff; }
    .pag-btn:disabled { opacity: 0.45; cursor: not-allowed; }
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
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
          </select>
          <button class="btn btn-primary shadow-sm" (click)="onFilterChange()">
            <i class="bi bi-arrow-clockwise me-2"></i> Refresh
          </button>
        </div>
      </div>

      <div class="grid grid-4 kpi-row scroll-3d-reveal scroll-delay-1">
        <div class="kpi-card kpi-blue card-3d-hover" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-primary-soft text-primary"><i class="bi bi-box-arrow-in-right"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Total Enquiries</h6>
            <h3 class="kpi-value">{{ kpi_totalEnquiries | number }}</h3>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
        </div>
        <div class="kpi-card kpi-orange card-3d-hover" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-warning-soft text-warning"><i class="bi bi-currency-dollar"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">High-Value Enquiries</h6>
            <h3 class="kpi-value">{{ kpi_highValue }}</h3>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
        </div>
        <div class="kpi-card kpi-green card-3d-hover" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-success-soft text-success"><i class="bi bi-facebook"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Top Source</h6>
            <h3 class="kpi-value" style="font-size: 1.25rem;">{{ topSource }}</h3>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
        </div>
        <div class="kpi-card kpi-purple card-3d-hover" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-info-soft text-info"><i class="bi bi-lightning-fill"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Avg Lead Score</h6>
            <h3 class="kpi-value">{{ kpi_avgLeadScore }}/100</h3>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
        </div>
      </div>

      <div class="grid scroll-3d-reveal scroll-delay-2" style="grid-template-columns: 1fr 2fr;">
        <div class="chart-card h-100 tilt-3d">
          <div class="chart-header">
            <h5>Enquiries by Source</h5>
          </div>
          <div class="chart-body" style="position: relative; height: 300px; width: 100%;">
            <canvas id="sourceChart"></canvas>
          </div>
        </div>
        <div class="chart-card h-100 tilt-3d">
          <div class="chart-header">
            <h5>Product/Service Categories</h5>
          </div>
          <div class="chart-body" style="position: relative; height: 300px; width: 100%;">
            <canvas id="categoryChart"></canvas>
          </div>
        </div>
      </div>

      <div class="chart-card scroll-3d-reveal scroll-delay-3 tilt-3d">
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
              <tr *ngIf="recentEnquiries.length === 0">
                <td colspan="5" class="text-center py-4 text-muted">
                  No enquiries found for the selected period.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination-row" *ngIf="totalRecentEnquiries > 0">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span class="pagination-info">
              Showing <strong>{{ paginationStart }}</strong> - <strong>{{ paginationEnd }}</strong> of <strong>{{ totalRecentEnquiries }}</strong> enquiries
            </span>
            <select class="filter-select" [(ngModel)]="pageSize" (change)="onPageSizeChange()">
              <option [value]="5">5 / page</option>
              <option [value]="10">10 / page</option>
              <option [value]="20">20 / page</option>
            </select>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;" *ngIf="totalPages > 1">
            <button class="pag-btn" (click)="goToPage(1)" [disabled]="currentPage === 1" title="First">
              <i class="bi bi-chevron-double-left"></i>
            </button>
            <button class="pag-btn" (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 1" title="Previous">
              <i class="bi bi-chevron-left"></i>
            </button>
            <button *ngFor="let p of pages" class="pag-btn" [class.active]="p === currentPage" (click)="goToPage(p)">
              {{ p }}
            </button>
            <button class="pag-btn" (click)="goToPage(currentPage + 1)" [disabled]="currentPage === totalPages" title="Next">
              <i class="bi bi-chevron-right"></i>
            </button>
            <button class="pag-btn" (click)="goToPage(totalPages)" [disabled]="currentPage === totalPages" title="Last">
              <i class="bi bi-chevron-double-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class EnquiryReportComponent implements OnInit {
  dateRange: string = 'all';

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
  totalRecentEnquiries: number = 0;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 5;

  get totalPages(): number {
    return Math.ceil(this.totalRecentEnquiries / this.pageSize) || 1;
  }

  get paginationStart(): number {
    if (this.totalRecentEnquiries === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalRecentEnquiries);
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
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.api.get(`/reports/leads/enquiries?dateRange=${this.dateRange}&page=${this.currentPage}&limit=${this.pageSize}`).subscribe({
      next: (res: any) => {
        if (res.success) {
          const data = res.data;
          this.totalEnquiries = data.totalEnquiries;
          this.highValue = data.highValue;
          this.topSource = data.topSource;
          this.avgLeadScore = data.avgLeadScore;
          this.recentEnquiries = data.recentEnquiries || [];
          this.totalRecentEnquiries = data.recentEnquiriesTotal || data.totalEnquiries || 0;

          this.animateKPIs();
          this.updateCharts(data.sources, data.categories);
        }
      },
      error: (err: any) => console.error(err)
    });
  }

  onFilterChange() {
    this.currentPage = 1;
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


