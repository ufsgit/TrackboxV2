import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

@Component({
  selector: 'app-lead-flow-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './lead-flow-report.component.html',
  styleUrl: './lead-flow-report.component.css'
})
export class LeadFlowReportComponent implements OnInit {
  loading: boolean = true;
  refreshing: boolean = false;

  // Filters
  dateRange: string = 'this_month';
  customStartDate: string = '';
  customEndDate: string = '';
  selectedEmployee: string = 'All';

  // Dropdown states
  isDateDropdownOpen: boolean = false;
  isEmployeeDropdownOpen: boolean = false;
  employeeSearchQuery: string = '';

  // Data
  users: any[] = [];
  totals: any = {
    totalCreated: 0,
    totalConverted: 0,
    totalLost: 0,
    totalInPipeline: 0,
    conversionRate: 0
  };

  daywiseTrend: any[] = [];
  monthlyTrend: any[] = [];

  // Table pagination
  leads: any[] = [];
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  isBrowser: boolean = false;

  // Year selection
  selectedYear: number = 2026;
  availableYears: number[] = [2026, 2025, 2024];
  isYearDropdownOpen: boolean = false;

  // View mode toggle
  chartMode: 'monthly' | 'daily' = 'monthly';
  activeViewTab: 'charts' | 'matrix' | 'leads' = 'charts';

  // 2026 Monthly Data & Peak Month
  months2026: any[] = [];
  peakMonth: any = null;

