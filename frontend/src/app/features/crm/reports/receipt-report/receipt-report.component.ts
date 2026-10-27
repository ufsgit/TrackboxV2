import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { ApiService } from '../../../../core/services/api.service';

interface ReceiptKpis {
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

interface EmployeeBreakdown {
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

interface ReceiptTransaction {
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
  receiptCount: number;
  totalAmount: number;
  applicationCount: number;
  applicationAmount: number;
  registrationCount: number;
  registrationAmount: number;
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
  loading: boolean = true;
  refreshing: boolean = false;

  // View Tab State
  activeTab: 'summary' | 'monthly' | 'transactions' | 'charts' = 'summary';

  // Monthly Sub-view Mode: 'split' | 'table' | 'chart'
  monthlyViewMode: 'split' | 'table' | 'chart' = 'split';

  // Active chart display mode inside monthly: 'dual' (two separate charts) | 'comparison' (combined side-by-side)
  monthlyChartDisplayMode: 'dual' | 'comparison' = 'dual';

  // Monthly Analysis State
  selectedYear: number = new Date().getFullYear();
  availableYears: number[] = [new Date().getFullYear()];
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
  monthlyLoading: boolean = false;

  // Date Filter State
  dateRange: string = 'this_month';
  customStartDate: string = '';
  customEndDate: string = '';
  isDateDropdownOpen: boolean = false;

  // Filter & Search State
  searchQuery: string = '';
  selectedEmployeeFilter: string = 'all';
  selectedTypeFilter: string = 'all';

  // Pagination
  currentPage: number = 1;
  pageSize: number = 25;
  totalRecords: number = 0;
  totalPages: number = 1;

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

  employeeBreakdown: EmployeeBreakdown[] = [];
  typeBreakdown: any[] = [];
  timelineData: any[] = [];
  staffList: { id: number; name: string }[] = [];
  receipts: ReceiptTransaction[] = [];

