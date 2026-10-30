import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { ApiService } from '../../../../core/services/api.service';

export interface ReceiptKpis {
  totalCount: number;
  totalAmount: number;
  todayCount: number;
  todayAmount: number;
  monthCount: number;
  monthAmount: number;
  rangeCount: number;
  rangeAmount: number;
  avgAmount: number;
  activeEmployeesCount: number;
}

export interface EmployeeBreakdown {
  user_id: number | null;
  employee_name: string;
  employee_email: string | null;
  employee_role: string | null;
  receipts_count: number;
  total_amount: number;
  avg_amount: number;
  last_receipt_date: string | null;
  percentage: number;
}

export interface ReceiptTransaction {
  receipt_id: number;
  contact_id: number;
  receipt_type_id: number;
  receipt_type_name: string;
  amount: string | number;
  receipt_date: string;
  description: string | null;
  created_by: number;
  created_by_name: string;
  created_at: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  assigned_to_name: string;
}

export interface MonthlyReceiptItem {
  month: number;
  monthName: string;
  shortName: string;
  receiptCount: number;
  totalAmount: number;
  applicationCount: number;
  applicationAmount: number;
  registrationCount: number;
  registrationAmount: number;
  percentageOfTotal: number;
  isPeakCount?: boolean;
  isPeakAmount?: boolean;
}

export interface MonthlyAnalysisSummary {
  totalYearReceipts: number;
  totalYearAmount: number;
  totalApplicationCount: number;
  totalApplicationAmount: number;
  totalRegistrationCount: number;
  totalRegistrationAmount: number;
  bestReceiptsMonth: string;
  bestAmountMonth: string;
}

@Component({
  selector: 'app-receipt-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './receipt-report.component.html',
  styleUrl: './receipt-report.component.css'
})
export class ReceiptReportComponent implements OnInit {
  readonly Math = Math;
  isBrowser: boolean = false;
  loading: boolean = true;
  refreshing: boolean = false;
  monthlyLoading: boolean = false;

  // View Navigation Tabs
  activeTab: 'charts' | 'matrix' | 'staff' | 'transactions' = 'charts';

  // Chart Mode: Monthly (Full Year) vs Day-wise (Selected Date Range)
  chartMode: 'monthly' | 'daily' = 'monthly';

  // Chart View Style in Monthly: 'split' (Side-by-side area charts) or 'combined' (Trade chart dual-axis)
  chartViewType: 'split' | 'combined' = 'split';

