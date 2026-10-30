import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

import { LeadProfileModalComponent } from '../../../../shared/components/lead-profile-modal/lead-profile-modal.component';
import { UpdateLeadStatusModalComponent } from '../../../../shared/components/update-lead-status-modal/update-lead-status-modal.component';

@Component({
  selector: 'app-pending-followup',
  standalone: true,
  imports: [CommonModule, FormsModule, LeadProfileModalComponent, UpdateLeadStatusModalComponent],
  providers: [DatePipe],
  templateUrl: './pending-followup.component.html',
  styleUrl: './pending-followup.component.css'
})
export class PendingFollowupComponent implements OnInit {
  searchTerm: string = '';
  searchTimeout: any = null;

  followups: any[] = [];
  stats = { overdue: 0, dueToday: 0, upcoming: 0 };
  displayStats = { overdue: 0, dueToday: 0, upcoming: 0 };
  filterParam: string | null = null;

  // ── Server-side Pagination ──────────────────────────────
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 1;
  pageSizeOptions: number[] = [10, 20, 50, 100];
  loading: boolean = true;

  // ── Selected Follow-up Data for Profile Modal ───────────
  selectedFollowupRow: any = null;

  // ── Lead Profile Modal ──────────────────────────────────
  showProfileModal = false;
  profileContactId: number | null = null;
  showLeadPanel = false;
  leadPanelLoading = false;
  leadPanelData: any = null;
  leadFollowupHistory: any[] = [];

  // ── Quick Followup Modal ────────────────────────────────
  showFollowupModal = false;
  followupContactId: number | null = null;
  followupContactName = '';
  followupInitialData: any = null;

  constructor(
    private apiService: ApiService,
    private datePipe: DatePipe,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.filterParam = params['filter'] || null;
    });
    this.fetchData();
  }

  fetchData() {
    this.loading = true;
    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    };
    if (this.filterParam) {
      params.filter = this.filterParam;
    }
    if (this.searchTerm && this.searchTerm.trim()) {
      params.search = this.searchTerm.trim();
    }

    this.apiService.get('/reports/leads/pending-followups', params).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.stats = {
            overdue: res.data.overdue || 0,
            dueToday: res.data.dueToday || 0,
            upcoming: res.data.upcoming || 0
          };
          this.animateCount('overdue', this.stats.overdue);
          this.animateCount('dueToday', this.stats.dueToday);
          this.animateCount('upcoming', this.stats.upcoming);

          this.followups = (res.data.list || []).map((f: any) => ({
            ...f,
            dueDate: this.datePipe.transform(f.dueDate, 'yyyy-MM-dd')
          }));

          if (res.data.pagination) {
            this.totalItems = res.data.pagination.total;
            this.totalPages = res.data.pagination.totalPages;
            this.currentPage = res.data.pagination.page;
          } else {
            this.totalItems = this.followups.length;
            this.totalPages = 1;
          }
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Error fetching pending followups:', err);
      }
    });
  }


  // ── Lead Profile Page Navigation ─────────────────────────
  openLeadProfile(row: any) {
    const contactId = row?.id || row?.lead_id || row?.contact_id;
    if (!contactId) return;
    this.profileContactId = contactId;
    this.selectedFollowupRow = row;
    this.showProfileModal = true;
  }

  closeLeadPanel() {
    this.showLeadPanel = false;
    this.leadPanelData = null;
  }

  closeProfileModal() {
    this.showProfileModal = false;
    this.profileContactId = null;
    this.selectedFollowupRow = null;
  }


  openFollowup(row: any) {
    const contactId = row?.id || row?.lead_id || row?.contact_id;
    if (!contactId) return;
    this.followupContactId = contactId;
    this.followupContactName = row.leadName || row.name || '';
    this.followupInitialData = row;
    this.showFollowupModal = true;
  }

  closeFollowupModal() {
    this.showFollowupModal = false;
    this.followupContactId = null;
    this.followupInitialData = null;
  }

  // ── Helpers ─────────────────────────────────────────────
  animateCount(key: 'overdue' | 'dueToday' | 'upcoming', target: number) {
    if (!target || target <= 0) { this.displayStats[key] = 0; return; }
    const duration = 1200;
    const startTime = performance.now();
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      this.displayStats[key] = Math.floor(target * easeProgress);
      if (progress < 1) requestAnimationFrame(step);
      else this.displayStats[key] = target;
    };
    requestAnimationFrame(step);
  }

  get pageTitle() {
    if (this.filterParam === 'upcoming') return 'Upcoming Follow-ups';
    if (this.filterParam === 'dueToday') return 'Today\'s Follow-ups';
    return 'Pending Followup';
  }

  get pageSubtitle() {
    if (this.filterParam === 'upcoming') return 'Track and manage leads scheduled for the future';
    if (this.filterParam === 'dueToday') return 'Track and manage leads that need attention today';
    return 'Track and manage leads that need attention';
  }

  get filteredFollowups() {
    return this.followups;
  }

  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.fetchData();
  }

  goToPage(page: number) {
    this.onPageChange(page);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.fetchData();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.fetchData();
    }
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.fetchData();
  }

  onSearchChange() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.fetchData();
    }, 300);
  }

  setFilter(status: string | null) {
    this.filterParam = this.filterParam === status ? null : status;
    this.currentPage = 1;
    this.fetchData();
  }

  get paginationStart(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Overdue': return 'badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle px-3 py-2';
      case 'Due Today': return 'badge rounded-pill bg-warning-subtle text-warning border border-warning-subtle px-3 py-2';
      case 'Upcoming': return 'badge rounded-pill bg-info-subtle text-info border border-info-subtle px-3 py-2';
      default: return 'badge rounded-pill bg-light text-dark px-3 py-2';
    }
  }
}
