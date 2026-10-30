import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { Subscription } from 'rxjs';
import * as XLSX from 'xlsx';

export interface PipelineSummary {
  applications: number;
  offerLetters: number;
  feesPaid: number;
  feesPaidAmount: number;
  visaSubmitted: number;
  visaApproved: number;
  enrolled: number;
}

@Component({
  selector: 'app-pipeline-kpi-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './pipeline-kpi-report.component.html',
  styleUrls: ['./pipeline-kpi-report.component.scss']
})
export class PipelineKpiReportComponent implements OnInit, OnDestroy {
  activeType: string = 'applications';
  loading: boolean = true;
  refreshing: boolean = false;

  // Filter state
  dateRange: string = 'all';
  customStartDate: string = '';
  customEndDate: string = '';
  searchQuery: string = '';
  isDateDropdownOpen: boolean = false;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 20;
  totalCount: number = 0;
  totalPages: number = 1;

  // Data
  items: any[] = [];
  summary: PipelineSummary = {
    applications: 0,
    offerLetters: 0,
    feesPaid: 0,
    feesPaidAmount: 0,
    visaSubmitted: 0,
    visaApproved: 0,
    enrolled: 0
  };

  private sub: Subscription = new Subscription();

  tabs = [
    { type: 'applications', label: 'Applications', icon: 'bi-file-earmark-person', color: '#10B981', tint: 'rgba(16, 185, 129, 0.1)' },
    { type: 'offer-letters', label: 'Offer Received', icon: 'bi-envelope-paper-heart', color: '#8B5CF6', tint: 'rgba(139, 92, 246, 0.1)' },
    { type: 'fees-paid', label: 'Fees Paid', icon: 'bi-cash-coin', color: '#F59E0B', tint: 'rgba(245, 158, 11, 0.1)' },
    { type: 'visa-submitted', label: 'Visa Applied', icon: 'bi-send-check', color: '#0EA5E9', tint: 'rgba(14, 165, 233, 0.1)' },
    { type: 'visa-approved', label: 'Visa Received', icon: 'bi-check-circle-fill', color: '#10B981', tint: 'rgba(16, 185, 129, 0.1)' },
    { type: 'enrolled', label: 'Enrolled / Travelled', icon: 'bi-mortarboard-fill', color: '#6366F1', tint: 'rgba(99, 102, 241, 0.1)' },
  ];

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  
  get currentUrl(): string {
    return this.router.url;
  }

  saveReportState(): void {
    try {
      const state = {
        currentPage: this.currentPage,
        pageSize: this.pageSize,
        dateRange: this.dateRange,
        customStartDate: this.customStartDate,
        customEndDate: this.customEndDate,
        searchQuery: this.searchQuery
      };
      sessionStorage.setItem('kpi_report_state_' + this.activeType, JSON.stringify(state));
    } catch (e) {}
  }

