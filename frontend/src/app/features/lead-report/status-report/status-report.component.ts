import { Component, OnInit, NgZone, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
    @keyframes spin { 100% { transform: rotate(360deg); } }
    @keyframes dropdownIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

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

    /* Custom Dropdown Panels */
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

    /* Badges & Placeholders */
    .badge-status { font-size: 0.75rem; padding: 4px 8px; border-radius: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }
    .badge-pending { background-color: #fef3c7; color: #d97706; }
    .badge-won { background-color: #dcfce7; color: #15803d; }
    .badge-lost { background-color: #fee2e2; color: #b91c1c; }
    .badge-default { background-color: #f1f5f9; color: #475569; }
    .empty-chart-placeholder { height: 100%; min-height: 250px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; }

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
          <h2 class="fw-bold mb-1">Status Report</h2>
          <p class="text-muted mb-0">Overview of your sales pipeline and lead stages</p>
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
                  <input type="date" class="modern-date-input" [(ngModel)]="customStartDate">
                </div>
                <div class="custom-date-row">
                  <label>End Date</label>
                  <input type="date" class="modern-date-input" [(ngModel)]="customEndDate">
                </div>
                <button class="btn-apply-custom" (click)="applyCustomDate()">Apply Filter</button>
              </div>
            </div>
          </div>

          <div class="filter-divider"></div>

          <!-- Refresh -->
          <button class="btn-refresh-toolbar" (click)="onRefresh()" [class.spinning]="isLoading" title="Refresh Report">
            <i class="bi bi-arrow-clockwise"></i>
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
            <span class="kpi-trend text-success"><i class="bi bi-arrow-up-right"></i> {{ wonRate }}%</span>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
        </div>
        <div class="kpi-card kpi-red" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-danger-soft text-danger"><i class="bi bi-x-circle-fill"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Closed Lost</h6>
            <h3 class="kpi-value">{{ kpi_closedLost | number }}</h3>
            <span class="kpi-trend text-danger"><i class="bi bi-arrow-down-right"></i> {{ lostRate }}%</span>
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
            <canvas id="lossReasonChart" [style.display]="hasLossData ? 'block' : 'none'"></canvas>
            <div *ngIf="!hasLossData" class="empty-chart-placeholder">
              <i class="bi bi-pie-chart text-muted mb-2" style="font-size: 2.5rem; opacity: 0.35;"></i>
              <span class="fw-semibold text-sm">No sales loss data recorded</span>
              <span class="text-xs text-muted">All active leads are currently in pipeline</span>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-header border-bottom pb-3 mb-3 flex justify-between items-center">
          <h5 class="mb-0">Stale Leads (Action Required)</h5>
          <span class="badge bg-danger-soft text-danger fw-semibold" *ngIf="staleLeads.length > 0">
            {{ staleLeads.length }} leads need attention
          </span>
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
                <td class="fw-semibold">
                  <span class="cursor-pointer text-primary hover-underline" (click)="followUp(lead)">
                    {{ lead.name }}
                  </span>
                  <div class="text-xs text-muted" *ngIf="lead.phone">{{ lead.phone }}</div>
                </td>
                <td>
                  <span class="badge-status" [ngClass]="getStatusBadge(lead.status)">
                    {{ lead.status }}
                  </span>
                </td>
                <td class="text-danger fw-bold">{{ lead.days }} Days</td>
                <td>{{ lead.assignedTo }}</td>
                <td>
                  <button class="btn btn-sm btn-primary" (click)="followUp(lead)">
                    <i class="bi bi-telephone-outbound me-1"></i> Follow-up
                  </button>
                </td>
              </tr>
              <tr *ngIf="staleLeads.length === 0">
                <td colspan="5" class="text-center py-4 text-muted">
                  <i class="bi bi-check2-circle text-success me-2" style="font-size: 1.25rem;"></i>
                  <span>No stale leads requiring action in this timeframe</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Server-Side Pagination -->
        <div class="pagination-row" *ngIf="totalStaleLeads > 0">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span class="pagination-info">
              Showing <strong>{{ paginationStart }}</strong> - <strong>{{ paginationEnd }}</strong> of <strong>{{ totalStaleLeads }}</strong> leads
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
export class StatusReportComponent implements OnInit {
  dateRange: string = 'this_month';
  customStartDate: string = '';
  customEndDate: string = '';
  isDateDropdownOpen: boolean = false;

  openLeads = 0;
  closedWon = 0;
  closedLost = 0;
  wonRate = '0';
  lostRate = '0';

  kpi_openLeads = 0;
  kpi_closedWon = 0;
  kpi_closedLost = 0;

  pipelineChart: any;
  lossReasonChart: any;

  staleLeads: any[] = [];
  totalStaleLeads: number = 0;
  isLoading = false;
  hasLossData = false;

  // Server-Side Pagination
  currentPage: number = 1;
  pageSize: number = 5;

  get totalPages(): number {
    return Math.ceil(this.totalStaleLeads / this.pageSize) || 1;
  }

  get paginationStart(): number {
    if (this.totalStaleLeads === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalStaleLeads);
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
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  @HostListener('document:click')
  onDocumentClick() {
    this.isDateDropdownOpen = false;
  }

  ngOnInit() {
    this.fetchData();
  }

  toggleDateDropdown(e: Event) {
    e.stopPropagation();
    this.isDateDropdownOpen = !this.isDateDropdownOpen;
  }

  selectDateRange(range: string) {
    this.dateRange = range;
    if (range !== 'custom') {
      this.isDateDropdownOpen = false;
      this.currentPage = 1;
      this.fetchData();
    }
  }

  applyCustomDate() {
    if (this.customStartDate && this.customEndDate) {
      this.isDateDropdownOpen = false;
      this.currentPage = 1;
      this.fetchData();
    }
  }

  onRefresh() {
    this.fetchData();
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

  fetchData() {
    this.isLoading = true;
    let url = `/reports/leads/status?dateRange=${this.dateRange}&page=${this.currentPage}&limit=${this.pageSize}`;
    if (this.dateRange === 'custom' && this.customStartDate && this.customEndDate) {
      url += `&startDate=${this.customStartDate}&endDate=${this.customEndDate}`;
    }

    this.api.get(url).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success) {
          const data = res.data;
          this.openLeads = data.openLeads || 0;
          this.closedWon = data.closedWon || 0;
          this.closedLost = data.closedLost || 0;
          this.wonRate = data.wonRate || '0';
          this.lostRate = data.lostRate || '0';
          this.staleLeads = data.staleLeads || [];
          this.totalStaleLeads = data.staleLeadsTotal !== undefined ? data.staleLeadsTotal : this.staleLeads.length;

          this.hasLossData = !!(data.lossValues && data.lossValues.some((v: number) => v > 0));

          this.animateKPIs();
          this.updateCharts(data);
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Failed to load status report data:', err);
        this.cdr.detectChanges();
      }
    });
  }

  followUp(lead: any) {
    if (lead.phone || lead.name) {
      this.router.navigate(['/contacts'], { queryParams: { search: lead.phone || lead.name } });
    } else {
      this.router.navigate(['/pending-followup']);
    }
  }

  getStatusBadge(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('won') || s.includes('converted')) return 'badge-won';
    if (s.includes('lost')) return 'badge-lost';
    if (s.includes('pending') || s.includes('follow')) return 'badge-pending';
    return 'badge-default';
  }

  updateCharts(data: any) {
    if (this.pipelineChart) this.pipelineChart.destroy();
    if (this.lossReasonChart) this.lossReasonChart.destroy();

    this.initPipelineChart(data.pipelineLabels || [], data.pipelineValues || [], data.pipelineColors);
    if (this.hasLossData) {
      this.initLossReasonChart(data.lossLabels || [], data.lossValues || []);
    }
  }

  initPipelineChart(labels: string[], values: number[], customColors?: string[]) {
    const ctx = document.getElementById('pipelineChart') as HTMLCanvasElement;
    if (!ctx) return;

    const defaultColors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#EC4899', '#06B6D4', '#9CA3AF'];
    const colors = (customColors && customColors.length) ? customColors : defaultColors;

    this.pipelineChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Leads',
          data: values.map(() => 0),
          backgroundColor: colors.slice(0, labels.length),
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
              label: (context) => ` ${context.parsed.y} Leads`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        },
        animation: { duration: 1200, easing: 'easeOutQuart' }
      }
    });

    setTimeout(() => {
      if (this.pipelineChart) {
        this.pipelineChart.data.datasets[0].data = values;
        this.pipelineChart.update();
      }
    }, 400);
  }

  initLossReasonChart(labels: string[], values: number[]) {
    const ctx = document.getElementById('lossReasonChart') as HTMLCanvasElement;
    if (!ctx) return;

    const colors = ['#EF4444', '#F97316', '#6B7280', '#9CA3AF', '#8B5CF6', '#EC4899'];

    this.lossReasonChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values.map(() => 0),
          backgroundColor: colors.slice(0, labels.length)
        }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        },
        animation: { duration: 1200, easing: 'easeOutQuart' }
      }
    });

    setTimeout(() => {
      if (this.lossReasonChart) {
        this.lossReasonChart.data.datasets[0].data = values;
        this.lossReasonChart.update();
      }
    }, 400);
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
