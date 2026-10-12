import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-lead-creation-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lead-creation-report.component.html',
  styleUrl: './lead-creation-report.component.css'
})
export class LeadCreationReportComponent implements OnInit {
  loading: boolean = true;
  refreshing: boolean = false;

  dateRange: string = 'ytd';
  customStartDate: string = '';
  customEndDate: string = '';
  isDateDropdownOpen: boolean = false;

  totalLeads: number = 0;
  rangeLeads: number = 0;
  todayLeads: number = 0;
  weekLeads: number = 0;
  breakdown: any[] = [];

  // Popup Modal State
  isModalOpen: boolean = false;
  modalTitle: string = '';
  modalSubtitle: string = '';
  modalBadge: string = '';
  modalFilterType: 'all' | 'range' | 'today' | 'week' | 'employee' = 'range';
  modalUserId: any = null;
  modalEmployeeName: string = '';
  modalLoading: boolean = false;
  modalSearchQuery: string = '';
  modalCurrentPage: number = 1;
  modalPageSize: number = 10;
  modalTotalCount: number = 0;
  modalTotalPages: number = 1;
  modalLeads: any[] = [];

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

    let endpoint = `/reports/leads/creation?dateRange=${this.dateRange}`;
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
          this.totalLeads = res.data.totalLeads || 0;
          this.rangeLeads = res.data.rangeLeads || 0;
          this.todayLeads = res.data.todayLeads || 0;
          this.weekLeads = res.data.weekLeads || 0;
          this.breakdown = res.data.breakdown || [];
        }
        setTimeout(() => {
          this.loading = false;
          this.refreshing = false;
          this.cdr.detectChanges();
        }, 150);
      },
      error: (err: any) => {
        console.error('Failed to load lead creation report', err);
        this.loading = false;
        this.refreshing = false;
      }
    });
  }

  // --- Modal Popup Handlers ---
  openCardDetails(type: 'all' | 'range' | 'today' | 'week', title: string, subtitle: string) {
    this.modalFilterType = type;
    this.modalUserId = null;
    this.modalEmployeeName = '';
    this.modalTitle = title;
    this.modalSubtitle = subtitle;
    this.modalCurrentPage = 1;
    this.modalSearchQuery = '';
    this.isModalOpen = true;
    this.fetchModalLeads();
  }

  openEmployeeDetails(row: any) {
    this.modalFilterType = 'employee';
    this.modalUserId = row.user_id;
    this.modalEmployeeName = row.employee || 'Unassigned';
    this.modalTitle = `Leads Created by ${this.modalEmployeeName}`;
    this.modalSubtitle = `Showing leads created in ${this.getDateRangeLabel()} (${row.leads_created} total)`;
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
    let url = `/reports/leads/creation?viewDetails=true&filterType=${this.modalFilterType}&page=${this.modalCurrentPage}&limit=${this.modalPageSize}&dateRange=${this.dateRange}`;

    if (this.dateRange === 'custom' && this.customStartDate && this.customEndDate) {
      url += `&startDate=${this.customStartDate}&endDate=${this.customEndDate}`;
    }

    if (this.modalFilterType === 'employee') {
      url += `&userId=${this.modalUserId ?? ''}`;
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
        console.error('Failed to load lead details for modal:', err);
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
      'today': 'Today',
      'this_week': 'This Week',
      'this_month': 'This Month',
      'last_month': 'Last Month',
      'ytd': 'Year to Date',
      'prev_year': 'Previous Year',
      'custom': 'Custom Range'
    };
    return labels[this.dateRange] || 'Year to Date';
  }

  getContributionPercent(leads: number): number {
    if (!this.rangeLeads || this.rangeLeads === 0) return 0;
    return Math.round((leads / this.rangeLeads) * 100);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getAvatarColor(index: number): string {
    const colors = ['#6366f1', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#14b8a6'];
    return colors[index % colors.length];
  }
}