  restoreReportState(): void {
    try {
      const raw = sessionStorage.getItem('kpi_report_state_' + this.activeType);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.currentPage) this.currentPage = s.currentPage;
        if (s.pageSize) this.pageSize = s.pageSize;
        if (s.dateRange) this.dateRange = s.dateRange;
        if (s.customStartDate !== undefined) this.customStartDate = s.customStartDate;
        if (s.customEndDate !== undefined) this.customEndDate = s.customEndDate;
        if (s.searchQuery !== undefined) this.searchQuery = s.searchQuery;
      }
    } catch (e) {}
  }

  ngOnInit(): void {
    // Determine active type from route path or data
    this.sub.add(
      this.route.data.subscribe(data => {
        if (data && data['defaultType']) {
          this.activeType = data['defaultType'];
        }
      })
    );

    this.sub.add(
      this.route.url.subscribe(segments => {
        const path = segments.map(s => s.path).join('/');
        if (path.includes('offer-letters')) this.activeType = 'offer-letters';
        else if (path.includes('fees-paid')) this.activeType = 'fees-paid';
        else if (path.includes('visa-submitted')) this.activeType = 'visa-submitted';
        else if (path.includes('visa-approved')) this.activeType = 'visa-approved';
        else if (path.includes('enrolled')) this.activeType = 'enrolled';
        else if (path.includes('applications')) this.activeType = 'applications';
        this.restoreReportState();
        this.fetchData();
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  switchTab(type: string): void {
    if (this.activeType === type) return;
    this.saveReportState();
    this.activeType = type;
    this.restoreReportState();
    
    // Update browser URL smoothly
    this.router.navigate([`/reports/${type}`], { replaceUrl: true });
    this.fetchData();
  }

  fetchData(isRefresh = false): void {
    if (isRefresh) {
      this.refreshing = true;
    } else {
      this.loading = true;
    }

    const params: any = {
      type: this.activeType,
      dateRange: this.dateRange,
      page: this.currentPage,
      limit: this.pageSize
    };

    if (this.searchQuery && this.searchQuery.trim()) {
      params.search = this.searchQuery.trim();
    }

    if (this.dateRange === 'custom') {
      if (this.customStartDate) params.startDate = this.customStartDate;
      if (this.customEndDate) params.endDate = this.customEndDate;
    }

    this.api.get('/reports/pipeline-kpis', params).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.refreshing = false;
        if (res && res.success && res.data) {
          this.items = res.data.items || [];
          this.saveReportState();
          this.totalCount = res.data.totalCount || 0;
          this.totalPages = res.data.totalPages || 1;
          if (res.data.summary) {
            this.summary = res.data.summary;
          }
        } else {
          this.items = [];
          this.totalCount = 0;
          this.totalPages = 1;
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.refreshing = false;
        console.error('Failed to load pipeline KPI report:', err);
        this.items = [];
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.fetchData();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.currentPage = 1;
    this.fetchData();
  }

  selectDateRange(range: string): void {
    this.dateRange = range;
    this.isDateDropdownOpen = false;
    this.currentPage = 1;
    if (range !== 'custom') {
      this.fetchData();
    }
  }

  applyCustomDate(): void {
    if (this.customStartDate && this.customEndDate) {
      this.isDateDropdownOpen = false;
      this.currentPage = 1;
      this.fetchData();
    }
  }

  getDateRangeLabel(): string {
    const labels: any = {
      'all': 'All Time',
      'today': 'Today',
      'this_week': 'This Week',
      'this_month': 'This Month',
      'last_30_days': 'Last 30 Days',
      'this_year': 'This Year',
      'custom': 'Custom Range'
    };
    return labels[this.dateRange] || 'All Time';
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages && p !== this.currentPage) {
      this.currentPage = p;
      this.fetchData();
    }
  }

  goBack(): void {
    this.router.navigate(['/crm-dashboard']);
  }

  getTabBadgeCount(type: string): number | string {
    switch (type) {
      case 'applications': return this.summary.applications;
      case 'offer-letters': return this.summary.offerLetters;
      case 'fees-paid': return this.summary.feesPaid;
      case 'visa-submitted': return this.summary.visaSubmitted;
      case 'visa-approved': return this.summary.visaApproved;
      case 'enrolled': return this.summary.enrolled;
      default: return 0;
    }
  }

  getActiveTabInfo() {
    return this.tabs.find(t => t.type === this.activeType) || this.tabs[0];
  }

  getInitials(name: string): string {
    if (!name) return 'AP';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  exportToExcel(): void {
    if (!this.items || this.items.length === 0) return;

    let exportRows: any[] = [];

    if (this.activeType === 'fees-paid') {
      exportRows = this.items.map((it, idx) => ({
        '#': idx + 1,
        'Receipt No': '#' + (it.receipt_id || ''),
        'Student / Payer': it.applicant_name || 'N/A',
        'Phone': it.applicant_phone || 'N/A',
        'Email': it.applicant_email || 'N/A',
        'Receipt Type': it.receipt_type_name || 'Application Fees',
        'Amount (INR)': it.amount || '0.00',
        'Payment Date': it.receipt_date ? new Date(it.receipt_date).toLocaleDateString() : 'N/A',
        'Recorded On': it.created_at ? new Date(it.created_at).toLocaleString() : 'N/A',
        'Received By': it.received_by_name || 'System',
        'Counselor': it.assigned_counselor || 'Unassigned',
        'Notes': it.description || ''
      }));
    } else {
      exportRows = this.items.map((it, idx) => ({
        '#': idx + 1,
        'Application ID': '#' + (it.application_id || ''),
        'Applicant Name': it.applicant_name || 'N/A',
        'Phone': it.applicant_phone || 'N/A',
        'Email': it.applicant_email || 'N/A',
        'Country': it.country || 'N/A',
        'University': it.university || 'N/A',
        'Course': it.course || 'N/A',
        'Year': it.year_name || 'N/A',
        'Status': it.status_name || 'N/A',
        'Created Date': it.application_created_at ? new Date(it.application_created_at).toLocaleString() : 'N/A',
        'Updated Date': it.application_updated_at ? new Date(it.application_updated_at).toLocaleString() : 'N/A',
        'Counselor': it.assigned_counselor || 'Unassigned'
      }));
    }

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportRows);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const sheetName = this.getActiveTabInfo().label.slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const fileName = `${this.activeType}-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }
}
