import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VisasService, VisaCase, VisaMetrics, VisaRequestItem, PreDepartureItem, VisaStatus } from '../../../core/services/visas.service';
import { AuthService } from '../../../core/services/auth.service';
import { SystemSettingsService } from '../../../core/services/system-settings.service';
import { LeadProfileModalComponent } from '../../../shared/components/lead-profile-modal/lead-profile-modal.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-visa-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LeadProfileModalComponent],
  templateUrl: './visa-management.component.html',
  styleUrls: ['./visa-management.component.css']
})
export class VisaManagementComponent implements OnInit, OnDestroy {
  // Navigation View / Active Tab
  activeTab: 'cases' | 'deadlines' | 'analytics' = 'cases';

  // Loading States
  loading = false;
  metricsLoading = false;
  submitting = false;
  uploadingDoc = false;

  // Visa Cases Data & Pagination
  cases: VisaCase[] = [];
  totalRecords = 0;
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  pageSizeOptions = [10, 15, 25, 50];

  // Metrics Summary
  metrics: VisaMetrics = {
    total: 0,
    active_processing: 0,
    preparation: 0,
    ready: 0,
    submitted: 0,
    under_assessment: 0,
    rfi_ppi: 0,
    aip: 0,
    approved: 0,
    declined: 0,
    withdrawn: 0,
    deadlines: {
      overdue: 0,
      due_today: 0,
      due_7_days: 0,
      travel_soon: 0
    },
    decline_categories: []
  };

  // Deadline & Overdue Alerts (VISA-002)
  deadlineAlerts: { immigration_requests: any[]; upcoming_travels: any[] } = {
    immigration_requests: [],
    upcoming_travels: []
  };

  // Decline Analytics (VISA-004)
  declineAnalytics: { summary: any[]; cases: any[] } = {
    summary: [],
    cases: []
  };

  // Filters
  searchTerm = '';
  statusFilter = 'all';
  visaTypeFilter = 'all';
  staffFilter = 'all';
  deadlineFilter: 'all' | 'overdue' | 'due_today' | 'due_7_days' | 'urgent_rfi' | 'travel_soon' = 'all';
  startDate = '';
  endDate = '';

  // Options & Dropdowns
  statusOptions: VisaStatus[] = [
    'Preparation',
    'Ready',
    'Submitted',
    'Under Assessment',
    'RFI-PPI',
    'AIP',
    'Approved',
    'Declined',
    'Withdrawn'
  ];

  visaTypeOptions = [
    'Student Visa',
    'Dependent / Spouse Visa',
    'Child Student Visa',
    'Visitor / Tourist Visa',
    'Post-Study Work Visa',
    'Parent Guardian Visa',
    'General Work Visa',
    'Other'
  ];

  declineCategories = [
    'Financial Inadequacy / Funds Verification',
    'GTE / Genuine Student Requirement',
    'Academic / Qualification Mismatch',
    'English Language Proficiency Requirement',
    'Incomplete / Fraudulent Documentation',
    'Medical / Character Requirement',
    'Country / Policy Restriction',
    'Other / Visa Officer Discretion'
  ];

  requestTypeOptions = [
    'RFI',
    'PPI',
    'Additional Documents',
    'Biometrics / Medicals',
    'Interview Request',
    'Other'
  ];

  // Team Users / Staff list
  staffList: any[] = [];

  // Search debounce
  private searchDebounceTimer: any;

  // Template Helpers
  Math = Math;

