import { Component, OnInit, NgZone, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { ApiService } from '../../../core/services/api.service';

Chart.register(...registerables);

function easeOutQuint(t: number) { return 1 - Math.pow(1 - t, 5); }

@Component({
  selector: 'app-conversation-report',
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

    .report-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
    .kpi-row .kpi-card { position: relative; overflow: hidden; animation: cardIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; border-radius: 12px; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.05); }
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
    
    .chart-card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.05); animation: fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .grid:nth-of-type(2) .chart-card:nth-child(1) { animation-delay: 0.2s; }
    .grid:nth-of-type(2) .chart-card:nth-child(2) { animation-delay: 0.3s; }
    .table-row { animation: rowIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: calc(0.4s + var(--row-i, 0) * 0.07s); }

    /* Modern Filter Toolbar */
    .filter-toolbar {
      display: inline-flex;
      align-items: center;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      gap: 2px;
    }
    .filter-dropdown-wrapper { position: relative; }
    .filter-item {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 12px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      color: #334155;
      cursor: pointer;
      user-select: none;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .filter-item:hover, .filter-item.active { background: #f1f5f9; color: #0f172a; }
    .filter-icon { color: #64748b; font-size: 0.95rem; }
    .filter-caret { font-size: 0.7rem; color: #94a3b8; transition: transform 0.2s ease; }
    .filter-item.active .filter-caret { transform: rotate(180deg); }
    .filter-divider { width: 1px; height: 20px; background: #e2e8f0; margin: 0 4px; }
    .btn-refresh-toolbar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-refresh-toolbar:hover { background: #f1f5f9; color: #4338ca; }
    .btn-refresh-toolbar.spinning i { display: inline-block; animation: spin 0.8s linear infinite; }

    /* Custom Dropdown Panel */
    .custom-dropdown-panel {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      z-index: 1050;
      padding: 8px;
      animation: dropdownIn 0.15s ease-out forwards;
    }
    .date-panel { width: 260px; }
    .dropdown-list { max-height: 280px; overflow-y: auto; }
    .dropdown-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      color: #334155;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .dropdown-option:hover { background: #f8fafc; color: #0f172a; }
    .dropdown-option.selected { background: #eef2ff; color: #4f46e5; font-weight: 600; }
    .opt-check { color: #4f46e5; font-size: 0.9rem; }
    
    .custom-date-inputs {
      border-top: 1px solid #f1f5f9;
      margin-top: 8px;
      padding-top: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .custom-date-row { display: flex; flex-direction: column; gap: 4px; }
    .custom-date-row label { font-size: 0.72rem; font-weight: 600; color: #64748b; text-transform: uppercase; }
    .modern-date-input {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 8px;
      font-size: 0.8rem;
      color: #1e293b;
      outline: none;
    }
    .modern-date-input:focus { border-color: #6366f1; ring: 2px solid rgba(99, 102, 241, 0.2); }
    .btn-apply-custom {
      margin-top: 4px;
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 7px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-apply-custom:hover { background: #4338ca; }

    .data-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .data-table th { text-align: left; padding: 12px 16px; background: #f8fafc; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; border-bottom: 2px solid #e2e8f0; }
    .data-table td { padding: 16px; border-bottom: 1px solid #e2e8f0; color: #334155; vertical-align: middle; }
    .data-table tbody tr:hover { background-color: #f8fafc; }
    .badge { padding: 6px 10px; border-radius: 6px; font-weight: 600; font-size: 0.8rem; }
    .badge-whatsapp { background: #dcfce7; color: #166534; }
    .badge-sms { background: #dbeafe; color: #1e40af; }
    .badge-email { background: #fef3c7; color: #92400e; }
    .badge-webchat { background: #e0e7ff; color: #4338ca; }

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
    .filter-select:focus { border-color: #4f46e5; }
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
    .pag-btn.active { background: #4f46e5; border-color: #4f46e5; color: #fff; }
    .pag-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  `],
  template: `
    <div class="report-container flex flex-col gap-20">
      <!-- Header -->
      <div class="flex justify-between items-center" style="flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 class="fw-bold mb-1">Conversation Report</h2>
          <p class="text-muted mb-0">Analysis of messaging metrics and response times</p>
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
          <button class="btn-refresh-toolbar" (click)="fetchData()" [class.spinning]="loading" title="Refresh Report">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-4 kpi-row">
        <div class="kpi-card kpi-blue" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-primary-soft text-primary"><i class="bi bi-send-fill"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title text-muted mb-1" style="font-size: 0.82rem; font-weight: 600;">Messages Sent</h6>
            <h3 class="kpi-value mb-0 fw-bold">{{ kpi_messagesSent | number }}</h3>
            <span class="kpi-trend text-muted small" style="font-size: 0.75rem;">Outbound volume</span>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
        </div>
        <div class="kpi-card kpi-green" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-success-soft text-success"><i class="bi bi-chat-left-dots-fill"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title text-muted mb-1" style="font-size: 0.82rem; font-weight: 600;">Messages Received</h6>
            <h3 class="kpi-value mb-0 fw-bold">{{ kpi_messagesReceived | number }}</h3>
            <span class="kpi-trend text-muted small" style="font-size: 0.75rem;">Inbound volume</span>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
        </div>
        <div class="kpi-card kpi-orange" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-warning-soft text-warning"><i class="bi bi-stopwatch-fill"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title text-muted mb-1" style="font-size: 0.82rem; font-weight: 600;">Avg Response Time</h6>
            <h3 class="kpi-value mb-0 fw-bold">{{ kpi_avgResponseTime }}m</h3>
            <span class="kpi-trend text-muted small" style="font-size: 0.75rem;">First reply speed</span>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
        </div>
        <div class="kpi-card kpi-purple" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-info-soft text-info"><i class="bi bi-robot"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title text-muted mb-1" style="font-size: 0.82rem; font-weight: 600;">Human Handled</h6>
            <h3 class="kpi-value mb-0 fw-bold">{{ kpi_botHandoff }}%</h3>
            <span class="kpi-trend text-muted small" style="font-size: 0.75rem;">Assigned agents</span>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid" style="grid-template-columns: 2fr 1fr;">
        <div class="chart-card h-100">
          <div class="chart-header mb-3">
            <h5 class="fw-bold mb-0">Message Volume Trend</h5>
          </div>
          <div class="chart-body" style="position: relative; height: 300px; width: 100%;">
            <canvas id="volumeChart"></canvas>
          </div>
        </div>
        <div class="chart-card h-100">
          <div class="chart-header mb-3">
            <h5 class="fw-bold mb-0">Messages by Channel</h5>
          </div>
          <div class="chart-body" style="position: relative; height: 300px; width: 100%;">
            <canvas id="channelChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="chart-card">
        <div class="chart-header border-bottom pb-3 mb-3 flex justify-between items-center">
          <h5 class="fw-bold mb-0">Recent Conversations</h5>
          <span class="badge bg-primary-soft text-primary" *ngIf="recentMessages.length > 0">
            {{ recentMessages.length }} Conversations
          </span>
        </div>
        <div style="overflow: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Channel</th>
                <th>Last Message</th>
                <th>Handled By</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="loading">
                <td colspan="5" class="text-center py-4 text-muted">
                  <i class="bi bi-arrow-clockwise spinning me-2"></i> Loading conversation records...
                </td>
              </tr>
              <tr *ngIf="!loading && recentMessages.length === 0">
                <td colspan="5" class="text-center py-4 text-muted">
                  No conversation records found for the selected period.
                </td>
              </tr>
              <tr *ngFor="let msg of recentMessages; let i = index" class="table-row" [style.--row-i]="i">
                <td class="fw-semibold">{{ msg.contact }}</td>
                <td>
                  <span class="badge" [ngClass]="getChannelBadgeClass(msg.channel)">
                    {{ msg.channel }}
                  </span>
                </td>
                <td class="text-muted" style="max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  {{ msg.message }}
                </td>
                <td>{{ msg.handledBy }}</td>
                <td class="text-muted small">{{ msg.time | date:'MMM d, h:mm a' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Server-Side Pagination -->
        <div class="pagination-row" *ngIf="totalRecentMessages > 0">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span class="pagination-info">
              Showing <strong>{{ paginationStart }}</strong> - <strong>{{ paginationEnd }}</strong> of <strong>{{ totalRecentMessages }}</strong> conversations
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
export class ConversationReportComponent implements OnInit {
  dateRange: string = 'this_month';
  startDate: string = '';
  endDate: string = '';
  isDateDropdownOpen: boolean = false;
  loading: boolean = false;

  messagesSent = 0;
  messagesReceived = 0;
  avgResponseTime = 0;
  botHandoff = 0;

  kpi_messagesSent = 0;
  kpi_messagesReceived = 0;
  kpi_avgResponseTime = 0;
  kpi_botHandoff = 0;

  volumeChart: any;
  channelChart: any;

  recentMessages: any[] = [];
  totalRecentMessages: number = 0;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 5;

  get totalPages(): number {
    return Math.ceil(this.totalRecentMessages / this.pageSize) || 1;
  }

  get paginationStart(): number {
    if (this.totalRecentMessages === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalRecentMessages);
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
    if (this.startDate && this.endDate) {
      this.isDateDropdownOpen = false;
      this.currentPage = 1;
      this.fetchData();
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

  getChannelBadgeClass(channel: string): string {
    const ch = (channel || '').toLowerCase();
    if (ch.includes('whatsapp')) return 'badge-whatsapp';
    if (ch.includes('sms')) return 'badge-sms';
    if (ch.includes('email')) return 'badge-email';
    return 'badge-webchat';
  }

  fetchData() {
    this.loading = true;
    let url = `/reports/conversation?dateRange=${this.dateRange}&page=${this.currentPage}&limit=${this.pageSize}`;
    if (this.dateRange === 'custom' && this.startDate && this.endDate) {
      url += `&startDate=${this.startDate}&endDate=${this.endDate}`;
    }

    this.api.get(url).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          const data = res.data;
          this.messagesSent = data.messagesSent || 0;
          this.messagesReceived = data.messagesReceived || 0;
          this.avgResponseTime = data.avgResponseTime || 0;
          this.botHandoff = data.botHandoff || 0;
          this.recentMessages = data.recentMessages || [];
          this.totalRecentMessages = data.recentMessagesTotal || 0;
          
          this.animateKPIs();
          
          setTimeout(() => {
            if (this.volumeChart) this.volumeChart.destroy();
            if (this.channelChart) this.channelChart.destroy();
            this.initVolumeChart(data.volumeData, data.volumeLabels);
            this.initChannelChart(data.channelData);
          }, 50);
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Failed to fetch conversation report:', err);
        this.cdr.detectChanges();
      }
    });
  }

  initVolumeChart(dataArray?: number[], labelArray?: string[]) {
    const ctx = document.getElementById('volumeChart') as HTMLCanvasElement;
    if (!ctx) return;
    const realData = dataArray || [0, 0, 0, 0, 0, 0, 0];
    const labels = labelArray && labelArray.length ? labelArray : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    this.volumeChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Messages',
          data: realData,
          borderColor: '#4F46E5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#4F46E5',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        }
      }
    });
  }

  initChannelChart(dataArray?: number[]) {
    const ctx = document.getElementById('channelChart') as HTMLCanvasElement;
    if (!ctx) return;
    const realData = dataArray || [0, 0, 0, 0];
    this.channelChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['WhatsApp', 'SMS', 'Email', 'Web Chat'],
        datasets: [{
          data: realData,
          backgroundColor: ['#25D366', '#3B82F6', '#F59E0B', '#10B981']
        }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12, padding: 12 }
          }
        }
      }
    });
  }

  animateKPIs() {
    this.ngZone.runOutsideAngular(() => {
      this.countUp(0, this.messagesSent, 800, 0, v => { this.kpi_messagesSent = v; this.cdr.detectChanges(); });
      this.countUp(0, this.messagesReceived, 800, 0, v => { this.kpi_messagesReceived = v; this.cdr.detectChanges(); });
      this.countUp(0, this.avgResponseTime, 800, 1, v => { this.kpi_avgResponseTime = v; this.cdr.detectChanges(); });
      this.countUp(0, this.botHandoff, 800, 0, v => { this.kpi_botHandoff = v; this.cdr.detectChanges(); });
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
