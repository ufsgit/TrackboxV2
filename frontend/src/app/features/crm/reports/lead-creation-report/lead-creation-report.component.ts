import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { ExcelExportBtnComponent } from '../../../../shared/components/excel-export-btn/excel-export-btn.component';

@Component({
  selector: 'app-lead-creation-report',
  standalone: true,
  imports: [CommonModule, FormsModule, ExcelExportBtnComponent],
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

  getExportFilters(): any {
    const filters: any = {
      dateRange: this.dateRange
    };
    if (this.dateRange === 'custom') {
      filters.startDate = this.customStartDate;
      filters.endDate = this.customEndDate;
    }
    return filters;
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
          const d = res.data;
          this.totalLeads = d.totalLeads || 0;
          this.rangeLeads = d.rangeLeads || 0;
          this.todayLeads = d.todayLeads || 0;
          this.weekLeads = d.weekLeads || 0;
          this.breakdown = d.breakdown || [];
        }
        this.loading = false;
        this.refreshing = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to load lead creation report', err);
        this.loading = false;
        this.refreshing = false;
      }
    });
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
    const labels: Record<string, string> = {
      'today': 'Today',
      'this_week': 'This Week',
      'this_month': 'This Month',
      'last_month': 'Last Month',
      'ytd': 'Year to Date',
      'custom': 'Custom Range'
    };
    return labels[this.dateRange] || 'Date Range';
  }

  getContributionPercent(leadsCreated: number): number {
    if (!this.rangeLeads || this.rangeLeads === 0) return 0;
    return Math.round((leadsCreated / this.rangeLeads) * 100);
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  getAvatarColor(index: number): string {
    const colors = [
      'linear-gradient(135deg, #6366f1, #4f46e5)',
      'linear-gradient(135deg, #3b82f6, #2563eb)',
      'linear-gradient(135deg, #10b981, #059669)',
      'linear-gradient(135deg, #f59e0b, #d97706)',
      'linear-gradient(135deg, #ec4899, #db2777)',
      'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      'linear-gradient(135deg, #14b8a6, #0d9488)',
      'linear-gradient(135deg, #f97316, #ea580c)'
    ];
    return colors[index % colors.length];
  }

  // ══════════════════════════════════════════════
  // POPUP MODAL METHODS
  // ══════════════════════════════════════════════

  openCardDetails(filterType: 'all' | 'range' | 'today' | 'week', title: string, subtitle: string) {
    this.modalFilterType = filterType;
    this.modalUserId = null;
    this.modalEmployeeName = '';
    this.modalTitle = title;
    this.modalSubtitle = subtitle;
    this.modalBadge = filterType === 'all' ? 'All Time' :
                      filterType === 'today' ? 'Today' :
                      filterType === 'week' ? 'This Week' : this.getDateRangeLabel();
    this.modalSearchQuery = '';
    this.modalCurrentPage = 1;
    this.isModalOpen = true;
    this.fetchModalLeads();
  }

  openEmployeeDetails(row: any) {
    this.modalFilterType = 'employee';
    this.modalUserId = row.user_id;
    this.modalEmployeeName = row.employee || 'Unassigned';
    this.modalTitle = `${this.modalEmployeeName}'s Generated Leads`;
    this.modalSubtitle = `Leads created by ${this.modalEmployeeName} in ${this.getDateRangeLabel()}`;
    this.modalBadge = `${row.leads_created} Leads`;
    this.modalSearchQuery = '';
    this.modalCurrentPage = 1;
    this.isModalOpen = true;
    this.fetchModalLeads();
  }

  closeModal() {
    this.isModalOpen = false;
    this.modalLeads = [];
  }

  
  clearModalSearch() {
    this.modalSearchQuery = '';
    this.modalCurrentPage = 1;
    this.fetchModalLeads();
  }

  get modalPaginationStart(): number {
    if (this.modalTotalCount === 0) return 0;
    return (this.modalCurrentPage - 1) * this.modalPageSize + 1;
  }

  get modalPaginationEnd(): number {
    return Math.min(this.modalCurrentPage * this.modalPageSize, this.modalTotalCount);
  }

  get modalPages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.modalCurrentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.modalTotalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  onModalSearch() {
    this.modalCurrentPage = 1;
    this.fetchModalLeads();
  }

  goToModalPage(page: number) {
    if (page >= 1 && page <= this.modalTotalPages && page !== this.modalCurrentPage) {
      this.modalCurrentPage = page;
      this.fetchModalLeads();
    }
  }

  fetchModalLeads() {
    this.modalLoading = true;
    let url = `/reports/leads/creation?viewDetails=true&filterType=${this.modalFilterType}&page=${this.modalCurrentPage}&limit=${this.modalPageSize}`;
    
    // Pass date range context
    if (this.modalFilterType === 'range' || this.modalFilterType === 'employee') {
      url += `&dateRange=${this.dateRange}`;
      if (this.dateRange === 'custom') {
        url += `&startDate=${this.customStartDate}&endDate=${this.customEndDate}`;
      }
    }

    if (this.modalFilterType === 'employee') {
      url += `&userId=${this.modalUserId}`;
    }

    if (this.modalSearchQuery.trim()) {
      url += `&search=${encodeURIComponent(this.modalSearchQuery.trim())}`;
    }

    this.api.get(url).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.modalLeads = res.data.leads || [];
          this.modalTotalCount = res.data.totalCount || 0;
          this.modalTotalPages = res.data.totalPages || 1;
        } else {
          this.modalLeads = [];
          this.modalTotalCount = 0;
          this.modalTotalPages = 1;
        }
        this.modalLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to load lead creation details', err);
        this.modalLoading = false;
        this.modalLeads = [];
        this.cdr.detectChanges();
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  getChannelClass(channel: string): string {
    const c = (channel || '').toLowerCase();
    if (c.includes('whatsapp')) return 'ch-whatsapp';
    if (c.includes('web') || c.includes('site')) return 'ch-web';
    if (c.includes('facebook') || c.includes('fb')) return 'ch-fb';
    if (c.includes('instagram') || c.includes('ig')) return 'ch-ig';
    if (c.includes('call') || c.includes('phone')) return 'ch-phone';
    if (c.includes('import')) return 'ch-import';
    return 'ch-default';
  }

  getChannelIcon(channel: string): string {
    const c = (channel || '').toLowerCase();
    if (c.includes('whatsapp')) return 'bi bi-whatsapp';
    if (c.includes('web') || c.includes('site')) return 'bi bi-globe';
    if (c.includes('facebook') || c.includes('fb')) return 'bi bi-facebook';
    if (c.includes('instagram') || c.includes('ig')) return 'bi bi-instagram';
    if (c.includes('call') || c.includes('phone')) return 'bi bi-telephone-fill';
    if (c.includes('import')) return 'bi bi-file-earmark-arrow-down-fill';
    return 'bi bi-broadcast-pin';
  }
}
