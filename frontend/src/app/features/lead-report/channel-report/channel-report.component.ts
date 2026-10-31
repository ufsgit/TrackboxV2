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

    /* ── Interactive Clickable Elements ── */
    .clickable-card {
      cursor: pointer;
      transition: transform 0.22s ease, box-shadow 0.22s ease;
      user-select: none;
    }
    .clickable-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px -6px rgba(0,0,0,0.08), 0 4px 10px -2px rgba(0,0,0,0.04);
    }
    .clickable-card:active {
      transform: translateY(-1px);
    }
    .click-indicator {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.72rem;
      font-weight: 700;
      color: #64748b;
      margin-top: 6px;
      background: #f1f5f9;
      padding: 3px 8px;
      border-radius: 9999px;
      transition: all 0.2s;
    }
    .clickable-card:hover .click-indicator {
      background: #e0f2fe;
      color: #0284c7;
    }

    .clickable-row {
      cursor: pointer;
      transition: background-color 0.18s ease;
    }
    .clickable-row:hover {
      background-color: #f8fafc !important;
    }

    .btn-view-channel-leads {
      border: 1px solid #e2e8f0;
      background: #ffffff;
      color: #2563eb;
      font-size: 0.78rem;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.18s ease;
    }
    .btn-view-channel-leads:hover {
      background: #2563eb;
      color: #ffffff;
      border-color: #2563eb;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
    }

    /* ── Details Popup Modal ── */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      z-index: 1040;
      animation: fadeInModal 0.2s ease-out;
    }
    @keyframes fadeInModal { from { opacity: 0; } to { opacity: 1; } }

    .details-modal-wrapper {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
      padding: 20px;
      animation: scaleUpModal 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes scaleUpModal {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    .details-modal-content {
      background: #ffffff;
      width: 100%;
      max-width: 1050px;
      max-height: 88vh;
      border-radius: 20px;
      box-shadow: 0 24px 48px -12px rgba(15, 23, 42, 0.25);
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: #f8fafc;
    }
    .modal-title-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.72rem;
      font-weight: 700;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .modal-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: #0f172a;
      margin: 4px 0 2px 0;
      letter-spacing: -0.02em;
    }
    .modal-subtitle {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0;
    }
    .modal-total-badge {
      font-size: 0.8rem;
      font-weight: 800;
      background: #e0f2fe;
      color: #0284c7;
      padding: 6px 14px;
      border-radius: 9999px;
      white-space: nowrap;
    }
    .btn-close-modal {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #64748b;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.95rem;
    }
    .btn-close-modal:hover {
      background: #fee2e2;
      color: #ef4444;
      border-color: #fca5a5;
    }

    .modal-toolbar {
      padding: 14px 24px;
      background: #ffffff;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .modal-search-box {
      flex: 1;
      min-width: 260px;
      position: relative;
      display: flex;
      align-items: center;
    }
    .modal-search-icon {
      position: absolute;
      left: 12px;
      color: #94a3b8;
      font-size: 0.85rem;
    }
    .modal-search-input {
      width: 100%;
      padding: 9px 34px 9px 36px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.85rem;
      outline: none;
      transition: all 0.2s;
    }
    .modal-search-input:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
    }
    .btn-clear-search {
      position: absolute;
      right: 10px;
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 1rem;
    }
    .btn-modal-search {
      padding: 9px 18px;
      background: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-modal-search:hover { background: #1d4ed8; }
    .modal-page-size-box {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-left: auto;
    }
    .ps-label { font-size: 0.8rem; color: #64748b; font-weight: 600; }
    .modal-select-size {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 7px 10px;
      font-size: 0.82rem;
      color: #334155;
      outline: none;
      background: #ffffff;
    }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      max-height: calc(88vh - 200px);
      padding: 0;
    }
    .modal-loading-state,
    .modal-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: #64748b;
      text-align: center;
    }
    .modal-empty-state i { font-size: 2.5rem; color: #cbd5e1; margin-bottom: 10px; }
    .modal-empty-state h4 { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0 0 4px 0; }
    .modal-table-responsive { width: 100%; overflow-x: auto; }
    .modal-leads-table { width: 100%; border-collapse: collapse; text-align: left; }
    .modal-leads-table thead th {
      background: #f8fafc;
      color: #64748b;
      font-size: 0.73rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 12px 18px;
      border-bottom: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .modal-leads-table tbody td {
      padding: 14px 18px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .lead-modal-row:hover { background: #f8fbff; }
    .lead-info-cell { display: flex; align-items: center; gap: 12px; }
    .lead-initials-badge {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: #e0f2fe;
      color: #0369a1;
      font-weight: 700;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .lead-details-text { display: flex; flex-direction: column; gap: 2px; }
    .lead-name { font-weight: 700; color: #0f172a; font-size: 0.9rem; }
    .lead-contact-sub {
      font-size: 0.78rem;
      color: #64748b;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .lead-contact-sub i { font-size: 0.72rem; color: #94a3b8; }
    .lead-date-cell { display: flex; flex-direction: column; }
    .date-str { font-weight: 600; font-size: 0.85rem; color: #334155; }
    .time-str { font-size: 0.75rem; color: #94a3b8; }
    .channel-badge-tag {
      display: inline-flex;
      padding: 4px 10px;
      background: #eff6ff;
      color: #1d4ed8;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .stage-tag {
      display: inline-flex;
      padding: 4px 10px;
      background: #f1f5f9;
      color: #475569;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .conv-tag {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .conv-won { background: #dcfce7; color: #15803d; }
    .conv-progress { background: #eff6ff; color: #2563eb; }
    .assignee-cell {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      color: #334155;
      font-weight: 500;
    }
    .assignee-cell i { color: #8b5cf6; }
    .source-badge {
      display: inline-flex;
      padding: 3px 8px;
      background: #faf5ff;
      color: #7e22ce;
      border: 1px solid #f3e8ff;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 600;
    }

    .modal-footer {
      padding: 14px 24px;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .modal-pagination-summary { font-size: 0.82rem; color: #64748b; }
    .modal-pagination-controls { display: flex; align-items: center; gap: 4px; }
    .modal-pag-btn {
      min-width: 30px;
      height: 30px;
      padding: 0 8px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      border-radius: 6px;
      color: #475569;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }
    .modal-pag-btn:hover:not(:disabled) { background: #f1f5f9; color: #0f172a; }
    .modal-pag-btn.active { background: #2563eb; border-color: #2563eb; color: #ffffff; }
    .modal-pag-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  `],
  template: `
    <div class="report-container flex flex-col gap-20">
      <div class="flex justify-between items-center gap-16">
        <div class="title-section">
          <h2 class="fw-bold mb-1">Source Report</h2>
          <p class="text-muted mb-0">Analyze lead volume by Source preference</p>
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

      <!-- KPI Cards (Clickable) -->
      <div class="grid grid-4 kpi-row">
        <!-- Total Leads Card -->
        <div class="kpi-card kpi-blue clickable-card" (click)="openCardDetails('total')" title="Click to view all leads in this period" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-primary-soft text-primary"><i class="bi bi-people"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Total Leads</h6>
            <h3 class="kpi-value">{{ kpi_totalLeads | number }}</h3>
            <span class="click-indicator"><i class="bi bi-box-arrow-up-right"></i> View Leads</span>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
        </div>
        
        <!-- Top Channel Card -->
        <div class="kpi-card kpi-green clickable-card" (click)="openCardDetails('top')" title="Click to view leads for top channel" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-success-soft text-success"><i class="bi bi-trophy"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Top Source</h6>
            <h3 class="kpi-value" style="font-size: 1.25rem; text-transform: capitalize;">{{ topChannel }}</h3>
            <span class="click-indicator"><i class="bi bi-box-arrow-up-right"></i> View Leads</span>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="grid" style="grid-template-columns: 1fr 2fr;">
        <div class="chart-card h-100">
          <div class="chart-header flex justify-between items-center">
            <h5>Leads by Source</h5>
            <small class="text-muted"><i class="bi bi-hand-index-thumb"></i> Click slice to view</small>
          </div>
          <div class="chart-body" style="position: relative; height: 300px; width: 100%; cursor: pointer;">
            <canvas id="channelPieChart"></canvas>
          </div>
        </div>
        
        <div class="chart-card h-100">
          <div class="chart-header flex justify-between items-center">
            <h5>Source Performance</h5>
            <small class="text-muted"><i class="bi bi-hand-index-thumb"></i> Click bar to view</small>
          </div>
          <div class="chart-body" style="position: relative; height: 300px; width: 100%; cursor: pointer;">
            <canvas id="channelBarChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Breakdown Table (Clickable Rows) -->
      <div class="chart-card">
        <div class="chart-header border-bottom pb-3 mb-3 flex justify-between items-center">
          <h5>Source Breakdown</h5>
          <small class="text-muted"><i class="bi bi-cursor-fill"></i> Click any Source row to view leads</small>
        </div>
        <div style="overflow: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Total Leads</th>
                <th>% of Total</th>
                <th class="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let ch of channels; let i = index" class="table-row clickable-row" (click)="openChannelDetails(ch.label)" [style.--row-i]="i" title="Click to view leads for {{ ch.label }}">
                <td class="fw-semibold" style="text-transform: capitalize;">{{ ch.label }}</td>
                <td><strong>{{ ch.value }}</strong></td>
                <td>
                  <div class="progress-cell">
                    <span class="rate-text text-muted small" style="width: 35px; text-align: left;">{{ ((ch.value / (totalLeads || 1)) * 100).toFixed(1) }}%</span>
                    <div class="progress-bar-bg">
                      <div class="progress-bar-fill" [style.width.%]="(ch.value / (totalLeads || 1)) * 100"></div>
                    </div>
                  </div>
                </td>
                <td class="text-end">
                  <button class="btn-view-channel-leads" (click)="$event.stopPropagation(); openChannelDetails(ch.label)">
                    <i class="bi bi-eye-fill"></i> View Details
                  </button>
                </td>
              </tr>
              <tr *ngIf="channels.length === 0">
                <td colspan="4" class="text-center py-4 text-muted">No data available for the selected period.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- POPUP DETAILS MODAL -->
    <div class="modal-backdrop" *ngIf="isModalOpen" (click)="closeModal()"></div>

    <div class="details-modal-wrapper" *ngIf="isModalOpen" (click)="$event.stopPropagation()">
      <div class="details-modal-content">
        
        <!-- Modal Header -->
        <div class="modal-header">
          <div>
            <div class="modal-title-chip">
              <i class="bi bi-diagram-3-fill"></i> Source Leads Audit
            </div>
            <h2 class="modal-title">{{ modalTitle }}</h2>
            <p class="modal-subtitle">{{ modalSubtitle }}</p>
          </div>

          <div class="flex items-center gap-12">
            <span class="modal-total-badge">{{ modalTotalCount }} Leads</span>
            <button class="btn-close-modal" (click)="closeModal()" title="Close">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <!-- Modal Toolbar -->
        <div class="modal-toolbar">
          <div class="modal-search-box">
            <i class="bi bi-search modal-search-icon"></i>
            <input 
              type="text" 
              [(ngModel)]="modalSearchQuery" 
              (keyup.enter)="onModalSearch()" 
              placeholder="Search lead by name, phone, email, or status..." 
              class="modal-search-input" />
            <button class="btn-clear-search" *ngIf="modalSearchQuery" (click)="clearModalSearch()">
              <i class="bi bi-x"></i>
            </button>
          </div>

          <button class="btn-modal-search" (click)="onModalSearch()">Search</button>

          <div class="modal-page-size-box">
            <span class="ps-label">Show:</span>
            <select [(ngModel)]="modalPageSize" (change)="modalCurrentPage = 1; fetchModalLeads()" class="modal-select-size">
              <option [value]="5">5 per page</option>
              <option [value]="10">10 per page</option>
              <option [value]="25">25 per page</option>
              <option [value]="50">50 per page</option>
            </select>
          </div>
        </div>

        <!-- Modal Body (Data Table) -->
        <div class="modal-body">
          
          <!-- Loading State -->
          <div class="modal-loading-state" *ngIf="modalLoading">
            <div class="spinner-border text-primary" role="status"></div>
            <p>Loading Source lead details...</p>
          </div>

          <!-- Empty State -->
          <div class="modal-empty-state" *ngIf="!modalLoading && modalLeads.length === 0">
            <i class="bi bi-inbox-fill"></i>
            <h4>No Leads Found</h4>
            <p>No leads recorded for the selected Source and timeframe.</p>
          </div>

          <!-- Leads Table -->
          <div class="modal-table-responsive" *ngIf="!modalLoading && modalLeads.length > 0">
            <table class="modal-leads-table">
              <thead>
                <tr>
                  <th>LEAD & CONTACT</th>
                  <th>CREATED DATE</th>
                  <th>Source PREFERENCE</th>
                  <th>CURRENT STAGE</th>
                  <th>CONVERSION</th>
                  <th>ASSIGNED TO</th>
                  <th>SOURCE</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let lead of modalLeads" class="lead-modal-row">
                  <td>
                    <div class="lead-info-cell">
                      <div class="lead-initials-badge">{{ getInitials(lead.name) }}</div>
                      <div class="lead-details-text">
                        <span class="lead-name">{{ lead.name }}</span>
                        <span class="lead-contact-sub" *ngIf="lead.phone">
                          <i class="bi bi-telephone-fill"></i> {{ lead.phone }}
                        </span>
                        <span class="lead-contact-sub" *ngIf="lead.email">
                          <i class="bi bi-envelope-fill"></i> {{ lead.email }}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="lead-date-cell">
                      <span class="date-str">{{ lead.created_at | date:'MMM d, y' }}</span>
                      <span class="time-str">{{ lead.created_at | date:'h:mm a' }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="channel-badge-tag">{{ lead.channel || 'Unknown' }}</span>
                  </td>
                  <td>
                    <span class="stage-tag">{{ lead.status_name || 'Pending' }}</span>
                  </td>
                  <td>
                    <span class="conv-tag" [ngClass]="{
                      'conv-won': lead.sale_won == 1 || lead.status_name?.toUpperCase()?.includes('WON'),
                      'conv-progress': lead.sale_won != 1 && !lead.status_name?.toUpperCase()?.includes('WON')
                    }">
                      <i class="bi bi-trophy-fill" *ngIf="lead.sale_won == 1 || lead.status_name?.toUpperCase()?.includes('WON')"></i>
                      <i class="bi bi-hourglass-split" *ngIf="lead.sale_won != 1 && !lead.status_name?.toUpperCase()?.includes('WON')"></i>
                      {{ (lead.sale_won == 1 || lead.status_name?.toUpperCase()?.includes('WON')) ? 'Converted (Won)' : 'In Pipeline' }}
                    </span>
                  </td>
                  <td>
                    <div class="assignee-cell">
                      <i class="bi bi-person-circle"></i>
                      <span>{{ lead.assigned_to }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="source-badge">{{ lead.source || 'Direct' }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Modal Footer (Pagination) -->
        <div class="modal-footer" *ngIf="modalTotalCount > 0">
          <div class="modal-pagination-summary">
            Showing <strong>{{ modalPaginationStart }}</strong> to <strong>{{ modalPaginationEnd }}</strong> of <strong>{{ modalTotalCount }}</strong> leads
          </div>

          <div class="modal-pagination-controls" *ngIf="modalTotalPages > 1">
            <button class="modal-pag-btn" (click)="goToModalPage(1)" [disabled]="modalCurrentPage === 1" title="First Page">
              <i class="bi bi-chevron-double-left"></i>
            </button>
            <button class="modal-pag-btn" (click)="goToModalPage(modalCurrentPage - 1)" [disabled]="modalCurrentPage === 1" title="Previous Page">
              <i class="bi bi-chevron-left"></i>
            </button>

            <ng-container *ngFor="let p of modalPages">
              <button class="modal-pag-btn" [class.active]="modalCurrentPage === p" (click)="goToModalPage(p)">
                {{ p }}
              </button>
            </ng-container>

            <button class="modal-pag-btn" (click)="goToModalPage(modalCurrentPage + 1)" [disabled]="modalCurrentPage === modalTotalPages" title="Next Page">
              <i class="bi bi-chevron-right"></i>
            </button>
            <button class="modal-pag-btn" (click)="goToModalPage(modalTotalPages)" [disabled]="modalCurrentPage === modalTotalPages" title="Last Page">
              <i class="bi bi-chevron-double-right"></i>
            </button>
          </div>
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

  totalLeads = 0;
  topChannel = 'Loading...';
  channels: any[] = [];
  kpi_totalLeads = 0;

  pieChart: any;
  barChart: any;

  // Modal State
  isModalOpen: boolean = false;
  modalTitle: string = '';
  modalSubtitle: string = '';
  selectedChannel: string = 'all';
  modalLoading: boolean = false;
  modalSearchQuery: string = '';
  modalCurrentPage: number = 1;
  modalPageSize: number = 10;
  modalTotalCount: number = 0;
  modalTotalPages: number = 1;
  modalLeads: any[] = [];

  constructor(
    private api: ApiService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchData();
  }

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
      'this_week': 'This Week',
      'this_month': 'This Month',
      'last_month': 'Last Month',
      'ytd': 'Year to Date',
      'prev_year': 'Previous Year',
      'custom': 'Custom Range'
    };
    return labels[range] || 'Select Range';
  }

  fetchData() {
    this.loading = true;
    if (this.dateRange === 'custom' && (!this.startDate || !this.endDate)) {
      this.loading = false;
      return;
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
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFilterChange() {
    this.fetchData();
  }

  // --- Modal Popup Handlers ---
  openCardDetails(type: 'total' | 'top') {
    if (type === 'total') {
      this.selectedChannel = 'all';
      this.modalTitle = `Total Leads (${this.totalLeads})`;
      this.modalSubtitle = `Showing all leads across all Source for ${this.getDateRangeLabel(this.dateRange)}`;
    } else {
      this.selectedChannel = this.topChannel;
      this.modalTitle = `Top Source: ${this.topChannel}`;
      this.modalSubtitle = `Showing leads generated through top preference (${this.topChannel}) for ${this.getDateRangeLabel(this.dateRange)}`;
    }
    this.modalCurrentPage = 1;
    this.modalSearchQuery = '';
    this.isModalOpen = true;
    this.fetchModalLeads();
  }

  openChannelDetails(channelName: string) {
    this.selectedChannel = channelName;
    this.modalTitle = `Leads via ${channelName}`;
    const found = this.channels.find(c => c.label.toLowerCase() === channelName.toLowerCase());
    const count = found ? found.value : '';
    this.modalSubtitle = `Showing ${count ? count + ' ' : ''}leads with "${channelName}" Source preference for ${this.getDateRangeLabel(this.dateRange)}`;
    this.modalCurrentPage = 1;
    this.modalSearchQuery = '';
    this.isModalOpen = true;
    this.fetchModalLeads();
  }

  closeModal() {
    this.isModalOpen = false;
    this.modalLeads = [];
    this.modalSearchQuery = '';
    this.modalTotalCount = 0;
  }

  fetchModalLeads() {
    this.modalLoading = true;
    let url = `/reports/leads/channels?viewDetails=true&channel=${encodeURIComponent(this.selectedChannel)}&dateRange=${this.dateRange}&page=${this.modalCurrentPage}&limit=${this.modalPageSize}`;

    if (this.dateRange === 'custom' && this.startDate && this.endDate) {
      url += `&startDate=${this.startDate}&endDate=${this.endDate}`;
    }

    if (this.modalSearchQuery && this.modalSearchQuery.trim()) {
      url += `&search=${encodeURIComponent(this.modalSearchQuery.trim())}`;
    }

    this.api.get(url).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.modalLeads = res.data.leads || [];
          this.modalTotalCount = res.data.totalCount || 0;
          this.modalTotalPages = res.data.totalPages || 1;
          this.modalCurrentPage = res.data.page || this.modalCurrentPage;
        }
        this.modalLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to load channel lead details:', err);
        this.modalLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onModalSearch() {
    this.modalCurrentPage = 1;
    this.fetchModalLeads();
  }

  clearModalSearch() {
    this.modalSearchQuery = '';
    this.modalCurrentPage = 1;
    this.fetchModalLeads();
  }

  goToModalPage(p: number) {
    if (p >= 1 && p <= this.modalTotalPages && p !== this.modalCurrentPage) {
      this.modalCurrentPage = p;
      this.fetchModalLeads();
    }
  }

  get modalPages(): number[] {
    const list: number[] = [];
    let start = Math.max(1, this.modalCurrentPage - 2);
    let end = Math.min(this.modalTotalPages, start + 4);
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    for (let i = start; i <= end; i++) {
      list.push(i);
    }
    return list;
  }

  get modalPaginationStart(): number {
    if (this.modalTotalCount === 0) return 0;
    return (this.modalCurrentPage - 1) * this.modalPageSize + 1;
  }

  get modalPaginationEnd(): number {
    return Math.min(this.modalCurrentPage * this.modalPageSize, this.modalTotalCount);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
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
        animation: { duration: 1200, easing: 'easeOutQuart' },
        onClick: (evt, elements) => {
          if (elements && elements.length > 0) {
            const index = elements[0].index;
            const clickedLabel = this.channels[index]?.label;
            if (clickedLabel) {
              this.ngZone.run(() => {
                this.openChannelDetails(clickedLabel);
              });
            }
          }
        }
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
        animation: { duration: 1200, easing: 'easeOutQuart' },
        onClick: (evt, elements) => {
          if (elements && elements.length > 0) {
            const index = elements[0].index;
            const clickedLabel = this.channels[index]?.label;
            if (clickedLabel) {
              this.ngZone.run(() => {
                this.openChannelDetails(clickedLabel);
              });
            }
          }
        }
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