  getDisplayMax(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalRecords);
  }

  // ── Modals & Drawers State ─────────────────────────────────
  // Detailed Case Drawer / Modal
  showCaseDrawer = false;
  selectedCase: (VisaCase & { requests: VisaRequestItem[]; history: any[] }) | null = null;
  drawerActiveTab: 'details' | 'requests' | 'pre_departure' | 'history' = 'details';

  // Edit / Create Visa Case Modal
  showCaseModal = false;
  isEditing = false;
  caseForm: any = this.getEmptyCaseForm();

  // Student selection for new case
  studentSearchQuery = '';
  searchingStudents = false;
  availableStudents: any[] = [];
  selectedStudent: any = null;

  // Immigration Request Modal (VISA-001)
  showRequestModal = false;
  requestForm: any = this.getEmptyRequestForm();

  // Student Profile Modal Integration
  showProfileModal = false;
  profileContactId: number | null = null;

  // Lazy loading flags for dropdowns
  visaTypesLoaded = false;
  loadingVisaTypes = false;
  visaStatusesLoaded = false;
  loadingVisaStatuses = false;
  reasonCategoriesLoaded = false;
  loadingReasonCategories = false;

  constructor(
    public visasService: VisasService,
    private settingsService: SystemSettingsService,
    public authService: AuthService
  ) {}

  get canFilterAgents(): boolean {
    return this.authService.canFilterAgents() || this.staffList.length > 1;
  }

  ngOnInit(): void {
    this.staffFilter = 'all';
    this.fetchMetrics();
    this.fetchCases();
    this.fetchStaffList();
    this.fetchDeadlineAlerts();
  }

  rawReasonCategories: any[] = [];

  loadReasonCategories(force = false): void {
    if (this.loadingReasonCategories) return;
    if (this.reasonCategoriesLoaded && !force) return;
    this.loadingReasonCategories = true;
    this.settingsService.getVisaReasonCategories().subscribe({
      next: (res: any) => {
        this.loadingReasonCategories = false;
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          this.rawReasonCategories = res.data;
          const names = res.data.map((r: any) => r.name);
          const current = this.caseForm?.decline_category;
          this.declineCategories = Array.from(new Set([...names, ...(current ? [current] : [])]));
          this.reasonCategoriesLoaded = true;
        }
      },
      error: () => {
        this.loadingReasonCategories = false;
      }
    });
  }

  loadVisaTypes(force = false): void {
    if (this.loadingVisaTypes) return;
    if (this.visaTypesLoaded && !force) return;
    this.loadingVisaTypes = true;
    this.settingsService.getVisaTypes().subscribe({
      next: (res: any) => {
        this.loadingVisaTypes = false;
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const names = res.data.map((t: any) => t.name);
          const current = this.caseForm?.visa_type;
          this.visaTypeOptions = Array.from(new Set([...names, ...(current ? [current] : [])]));
          this.visaTypesLoaded = true;
        }
      },
      error: () => {
        this.loadingVisaTypes = false;
      }
    });
  }

  // Raw statuses from database
  rawVisaStatuses: any[] = [];

  loadVisaStatuses(force = false): void {
    if (this.loadingVisaStatuses) return;
    if (this.visaStatusesLoaded && !force) return;
    this.loadingVisaStatuses = true;
    this.settingsService.getVisaStatuses().subscribe({
      next: (res: any) => {
        this.loadingVisaStatuses = false;
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          this.rawVisaStatuses = res.data;
          const names = res.data.map((s: any) => s.name);
          const current = this.caseForm?.status;
          this.statusOptions = Array.from(new Set([...names, ...(current ? [current] : [])]));
          this.visaStatusesLoaded = true;
        }
      },
      error: () => {
        this.loadingVisaStatuses = false;
      }
    });
  }

  statusRequiresReason(statusName?: string): boolean {
    const sName = statusName || this.caseForm?.status;
    if (!sName) return false;
    const match = this.rawVisaStatuses.find(
      (s: any) => (s.name || '').trim().toLowerCase() === sName.trim().toLowerCase()
    );
    if (match) {
      return Number(match.has_reason) === 1;
    }
    return sName.trim().toLowerCase() === 'declined';
  }

  getFilteredReasonCategories(): string[] {
    const currentStatusName = (this.caseForm?.status || '').trim().toLowerCase();
    const matchedStatus = this.rawVisaStatuses.find(
      (s: any) => (s.name || '').trim().toLowerCase() === currentStatusName
    );

    // If this status has specific reason categories configured:
    if (matchedStatus && Array.isArray(matchedStatus.reason_category_ids) && matchedStatus.reason_category_ids.length > 0) {
      const allowedIdSet = new Set(matchedStatus.reason_category_ids.map((id: any) => Number(id)));

      const filtered = this.rawReasonCategories
        .filter((cat: any) => allowedIdSet.has(Number(cat.id)))
        .map((cat: any) => cat.name);

      if (filtered.length > 0) {
        if (this.caseForm?.decline_category && !filtered.includes(this.caseForm.decline_category)) {
          return [this.caseForm.decline_category, ...filtered];
        }
        return filtered;
      }
    }

    return this.declineCategories;
  }

  ngOnDestroy(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
  }

  // ── Data Fetching ──────────────────────────────────────────
  fetchCases(): void {
    this.loading = true;
    this.visasService.getVisas({
      search: this.searchTerm.trim() || undefined,
      status: this.statusFilter !== 'all' ? this.statusFilter : undefined,
      visa_type: this.visaTypeFilter !== 'all' ? this.visaTypeFilter : undefined,
      assigned_staff_id: this.staffFilter !== 'all' ? this.staffFilter : undefined,
      deadline_filter: this.deadlineFilter !== 'all' ? this.deadlineFilter : undefined,
      start_date: this.startDate || undefined,
      end_date: this.endDate || undefined,
      page: this.currentPage,
      limit: this.pageSize
    }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.cases = res.data || [];
          if (res.pagination) {
            this.totalRecords = res.pagination.total;
            this.totalPages = res.pagination.totalPages;
          }
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to load visa cases:', err);
      }
    });
  }

  fetchMetrics(): void {
    this.metricsLoading = true;
    const staffId = this.staffFilter !== 'all' ? this.staffFilter : undefined;
    this.visasService.getMetrics({ assigned_staff_id: staffId }).subscribe({
      next: (res) => {
        this.metricsLoading = false;
        if (res.success && res.data) {
          this.metrics = res.data;
        }
      },
      error: (err) => {
        this.metricsLoading = false;
        console.error('Failed to load metrics:', err);
      }
    });
  }

  fetchStaffList(): void {
    this.visasService.getVisaStaffList().subscribe({
      next: (res) => {
        if (res.success) {
          this.staffList = res.data || [];
        }
      },
      error: (err) => console.error('Failed to load staff list:', err)
    });
  }

  fetchDeadlineAlerts(): void {
    const staffId = this.staffFilter !== 'all' ? this.staffFilter : undefined;
    this.visasService.getDeadlineAlerts({ assigned_staff_id: staffId }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.deadlineAlerts = res.data;
        }
      },
      error: (err) => console.error('Failed to load deadline alerts:', err)
    });
  }

  fetchDeclineAnalytics(): void {
    const staffId = this.staffFilter !== 'all' ? this.staffFilter : undefined;
    this.visasService.getDeclineAnalytics({ assigned_staff_id: staffId }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.declineAnalytics = res.data;
        }
      },
      error: (err) => console.error('Failed to load decline analytics:', err)
    });
  }

  // ── Filters & Search ───────────────────────────────────────
  onSearchChange(): void {
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.currentPage = 1;
      this.fetchCases();
    }, 350);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.fetchCases();
    this.fetchMetrics();
    this.fetchDeadlineAlerts();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.visaTypeFilter = 'all';
    this.staffFilter = this.canFilterAgents ? 'all' : (this.authService.getCurrentUserId()?.toString() || 'me');
    this.deadlineFilter = 'all';
    this.startDate = '';
    this.endDate = '';
    this.currentPage = 1;
    this.fetchCases();
  }

  selectKpi(type: string): void {
    if (type === 'all') {
      this.resetFilters();
    } else if (type === 'overdue') {
      this.deadlineFilter = 'overdue';
      this.statusFilter = 'all';
      this.onFilterChange();
    } else if (type === 'rfi_ppi') {
      this.statusFilter = 'RFI-PPI';
      this.deadlineFilter = 'all';
      this.onFilterChange();
    } else if (type === 'submitted') {
      this.statusFilter = 'Submitted';
      this.deadlineFilter = 'all';
      this.onFilterChange();
    } else if (type === 'approved') {
      this.statusFilter = 'Approved';
      this.deadlineFilter = 'all';
      this.onFilterChange();
    } else if (type === 'declined') {
      this.statusFilter = 'Declined';
      this.deadlineFilter = 'all';
      this.onFilterChange();
    }
  }

  switchTab(tab: 'cases' | 'deadlines' | 'analytics'): void {
    this.activeTab = tab;
    if (tab === 'deadlines') {
      this.fetchDeadlineAlerts();
    } else if (tab === 'analytics') {
      this.fetchDeclineAnalytics();
    } else {
      this.fetchCases();
    }
  }

  // ── Pagination ─────────────────────────────────────────────
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.fetchCases();
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.fetchCases();
  }

  // ── View Case Details & Drawer ─────────────────────────────
  openCaseById(id: number, tab: 'details' | 'requests' | 'pre_departure' | 'history' = 'details'): void {
    this.openCaseDrawer({ id } as VisaCase, tab);
  }

  openCaseDrawer(c: VisaCase, tab: 'details' | 'requests' | 'pre_departure' | 'history' = 'details'): void {
    this.drawerActiveTab = tab;
    this.visasService.getVisaById(c.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.selectedCase = res.data;
          this.showCaseDrawer = true;
        }
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.message || 'Could not load visa case details.'
        });
      }
    });
  }

  closeCaseDrawer(): void {
    this.showCaseDrawer = false;
    this.selectedCase = null;
  }

  // ── Create & Edit Visa Case Modal ──────────────────────────
  openCreateModal(): void {
    this.isEditing = false;
    this.caseForm = this.getEmptyCaseForm();
    this.selectedStudent = null;
    this.studentSearchQuery = '';
    this.availableStudents = [];
    this.loadVisaTypes(true);
    this.loadVisaStatuses(true);
    this.loadReasonCategories(true);
    this.showCaseModal = true;
    this.searchStudents();
  }

  openEditModal(c: VisaCase): void {
    this.isEditing = true;
    this.caseForm = {
      id: c.id,
      contact_id: c.contact_id,
      contact_name: c.contact_name,
      contact_phone: c.contact_phone,
      visa_type: c.visa_type || 'Student Visa',
      application_no: c.application_no || '',
      assigned_staff_id: c.assigned_staff_id || null,
      status: c.status || 'Preparation',
      submission_date: c.submission_date ? c.submission_date.slice(0, 10) : '',
      officer_name: c.officer_name || '',
      officer_contact: c.officer_contact || '',
      extension_requested_date: c.extension_requested_date ? c.extension_requested_date.slice(0, 10) : '',
      extension_approved_date: c.extension_approved_date ? c.extension_approved_date.slice(0, 10) : '',
      extension_notes: c.extension_notes || '',
      outcome_date: c.outcome_date ? c.outcome_date.slice(0, 10) : '',
      outcome_notes: c.outcome_notes || '',
      decline_category: c.decline_category || '',
      decline_detailed_notes: c.decline_detailed_notes || '',
      visa_expiry_date: c.visa_expiry_date ? c.visa_expiry_date.slice(0, 10) : '',
      travel_date: c.travel_date ? c.travel_date.slice(0, 10) : '',
      intake_date: c.intake_date ? c.intake_date.slice(0, 10) : '',
      description: c.description || ''
    };
    this.selectedStudent = {
      id: c.contact_id,
      name: c.contact_name,
      phone: c.contact_phone
    };
    this.loadVisaTypes(true);
    this.loadVisaStatuses(true);
    this.loadReasonCategories(true);
    this.showCaseModal = true;
  }

  closeCaseModal(): void {
    this.showCaseModal = false;
    this.caseForm = this.getEmptyCaseForm();
    this.selectedStudent = null;
  }

  searchStudents(): void {
    this.searchingStudents = true;
    this.visasService.getAvailableStudents(this.studentSearchQuery).subscribe({
      next: (res) => {
        this.searchingStudents = false;
        if (res.success) {
          this.availableStudents = res.data || [];
        }
      },
      error: () => {
        this.searchingStudents = false;
      }
    });
  }

  selectStudent(s: any): void {
    this.selectedStudent = s;
    this.caseForm.contact_id = s.id;
    this.caseForm.contact_name = s.name;
    this.caseForm.contact_phone = s.phone;
  }

  saveCase(): void {
    if (!this.caseForm.contact_id) {
      Swal.fire({ icon: 'warning', title: 'Student Required', text: 'Please select a student contact.' });
      return;
    }

    // VISA-004 Validation: Reason Category required if has_reason=1 or status is Declined
    if (this.statusRequiresReason() && !this.caseForm.decline_category) {
      Swal.fire({
        icon: 'warning',
        title: 'Reason Category Required',
        text: `VISA-004 Requirement: Please select a reason category for status '${this.caseForm.status}'.`
      });
      return;
    }

    this.submitting = true;
    this.visasService.saveVisa(this.caseForm).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          const isApproved = this.caseForm.status === 'Approved';
          Swal.fire({
            icon: 'success',
            title: this.isEditing ? 'Case Updated' : 'Case Registered',
            text: isApproved 
              ? 'Visa Approved! VISA-003 Triggered: Student journey updated and pre-departure actions scheduled.' 
              : res.message,
            timer: isApproved ? 3500 : 2000,
            showConfirmButton: isApproved
          });
          this.closeCaseModal();
          this.fetchCases();
          this.fetchMetrics();
          this.fetchDeadlineAlerts();

          // Refresh selected case if drawer open
          if (this.selectedCase && this.selectedCase.id === res.data.id) {
            this.openCaseDrawer(res.data, this.drawerActiveTab);
          }
        }
      },
      error: (err) => {
        this.submitting = false;
        Swal.fire({
          icon: 'error',
          title: 'Save Failed',
          text: err.error?.message || 'Failed to save visa case record.'
        });
      }
    });
  }

  // ── VISA-001: Official Immigration Requests (RFI / PPI) ────
  openAddRequestModal(): void {
    if (!this.selectedCase) return;
    this.requestForm = this.getEmptyRequestForm();
    this.requestForm.visa_id = this.selectedCase.id;
    this.requestForm.contact_id = this.selectedCase.contact_id;
    this.requestForm.task_assignee_id = this.selectedCase.assigned_staff_id;
    this.showRequestModal = true;
  }

  closeRequestModal(): void {
    this.showRequestModal = false;
    this.requestForm = this.getEmptyRequestForm();
  }

  onDocumentSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    this.uploadingDoc = true;
    const formData = new FormData();
    formData.append('file', file);

    this.visasService.uploadDocument(formData).subscribe({
      next: (res) => {
        this.uploadingDoc = false;
        if (res.success && res.url) {
          this.requestForm.document_url = res.url;
          this.requestForm.document_name = file.name;
        } else {
          Swal.fire({ icon: 'error', title: 'Upload Failed', text: res.message || 'File upload failed.' });
        }
      },
      error: (err) => {
        this.uploadingDoc = false;
        Swal.fire({ icon: 'error', title: 'Upload Failed', text: err.error?.message || 'File upload failed.' });
      }
    });
  }

  saveImmigrationRequest(): void {
    if (!this.requestForm.received_date || !this.requestForm.due_date || !this.requestForm.title) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Received date, due date, and official request title are required.'
      });
      return;
    }

    this.submitting = true;
    this.visasService.addVisaRequest(this.selectedCase!.id, this.requestForm).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          Swal.fire({
            icon: 'success',
            title: 'Immigration Request Recorded',
            text: 'VISA-001: Request logged with due date, document link, and task assignment.',
            timer: 2000,
            showConfirmButton: false
          });
          this.closeRequestModal();
          this.fetchCases();
          this.fetchMetrics();
          this.fetchDeadlineAlerts();

          // Reload drawer
          if (this.selectedCase) {
            this.openCaseDrawer(this.selectedCase, 'requests');
          }
        }
      },
      error: (err) => {
        this.submitting = false;
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: err.error?.message || 'Failed to log immigration request.'
        });
      }
    });
  }

  markRequestClosed(req: VisaRequestItem): void {
    Swal.fire({
      title: 'Close Immigration Request?',
      text: 'Mark this official request as completed and submitted to embassy?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Mark Closed',
      confirmButtonColor: '#10b981'
    }).then((result) => {
      if (result.isConfirmed) {
        this.visasService.updateVisaRequest(this.selectedCase!.id, req.id!, { status: 'Closed' }).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Closed', timer: 1500, showConfirmButton: false });
            this.fetchCases();
            this.fetchMetrics();
            this.fetchDeadlineAlerts();
            if (this.selectedCase) {
              this.openCaseDrawer(this.selectedCase, 'requests');
            }
          },
          error: (err) => {
            Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message });
          }
        });
      }
    });
  }

  deleteRequest(req: VisaRequestItem): void {
    Swal.fire({
      title: 'Delete Request?',
      text: 'Remove this immigration request record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#ef4444'
    }).then((result) => {
      if (result.isConfirmed) {
        this.visasService.deleteVisaRequest(this.selectedCase!.id, req.id!).subscribe({
          next: () => {
            if (this.selectedCase) {
              this.openCaseDrawer(this.selectedCase, 'requests');
            }
            this.fetchCases();
            this.fetchMetrics();
          }
        });
      }
    });
  }

  deleteCase(c: VisaCase, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    Swal.fire({
      title: 'Delete Visa Case?',
      text: `Are you sure you want to delete the visa case record for "${c.contact_name || 'this student'}"? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    }).then((res) => {
      if (res.isConfirmed) {
        this.visasService.deleteVisa(c.id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Visa case record has been permanently deleted.',
              timer: 1600,
              showConfirmButton: false
            });
            if (this.selectedCase?.id === c.id) {
              this.closeCaseDrawer();
            }
            this.fetchCases();
            this.fetchMetrics();
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Delete Failed',
              text: err?.error?.message || 'Could not delete visa case.'
            });
          }
        });
      }
    });
  }

  // ── VISA-003: Pre-Departure Actions Checklist ──────────────
  togglePreDepartureItem(item: PreDepartureItem): void {
    if (!this.selectedCase || !this.selectedCase.pre_departure_data) return;

    item.done = !item.done;
    item.completed_at = item.done ? new Date().toISOString() : null;

    this.visasService.updatePreDeparture(this.selectedCase.id, this.selectedCase.pre_departure_data).subscribe({
      next: (res) => {
        if (res.success) {
          // Check if all completed
          const allDone = this.selectedCase!.pre_departure_data!.every(p => p.done);
          if (allDone) {
            Swal.fire({
              icon: 'success',
              title: 'All Pre-Departure Actions Completed!',
              text: 'Student is fully cleared and ready for departure.',
              timer: 3000
            });
          }
        }
      },
      error: (err) => {
        item.done = !item.done;
        Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Failed to update item' });
      }
    });
  }

  getPreDepartureProgress(): number {
    if (!this.selectedCase || !this.selectedCase.pre_departure_data || this.selectedCase.pre_departure_data.length === 0) {
      return 0;
    }
    const completed = this.selectedCase.pre_departure_data.filter(i => i.done).length;
    return Math.round((completed / this.selectedCase.pre_departure_data.length) * 100);
  }

  // ── Student CRM Profile Modal ──────────────────────────────
  openStudentProfile(contactId: number): void {
    this.profileContactId = contactId;
    this.showProfileModal = true;
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
    this.profileContactId = null;
  }

  // ── Helper Badges & Styles ─────────────────────────────────
  getStatusBadgeClass(status: VisaStatus | string): string {
    switch (status) {
      case 'Preparation': return 'badge-status-gray';
      case 'Ready': return 'badge-status-teal';
      case 'Submitted': return 'badge-status-blue';
      case 'Under Assessment': return 'badge-status-purple';
      case 'RFI-PPI': return 'badge-status-amber animate-pulse';
      case 'AIP': return 'badge-status-indigo';
      case 'Approved': return 'badge-status-green';
      case 'Declined': return 'badge-status-red';
      case 'Withdrawn': return 'badge-status-slate';
      default: return 'badge-status-gray';
    }
  }

  getStatusIcon(status: VisaStatus | string): string {
    switch (status) {
      case 'Preparation': return 'bi-pencil-square';
      case 'Ready': return 'bi-check2';
      case 'Submitted': return 'bi-send-check';
      case 'Under Assessment': return 'bi-search';
      case 'RFI-PPI': return 'bi-exclamation-octagon-fill';
      case 'AIP': return 'bi-award';
      case 'Approved': return 'bi-check-circle-fill';
      case 'Declined': return 'bi-x-circle-fill';
      case 'Withdrawn': return 'bi-dash-circle';
      default: return 'bi-circle';
    }
  }

  getDaysRemainingBadge(days?: number): { text: string; css: string } {
    if (days === undefined || days === null) return { text: '', css: '' };
    if (days < 0) return { text: `Overdue by ${Math.abs(days)}d`, css: 'deadline-overdue' };
    if (days === 0) return { text: 'Due Today', css: 'deadline-today' };
    if (days <= 7) return { text: `Due in ${days}d`, css: 'deadline-urgent' };
    return { text: `${days}d left`, css: 'deadline-normal' };
  }

  private getEmptyCaseForm(): any {
    return {
      id: null,
      contact_id: null,
      contact_name: '',
      contact_phone: '',
      is_delete: 0,
      visa_type: 'Student Visa',
      application_no: '',
      assigned_staff_id: null,
      status: 'Preparation',
      submission_date: '',
      officer_name: '',
      officer_contact: '',
      extension_requested_date: '',
      extension_approved_date: '',
      extension_notes: '',
      outcome_date: '',
      outcome_notes: '',
      decline_category: '',
      decline_detailed_notes: '',
      visa_expiry_date: '',
      travel_date: '',
      intake_date: '',
      description: ''
    };
  }

  private getEmptyRequestForm(): any {
    const today = new Date().toISOString().slice(0, 10);
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return {
      visa_id: null,
      contact_id: null,
      request_type: 'RFI',
      received_date: today,
      due_date: dueDate,
      title: '',
      details: '',
      document_name: '',
      document_url: '',
      create_task: true,
      task_assignee_id: null
    };
  }
}
