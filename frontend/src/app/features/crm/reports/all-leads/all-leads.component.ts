import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

import { LeadProfileModalComponent } from '../../../../shared/components/lead-profile-modal/lead-profile-modal.component';
import { UpdateLeadStatusModalComponent } from '../../../../shared/components/update-lead-status-modal/update-lead-status-modal.component';

@Component({
  selector: 'app-all-leads',
  standalone: true,
  imports: [CommonModule, FormsModule, LeadProfileModalComponent, UpdateLeadStatusModalComponent],
  templateUrl: './all-leads.component.html',
  styleUrl: './all-leads.component.css'
})
export class AllLeadsComponent implements OnInit {

  leads: any[] = [];
  loading = false;
  searchTerm = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalLeads = 0;
  totalPages = 1;

  // Filters
  activeStatus = '';
  activeAgent = '';
  statuses: any[] = [];
  agents: any[] = [];

  // Lead Profile Modal
  showProfileModal = false;
  profileContactId: number | null = null;

  // Quick Followup / Update Lead Status Modal
  showFollowupModal = false;
  followupContactId: number | null = null;
  followupContactName = '';
  followupInitialData: any = null;

  totalWithFollowup = 0;
  totalWithoutFollowup = 0;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.loadLeads();
    this.loadStatuses();
    this.loadAgents();
  }

  get filteredLeads() { return this.leads; }

  get withFollowupCount(): number {
    return this.totalWithFollowup;
  }

  get noFollowupCount(): number {
    return this.totalWithoutFollowup;
  }

  loadLeads() {
    this.loading = true;
    const params: any = { page: this.currentPage, limit: this.pageSize };
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.activeStatus) params.status = this.activeStatus;
    if (this.activeAgent) params.agent = this.activeAgent;

    this.api.get('/contacts', params).subscribe({
      next: (res: any) => {
        this.leads = res.data.map((c: any) => ({
          ...c,
          tags: Array.isArray(c.tags) ? c.tags : JSON.parse(c.tags || '[]')
        }));
        this.totalLeads = res.total || 0;
        this.totalPages = Math.max(1, Math.ceil(this.totalLeads / this.pageSize));
        this.loading = false;

        if (res.with_followup !== undefined && res.without_followup !== undefined) {
          this.totalWithFollowup = res.with_followup;
          this.totalWithoutFollowup = res.without_followup;
        } else {
          this.loadFollowupStats();
        }
      },
      error: () => { this.loading = false; }
    });
  }

  loadFollowupStats() {
    const params: any = { page: 1, limit: 10000 };
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.activeStatus) params.status = this.activeStatus;
    if (this.activeAgent) params.agent = this.activeAgent;

    this.api.get('/contacts', params).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.totalWithFollowup = res.data.filter((c: any) => c.follow_up_date).length;
          this.totalWithoutFollowup = res.data.length - this.totalWithFollowup;
        }
      }
    });
  }

  loadStatuses() {
    this.api.get('/system-settings/statuses').subscribe({
      next: (res: any) => { if (res.success) this.statuses = res.data; }
    });
  }

  loadAgents() {
    this.api.get('/contacts/agents').subscribe({
      next: (res: any) => { this.agents = res.data || []; }
    });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadLeads();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadLeads();
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.loadLeads();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadLeads();
  }

  get pages(): number[] {
    const range: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  }

  // Lead Profile Panel
  showLeadPanel = false;
  leadPanelLoading = false;
  leadPanelData: any = null;
  leadFollowupHistory: any[] = [];

  openFollowup(lead: any) {
    const contactId = lead?.id || lead?.lead_id || lead?.contact_id;
    if (!contactId) return;
    this.followupContactId = contactId;
    this.followupContactName = lead.name || lead.leadName || '';
    this.followupInitialData = lead;
    this.showFollowupModal = true;
  }

  closeFollowupModal() {
    this.showFollowupModal = false;
    this.followupContactId = null;
    this.followupInitialData = null;
  }

  openProfile(lead: any) {
    const contactId = lead?.id || lead?.lead_id || lead?.contact_id;
    if (!contactId) return;
    this.openProfileById(contactId);
  }

  openProfileById(contactId: number) {
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

  getStatusColor(statusName: string): string {
    if (!statusName) return '#64748b';
    const colors: Record<string, string> = {
      'new': '#3b82f6', 'hot': '#ef4444', 'warm': '#f97316',
      'cold': '#06b6d4', 'won': '#22c55e', 'lost': '#94a3b8'
    };
    return colors[statusName.toLowerCase()] || '#6366f1';
  }
}
