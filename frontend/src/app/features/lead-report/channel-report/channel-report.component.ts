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
    .header-actions { position: relative; z-index: 100; }
    .filter-toolbar { display: flex; align-items: center; background: #ffffff; border-radius: 12px; padding: 0.35rem; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.05); border: 1px solid #f1f5f9; flex-wrap: wrap; }
    .filter-dropdown-wrapper { position: relative; }
    .filter-item { display: flex; align-items: center; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; user-select: none; }
    .filter-item:hover, .filter-item.active { background: #f8fafc; }
    .filter-item.active { box-shadow: inset 0 0 0 1px rgba(139, 92, 246, 0.2); }
    .filter-icon { color: #8b5cf6; margin-right: 0.6rem; font-size: 1.1rem; }
    .filter-value { color: #334155; font-size: 0.95rem; font-weight: 500; margin-right: 0.75rem; white-space: nowrap; }
    .filter-caret { color: #94a3b8; font-size: 0.8rem; transition: transform 0.2s ease; }
    .filter-item.active .filter-caret { transform: rotate(180deg); }
    .filter-divider { width: 1px; height: 24px; background: #e2e8f0; margin: 0 0.5rem; }
    .btn-refresh-toolbar { background: transparent; color: #64748b; border: none; height: 38px; width: 38px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; font-size: 1.1rem; }
    .btn-refresh-toolbar:hover { background: #f8fafc; color: #8b5cf6; }
    .btn-refresh-toolbar.spinning i { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .custom-dropdown-panel { position: absolute; top: calc(100% + 8px); right: 0; background: white; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; z-index: 50; min-width: 220px; animation: dropdownIn 0.2s ease-out; }
    @keyframes dropdownIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
    .dropdown-list { max-height: 260px; overflow-y: auto; padding: 0.5rem; }
    .dropdown-list::-webkit-scrollbar { width: 6px; }
    .dropdown-list::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 4px; }
    .dropdown-option { display: flex; align-items: center; padding: 0.5rem; border-radius: 8px; cursor: pointer; transition: all 0.15s; margin: 0 !important; }
    .dropdown-option:hover { background: #f8fafc; }
    .dropdown-option.selected { background: rgba(139, 92, 246, 0.05); }
    .opt-name { font-size: 0.9rem; color: #334155; font-weight: 500; flex-grow: 1; margin: 0 !important; }
    .opt-check { color: #8b5cf6; font-size: 1.1rem; }
    .date-panel { min-width: 220px; }
    .custom-date-inputs { padding: 0.75rem; border-top: 1px solid #e2e8f0; background: #f8fafc; border-radius: 0 0 12px 12px; }
    .custom-date-row { margin-bottom: 0.75rem; }
    .custom-date-row label { display: block; font-size: 0.75rem; font-weight: 600; color: #64748b; margin-bottom: 0.25rem; }
    .modern-date-input { width: 100%; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.85rem; outline: none; color: #334155; box-sizing: border-box; }
    .modern-date-input:focus { border-color: #8b5cf6; box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1); }
    .btn-apply-custom { width: 100%; background: #8b5cf6; color: white; border: none; padding: 0.5rem; border-radius: 6px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
    .btn-apply-custom:hover { background: #7c3aed; }
    .title-section { flex: 1; min-width: 0; margin-right: 20px; }
  `],
  template: `
    <div class="report-container flex flex-col gap-20">
      <div class="flex justify-between items-center gap-16">
        <div class="title-section">
          <h2 class="fw-bold mb-1">Channel Report</h2>
          <p class="text-muted mb-0">Analyze lead volume by channel preference</p>
        </div>
        
        <div class="header-actions ms-auto">
          <div class="filter-toolbar">
            <!-- Custom Date / Period Filter -->
            <div class="filter-dropdown-wrapper">
              <div class="filter-item" (click)="toggleDropdown($event)" [class.active]="isDropdownOpen">
                <i class="bi bi-calendar3 filter-icon"></i>
                <span class="filter-value">{{ getDateRangeLabel(dateRange) }}</span>
                <i class="bi bi-chevron-down filter-caret"></i>
              </div>
              
              <!-- Date Popup -->
              <div class="custom-dropdown-panel date-panel" *ngIf="isDropdownOpen" (click)="$event.stopPropagation()">
                <div class="dropdown-list">
                  <div class="dropdown-option" (click)="selectDateRange('today')" [class.selected]="dateRange === 'today'">
                    <span class="opt-name">Today</span>
                    <i class="bi bi-check2 opt-check" *ngIf="dateRange === 'today'"></i>
                  </div>
                  <div class="dropdown-option" (click)="selectDateRange('this_week')" [class.selected]="dateRange === 'this_week'">
                    <span class="opt-name">This Week</span>
                    <i class="bi bi-check2 opt-check" *ngIf="dateRange === 'this_week'"></i>
                  </div>
                  <div class="dropdown-option" (click)="selectDateRange('this_month')" [class.selected]="dateRange === 'this_month'">
                    <span class="opt-name">This Month</span>
                    <i class="bi bi-check2 opt-check" *ngIf="dateRange === 'this_month'"></i>
                  </div>
                  <div class="dropdown-option" (click)="selectDateRange('last_month')" [class.selected]="dateRange === 'last_month'">
                    <span class="opt-name">Last Month</span>
                    <i class="bi bi-check2 opt-check" *ngIf="dateRange === 'last_month'"></i>
                  </div>
                  <div class="dropdown-option" (click)="selectDateRange('ytd')" [class.selected]="dateRange === 'ytd'">
                    <span class="opt-name">Year to Date</span>
                    <i class="bi bi-check2 opt-check" *ngIf="dateRange === 'ytd'"></i>
                  </div>
                  <div class="dropdown-option" (click)="selectDateRange('prev_year')" [class.selected]="dateRange === 'prev_year'">
                    <span class="opt-name">Previous Year</span>
                    <i class="bi bi-check2 opt-check" *ngIf="dateRange === 'prev_year'"></i>
                  </div>
                  <div class="dropdown-option" (click)="selectDateRange('custom')" [class.selected]="dateRange === 'custom'">
                    <span class="opt-name">Custom Range</span>
                    <i class="bi bi-check2 opt-check" *ngIf="dateRange === 'custom'"></i>
                  </div>
                </div>
                
                <!-- Custom Range Inputs -->
                <div class="custom-date-inputs" *ngIf="dateRange === 'custom'">
                  <div class="custom-date-row">
                    <label>Start Date</label>
                    <input type="date" class="modern-date-input" [(ngModel)]="startDate">
                  </div>
                  <div class="custom-date-row">
                    <label>End Date</label>
                    <input type="date" class="modern-date-input" [(ngModel)]="endDate">
                  </div>
                  <button class="btn-apply-custom" (click)="applyCustomDate()">Apply Filter</button>
                </div>
              </div>
            </div>

            <div class="filter-divider"></div>

            <!-- Refresh -->
            <button class="btn-refresh-toolbar" (click)="onFilterChange()" [class.spinning]="loading" title="Refresh Report">
              <i class="bi bi-arrow-clockwise"></i>
            </button>
          </div>
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
  loading: boolean = false;

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
    if (range !== 'custom') {
      this.isDropdownOpen = false;
      this.onFilterChange();
    }
  }

  applyCustomDate() {
    if (this.startDate && this.endDate) {
      this.isDropdownOpen = false;
      this.onFilterChange();
    }
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
    this.loading = true;
    if (this.dateRange === 'custom' && (!this.startDate || !this.endDate)) {
      this.loading = false;
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
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
      }
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
