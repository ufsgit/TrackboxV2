import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { ApiService } from '../../../core/services/api.service';

Chart.register(...registerables);

@Component({
  selector: 'app-source-conversion-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="report-container flex flex-col gap-20">
      <div class="flex justify-between items-center" style="flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 class="fw-bold mb-1">Source Category Conversion Report</h2>
          <p class="text-muted mb-0">Track conversion rates based on source categories</p>
        </div>
        
        <!-- Modern Filter Toolbar -->
        <div class="filter-toolbar">
          <div class="filter-dropdown-wrapper">
            <div class="filter-item" (click)="toggleDateDropdown($event)" [class.active]="isDateDropdownOpen">
              <i class="bi bi-calendar3 filter-icon"></i>
              <span class="filter-value">{{ getDateRangeLabel() }}</span>
              <i class="bi bi-chevron-down filter-caret"></i>
            </div>
            
            <!-- Date Popup -->
            <div class="custom-dropdown-panel date-panel" *ngIf="isDateDropdownOpen" (click)="$event.stopPropagation()">
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
                <div class="dropdown-option" (click)="selectDateRange('all')" [class.selected]="dateRange === 'all'">
                  <span class="opt-name">All Time</span>
                  <i class="bi bi-check2 opt-check" *ngIf="dateRange === 'all'"></i>
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
          <button class="btn-refresh-toolbar" (click)="loadData()" [class.spinning]="loading" title="Refresh Report">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="chart-card h-100">
          <div class="chart-header">
            <h5>Conversion Rate by Category (%)</h5>
          </div>
          <div class="chart-body" style="position: relative; height: 350px; width: 100%;">
            <canvas id="conversionChart"></canvas>
          </div>
        </div>
        
        <div class="chart-card h-100">
          <div class="chart-header border-bottom pb-3 mb-3 flex justify-between items-center">
            <h5 class="mb-0">Data Breakdown</h5>
            <span class="badge bg-primary-soft text-primary" *ngIf="reportData.length > 0">
              {{ reportData.length }} Categories
            </span>
          </div>
          <div style="overflow: auto; max-height: 350px;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Total Leads</th>
                  <th>Converted</th>
                  <th>Conversion Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="loading">
                  <td colspan="4" class="text-center py-4 text-muted">
                    <i class="bi bi-arrow-clockwise spin me-2"></i> Loading data...
                  </td>
                </tr>
                <tr *ngIf="!loading && reportData.length === 0">
                  <td colspan="4" class="text-center py-4 text-muted">No data found for the selected period.</td>
                </tr>
                <tr *ngFor="let item of paginatedData">
                  <td class="fw-semibold">{{ item.category_name }}</td>
                  <td>{{ item.total_leads | number }}</td>
                  <td>{{ item.converted_leads | number }}</td>
                  <td>
                    <span class="badge" [ngClass]="getRateClass(item.conversion_rate)">
                      {{ item.conversion_rate }}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="pagination-row" *ngIf="reportData.length > 0">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span class="pagination-info">
                Showing <strong>{{ paginationStart }}</strong> - <strong>{{ paginationEnd }}</strong> of <strong>{{ reportData.length }}</strong> categories
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
    </div>
  `,
  styles: [`
    @keyframes spin { 100% { transform: rotate(360deg); } }
    @keyframes dropdownIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

    .report-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
    .gap-20 { gap: 20px; }
    .grid { display: grid; gap: 24px; }
    .grid-2 { grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); }
    .chart-card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.05); }
    .chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .chart-header h5 { margin: 0; font-weight: 700; color: #1e293b; font-size: 1.1rem; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .data-table th { text-align: left; padding: 12px 16px; background: #f8fafc; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; border-bottom: 2px solid #e2e8f0; }
    .data-table td { padding: 16px; border-bottom: 1px solid #e2e8f0; color: #334155; vertical-align: middle; }
    .data-table tbody tr:hover { background-color: #f8fafc; }
    .badge { padding: 6px 10px; border-radius: 6px; font-weight: 600; font-size: 0.8rem; }
    .bg-success-soft { background: #dcfce7; color: #166534; }
    .bg-warning-soft { background: #fef3c7; color: #92400e; }
    .bg-danger-soft { background: #fee2e2; color: #991b1b; }
    .bg-primary-soft { background: #e0e7ff; color: #4338ca; }

    /* Modern Filter Toolbar */
    .filter-toolbar {
      display: inline-flex;
      align-items: center;
      background: #ffffff;
      border-radius: 12px;
      padding: 0.35rem 0.5rem;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06);
      border: 1px solid #e2e8f0;
      position: relative;
    }

    .filter-dropdown-wrapper {
      position: relative;
    }

    .filter-item {
      display: flex;
      align-items: center;
      padding: 0.5rem 0.9rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
    }

    .filter-item:hover, .filter-item.active {
      background: #f1f5f9;
    }

    .filter-icon {
      color: #6366f1;
      margin-right: 0.6rem;
      font-size: 1.05rem;
    }

    .filter-value {
      color: #1e293b;
      font-size: 0.9rem;
      font-weight: 600;
      margin-right: 0.75rem;
      white-space: nowrap;
    }

    .filter-caret {
      color: #94a3b8;
      font-size: 0.75rem;
      transition: transform 0.2s ease;
    }

    .filter-item.active .filter-caret {
      transform: rotate(180deg);
    }

    .filter-divider {
      width: 1px;
      height: 24px;
      background: #e2e8f0;
      margin: 0 0.4rem;
    }

    .btn-refresh-toolbar {
      background: transparent;
      color: #64748b;
      border: none;
      height: 38px;
      width: 38px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 1.15rem;
    }

    .btn-refresh-toolbar:hover {
      background: #f1f5f9;
      color: #6366f1;
    }

    .btn-refresh-toolbar.spinning i {
      animation: spin 1s linear infinite;
    }

    .custom-dropdown-panel {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
      z-index: 1000;
      min-width: 230px;
      animation: dropdownIn 0.2s ease-out;
    }

    .dropdown-list {
      max-height: 280px;
      overflow-y: auto;
      padding: 0.5rem;
    }

    .dropdown-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.55rem 0.8rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
      font-size: 0.875rem;
      color: #334155;
      font-weight: 500;
    }

    .dropdown-option:hover {
      background: #f8fafc;
      color: #6366f1;
    }

    .dropdown-option.selected {
      background: rgba(99, 102, 241, 0.08);
      color: #6366f1;
      font-weight: 600;
    }

    .opt-check {
      color: #6366f1;
      font-size: 1rem;
    }

    .custom-date-inputs {
      padding: 0.75rem;
      border-top: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      background: #f8fafc;
      border-bottom-left-radius: 12px;
      border-bottom-right-radius: 12px;
    }

    .custom-date-row {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .custom-date-row label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .modern-date-input {
      padding: 0.4rem 0.6rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.85rem;
      outline: none;
      background: #ffffff;
      color: #1e293b;
    }

    .modern-date-input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
    }

    .btn-apply-custom {
      background: #6366f1;
      color: #ffffff;
      border: none;
      padding: 0.45rem;
      border-radius: 6px;
      font-size: 0.825rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      margin-top: 0.25rem;
    }

    .btn-apply-custom:hover {
      background: #4f46e5;
    }

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
  `]
})
export class SourceConversionReportComponent implements OnInit {
  dateRange: string = 'this_month';
  startDate: string = '';
  endDate: string = '';
  isDateDropdownOpen: boolean = false;
  reportData: any[] = [];
  loading = false;
  chartInstance: any = null;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 5;

  get totalPages(): number {
    return Math.ceil(this.reportData.length / this.pageSize) || 1;
  }

  get paginatedData(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.reportData.slice(start, start + this.pageSize);
  }

  get paginationStart(): number {
    if (this.reportData.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.reportData.length);
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
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onPageSizeChange() {
    this.currentPage = 1;
  }

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    this.endDate = today.toISOString().split('T')[0];
    this.startDate = thirtyDaysAgo.toISOString().split('T')[0];
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.isDateDropdownOpen = false;
  }

  ngOnInit() {
    this.loadData();
  }

  toggleDateDropdown(e: Event) {
    e.stopPropagation();
    this.isDateDropdownOpen = !this.isDateDropdownOpen;
  }

  selectDateRange(range: string) {
    this.dateRange = range;
    if (range !== 'custom') {
      this.isDateDropdownOpen = false;
      this.loadData();
    }
  }

  applyCustomDate() {
    if (this.startDate && this.endDate) {
      this.isDateDropdownOpen = false;
      this.loadData();
    }
  }

  getDateRangeLabel(): string {
    const labels: Record<string, string> = {
      'today': 'Today',
      'this_week': 'This Week',
      'this_month': 'This Month',
      'last_month': 'Last Month',
      'ytd': 'Year to Date',
      'all': 'All Time',
      'custom': 'Custom Range'
    };
    return labels[this.dateRange] || 'Select Date';
  }

  loadData() {
    this.loading = true;
    let url = `/reports/leads/source-conversion?dateRange=${this.dateRange}`;
    if (this.dateRange === 'custom' && this.startDate && this.endDate) {
      url += `&startDate=${this.startDate}&endDate=${this.endDate}`;
    }
    
    this.api.get(url).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.reportData = res.data || [];
          this.renderChart();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to load source conversion report:', err);
        this.cdr.detectChanges();
      }
    });
  }

  getRateClass(rate: number | string): string {
    const num = Number(rate);
    if (num >= 20) return 'bg-success-soft';
    if (num > 0) return 'bg-warning-soft';
    return 'bg-danger-soft';
  }

  renderChart() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
    const ctx = document.getElementById('conversionChart') as HTMLCanvasElement;
    if (!ctx) return;

    const labels = this.reportData.map(d => d.category_name);
    const data = this.reportData.map(d => Number(d.conversion_rate));
    const maxVal = Math.max(...data, 1);
    const suggestedMax = Math.min(Math.ceil(maxVal * 1.3), 100);

    const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
    const bgColors = this.reportData.map((_, i) => colors[i % colors.length]);

    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Conversion Rate (%)',
          data,
          backgroundColor: bgColors,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const item = this.reportData[ctx.dataIndex];
                return ` ${ctx.parsed.y}% (${item?.converted_leads || 0} won / ${item?.total_leads || 0} leads)`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: suggestedMax > 5 ? suggestedMax : 5,
            ticks: {
              callback: (val) => val + '%'
            }
          }
        }
      }
    });
  }
}
