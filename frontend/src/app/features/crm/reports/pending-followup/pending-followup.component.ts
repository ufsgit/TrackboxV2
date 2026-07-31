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

  followups: any[] = [];
  stats = { overdue: 0, dueToday: 0, upcoming: 0 };
  displayStats = { overdue: 0, dueToday: 0, upcoming: 0 };
  filterParam: string | null = null;

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
    this.apiService.get('/reports/leads/pending-followups').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.stats = {
            overdue: res.data.overdue || 0,
            dueToday: res.data.dueToday || 0,
            upcoming: res.data.upcoming || 0
          };
          this.animateCount('overdue', this.stats.overdue);
          this.animateCount('dueToday', this.stats.dueToday);
          this.animateCount('upcoming', this.stats.upcoming);

          this.followups = res.data.list.map((f: any) => ({
            ...f,
            dueDate: this.datePipe.transform(f.dueDate, 'yyyy-MM-dd')
          }));
        }
      },
      error: (err) => console.error('Error fetching pending followups:', err)
    });
  }


  // ── Lead Profile Page Navigation ─────────────────────────
  openLeadProfile(row: any) {
    const contactId = row?.id || row?.lead_id || row?.contact_id;
    if (!contactId) return;
    this.profileContactId = contactId;
    this.showProfileModal = true;
  }

  closeLeadPanel() {
    this.showLeadPanel = false;
    this.leadPanelData = null;
  }

  closeProfileModal() {
    this.showProfileModal = false;
    this.profileContactId = null;
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
    return 'Pending Follow-ups';
  }

  get pageSubtitle() {
    if (this.filterParam === 'upcoming') return 'Track and manage leads scheduled for the future';
    if (this.filterParam === 'dueToday') return 'Track and manage leads that need attention today';
    return 'Track and manage leads that need attention';
  }

  get filteredFollowups() {
    let filtered = this.followups;
    
    // By default (null) or when explicitly 'overdue', show ONLY Overdue
    if (this.filterParam === 'upcoming') {
      filtered = filtered.filter(f => f.status === 'Upcoming');
    } else if (this.filterParam === 'dueToday') {
      filtered = filtered.filter(f => f.status === 'Due Today');
    } else {
      // If null or 'overdue' or anything else, show Overdue (till yesterday)
      filtered = filtered.filter(f => f.status === 'Overdue');
    }

    if (!this.searchTerm) return filtered;
    return filtered.filter(f =>
      f.leadName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      f.assignee?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  get unassignedUpcomingCount() {
    return this.followups.filter(f => f.status === 'Upcoming' && f.assignee === 'Unassigned').length;
  }

  setFilter(status: string | null) {
    this.filterParam = this.filterParam === status ? null : status;
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
