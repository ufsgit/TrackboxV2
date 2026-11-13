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

  tabs: any[] = [
    { type: 'applications', label: 'Applications', icon: 'bi-file-earmark-person', color: '#10B981', tint: 'rgba(16, 185, 129, 0.1)', count: 0 },
    { type: 'fees-paid', label: 'Fees Paid', icon: 'bi-cash-coin', color: '#F59E0B', tint: 'rgba(245, 158, 11, 0.1)', count: 0 }
  ];

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  hexToRgba(hex: string, alpha: number = 0.12): string {
    if (!hex) return 'rgba(99, 102, 241, 0.12)';
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    if (c.length === 6) {
      const num = parseInt(c, 16);
      return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
    }
    return 'rgba(99, 102, 241, 0.12)';
  }

  loadPipelineSummary(): void {
    const params: any = {
      dateRange: this.dateRange
    };
    if (this.dateRange === 'custom') {
      if (this.customStartDate) params.startDate = this.customStartDate;
      if (this.customEndDate) params.endDate = this.customEndDate;
    }

    this.api.get('/reports/application-pipeline-summary', params).subscribe({
      next: (res: any) => {
        if (res && res.success && res.data) {
          const d = res.data;
          this.summary = {
            applications: Number(d.summary?.totalApplications || 0),
            offerLetters: 0,
            feesPaid: Number(d.summary?.feesPaidCount || 0),
            feesPaidAmount: Number(d.summary?.feesPaidAmount || 0),
            visaSubmitted: 0,
            visaApproved: 0,
            enrolled: 0
          };

          const statusPalette = ['#3B82F6', '#8B5CF6', '#EC4899', '#0EA5E9', '#F59E0B', '#10B981', '#6366F1'];
          const statusIcons: Record<string, string> = {
            'offer': 'bi-envelope-paper-heart',
            'visa applied': 'bi-send-check',
            'visa submit': 'bi-send-check',
            'visa': 'bi-shield-check',
            'enrolled': 'bi-mortarboard-fill',
            'completion': 'bi-award-fill',
            'paid': 'bi-cash-coin',
            'fee': 'bi-cash-coin',
            'registered': 'bi-person-check',
            'admit': 'bi-building-check'
          };

          const dynamicTabs: any[] = [
            { type: 'applications', label: 'Applications', icon: 'bi-file-earmark-person', color: '#10B981', tint: 'rgba(16, 185, 129, 0.1)', count: this.summary.applications },
            { type: 'fees-paid', label: 'Fees Paid', icon: 'bi-cash-coin', color: '#F59E0B', tint: 'rgba(245, 158, 11, 0.1)', count: this.summary.feesPaid }
          ];

          if (d.statuses && Array.isArray(d.statuses)) {
            d.statuses.forEach((s: any, idx: number) => {
              const lower = (s.status_name || '').toLowerCase();
              let icon = 'bi-check2-circle';
              for (const [k, ic] of Object.entries(statusIcons)) {
                if (lower.includes(k)) {
                  icon = ic;
                  break;
                }
              }
              const color = s.status_color && s.status_color !== '#475569' ? s.status_color : statusPalette[idx % statusPalette.length];
              dynamicTabs.push({
                type: 'status-' + s.status_id,
                status_id: s.status_id,
                label: s.status_name,
                icon: icon,
                color: color,
                tint: this.hexToRgba(color, 0.12),
                count: Number(s.count || 0)
              });
            });
          }

          this.tabs = dynamicTabs;
        }
      },
      error: (err: any) => {
        console.error('Failed to load application pipeline summary:', err);
      }
    });
  }

  
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
        else if (path.includes('enrolled') || path.includes('completion')) this.activeType = 'enrolled';
        else if (path.includes('applications')) {
          if (!this.activeType.startsWith('status-')) {
            this.activeType = 'applications';
          }
        }
        this.restoreReportState();
        this.fetchData();
      })
    );

    this.sub.add(
      this.route.queryParams.subscribe(qp => {
        if (qp && qp['statusId']) {
          this.activeType = 'status-' + qp['statusId'];
          this.fetchData();
        } else if (qp && qp['status']) {
          const match = this.tabs.find(t => (t.label || '').toLowerCase() === qp['status'].toLowerCase());
          if (match) {
            this.activeType = match.type;
            this.fetchData();
          }
        }
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
    this.currentPage = 1;
    this.restoreReportState();
    
    if (type === 'applications' || type === 'fees-paid') {
      this.router.navigate([`/reports/${type}`], { replaceUrl: true });
    } else if (type.startsWith('status-')) {
      const sid = type.replace('status-', '');
      this.router.navigate([`/reports/applications`], { queryParams: { statusId: sid }, replaceUrl: true });
    } else {
      this.router.navigate([`/reports/${type}`], { replaceUrl: true });
    }
    this.fetchData();
  }

  fetchData(isRefresh = false): void {
    if (isRefresh) {
      this.refreshing = true;
    } else {
      this.loading = true;
    }

    this.loadPipelineSummary();

    const params: any = {
      type: this.activeType,
      dateRange: this.dateRange,
      page: this.currentPage,
      limit: this.pageSize
    };

    if (this.activeType.startsWith('status-')) {
      params.statusId = this.activeType.replace('status-', '');
    }

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
            this.summary = { ...this.summary, ...res.data.summary };
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

  getTabBadgeCount(target: any): number | string {
    if (target && typeof target === 'object' && target.count !== undefined) {
      return target.count;
    }
    const type = typeof target === 'string' ? target : target?.type;
    const found = this.tabs.find(t => t.type === type);
    if (found && found.count !== undefined) return found.count;
    if (type === 'applications') return this.summary.applications;
    if (type === 'fees-paid') return this.summary.feesPaid;
    return 0;
  }

  getActiveTabInfo() {
    return this.tabs.find(t => t.type === this.activeType) || this.tabs[0] || { label: 'Applications', icon: 'bi-file-earmark-person', color: '#10B981', tint: 'rgba(16, 185, 129, 0.1)' };
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
