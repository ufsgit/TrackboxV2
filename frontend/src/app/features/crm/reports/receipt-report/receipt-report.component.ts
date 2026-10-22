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
  activeTab: 'summary' | 'transactions' | 'charts' = 'summary';

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
  }

  fetchData(isRefresh = false) {
    if (isRefresh) {
      this.refreshing = true;
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
  setTab(tab: 'summary' | 'transactions' | 'charts') {
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
