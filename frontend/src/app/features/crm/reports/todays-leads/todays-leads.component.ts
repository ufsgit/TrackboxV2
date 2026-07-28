import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-todays-leads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './todays-leads.component.html',
  styleUrl: './todays-leads.component.css'
})
export class TodaysLeadsComponent {
  searchTerm: string = '';

  leads: any[] = [];
  stats: any = { totalToday: 0, unassignedLeads: 0 };

  // ── Lead Profile Panel ──────────────────────────────────
  showLeadPanel = false;
  leadPanelLoading = false;
  leadPanelData: any = null;
  leadFollowupHistory: any[] = [];

  // ── Quick Followup Modal ────────────────────────────────
  showFollowupModal = false;
  followupLoading = false;
  followupContactId: number | null = null;
  followupContactName = '';
  statuses: any[] = [];
  followupForm = {
    status_id: null as number | null,
    status_name: '',
    remark: '',
    follow_up_date: ''
  };

  constructor(private api: ApiService) {
    this.fetchData();
    this.loadStatuses();
  }

  fetchData() {
    this.api.get('/reports/leads/today').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.leads = res.data.leads;
          this.stats = res.data;
        }
      },
      error: (err: any) => console.error(err)
    });
  }

  loadStatuses() {
    this.api.get('/system-settings/statuses').subscribe({
      next: (res: any) => { if (res.success) this.statuses = res.data; }
    });
  }

  // ── Lead Profile Panel ──────────────────────────────────
  openLeadProfile(row: any) {
    const contactId = row?.id || row?.lead_id || row?.contact_id;
    if (!contactId) return;

    this.showLeadPanel = true;
    this.leadPanelLoading = true;
    this.leadPanelData = null;
    this.leadFollowupHistory = [];

    this.api.get(`/contacts/${contactId}`).subscribe({
      next: (res: any) => {
        if (res.success) this.leadPanelData = res.data;
        this.leadPanelLoading = false;
      },
      error: () => this.leadPanelLoading = false
    });

    this.api.get(`/contacts/${contactId}/timeline`).subscribe({
      next: (res: any) => {
        if (res.success) this.leadFollowupHistory = res.data.filter((e: any) => e.type === 'follow_up').slice(0, 5);
      }
    });
  }

  closeLeadPanel() {
    this.showLeadPanel = false;
    this.leadPanelData = null;
  }

  // ── Quick Followup Modal ────────────────────────────────
  openFollowup(row: any) {
    const contactId = row?.id || row?.lead_id || row?.contact_id;
    if (!contactId) return;

    this.followupContactId = contactId;
    this.followupContactName = row.name || '';
    this.followupForm = {
      status_id: null,
      status_name: row.statusName || '',
      remark: '',
      follow_up_date: ''
    };
    this.showFollowupModal = true;
  }

  closeFollowupModal() {
    this.showFollowupModal = false;
    this.followupContactId = null;
  }

  saveFollowup() {
    if (!this.followupContactId) return;
    this.followupLoading = true;

    const selStatus = this.statuses.find(s => s.name === this.followupForm.status_name);
    if (selStatus) this.followupForm.status_id = selStatus.id;

    this.api.put(`/contacts/${this.followupContactId}`, {
      status_id: this.followupForm.status_id,
      status_name: this.followupForm.status_name,
      remarks: this.followupForm.remark,
      follow_up_date: this.followupForm.follow_up_date || null
    }).subscribe({
      next: () => {
        this.followupLoading = false;
        this.closeFollowupModal();
        this.fetchData();
      },
      error: () => this.followupLoading = false
    });
  }

  // ── Helpers ─────────────────────────────────────────────
  get filteredLeads() {
    if (!this.searchTerm) return this.leads;
    const term = this.searchTerm.toLowerCase();
    return this.leads.filter(l =>
      l.name?.toLowerCase().includes(term) ||
      l.agent?.toLowerCase().includes(term) ||
      l.statusName?.toLowerCase().includes(term)
    );
  }

  getAssigneeBadge(assignee: string): string {
    return assignee === 'Unassigned'
      ? 'badge rounded-pill bg-secondary-subtle text-secondary border border-secondary-subtle px-3 py-2'
      : 'badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-2';
  }
}
