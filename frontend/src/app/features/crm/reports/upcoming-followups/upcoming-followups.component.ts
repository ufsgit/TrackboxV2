import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { LeadProfileModalComponent } from '../../../../shared/components/lead-profile-modal/lead-profile-modal.component';
import { UpdateLeadStatusModalComponent } from '../../../../shared/components/update-lead-status-modal/update-lead-status-modal.component';
import { ExcelExportBtnComponent } from '../../../../shared/components/excel-export-btn/excel-export-btn.component';

@Component({
  selector: 'app-upcoming-followups',
  standalone: true,
  imports: [CommonModule, FormsModule, LeadProfileModalComponent, UpdateLeadStatusModalComponent, ExcelExportBtnComponent],
  providers: [DatePipe],
  templateUrl: './upcoming-followups.component.html',
  styleUrl: './upcoming-followups.component.css'
})
export class UpcomingFollowupsComponent implements OnInit {
  searchTerm: string = '';
  searchTimeout: any = null;
  loading: boolean = true;

  leads: any[] = [];
  stats: any = { upcoming: 0, unassignedUpcoming: 0 };

  // ── Server-Side Pagination ──────────────────────────────
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 1;
  pageSizeOptions: number[] = [10, 20, 50, 100];

  // ── Lead Profile Modal ──────────────────────────────────
  showProfileModal = false;
  profileContactId: number | null = null;

  // ── Update Lead Status Modal ────────────────────────────
  showFollowupModal = false;
  followupContactId: number | null = null;
  followupContactName = '';
  followupInitialData: any = null;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.loading = true;
    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    };
    if (this.searchTerm && this.searchTerm.trim()) {
      params.search = this.searchTerm.trim();
    }

    this.api.get('/reports/leads/upcoming-followups', params).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.leads = res.data.list || [];
          this.stats = {
            upcoming: res.data.upcoming || 0,
            unassignedUpcoming: res.data.unassignedUpcoming || 0
          };
          if (res.data.pagination) {
            this.totalItems = res.data.pagination.total;
            this.totalPages = res.data.pagination.totalPages;
            this.currentPage = res.data.pagination.page;
          } else {
            this.totalItems = this.leads.length;
            this.totalPages = 1;
          }
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error fetching upcoming followups:', err);
      }
    });
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

  getExportFilters() {
    const f: any = {};
    if (this.searchTerm && this.searchTerm.trim()) f.search = this.searchTerm.trim();
    return f;
  }

  // ── Pagination Controls ──────────────────────────────────
  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages && p !== this.currentPage) {
      this.currentPage = p;
      this.fetchData();
    }
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

  // ── Lead Profile Modal Navigation ─────────────────────────
  openLeadProfile(row: any) {
    const contactId = row?.id || row?.lead_id || row?.contact_id;
    if (!contactId) return;
    this.profileContactId = contactId;
    this.showProfileModal = true;
  }

  // ── Update Lead Status Modal ──────────────────────────────
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

  getAssigneeBadge(assignee: string): string {
    return assignee === 'Unassigned'
      ? 'badge rounded-pill bg-secondary-subtle text-secondary border border-secondary-subtle px-3 py-2'
      : 'badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-2';
  }
}