  // Year State
  selectedYear: number = new Date().getFullYear();
  availableYears: number[] = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];
  isYearDropdownOpen: boolean = false;

  // Date Filter State
  dateRange: string = 'this_month';
  customStartDate: string = '';
  customEndDate: string = '';
  isDateDropdownOpen: boolean = false;

  // Staff / User Filter State
  selectedEmployee: string = 'all';
  isEmployeeDropdownOpen: boolean = false;
  employeeSearchQuery: string = '';

  // Type Filter & Search
  selectedTypeFilter: string = 'all';
  searchQuery: string = '';

  // Data Containers
  kpis: ReceiptKpis = {
    totalCount: 0,
    totalAmount: 0,
    todayCount: 0,
    todayAmount: 0,
    monthCount: 0,
    monthAmount: 0,
    rangeCount: 0,
    rangeAmount: 0,
    avgAmount: 0,
    activeEmployeesCount: 0
  };

  monthlyData: MonthlyReceiptItem[] = [];
  monthlySummary: MonthlyAnalysisSummary = {
    totalYearReceipts: 0,
    totalYearAmount: 0,
    totalApplicationCount: 0,
    totalApplicationAmount: 0,
    totalRegistrationCount: 0,
    totalRegistrationAmount: 0,
    bestReceiptsMonth: '—',
    bestAmountMonth: '—'
  };

  peakMonthReceipts: MonthlyReceiptItem | null = null;
  peakMonthAmount: MonthlyReceiptItem | null = null;

  employeeBreakdown: EmployeeBreakdown[] = [];
  typeBreakdown: any[] = [];
  timelineData: any[] = [];
  staffList: { id: number; name: string }[] = [];
  receipts: ReceiptTransaction[] = [];

  // Table Pagination
  currentPage: number = 1;
  pageSize: number = 25;
  totalRecords: number = 0;
  totalPages: number = 1;

  // Employee Modal Drilldown State
  isModalOpen: boolean = false;
  modalEmployeeName: string = '';
  modalEmployeeId: number | null = null;
  modalReceipts: ReceiptTransaction[] = [];
  modalLoading: boolean = false;
  modalSearch: string = '';
  modalPage: number = 1;
  modalPageSize: number = 10;
  modalTotal: number = 0;
  modalTotalPages: number = 1;

  // ═══════════════════════ CHART CONFIGURATIONS ═══════════════════════

  // 1. Monthly Chart 1: Total Receipts Received Area Graph (Jan - Dec)
  public monthlyReceiptsChartData: ChartConfiguration['data'] = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        type: 'line',
        label: 'Receipts Count',
        data: [],
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.16)',
        pointBackgroundColor: '#0284c7',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#0284c7',
        pointRadius: 4.5,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: 'Application Fees',
        data: [],
        borderColor: '#3b82f6',
        backgroundColor: 'transparent',
        borderDash: [4, 4],
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: false,
        tension: 0.35,
        borderWidth: 1.8,
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: 'Registration Fees',
        data: [],
        borderColor: '#f59e0b',
        backgroundColor: 'transparent',
        borderDash: [4, 4],
        pointBackgroundColor: '#f59e0b',
        pointBorderColor: '#ffffff',
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: false,
        tension: 0.35,
        borderWidth: 1.8,
        yAxisID: 'y'
      }
    ]
  };

  public monthlyReceiptsChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'center',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
          padding: 14,
          font: { family: 'Inter', size: 11, weight: 600 },
          color: '#475569'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#ffffff',
        titleFont: { size: 13, weight: 'bold' },
        bodyColor: '#e2e8f0',
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        usePointStyle: true,
        boxPadding: 4,
        callbacks: {
          afterTitle: (tooltipItems) => {
            const index = tooltipItems[0]?.dataIndex;
            if (this.monthlyData[index]?.isPeakCount) {
              return '⭐ HIGHEST RECEIPTS VOLUME';
            }
            return '';
          },
          label: (context) => {
            const label = context.dataset.label || '';
            const val = context.parsed.y ?? 0;
            return ` ${label}: ${val} receipts`;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear',
        position: 'left',
        beginAtZero: true,
        grid: { color: 'rgba(226, 232, 240, 0.65)' },
        ticks: { precision: 0, color: '#64748b', font: { size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: {
          color: '#64748b',
          font: { size: 11, weight: 'bold' },
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };

  // 2. Monthly Chart 2: Total Collections Inflow Area Graph (Jan - Dec)
  public monthlyCollectionsChartData: ChartConfiguration['data'] = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        type: 'line',
        label: 'Total Collections (₹)',
        data: [],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.18)',
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#10b981',
        pointRadius: 4.5,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: 'App Fee Collections',
        data: [],
        borderColor: '#3b82f6',
        backgroundColor: 'transparent',
        borderDash: [3, 3],
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: false,
        tension: 0.35,
        borderWidth: 1.8,
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: 'Reg Fee Collections',
        data: [],
        borderColor: '#f59e0b',
        backgroundColor: 'transparent',
        borderDash: [3, 3],
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: false,
        tension: 0.35,
        borderWidth: 1.8,
        yAxisID: 'y'
      }
    ]
  };

  public monthlyCollectionsChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'center',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
          padding: 14,
          font: { family: 'Inter', size: 11, weight: 600 },
          color: '#475569'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#ffffff',
        titleFont: { size: 13, weight: 'bold' },
        bodyColor: '#e2e8f0',
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        usePointStyle: true,
        boxPadding: 4,
        callbacks: {
          afterTitle: (tooltipItems) => {
            const index = tooltipItems[0]?.dataIndex;
            if (this.monthlyData[index]?.isPeakAmount) {
              return '👑 HIGHEST COLLECTION MONTH';
            }
            return '';
          },
          label: (context) => {
            const label = context.dataset.label || '';
            const val = context.parsed.y ?? 0;
            return ` ${label}: ₹${Number(val).toLocaleString('en-IN')}`;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear',
        position: 'left',
        beginAtZero: true,
        grid: { color: 'rgba(226, 232, 240, 0.65)' },
        ticks: {
          color: '#64748b',
          font: { size: 11 },
          callback: (val) => '₹' + Number(val).toLocaleString('en-IN')
        }
      },
      x: {
        grid: { display: false },
        ticks: {
          color: '#64748b',
          font: { size: 11, weight: 'bold' },
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };

  // 3. Combined Trade Area Chart (Dual-Axis PowerBI/Trading Style Area Graph)
  public monthlyCombinedTradeChartData: ChartConfiguration['data'] = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        type: 'line',
        label: 'Receipts Count',
        data: [],
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.25)',
        pointBackgroundColor: '#0284c7',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#0284c7',
        pointRadius: 5,
        pointHoverRadius: 8,
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: 'Total Collections (₹)',
        data: [],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.22)',
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#10b981',
        pointRadius: 5,
        pointHoverRadius: 8,
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        yAxisID: 'y1'
      }
    ]
  };

  public monthlyCombinedTradeChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'center',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 9,
          boxHeight: 9,
          padding: 18,
          font: { family: 'Inter', size: 12, weight: 600 },
          color: '#334155'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#ffffff',
        titleFont: { size: 13, weight: 'bold' },
        bodyColor: '#e2e8f0',
        bodyFont: { size: 12 },
        padding: 14,
        cornerRadius: 8,
        usePointStyle: true,
        boxPadding: 6,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const val = context.parsed.y ?? 0;
            if (label.includes('₹') || label.includes('Collection')) {
              return ` ${label}: ₹${Number(val).toLocaleString('en-IN')}`;
            }
            return ` ${label}: ${val} receipts`;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear',
        position: 'left',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Receipts Count',
          color: '#0284c7',
          font: { family: 'Inter', size: 11, weight: 700 }
        },
        grid: { color: 'rgba(226, 232, 240, 0.65)' },
        ticks: { precision: 0, color: '#0284c7', font: { size: 11, weight: 600 } }
      },
      y1: {
        type: 'linear',
        position: 'right',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Total Collection (₹)',
          color: '#10b981',
          font: { family: 'Inter', size: 11, weight: 700 }
        },
        grid: { display: false },
        ticks: {
          color: '#10b981',
          font: { size: 11, weight: 600 },
          callback: (val) => '₹' + Number(val).toLocaleString('en-IN')
        }
      },
      x: {
        grid: { display: false },
        ticks: {
          color: '#475569',
          font: { family: 'Inter', size: 11, weight: 'bold' },
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };

  // 4. Day-wise Receipts Area Chart (When in daily mode)
  public dailyReceiptsChartData: ChartConfiguration['data'] = {
    datasets: [{
      type: 'line',
      data: [],
      label: 'Receipts Count',
      borderColor: '#0284c7',
      backgroundColor: 'rgba(2, 132, 199, 0.2)',
      pointBackgroundColor: '#0284c7',
      pointBorderColor: '#ffffff',
      pointHoverRadius: 6,
      fill: true,
      tension: 0.35,
      borderWidth: 2.5
    }],
    labels: []
  };

  // 5. Day-wise Collection Area Chart (When in daily mode)
  public dailyCollectionsChartData: ChartConfiguration['data'] = {
    datasets: [{
      type: 'line',
      data: [],
      label: 'Collections (₹)',
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      pointBackgroundColor: '#10b981',
      pointBorderColor: '#ffffff',
      pointHoverRadius: 6,
      fill: true,
      tension: 0.35,
      borderWidth: 2.5
    }],
    labels: []
  };

  public dailyChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(226, 232, 240, 0.6)' },
        ticks: { precision: 0, color: '#64748b', font: { size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 11 }, maxRotation: 45 }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const val = context.parsed.y ?? 0;
            if (label.includes('₹') || label.includes('Collection')) {
              return ` ${label}: ₹${Number(val).toLocaleString('en-IN')}`;
            }
            return ` ${label}: ${val} receipts`;
          }
        }
      }
    }
  };

  // 6. Staff Share Doughnut Chart (In Staff Performance tab)
  public staffChartType: 'doughnut' = 'doughnut';
  public staffChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
        '#06b6d4', '#6366f1', '#14b8a6', '#f97316', '#64748b'
      ],
      hoverOffset: 6
    }]
  };

  public staffChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { family: 'Inter', size: 11 }
        }
      }
    },
    cutout: '65%'
  };

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    const today = new Date().toISOString().split('T')[0];
    this.customStartDate = today;
    this.customEndDate = today;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.isDateDropdownOpen = false;
    this.isEmployeeDropdownOpen = false;
    this.isYearDropdownOpen = false;
  }

  ngOnInit() {
    this.fetchData();
    this.fetchMonthlyAnalysis();
  }

  fetchData(isRefresh = false) {
    if (isRefresh) {
      this.refreshing = true;
      this.fetchMonthlyAnalysis();
    } else {
      this.loading = true;
    }

    let url = `/reports/receipts?dateRange=${this.dateRange}&page=${this.currentPage}&limit=${this.pageSize}`;

    if (this.dateRange === 'custom') {
      if (!this.customStartDate || !this.customEndDate) {
        this.loading = false;
        this.refreshing = false;
        return;
      }
      url += `&startDate=${this.customStartDate}&endDate=${this.customEndDate}`;
    }

    if (this.selectedEmployee && this.selectedEmployee !== 'all') {
      url += `&userId=${encodeURIComponent(this.selectedEmployee)}`;
    }

    if (this.selectedTypeFilter && this.selectedTypeFilter !== 'all') {
      url += `&receiptTypeId=${encodeURIComponent(this.selectedTypeFilter)}`;
    }

    if (this.searchQuery && this.searchQuery.trim()) {
      url += `&search=${encodeURIComponent(this.searchQuery.trim())}`;
    }

    this.api.get(url).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          const d = res.data;
          this.kpis = d.kpis || this.kpis;
          this.employeeBreakdown = d.employeeBreakdown || [];
          this.typeBreakdown = d.typeBreakdown || [];
          this.timelineData = d.timelineData || [];
          this.staffList = d.staffList || [];
          this.receipts = d.receipts || [];
          if (d.pagination) {
            this.totalRecords = d.pagination.total;
            this.totalPages = d.pagination.totalPages;
            this.currentPage = d.pagination.page;
          }
          this.updateDailyCharts();
          this.updateStaffChart();
        }
        setTimeout(() => {
          this.loading = false;
          this.refreshing = false;
          this.cdr.detectChanges();
        }, 120);
      },
      error: (err: any) => {
        console.error('Failed to load receipts report', err);
        this.loading = false;
        this.refreshing = false;
        this.cdr.detectChanges();
      }
    });
  }

  fetchMonthlyAnalysis() {
    this.monthlyLoading = true;
    let url = `/reports/receipts/monthly-analysis?year=${this.selectedYear}`;
    if (this.selectedEmployee && this.selectedEmployee !== 'all') {
      url += `&userId=${encodeURIComponent(this.selectedEmployee)}`;
    }
    this.api.get(url).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          const d = res.data;
          this.selectedYear = d.year || this.selectedYear;
          this.availableYears = d.availableYears || [this.selectedYear];
          this.monthlySummary = d.summary || this.monthlySummary;

          const rawMonths = d.monthlyData || [];
          const totalAnnualAmount = Number(this.monthlySummary.totalYearAmount || 0);

          let maxCount = -1;
          let maxAmount = -1;

          rawMonths.forEach((m: any) => {
            if (Number(m.receiptCount) > maxCount) maxCount = Number(m.receiptCount);
            if (Number(m.totalAmount) > maxAmount) maxAmount = Number(m.totalAmount);
          });

          this.monthlyData = rawMonths.map((m: any) => {
            const rCount = Number(m.receiptCount || 0);
            const tAmount = Number(m.totalAmount || 0);
            const isPeakCount = maxCount > 0 && rCount === maxCount;
            const isPeakAmount = maxAmount > 0 && tAmount === maxAmount;

            const item: MonthlyReceiptItem = {
              month: m.month,
              monthName: m.monthName,
              shortName: m.monthName.slice(0, 3),
              receiptCount: rCount,
              totalAmount: tAmount,
              applicationCount: Number(m.applicationCount || 0),
              applicationAmount: Number(m.applicationAmount || 0),
              registrationCount: Number(m.registrationCount || 0),
              registrationAmount: Number(m.registrationAmount || 0),
              percentageOfTotal: totalAnnualAmount > 0 ? Math.round((tAmount / totalAnnualAmount) * 100) : 0,
              isPeakCount,
              isPeakAmount
            };

            if (isPeakCount && !this.peakMonthReceipts) this.peakMonthReceipts = item;
            if (isPeakAmount && !this.peakMonthAmount) this.peakMonthAmount = item;

            return item;
          });

          // Fallbacks for peak months if not set
          if (!this.peakMonthReceipts && this.monthlyData.length > 0) {
            this.peakMonthReceipts = this.monthlyData.reduce((prev, curr) => curr.receiptCount > prev.receiptCount ? curr : prev, this.monthlyData[0]);
          }
          if (!this.peakMonthAmount && this.monthlyData.length > 0) {
            this.peakMonthAmount = this.monthlyData.reduce((prev, curr) => curr.totalAmount > prev.totalAmount ? curr : prev, this.monthlyData[0]);
          }

          this.updateMonthlyCharts();
        }
        this.monthlyLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to load monthly receipt analysis', err);
        this.monthlyLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateMonthlyCharts() {
    if (!this.monthlyData || this.monthlyData.length === 0) return;

    const labels = this.monthlyData.map(m => m.shortName);
    const receiptCounts = this.monthlyData.map(m => m.receiptCount);
    const totalAmounts = this.monthlyData.map(m => m.totalAmount);
    const appCounts = this.monthlyData.map(m => m.applicationCount);
    const regCounts = this.monthlyData.map(m => m.registrationCount);
    const appAmounts = this.monthlyData.map(m => m.applicationAmount);
    const regAmounts = this.monthlyData.map(m => m.registrationAmount);

    // 1. Monthly Receipts Area Chart
    this.monthlyReceiptsChartData = {
      labels: [...labels],
      datasets: [
        {
          type: 'line',
          label: 'Total Receipts',
          data: [...receiptCounts],
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.16)',
          pointBackgroundColor: '#0284c7',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#0284c7',
          pointRadius: 4.5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: 'Application Fees',
          data: [...appCounts],
          borderColor: '#3b82f6',
          backgroundColor: 'transparent',
          borderDash: [4, 4],
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#ffffff',
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: false,
          tension: 0.35,
          borderWidth: 1.8,
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: 'Registration Fees',
          data: [...regCounts],
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          borderDash: [4, 4],
          pointBackgroundColor: '#f59e0b',
          pointBorderColor: '#ffffff',
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: false,
          tension: 0.35,
          borderWidth: 1.8,
          yAxisID: 'y'
        }
      ]
    };

    // 2. Monthly Collection Inflow Area Chart
    this.monthlyCollectionsChartData = {
      labels: [...labels],
      datasets: [
        {
          type: 'line',
          label: 'Total Collections (₹)',
          data: [...totalAmounts],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.18)',
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#10b981',
          pointRadius: 4.5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: 'App Fee Collections',
          data: [...appAmounts],
          borderColor: '#3b82f6',
          backgroundColor: 'transparent',
          borderDash: [3, 3],
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: false,
          tension: 0.35,
          borderWidth: 1.8,
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: 'Reg Fee Collections',
          data: [...regAmounts],
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          borderDash: [3, 3],
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: false,
          tension: 0.35,
          borderWidth: 1.8,
          yAxisID: 'y'
        }
      ]
    };

    // 3. Combined Dual-Axis Trade Area Chart
    this.monthlyCombinedTradeChartData = {
      labels: [...labels],
      datasets: [
        {
          type: 'line',
          label: 'Receipts Count',
          data: [...receiptCounts],
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.22)',
          pointBackgroundColor: '#0284c7',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#0284c7',
          pointRadius: 5,
          pointHoverRadius: 8,
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: 'Total Collections (₹)',
          data: [...totalAmounts],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.22)',
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#10b981',
          pointRadius: 5,
          pointHoverRadius: 8,
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          yAxisID: 'y1'
        }
      ]
    };
  }

  updateDailyCharts() {
    if (this.timelineData && this.timelineData.length > 0) {
      const labels = this.timelineData.map(t => t.label || t.period_key);
      const counts = this.timelineData.map(t => Number(t.count || 0));
      const amounts = this.timelineData.map(t => Number(t.total_amount || 0));

      this.dailyReceiptsChartData = {
        labels: [...labels],
        datasets: [{
          type: 'line',
          data: [...counts],
          label: 'Receipts Count',
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.2)',
          pointBackgroundColor: '#0284c7',
          pointBorderColor: '#ffffff',
          pointHoverRadius: 6,
          fill: true,
          tension: 0.35,
          borderWidth: 2.5
        }]
      };

      this.dailyCollectionsChartData = {
        labels: [...labels],
        datasets: [{
          type: 'line',
          data: [...amounts],
          label: 'Collections (₹)',
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointHoverRadius: 6,
          fill: true,
          tension: 0.35,
          borderWidth: 2.5
        }]
      };
    } else {
      this.dailyReceiptsChartData = { labels: ['No Data'], datasets: [{ type: 'line', data: [0], label: 'Receipts Count' }] };
      this.dailyCollectionsChartData = { labels: ['No Data'], datasets: [{ type: 'line', data: [0], label: 'Collections (₹)' }] };
    }
  }

  updateStaffChart() {
    if (this.employeeBreakdown && this.employeeBreakdown.length > 0) {
      this.staffChartData.labels = this.employeeBreakdown.map(e => e.employee_name);
      if (this.staffChartData.datasets[0]) {
        this.staffChartData.datasets[0].data = this.employeeBreakdown.map(e => e.receipts_count);
      }
    } else {
      this.staffChartData.labels = ['No Staff Activity'];
      if (this.staffChartData.datasets[0]) this.staffChartData.datasets[0].data = [0];
    }
  }

  // Filter Actions
  toggleYearDropdown(event: Event) {
    event.stopPropagation();
    this.isYearDropdownOpen = !this.isYearDropdownOpen;
    this.isDateDropdownOpen = false;
    this.isEmployeeDropdownOpen = false;
  }

  selectYear(year: number) {
    this.selectedYear = year;
    this.isYearDropdownOpen = false;
    this.fetchMonthlyAnalysis();
  }

  toggleDateDropdown(event: Event) {
    event.stopPropagation();
    this.isDateDropdownOpen = !this.isDateDropdownOpen;
    this.isYearDropdownOpen = false;
    this.isEmployeeDropdownOpen = false;
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

  getDateRangeLabel(): string {
    switch (this.dateRange) {
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'this_week': return 'This Week';
      case 'this_month': return 'This Month';
      case 'last_month': return 'Last Month';
      case 'ytd': return `Full Year ${this.selectedYear} (YTD)`;
      case 'all': return 'All Dates';
      case 'custom':
        return this.customStartDate && this.customEndDate
          ? `${this.customStartDate} to ${this.customEndDate}`
          : 'Custom Range';
      default: return 'This Month';
    }
  }

  toggleEmployeeDropdown(event: Event) {
    event.stopPropagation();
    this.isEmployeeDropdownOpen = !this.isEmployeeDropdownOpen;
    this.isYearDropdownOpen = false;
    this.isDateDropdownOpen = false;
  }

  selectEmployee(empId: string) {
    this.selectedEmployee = empId;
    this.isEmployeeDropdownOpen = false;
    this.currentPage = 1;
    this.fetchData();
    this.fetchMonthlyAnalysis();
  }

  getSelectedEmployeeName(): string {
    if (!this.selectedEmployee || this.selectedEmployee === 'all') return 'All Staff';
    const found = this.staffList.find(s => String(s.id) === String(this.selectedEmployee));
    return found ? found.name : 'Selected Staff';
  }

  get filteredStaffList() {
    if (!this.employeeSearchQuery) return this.staffList;
    return this.staffList.filter(s => s.name.toLowerCase().includes(this.employeeSearchQuery.toLowerCase()));
  }

  onSearchChange() {
    this.currentPage = 1;
    this.fetchData();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.fetchData();
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedEmployee = 'all';
    this.selectedTypeFilter = 'all';
    this.dateRange = 'this_month';
    this.currentPage = 1;
    this.fetchData();
  }

  // Tab Navigation
  setTab(tab: 'charts' | 'matrix' | 'staff' | 'transactions') {
    this.activeTab = tab;
  }

  // Drilldown / Staff Filter
  filterByStaff(emp: EmployeeBreakdown) {
    this.selectedEmployee = emp.user_id !== null ? String(emp.user_id) : '0';
    this.currentPage = 1;
    this.fetchData();
  }

  viewEmployeeTransactions(emp: EmployeeBreakdown) {
    this.selectedEmployee = emp.user_id !== null ? String(emp.user_id) : '0';
    this.activeTab = 'transactions';
    this.currentPage = 1;
    this.fetchData();
  }

  // Modal Drilldown
  openEmployeeModal(emp: EmployeeBreakdown) {
    this.modalEmployeeName = emp.employee_name;
    this.modalEmployeeId = emp.user_id;
    this.modalSearch = '';
    this.modalPage = 1;
    this.isModalOpen = true;
    this.fetchModalReceipts();
  }

  closeModal() {
    this.isModalOpen = false;
    this.modalReceipts = [];
    this.modalEmployeeId = null;
  }

  fetchModalReceipts() {
    this.modalLoading = true;
    let url = `/reports/receipts?page=${this.modalPage}&limit=${this.modalPageSize}&dateRange=${this.dateRange}`;
    if (this.modalEmployeeId !== null) {
      url += `&userId=${this.modalEmployeeId}`;
    }
    if (this.dateRange === 'custom' && this.customStartDate && this.customEndDate) {
      url += `&startDate=${this.customStartDate}&endDate=${this.customEndDate}`;
    }
    if (this.modalSearch && this.modalSearch.trim()) {
      url += `&search=${encodeURIComponent(this.modalSearch.trim())}`;
    }

    this.api.get(url).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.modalReceipts = res.data.receipts || [];
          if (res.data.pagination) {
            this.modalTotal = res.data.pagination.total;
            this.modalTotalPages = res.data.pagination.totalPages;
          }
        }
        this.modalLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.modalLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onModalSearchChange() {
    this.modalPage = 1;
    this.fetchModalReceipts();
  }

  goToModalPage(page: number) {
    if (page >= 1 && page <= this.modalTotalPages && page !== this.modalPage) {
      this.modalPage = page;
      this.fetchModalReceipts();
    }
  }

  // Pagination Actions
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

  // Export to CSV
  exportToCsv() {
    if (!this.receipts || this.receipts.length === 0) return;

    const headers = ['Receipt ID', 'Date', 'Applicant Name', 'Phone', 'Email', 'Receipt Type', 'Amount (INR)', 'Created By', 'Created At', 'Notes'];
    const rows = this.receipts.map(r => [
      `"${r.receipt_id}"`,
      `"${r.receipt_date ? new Date(r.receipt_date).toLocaleDateString() : ''}"`,
      `"${(r.contact_name || '').replace(/"/g, '""')}"`,
      `"${(r.contact_phone || '').replace(/"/g, '""')}"`,
      `"${(r.contact_email || '').replace(/"/g, '""')}"`,
      `"${(r.receipt_type_name || '').replace(/"/g, '""')}"`,
      `"${r.amount}"`,
      `"${(r.created_by_name || '').replace(/"/g, '""')}"`,
      `"${r.created_at ? new Date(r.created_at).toLocaleString() : ''}"`,
      `"${(r.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `receipts_report_${this.selectedYear}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  formatCurrency(val: number | string): string {
    const num = Number(val || 0);
    return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
}
