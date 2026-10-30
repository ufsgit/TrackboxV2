import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { LeadProfileModalComponent } from '../../../../shared/components/lead-profile-modal/lead-profile-modal.component';
import { UpdateLeadStatusModalComponent } from '../../../../shared/components/update-lead-status-modal/update-lead-status-modal.component';

@Component({
  selector: 'app-todays-leads',
  standalone: true,
  imports: [CommonModule, FormsModule, LeadProfileModalComponent, UpdateLeadStatusModalComponent],
  templateUrl: './todays-leads.component.html',
  styleUrl: './todays-leads.component.css'
})
export class TodaysLeadsComponent {
  searchTerm: string = '';
  loading: boolean = true;

  leads: any[] = [];
  stats: any = { totalToday: 0, unassignedLeads: 0 };

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
    this.loading = true;
    this.api.get('/reports/leads/today').subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          const list = res.data.leads || [];
          // Date logic: Follow-up Date is today strictly belongs under Today's Follow-up
          this.leads = list.filter((l: any) => l.status === 'Due Today' || this.isTodayDate(l.dueDate || l.follow_up_date));
          this.stats = {
            totalToday: this.leads.length,
            unassignedLeads: this.leads.filter((l: any) => !l.agent || l.agent === 'Unassigned').length
          };
        }
      },
      error: (err: any) => { this.loading = false; console.error(err); }
    });
  }

  isTodayDate(dateVal: any): boolean {
    if (!dateVal) return true;
    const d = new Date(dateVal);
    const today = new Date();
    d.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
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
    this.followupContactName = row.name || row.leadName || '';
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
    const list = this.leads.filter(l => l.status === 'Due Today' || this.isTodayDate(l.dueDate || l.follow_up_date));
    if (!this.searchTerm) return list;
    const term = this.searchTerm.toLowerCase();
    return list.filter(l =>
      l.name?.toLowerCase().includes(term) ||
      l.agent?.toLowerCase().includes(term) ||
      l.statusName?.toLowerCase().includes(term) ||
      l.phone?.includes(term)
    );
  }

  getAssigneeBadge(assignee: string): string {
    return assignee === 'Unassigned'
      ? 'badge rounded-pill bg-secondary-subtle text-secondary border border-secondary-subtle px-3 py-2'
      : 'badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-2';
  }
}
