import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { LeadProfileModalComponent } from '../../../../shared/components/lead-profile-modal/lead-profile-modal.component';
import { UpdateLeadStatusModalComponent } from '../../../../shared/components/update-lead-status-modal/update-lead-status-modal.component';

@Component({
  selector: 'app-upcoming-followups',
  standalone: true,
  imports: [CommonModule, FormsModule, LeadProfileModalComponent, UpdateLeadStatusModalComponent],
  templateUrl: './upcoming-followups.component.html',
  styleUrl: './upcoming-followups.component.css'
})
export class UpcomingFollowupsComponent {
  searchTerm: string = '';

  leads: any[] = [];
  stats: any = { upcoming: 0, unassignedUpcoming: 0 };

  // ── Lead Profile Modal ──────────────────────────────────
  showProfileModal = false;
  profileContactId: number | null = null;

  // ── Update Lead Status Modal ────────────────────────────
  showFollowupModal = false;
  followupContactId: number | null = null;
  followupContactName = '';
  followupInitialData: any = null;

  constructor(private api: ApiService, private router: Router) {
    this.fetchData();
  }

  fetchData() {
    this.api.get('/reports/leads/pending-followups').subscribe({
      next: (res: any) => {
        if (res.success) {
          // Filter the pending followups list to only show upcoming
          const allPending = res.data.list || [];
          this.leads = allPending.filter((f: any) => f.status === 'Upcoming');
          
          this.stats = {
            upcoming: res.data.upcoming || 0,
            unassignedUpcoming: this.leads.filter(l => l.assignee === 'Unassigned').length
          };
        }
      },
      error: (err: any) => console.error(err)
    });
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

  // ── Helpers ─────────────────────────────────────────────
  get filteredLeads() {
    if (!this.searchTerm) return this.leads;
    const term = this.searchTerm.toLowerCase();
    return this.leads.filter(l =>
      l.leadName?.toLowerCase().includes(term) ||
      l.assignee?.toLowerCase().includes(term) ||
      l.statusName?.toLowerCase().includes(term)
    );
  }

  getAssigneeBadge(assignee: string): string {
    return assignee === 'Unassigned'
      ? 'badge rounded-pill bg-secondary-subtle text-secondary border border-secondary-subtle px-3 py-2'
      : 'badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-2';
  }
}
