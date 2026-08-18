import { Component, OnInit, NgZone, ChangeDetectorRef, HostListener } from '@angular/core';
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
    .progress-cell { display: flex; align-items: center; justify-content: flex-start; gap: 0.75rem; }
    .rate-text { font-weight: 600; color: #0f172a; }
    .progress-bar-bg { width: 60px; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
    .progress-bar-fill { height: 100%; background: linear-gradient(90deg, #38bdf8, #818cf8); border-radius: 3px; transition: width 1s ease-out; }
    .date-dropdown-trigger { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 8px 20px; font-weight: 600; font-size: 0.9rem; color: #475569; box-shadow: 0 2px 6px rgba(0,0,0,0.04); transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 8px; }
    .date-dropdown-trigger:hover, .date-dropdown-trigger.active { border-color: #a5b4fc; box-shadow: 0 4px 12px rgba(99,102,241,0.12); color: #4f46e5; background: #f8fafc; }
    .date-dropdown-trigger i.bi-calendar3 { color: #6366f1; transition: transform 0.2s ease; font-size: 1.05rem; }
    .date-dropdown-trigger.active i.bi-calendar3 { transform: scale(1.1); }
    .date-dropdown-trigger::after { margin-left: 6px; border-top: 0.35em solid #94a3b8; border-right: 0.35em solid transparent; border-left: 0.35em solid transparent; }
    .date-dropdown-menu { list-style: none !important; border: 1px solid rgba(255,255,255,0.7) !important; border-radius: 16px !important; box-shadow: 0 15px 35px rgba(15, 23, 42, 0.12), 0 5px 15px rgba(0,0,0,0.05) !important; padding: 10px !important; margin: 0 !important; margin-top: 8px !important; min-width: 220px !important; background: rgba(255, 255, 255, 0.95) !important; backdrop-filter: blur(12px) !important; -webkit-backdrop-filter: blur(12px) !important; position: absolute; right: 0; display: none; z-index: 1000; }
    .date-dropdown-menu.show { display: block; animation: dropdownFadeSlide 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .date-dropdown-menu li { list-style: none !important; margin: 0 !important; padding: 0 !important; }
    .date-dropdown-menu .dropdown-item { border-radius: 8px; padding: 10px 14px; font-size: 0.9rem; font-weight: 600; color: #475569; display: flex; align-items: center; gap: 12px; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); margin-bottom: 4px; cursor: pointer; }
    .date-dropdown-menu .dropdown-item:last-child { margin-bottom: 0; }
    .date-dropdown-menu .dropdown-item i { font-size: 1.1rem; color: #94a3b8; transition: all 0.2s ease; }
    .date-dropdown-menu .dropdown-item:hover { background-color: #f1f5f9; color: #4f46e5; transform: translateX(4px); }
    .date-dropdown-menu .dropdown-item:hover i { color: #6366f1; transform: scale(1.1); }
    .date-dropdown-menu .dropdown-item.active { background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; box-shadow: 0 4px 10px rgba(99,102,241,0.25); transform: none; }
    .date-dropdown-menu .dropdown-item.active i { color: #ffffff; }
    @keyframes dropdownFadeSlide { from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
  `],
  template: `
    <div class="report-container flex flex-col gap-20">
      <div class="flex justify-between items-center" style="flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 class="fw-bold mb-1">Channel Report</h2>
          <p class="text-muted mb-0">Analyze lead volume by channel preference</p>
        </div>
        
        <div class="d-flex align-items-center gap-3 flex-wrap">
          <button class="btn btn-primary shadow-sm d-flex align-items-center gap-2 px-4" (click)="onFilterChange()" style="border-radius: 20px;">
            <i class="bi bi-arrow-clockwise"></i> Refresh
          </button>

          <div class="dropdown" style="position: relative;">
            <button class="btn date-dropdown-trigger dropdown-toggle" [class.active]="isDropdownOpen" type="button" (click)="toggleDropdown($event)">
              <i class="bi bi-calendar3"></i>
              <span>{{ getDateRangeLabel(dateRange) }}</span>
            </button>
            <ul class="dropdown-menu date-dropdown-menu" [class.show]="isDropdownOpen">
              <li><a class="dropdown-item" [class.active]="dateRange === 'today'" (click)="selectDateRange('today')">
                <i class="bi bi-clock"></i> Today
              </a></li>
              <li><a class="dropdown-item" [class.active]="dateRange === 'this_month'" (click)="selectDateRange('this_month')">
                <i class="bi bi-calendar2-day"></i> This Month
              </a></li>
              <li><a class="dropdown-item" [class.active]="dateRange === 'last_month'" (click)="selectDateRange('last_month')">
                <i class="bi bi-calendar2-minus"></i> Last Month
              </a></li>
              <li><a class="dropdown-item" [class.active]="dateRange === 'ytd'" (click)="selectDateRange('ytd')">
                <i class="bi bi-calendar2-check"></i> Year to Date
              </a></li>
              <li><a class="dropdown-item" [class.active]="dateRange === 'prev_year'" (click)="selectDateRange('prev_year')">
                <i class="bi bi-calendar2-x"></i> Previous Year
              </a></li>
              <li><hr class="dropdown-divider" style="margin: 8px 0; border-color: #f1f5f9;"></li>
              <li><a class="dropdown-item" [class.active]="dateRange === 'custom'" (click)="selectDateRange('custom')">
                <i class="bi bi-sliders"></i> Custom Range
              </a></li>
            </ul>
          </div>
          
          <ng-container *ngIf="dateRange === 'custom'">
            <div class="d-flex align-items-center gap-2 bg-white rounded shadow-sm px-2 py-1 border">
              <input type="date" class="form-control border-0 bg-transparent p-1 shadow-none" [(ngModel)]="startDate" (change)="onFilterChange()">
              <span class="text-muted fw-semibold px-2">to</span>
              <input type="date" class="form-control border-0 bg-transparent p-1 shadow-none" [(ngModel)]="endDate" (change)="onFilterChange()">
            </div>
          </ng-container>
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
                  <div class="progress-cell">
                    <span class="rate-text text-muted small" style="width: 35px; text-align: left;">{{ ((ch.value / (totalLeads || 1)) * 100).toFixed(1) }}%</span>
                    <div class="progress-bar-bg">
                      <div class="progress-bar-fill" [style.width.%]="(ch.value / (totalLeads || 1)) * 100"></div>
                    </div>
                  </div>
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

  isDropdownOpen = false;

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  @HostListener('document:click')
  closeDropdown() {
    this.isDropdownOpen = false;
  }

  selectDateRange(range: string) {
    this.dateRange = range;
    this.isDropdownOpen = false;
    this.onFilterChange();
  }

  getDateRangeLabel(range: string): string {
    const labels: { [key: string]: string } = {
      'today': 'Today',
      'this_month': 'This Month',
      'last_month': 'Last Month',
      'ytd': 'Year to Date',
      'prev_year': 'Previous Year',
      'custom': 'Custom Range'
    };
    return labels[range] || 'Select Range';
  }

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