  // 1. Application Fee Separate Chart
  public applicationChartType: ChartType = 'bar';
  public applicationChartData: ChartConfiguration['data'] = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        data: [],
        label: 'Application Fee Receipts',
        backgroundColor: 'rgba(59, 130, 246, 0.85)',
        hoverBackgroundColor: 'rgba(29, 78, 216, 1)',
        borderRadius: 6,
        yAxisID: 'y'
      },
      {
        data: [],
        label: 'Amount (₹)',
        type: 'line',
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.12)',
        borderWidth: 2,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#ffffff',
        pointRadius: 4,
        fill: true,
        tension: 0.3,
        yAxisID: 'y1'
      }
    ]
  };

  public applicationChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: { usePointStyle: true, boxWidth: 7, font: { family: 'Inter', size: 11, weight: 600 } }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const val = context.parsed.y;
            if (label.includes('Amount')) return ` ${label}: ₹${Number(val).toLocaleString('en-IN')}`;
            return ` ${label}: ${val} receipts`;
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 10 } } },
      y: {
        type: 'linear',
        position: 'left',
        title: { display: true, text: 'Receipts Count', font: { size: 10, weight: 600 } },
        beginAtZero: true,
        ticks: { precision: 0 }
      },
      y1: {
        type: 'linear',
        position: 'right',
        title: { display: true, text: 'Amount (₹)', font: { size: 10, weight: 600 } },
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        ticks: { callback: (val) => '₹' + Number(val).toLocaleString('en-IN') }
      }
    }
  };

  // 2. Registration Fee Separate Chart
  public registrationChartType: ChartType = 'bar';
  public registrationChartData: ChartConfiguration['data'] = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        data: [],
        label: 'Registration Fee Receipts',
        backgroundColor: 'rgba(245, 158, 11, 0.85)',
        hoverBackgroundColor: 'rgba(217, 119, 6, 1)',
        borderRadius: 6,
        yAxisID: 'y'
      },
      {
        data: [],
        label: 'Amount (₹)',
        type: 'line',
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        borderWidth: 2,
        pointBackgroundColor: '#d97706',
        pointBorderColor: '#ffffff',
        pointRadius: 4,
        fill: true,
        tension: 0.3,
        yAxisID: 'y1'
      }
    ]
  };

  public registrationChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: { usePointStyle: true, boxWidth: 7, font: { family: 'Inter', size: 11, weight: 600 } }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const val = context.parsed.y;
            if (label.includes('Amount')) return ` ${label}: ₹${Number(val).toLocaleString('en-IN')}`;
            return ` ${label}: ${val} receipts`;
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 10 } } },
      y: {
        type: 'linear',
        position: 'left',
        title: { display: true, text: 'Receipts Count', font: { size: 10, weight: 600 } },
        beginAtZero: true,
        ticks: { precision: 0 }
      },
      y1: {
        type: 'linear',
        position: 'right',
        title: { display: true, text: 'Amount (₹)', font: { size: 10, weight: 600 } },
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        ticks: { callback: (val) => '₹' + Number(val).toLocaleString('en-IN') }
      }
    }
  };

  // 3. Comparison Chart: Application Fee Count vs Registration Fee Count
  public comparisonChartType: ChartType = 'bar';
  public comparisonChartData: ChartConfiguration['data'] = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        data: [],
        label: 'Application Fees Count',
        backgroundColor: 'rgba(59, 130, 246, 0.85)',
        hoverBackgroundColor: 'rgba(29, 78, 216, 1)',
        borderRadius: 5
      },
      {
        data: [],
        label: 'Registration Fees Count',
        backgroundColor: 'rgba(245, 158, 11, 0.85)',
        hoverBackgroundColor: 'rgba(217, 119, 6, 1)',
        borderRadius: 5
      }
    ]
  };

  public comparisonChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Inter', size: 11, weight: 600 } }
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.parsed.y} receipts`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 10 } } },
      y: {
        type: 'linear',
        beginAtZero: true,
        ticks: { precision: 0 },
        title: { display: true, text: 'Receipts Count', font: { size: 11, weight: 600 } }
      }
    }
  };

  // Graph / Chart Configuration
  public trendChartType: ChartType = 'bar';
  public trendChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Receipts Count',
        backgroundColor: 'rgba(59, 130, 246, 0.85)',
        hoverBackgroundColor: 'rgba(37, 99, 235, 1)',
        borderRadius: 6,
        yAxisID: 'y'
      },
      {
        data: [],
        label: 'Amount (₹)',
        type: 'line',
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderWidth: 2.5,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
        fill: true,
        tension: 0.35,
        yAxisID: 'y1'
      }
    ]
  };

  public trendChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { family: 'Inter', size: 12 }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const val = context.parsed.y;
            if (label.includes('Amount')) {
              return ` ${label}: ₹${Number(val).toLocaleString('en-IN')}`;
            }
            return ` ${label}: ${val}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 11 }, maxRotation: 45 }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: { display: true, text: 'Receipts Count', font: { size: 11 } },
        beginAtZero: true,
        grid: { color: 'rgba(226, 232, 240, 0.6)' },
        ticks: { precision: 0 }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: { display: true, text: 'Amount (₹)', font: { size: 11 } },
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        ticks: {
          callback: (val) => '₹' + Number(val).toLocaleString('en-IN')
        }
      }
    }
  };

  // Staff Share Doughnut Chart
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

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

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

    if (this.selectedEmployeeFilter && this.selectedEmployeeFilter !== 'all') {
      url += `&userId=${this.selectedEmployeeFilter}`;
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
          this.updateCharts();
        }
        setTimeout(() => {
          this.loading = false;
          this.refreshing = false;
          this.cdr.detectChanges();
        }, 150);
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
    this.api.get(`/reports/receipts/monthly-analysis?year=${this.selectedYear}`).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          const d = res.data;
          this.selectedYear = d.year || this.selectedYear;
          this.availableYears = d.availableYears || [this.selectedYear];
          this.monthlyData = d.monthlyData || [];
          this.monthlySummary = d.summary || this.monthlySummary;
          this.updateMonthlyChart();
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

  onYearChange() {
    this.fetchMonthlyAnalysis();
  }

  updateMonthlyChart() {
    const monthLabels = this.monthlyData && this.monthlyData.length > 0
      ? this.monthlyData.map(m => m.monthName.slice(0, 3))
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // 1. Application Fee Chart
    this.applicationChartData.labels = monthLabels;
    if (this.applicationChartData.datasets[0]) {
      this.applicationChartData.datasets[0].data = this.monthlyData.map(m => Number(m.applicationCount || 0));
    }
    if (this.applicationChartData.datasets[1]) {
      this.applicationChartData.datasets[1].data = this.monthlyData.map(m => Number(m.applicationAmount || 0));
    }

    // 2. Registration Fee Chart
    this.registrationChartData.labels = monthLabels;
    if (this.registrationChartData.datasets[0]) {
      this.registrationChartData.datasets[0].data = this.monthlyData.map(m => Number(m.registrationCount || 0));
    }
    if (this.registrationChartData.datasets[1]) {
      this.registrationChartData.datasets[1].data = this.monthlyData.map(m => Number(m.registrationAmount || 0));
    }

    // 3. Comparison Chart: Application Fee vs Registration Fee count side by side
    this.comparisonChartData.labels = monthLabels;
    if (this.comparisonChartData.datasets[0]) {
      this.comparisonChartData.datasets[0].data = this.monthlyData.map(m => Number(m.applicationCount || 0));
    }
    if (this.comparisonChartData.datasets[1]) {
      this.comparisonChartData.datasets[1].data = this.monthlyData.map(m => Number(m.registrationCount || 0));
    }
  }

  updateCharts() {
    // 1. Timeline Chart (trend)
    if (this.timelineData && this.timelineData.length > 0) {
      this.trendChartData.labels = this.timelineData.map(t => t.label || t.period_key);
      if (this.trendChartData.datasets[0]) {
        this.trendChartData.datasets[0].data = this.timelineData.map(t => Number(t.count || 0));
      }
      if (this.trendChartData.datasets[1]) {
        this.trendChartData.datasets[1].data = this.timelineData.map(t => Number(t.total_amount || 0));
      }
    } else {
      this.trendChartData.labels = ['No Data'];
      if (this.trendChartData.datasets[0]) this.trendChartData.datasets[0].data = [0];
      if (this.trendChartData.datasets[1]) this.trendChartData.datasets[1].data = [0];
    }

    // 2. Staff Distribution Chart
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
  toggleDateDropdown() {
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

  getDateRangeLabel(): string {
    switch (this.dateRange) {
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'this_week': return 'This Week';
      case 'this_month': return 'This Month';
      case 'last_month': return 'Last Month';
      case 'ytd': return 'Year to Date';
      case 'all': return 'All Time';
      case 'custom':
        return this.customStartDate && this.customEndDate
          ? `${this.customStartDate} to ${this.customEndDate}`
          : 'Custom Range';
      default: return 'This Month';
    }
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
    this.selectedEmployeeFilter = 'all';
    this.selectedTypeFilter = 'all';
    this.dateRange = 'this_month';
    this.currentPage = 1;
    this.fetchData();
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

  // Tab Navigation
  setTab(tab: 'summary' | 'monthly' | 'transactions' | 'charts') {
    this.activeTab = tab;
  }

  // Filter table by employee click & switch tab
  filterByStaff(emp: EmployeeBreakdown) {
    this.selectedEmployeeFilter = emp.user_id !== null ? String(emp.user_id) : '0';
    this.currentPage = 1;
    this.fetchData();
  }

  viewEmployeeTransactions(emp: EmployeeBreakdown) {
    this.selectedEmployeeFilter = emp.user_id !== null ? String(emp.user_id) : '0';
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
    link.setAttribute('download', `receipts_report_${this.dateRange}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  formatCurrency(val: number | string): string {
    const num = Number(val || 0);
    return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
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