  // Chart 1 (Monthly Side): Total Leads Received (Jan to Dec 2026)
  public monthlyLeadsChartData: ChartConfiguration['data'] = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      type: 'bar',
      label: 'Leads Received',
      data: [],
      backgroundColor: [],
      borderColor: [],
      borderWidth: 2,
      borderRadius: 8,
      hoverBackgroundColor: '#1d4ed8',
      maxBarThickness: 42
    }]
  };

  // Chart 2 (Monthly Side): Leads Converted (Jan to Dec 2026)
  public monthlyConversionChartData: ChartConfiguration['data'] = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      type: 'bar',
      label: 'Leads Converted (Won)',
      data: [],
      backgroundColor: [],
      borderColor: [],
      borderWidth: 2,
      borderRadius: 8,
      hoverBackgroundColor: '#047857',
      maxBarThickness: 42
    }]
  };

  public monthlyChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#ffffff',
        titleFont: { size: 13, weight: 'bold' },
        bodyColor: '#e2e8f0',
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          afterTitle: (tooltipItems) => {
            const index = tooltipItems[0]?.dataIndex;
            if (this.months2026[index]?.isPeak) {
              return '⭐ HIGHEST LEADS MONTH';
            }
            return '';
          },
          label: (context) => {
            const val = context.parsed.y ?? 0;
            const index = context.dataIndex;
            const monthObj = this.months2026[index];
            if (context.dataset.label === 'Leads Received') {
              return `Leads Received: ${val}`;
            } else {
              const rate = monthObj?.conversionRate ?? 0;
              return `Converted: ${val} (Win Rate: ${rate}%)`;
            }
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(226, 232, 240, 0.6)' },
        ticks: { precision: 0, color: '#64748b', font: { size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 11, weight: 'bold' } }
      }
    }
  };

  // Chart 3: Lead Creations Count (Day-wise)
  public creationChartData: ChartConfiguration['data'] = {
    datasets: [{
      data: [],
      label: 'Leads Created',
      borderColor: '#38bdf8',
      backgroundColor: 'rgba(56, 189, 248, 0.22)',
      pointBackgroundColor: '#0284c7',
      pointBorderColor: '#ffffff',
      pointHoverBackgroundColor: '#ffffff',
      pointHoverBorderColor: '#0284c7',
      pointRadius: 4,
      pointHoverRadius: 6,
      fill: true,
      tension: 0.35,
      borderWidth: 2.5
    }],
    labels: []
  };

  // Chart 4: Conversion Count (Day-wise)
  public conversionChartData: ChartConfiguration['data'] = {
    datasets: [{
      data: [],
      label: 'Leads Converted (Won)',
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.18)',
      pointBackgroundColor: '#059669',
      pointBorderColor: '#ffffff',
      pointHoverBackgroundColor: '#ffffff',
      pointHoverBorderColor: '#059669',
      pointRadius: 4,
      pointHoverRadius: 6,
      fill: true,
      tension: 0.35,
      borderWidth: 2.5
    }],
    labels: []
  };

  public lineChartOptions: ChartConfiguration['options'] = {
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
        displayColors: false
      }
    }
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
    this.fetchEmployees();
    this.fetchData();
  }

  fetchEmployees() {
    this.api.get('/settings/team').subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.users = res.data;
        }
      },
      error: (err: any) => console.error('Failed to load team:', err)
    });
  }

  fetchData(isRefresh = false) {
    if (isRefresh) {
      this.refreshing = true;
    } else {
      this.loading = true;
    }

    let url = `/reports/leads/flow?dateRange=${this.dateRange}&year=${this.selectedYear}&page=${this.currentPage}&limit=${this.pageSize}`;

    if (this.dateRange === 'custom') {
      if (!this.customStartDate || !this.customEndDate) {
        this.loading = false;
        this.refreshing = false;
        return;
      }
      url += `&startDate=${this.customStartDate}&endDate=${this.customEndDate}`;
    }

    if (this.selectedEmployee && this.selectedEmployee !== 'All') {
      url += `&employee=${encodeURIComponent(this.selectedEmployee)}`;
    }

    this.api.get(url).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          const d = res.data;
          this.totals = d.totals || this.totals;
          this.daywiseTrend = d.daywiseTrend || [];
          this.monthlyTrend = d.monthlyTrend || [];
          this.months2026 = d.months2026 || [];
          this.peakMonth = d.peakMonth || null;
          this.leads = d.leads || [];
          this.currentPage = d.page || this.currentPage;
          this.totalPages = d.totalPages || 1;

          if (d.dropdownUsers && d.dropdownUsers.length > 0) {
            this.users = d.dropdownUsers;
          }

          this.updateCharts();
        }
        this.loading = false;
        this.refreshing = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to fetch lead flow report:', err);
        this.loading = false;
        this.refreshing = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateCharts() {
    // 1. Monthly 2026 Charts
    if (this.months2026 && this.months2026.length > 0) {
      const labels = this.months2026.map(m => m.shortName);
      const creationValues = this.months2026.map(m => Number(m.createdCount) || 0);
      const conversionValues = this.months2026.map(m => Number(m.convertedCount) || 0);

      // Colors for Left Chart (Total Leads Received) - Highlight Peak Month
      const leadsBgColors = this.months2026.map(m => 
        m.isPeak ? '#2563eb' : (m.createdCount > 0 ? '#38bdf8' : 'rgba(203, 213, 225, 0.45)')
      );
      const leadsBorderColors = this.months2026.map(m => 
        m.isPeak ? '#1d4ed8' : (m.createdCount > 0 ? '#0284c7' : 'rgba(148, 163, 184, 0.5)')
      );

      this.monthlyLeadsChartData = {
        labels: [...labels],
        datasets: [{
          type: 'bar',
          label: 'Leads Received',
          data: [...creationValues],
          backgroundColor: leadsBgColors,
          borderColor: leadsBorderColors,
          borderWidth: 2,
          borderRadius: 8,
          maxBarThickness: 38
        }]
      };

      // Colors for Right Chart (Lead Conversions)
      const convBgColors = this.months2026.map(m => 
        m.convertedCount > 0 ? '#10b981' : 'rgba(203, 213, 225, 0.45)'
      );
      const convBorderColors = this.months2026.map(m => 
        m.convertedCount > 0 ? '#059669' : 'rgba(148, 163, 184, 0.5)'
      );

      this.monthlyConversionChartData = {
        labels: [...labels],
        datasets: [{
          type: 'bar',
          label: 'Leads Converted (Won)',
          data: [...conversionValues],
          backgroundColor: convBgColors,
          borderColor: convBorderColors,
          borderWidth: 2,
          borderRadius: 8,
          maxBarThickness: 38
        }]
      };
    }

    // 2. Day-wise Charts
    if (this.daywiseTrend && this.daywiseTrend.length > 0) {
      const dayLabels = this.daywiseTrend.map(r => r.formattedDay || r.day);
      const dayCreationPoints = this.daywiseTrend.map(r => Number(r.createdCount) || 0);
      const dayConversionPoints = this.daywiseTrend.map(r => Number(r.convertedCount) || 0);

      this.creationChartData = {
        labels: [...dayLabels],
        datasets: [{
          ...this.creationChartData.datasets[0],
          data: [...dayCreationPoints]
        }]
      };

      this.conversionChartData = {
        labels: [...dayLabels],
        datasets: [{
          ...this.conversionChartData.datasets[0],
          data: [...dayConversionPoints]
        }]
      };
    } else {
      this.creationChartData.labels = [];
      this.creationChartData.datasets[0].data = [];
      this.conversionChartData.labels = [];
      this.conversionChartData.datasets[0].data = [];
    }
  }

  // Year filter handler
  toggleYearDropdown(e: Event) {
    e.stopPropagation();
    this.isYearDropdownOpen = !this.isYearDropdownOpen;
    this.isDateDropdownOpen = false;
    this.isEmployeeDropdownOpen = false;
  }

  selectYear(y: number) {
    this.selectedYear = y;
    this.isYearDropdownOpen = false;
    this.fetchData();
  }

  // Filter handlers
  toggleDateDropdown(e: Event) {
    e.stopPropagation();
    this.isDateDropdownOpen = !this.isDateDropdownOpen;
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

  toggleEmployeeDropdown(e: Event) {
    e.stopPropagation();
    this.isEmployeeDropdownOpen = !this.isEmployeeDropdownOpen;
    this.isDateDropdownOpen = false;
  }

  selectEmployee(empId: any) {
    this.selectedEmployee = empId;
    this.isEmployeeDropdownOpen = false;
    this.currentPage = 1;
    this.fetchData();
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.fetchData();
  }

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages && p !== this.currentPage) {
      this.currentPage = p;
      this.fetchData();
    }
  }

  resetFilters() {
    this.dateRange = 'this_month';
    this.selectedEmployee = 'All';
    this.currentPage = 1;
    this.fetchData();
  }

  setActiveTab(tab: 'charts' | 'matrix' | 'leads') {
    this.activeViewTab = tab;
    this.cdr.detectChanges();
  }

  getDateRangeLabel(): string {
    const labels: Record<string, string> = {
      'today': 'Today',
      'yesterday': 'Yesterday',
      'this_week': 'This Week',
      'this_month': 'This Month',
      'last_month': 'Last Month',
      'ytd': 'This Year (YTD)',
      'all': 'All Dates',
      'custom': 'Custom Range'
    };
    return labels[this.dateRange] || 'Select Date';
  }

  getSelectedEmployeeName(): string {
    if (this.selectedEmployee === 'All') return 'All Staff';
    const found = this.users.find(u => String(u.id) === String(this.selectedEmployee));
    return found ? found.name : 'Selected Staff';
  }

  get filteredUsers(): any[] {
    if (!this.employeeSearchQuery.trim()) return this.users;
    const q = this.employeeSearchQuery.toLowerCase();
    return this.users.filter(u => 
      (u.name && u.name.toLowerCase().includes(q)) || 
      (u.employee_code && u.employee_code.toLowerCase().includes(q))
    );
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }

  get paginationStart(): number {
    if (this.totals.totalCreated === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totals.totalCreated);
  }

  get pages(): number[] {
    const list: number[] = [];
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(this.totalPages, start + 4);
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    for (let i = start; i <= end; i++) {
      list.push(i);
    }
    return list;
  }
}
