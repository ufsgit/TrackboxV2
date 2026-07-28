import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-pending-followup',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  agents: any[] = [];
  followupForm = {
    status_id: null as number | null,
    status_name: '',
    remark: '',
    follow_up_date: ''
  };

  constructor(
    private apiService: ApiService,
    private datePipe: DatePipe,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.filterParam = params['filter'] || null;
    });
    this.fetchData();
    this.loadStatuses();
    this.loadAgents();
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

  loadStatuses() {
    this.apiService.get('/system-settings/statuses').subscribe({
      next: (res: any) => { if (res.success) this.statuses = res.data; }
    });
  }

  loadAgents() {
    this.apiService.get('/settings/team').subscribe({
      next: (res: any) => {
        if (res.success) this.agents = res.data.filter((u: any) => u.role === 'agent' || u.role === 'admin');
      }
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

    this.apiService.get(`/contacts/${contactId}`).subscribe({
      next: (res: any) => {
        if (res.success) this.leadPanelData = res.data;
        this.leadPanelLoading = false;
      },
      error: () => this.leadPanelLoading = false
    });

    this.apiService.get(`/contacts/${contactId}/timeline`).subscribe({
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
    this.followupContactName = row.leadName || row.name || '';
    this.followupForm = {
      status_id: row.status_id || null,
      status_name: row.statusName || '',
      remark: '',
      follow_up_date: row.dueDate || ''
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

    this.apiService.put(`/contacts/${this.followupContactId}`, {
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
    return this.filterParam === 'upcoming' ? 'Upcoming Follow-ups' : 'Pending Follow-ups';
  }

  get pageSubtitle() {
    return this.filterParam === 'upcoming' ? 'Track and manage leads scheduled for the future' : 'Track and manage leads that need attention';
  }

  get filteredFollowups() {
    let filtered = this.followups;
    if (this.filterParam === 'upcoming') filtered = filtered.filter(f => f.status === 'Upcoming');
    else if (this.filterParam === 'overdue') filtered = filtered.filter(f => f.status === 'Overdue');
    else if (this.filterParam === 'dueToday') filtered = filtered.filter(f => f.status === 'Due Today');

    if (!this.searchTerm) return filtered;
    return filtered.filter(f =>
      f.leadName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      f.assignee?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
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
