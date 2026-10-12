import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

@Component({
  selector: 'app-application-status-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './application-status-report.component.html',
  styleUrl: './application-status-report.component.css'
})
export class ApplicationStatusReportComponent implements OnInit {
  loading: boolean = true;
  refreshing: boolean = false;

  dateRange: string = 'all';
  customStartDate: string = '';
  customEndDate: string = '';
  isDateDropdownOpen: boolean = false;

  totalApplications: number = 0;
  breakdown: any[] = [];
  chartBreakdown: any[] = [];

  // --- Modal State ---
  isModalOpen: boolean = false;
  modalTitle: string = '';
  modalSubtitle: string = '';
  modalLoading: boolean = false;
  modalSearchQuery: string = '';
  modalCurrentPage: number = 1;
  modalPageSize: number = 10;
  modalTotalCount: number = 0;
  modalTotalPages: number = 1;
  modalApplications: any[] = [];
  modalStatusFilter: string = 'all';

  // Chart configuration
  public pieChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%', // Makes it a donut chart
    onClick: (evt: any, elements: any[]) => {
      if (elements && elements.length > 0) {
        const index = elements[0].index;
        const item = this.chartBreakdown[index];
        if (item) {
          this.openStatusDetails(item.status, item.count, item.color);
        }
      }
    },
    onHover: (event: any, chartElement: any[]) => {
      if (event?.native?.target) {
        event.native.target.style.cursor = (chartElement && chartElement.length > 0) ? 'pointer' : 'default';
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: 'Inter, sans-serif',
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#212529',
        bodyColor: '#212529',
        borderColor: '#dee2e6',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          afterLabel: () => '👉 Click to view applications'
        }
      }
    }
  };

  public pieChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  isBrowser = false;

  constructor(
    private api: ApiService, 
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.fetchData();
  }

  fetchData(isRefresh = false) {
    if (isRefresh) {
      this.refreshing = true;
    } else {
      this.loading = true;
    }

    let endpoint = `/reports/applications/status-summary?dateRange=${this.dateRange}`;
    if (this.dateRange === 'custom') {
      if (!this.customStartDate || !this.customEndDate) {
        this.loading = false;
        this.refreshing = false;
        return;
      }
      endpoint += `&startDate=${this.customStartDate}&endDate=${this.customEndDate}`;
    }

    this.api.get(endpoint).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.breakdown = res.data || [];
          this.totalApplications = this.breakdown.reduce((sum, item) => sum + (Number(item.count) || 0), 0);
          this.updateChart();
        }
        setTimeout(() => {
          this.loading = false;
          this.refreshing = false;
          this.cdr.detectChanges();
        }, 150);
      },
      error: (err: any) => {
        console.error('Failed to load application status report', err);
        this.loading = false;
        this.refreshing = false;
      }
    });
  }

  updateChart() {
    this.chartBreakdown = this.breakdown.filter(d => Number(d.count) > 0);
    
    this.pieChartData = {
      labels: this.chartBreakdown.map(d => d.status),
      datasets: [
        {
          data: this.chartBreakdown.map(d => Number(d.count)),
          backgroundColor: this.chartBreakdown.map((d, i) => d.color || this.getStatusColor(i)),
          borderWidth: 0,
          hoverOffset: 6
        }
      ]
    };
  }

  toggleDateDropdown() {
    this.isDateDropdownOpen = !this.isDateDropdownOpen;
  }

  selectDateRange(range: string) {
    this.dateRange = range;
    if (range !== 'custom') {
      this.isDateDropdownOpen = false;
      this.fetchData();
    }
  }

  applyCustomDate() {
    if (this.customStartDate && this.customEndDate) {
      this.isDateDropdownOpen = false;
      this.fetchData();
    }
  }

  getDateRangeLabel(): string {
    const labels: any = {
      'all': 'All Dates',
      'today': 'Today',
      'this_week': 'This Week',
      'this_month': 'This Month',
      'last_month': 'Last Month',
      'ytd': 'Year to Date',
      'prev_year': 'Previous Year',
      'custom': 'Custom Range'
    };
    return labels[this.dateRange] || 'All Dates';
  }

  getStatusColor(index: number): string {
    const colors = ['#10b981', '#fb3909', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#f97316'];
    return colors[index % colors.length];
  }

  // --- Modal Popup Handlers ---
  openCardDetails() {
    this.modalStatusFilter = 'all';
    this.modalTitle = 'All Applications';
    this.modalSubtitle = `Showing all applications in ${this.getDateRangeLabel()} (${this.totalApplications} total)`;
    this.modalCurrentPage = 1;
    this.modalSearchQuery = '';
    this.isModalOpen = true;
    this.fetchModalApplications();
  }

  openStatusDetails(statusName: string, count?: number, color?: string) {
    this.modalStatusFilter = statusName;
    const countText = count !== undefined ? ` (${count} total)` : '';
    this.modalTitle = `Applications: ${statusName}`;
    this.modalSubtitle = `Status: ${statusName} in ${this.getDateRangeLabel()}${countText}`;
    this.modalCurrentPage = 1;
    this.modalSearchQuery = '';
    this.isModalOpen = true;
    this.fetchModalApplications();
  }

  closeModal() {
    this.isModalOpen = false;
    this.modalApplications = [];
    this.modalSearchQuery = '';
    this.modalTotalCount = 0;
  }

  fetchModalApplications() {
    this.modalLoading = true;
    let url = `/reports/applications/status-summary?viewDetails=true&page=${this.modalCurrentPage}&limit=${this.modalPageSize}&dateRange=${this.dateRange}`;

    if (this.dateRange === 'custom' && this.customStartDate && this.customEndDate) {
      url += `&startDate=${this.customStartDate}&endDate=${this.customEndDate}`;
    }

    if (this.modalStatusFilter && this.modalStatusFilter !== 'all') {
      url += `&statusName=${encodeURIComponent(this.modalStatusFilter)}`;
    }

    if (this.modalSearchQuery && this.modalSearchQuery.trim()) {
      url += `&search=${encodeURIComponent(this.modalSearchQuery.trim())}`;
    }

    this.api.get(url).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.modalApplications = res.data.applications || [];
          this.modalTotalCount = res.data.totalCount || 0;
          this.modalTotalPages = res.data.totalPages || 1;
        } else {
          this.modalApplications = [];
          this.modalTotalCount = 0;
          this.modalTotalPages = 1;
        }
        this.modalLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to load application details', err);
        this.modalApplications = [];
        this.modalTotalCount = 0;
        this.modalTotalPages = 1;
        this.modalLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onModalSearch() {
    this.modalCurrentPage = 1;
    this.fetchModalApplications();
  }

  clearModalSearch() {
    this.modalSearchQuery = '';
    this.onModalSearch();
  }

  goToModalPage(page: number) {
    if (page >= 1 && page <= this.modalTotalPages && page !== this.modalCurrentPage) {
      this.modalCurrentPage = page;
      this.fetchModalApplications();
    }
  }

  getInitials(name: string): string {
    if (!name) return 'AP';
    return name
      .split(' ')
      .filter(p => p.length > 0)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('');
  }

  getPaginationArray(): number[] {
    const total = this.modalTotalPages;
    const current = this.modalCurrentPage;
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const start = Math.max(1, Math.min(current - 2, total - 4));
    return Array.from({ length: 5 }, (_, i) => start + i);
  }
}
