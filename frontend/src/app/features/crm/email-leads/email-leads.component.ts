import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { SystemSettingsService } from '../../../core/services/system-settings.service';
import { SendEmailModalComponent } from './components/send-email-modal/send-email-modal.component';

@Component({
  selector: 'app-email-leads',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SendEmailModalComponent],
  templateUrl: './email-leads.component.html',
  styleUrls: ['./email-leads.component.css']
})
export class EmailLeadsComponent implements OnInit, OnDestroy {
  leads: any[] = [];
  loading = false;
  searchQuery = '';
  activeStatus = '';
  leadStatuses: any[] = [];

  // Search Debounce (0.3s)
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // Pagination
  currentPage = 1;
  pageSize = 15;
  totalLeads = 0;
  totalPages = 1;

  // Selection
  selectedContactIds: Set<number> = new Set();
  isAllSelected = false;         // Page level selection
  isAllPagesSelected = false;    // Select all leads across all pages

  // Modal Control
  showBulkEmailModal = false;

  constructor(
    private api: ApiService,
    private settingsService: SystemSettingsService
  ) {}

  ngOnInit(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.applyFilters();
    });

    this.loadLeadStatuses();
    this.loadLeads();
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  loadLeadStatuses(): void {
    this.settingsService.getStatuses().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.leadStatuses = res.data;
        }
      },
      error: () => {}
    });
  }

  loadLeads(): void {
    this.loading = true;
    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    };

    if (this.searchQuery && this.searchQuery.trim()) {
      params.search = this.searchQuery.trim();
    }
    if (this.activeStatus) {
      params.status = this.activeStatus;
    }

    this.api.get('/contacts', params).subscribe({
      next: (res: any) => {
        this.leads = res.data || [];
        this.totalLeads = res.total || 0;
        this.totalPages = Math.max(1, Math.ceil(this.totalLeads / this.pageSize));
        this.updateSelectAllStatus();
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error loading email leads:', err);
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.clearSelection();
    this.loadLeads();
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.loadLeads();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadLeads();
  }

  getPages(): number[] {
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

  // Checkbox management
  toggleSelectAll(): void {
    if (this.isAllSelected || this.isAllPagesSelected) {
      this.clearSelection();
    } else {
      this.leads.forEach(lead => {
        if (lead.id) this.selectedContactIds.add(lead.id);
      });
      this.isAllSelected = true;
      this.isAllPagesSelected = false;
    }
  }

  selectAllAcrossAllPages(): void {
    this.isAllPagesSelected = true;
    this.isAllSelected = true;
    this.leads.forEach(lead => {
      if (lead.id) this.selectedContactIds.add(lead.id);
    });
  }

  toggleSelectContact(contactId: number, event: Event): void {
    event.stopPropagation();
    if (this.isAllPagesSelected) {
      this.isAllPagesSelected = false;
    }
    if (this.selectedContactIds.has(contactId)) {
      this.selectedContactIds.delete(contactId);
    } else {
      this.selectedContactIds.add(contactId);
    }
    this.updateSelectAllStatus();
  }

  isContactSelected(contactId: number): boolean {
    if (this.isAllPagesSelected) return true;
    return this.selectedContactIds.has(contactId);
  }

  updateSelectAllStatus(): void {
    if (!this.leads || this.leads.length === 0) {
      this.isAllSelected = false;
      return;
    }
    if (this.isAllPagesSelected) {
      this.isAllSelected = true;
      return;
    }
    this.isAllSelected = this.leads.every(lead => this.selectedContactIds.has(lead.id));
  }

  clearSelection(): void {
    this.selectedContactIds.clear();
    this.isAllSelected = false;
    this.isAllPagesSelected = false;
  }

  // Avatar Tint & Initials
  getAvatarTintClass(idOrIndex: number): string {
    const tints = [
      'avatar-tint-purple',
      'avatar-tint-teal',
      'avatar-tint-blue',
      'avatar-tint-indigo',
      'avatar-tint-rose',
      'avatar-tint-emerald',
      'avatar-tint-amber',
      'avatar-cyan'
    ];
    return tints[Math.abs(idOrIndex) % tints.length];
  }

  getLeadInitials(name: string): string {
    if (!name) return 'LD';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  getStatusColor(statusName: string): string {
    const found = this.leadStatuses.find(s => s.name?.toLowerCase() === statusName?.toLowerCase());
    return found?.color || '#6366f1';
  }

  openBulkEmailModal(): void {
    this.showBulkEmailModal = true;
  }

  closeBulkEmailModal(): void {
    this.showBulkEmailModal = false;
  }

  onEmailSent(): void {
    this.clearSelection();
    this.loadLeads();
  }
}
