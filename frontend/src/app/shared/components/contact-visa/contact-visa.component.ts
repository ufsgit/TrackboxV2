import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VisasService, VisaCase, VisaRequestItem, PreDepartureItem, VisaStatus } from '../../../core/services/visas.service';
import { AuthService } from '../../../core/services/auth.service';
import { SystemSettingsService } from '../../../core/services/system-settings.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contact-visa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-visa.component.html',
  styleUrls: ['./contact-visa.component.css']
})
export class ContactVisaComponent implements OnInit, OnChanges {
  @Input() contactId: number | null = null;
  @Input() studentName: string = '';
  @Input() contact: any = null;
  @Output() statusChange = new EventEmitter<string>();

  // State
  loading = false;
  submitting = false;
  uploadingDoc = false;
  visa: (VisaCase & { requests?: VisaRequestItem[]; history?: any[] }) | null = null;
  visaCases: VisaCase[] = [];
  selectedVisaId: number | null = null;

  // Active Sub-Tab
  activeSection: 'overview' | 'requests' | 'pre_departure' | 'history' = 'overview';

  // Edit / Register Modal
  showCaseModal = false;
  isEditing = false;
  caseForm: any = this.getEmptyCaseForm();

  // Add Immigration Request Modal (VISA-001)
  showRequestModal = false;
  requestForm: any = this.getEmptyRequestForm();

  // Dropdown options
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

  staffList: any[] = [];

  // Lazy loading flags for dropdowns
  visaTypesLoaded = false;
  loadingVisaTypes = false;
  visaStatusesLoaded = false;
  loadingVisaStatuses = false;
  staffListLoaded = false;
  loadingStaffList = false;
  reasonCategoriesLoaded = false;
  loadingReasonCategories = false;

  constructor(
    private visasService: VisasService,
    private settingsService: SystemSettingsService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.contactId) {
      this.loadVisa();
    }
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
    // Default fallback
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

      // Filter from rawReasonCategories matching those IDs
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contactId'] && !changes['contactId'].firstChange && this.contactId) {
      this.loadVisa();
    }
  }

  fetchStaffList(force = false): void {
    if (this.loadingStaffList) return;
    if (this.staffListLoaded && !force) return;
    this.loadingStaffList = true;
    this.visasService.getVisaStaffList().subscribe({
      next: (res) => {
        this.loadingStaffList = false;
        if (res.success) {
          this.staffList = res.data || [];
          this.staffListLoaded = true;
        }
      },
      error: () => {
        this.loadingStaffList = false;
      }
    });
  }

  loadVisa(visaId?: number): void {
    if (!this.contactId) return;
    this.loading = true;
    const targetVisaId = visaId || this.selectedVisaId || undefined;
    this.visasService.getContactVisa(this.contactId, targetVisaId).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.visa = res.data;
          this.selectedVisaId = res.data.id;
          this.visaCases = res.cases || [res.data];
          this.statusChange.emit(this.visa?.status || '');
        } else {
          this.visa = null;
          this.selectedVisaId = null;
          this.visaCases = [];
          this.statusChange.emit('');
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to load contact visa:', err);
      }
    });
  }

  selectCase(c: VisaCase): void {
    if (!c || c.id === this.visa?.id) return;
    this.selectedVisaId = c.id;
    this.loadVisa(c.id);
  }

  // ── Open Modals ───────────────────────────────────────────
  openRegisterModal(): void {
    this.isEditing = false;
    this.caseForm = this.getEmptyCaseForm();
    this.caseForm.id = null;
    this.caseForm.contact_id = this.contactId;
    this.caseForm.contact_name = this.studentName || this.contact?.name || '';
    this.caseForm.contact_phone = this.contact?.phone || '';
    this.caseForm.assigned_staff_id = this.contact?.assigned_to || null;
    this.loadVisaTypes(true);
    this.loadVisaStatuses(true);
    this.loadReasonCategories(true);
    this.fetchStaffList(true);
    this.showCaseModal = true;
  }

  openEditModal(): void {
    if (!this.visa) return;
    this.isEditing = true;
    this.caseForm = {
      id: this.visa.id,
      contact_id: this.visa.contact_id,
      contact_name: this.visa.contact_name || this.studentName || this.contact?.name || '',
      contact_phone: this.visa.contact_phone || this.contact?.phone || '',
      visa_type: this.visa.visa_type || 'Student Visa',
      application_no: this.visa.application_no || '',
      assigned_staff_id: this.visa.assigned_staff_id || null,
      status: this.visa.status || 'Preparation',
      submission_date: this.visa.submission_date ? this.visa.submission_date.slice(0, 10) : '',
      officer_name: this.visa.officer_name || '',
      officer_contact: this.visa.officer_contact || '',
      extension_requested_date: this.visa.extension_requested_date ? this.visa.extension_requested_date.slice(0, 10) : '',
      extension_approved_date: this.visa.extension_approved_date ? this.visa.extension_approved_date.slice(0, 10) : '',
      extension_notes: this.visa.extension_notes || '',
      outcome_date: this.visa.outcome_date ? this.visa.outcome_date.slice(0, 10) : '',
      outcome_notes: this.visa.outcome_notes || '',
      decline_category: this.visa.decline_category || '',
      decline_detailed_notes: this.visa.decline_detailed_notes || '',
      visa_expiry_date: this.visa.visa_expiry_date ? this.visa.visa_expiry_date.slice(0, 10) : '',
      travel_date: this.visa.travel_date ? this.visa.travel_date.slice(0, 10) : '',
      intake_date: this.visa.intake_date ? this.visa.intake_date.slice(0, 10) : '',
      description: this.visa.description || ''
    };
    if (this.caseForm.visa_type && !this.visaTypeOptions.includes(this.caseForm.visa_type)) {
      this.visaTypeOptions.unshift(this.caseForm.visa_type);
    }
    if (this.caseForm.status && !this.statusOptions.includes(this.caseForm.status)) {
      this.statusOptions.unshift(this.caseForm.status);
    }
    if (this.visa.assigned_staff_id && (this.visa.staff_name || this.visa.assigned_staff_name)) {
      const staffName = this.visa.staff_name || this.visa.assigned_staff_name;
      if (!this.staffList.some(s => s.id === this.visa?.assigned_staff_id)) {
        this.staffList.unshift({ id: this.visa.assigned_staff_id, name: staffName });
      }
    }
    this.loadVisaTypes(true);
    this.loadVisaStatuses(true);
    this.loadReasonCategories(true);
    this.fetchStaffList(true);
    this.showCaseModal = true;
  }

  closeCaseModal(): void {
    this.showCaseModal = false;
  }

  deleteVisaCase(): void {
    if (!this.visa) return;
    Swal.fire({
      title: 'Delete Visa Case?',
      text: `Are you sure you want to delete the visa case record for ${this.studentName || 'this student'}? This will remove all associated requests and timeline events.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete Case',
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.submitting = true;
        this.visasService.deleteVisa(this.visa!.id).subscribe({
          next: () => {
            this.submitting = false;
            Swal.fire({
              icon: 'success',
              title: 'Deleted',
              text: 'Visa case record has been removed.',
              timer: 1600,
              showConfirmButton: false
            });
            this.closeCaseModal();
            this.selectedVisaId = null;
            this.loadVisa();
          },
          error: (err) => {
            this.submitting = false;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err.error?.message || 'Could not delete visa case.'
            });
          }
        });
      }
    });
  }

  saveCase(): void {
    if (!this.caseForm.contact_id) {
      Swal.fire({ icon: 'warning', title: 'Contact Required' });
      return;
    }

    // VISA-004 check (Declined or custom status with has_reason=1)
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
            title: this.isEditing ? 'Visa Updated' : 'Visa Registered',
            text: isApproved 
              ? 'Visa Approved! VISA-003: Student journey updated and pre-departure actions scheduled.' 
              : 'Visa case record saved successfully.',
            timer: isApproved ? 3000 : 2000,
            showConfirmButton: isApproved
          });
          this.closeCaseModal();
          this.selectedVisaId = res.data?.id || null;
          this.loadVisa(this.selectedVisaId || undefined);
        }
      },
      error: (err) => {
        this.submitting = false;
        Swal.fire({
          icon: 'error',
          title: 'Save Failed',
          text: err.error?.message || 'Could not save visa details.'
        });
      }
    });
  }

  // ── VISA-001: Immigration Requests (RFI / PPI) ─────────────
  openAddRequestModal(): void {
    if (!this.visa) return;
    this.requestForm = this.getEmptyRequestForm();
    this.requestForm.visa_id = this.visa.id;
    this.requestForm.contact_id = this.contactId;
    this.requestForm.task_assignee_id = this.visa.assigned_staff_id;
    this.showRequestModal = true;
  }

  closeRequestModal(): void {
    this.showRequestModal = false;
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
          Swal.fire({ icon: 'error', title: 'Upload Failed', text: res.message });
        }
      },
      error: (err) => {
        this.uploadingDoc = false;
        Swal.fire({ icon: 'error', title: 'Upload Failed', text: err.error?.message });
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
    this.visasService.addVisaRequest(this.visa!.id, this.requestForm).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          Swal.fire({
            icon: 'success',
            title: 'Request Logged (VISA-001)',
            text: 'Official immigration request logged with due date and task linkage.',
            timer: 2000,
            showConfirmButton: false
          });
          this.closeRequestModal();
          this.loadVisa();
        }
      },
      error: (err) => {
        this.submitting = false;
        Swal.fire({ icon: 'error', title: 'Failed', text: err.error?.message });
      }
    });
  }

  markRequestClosed(req: VisaRequestItem): void {
    Swal.fire({
      title: 'Close Request?',
      text: 'Mark this request as fulfilled and submitted to immigration?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Close'
    }).then((result) => {
      if (result.isConfirmed) {
        this.visasService.updateVisaRequest(this.visa!.id, req.id!, { status: 'Closed' }).subscribe({
          next: () => {
            this.loadVisa();
          }
        });
      }
    });
  }

  deleteRequest(req: VisaRequestItem): void {
    Swal.fire({
      title: 'Delete Request?',
      text: 'Remove this official request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete'
    }).then((result) => {
      if (result.isConfirmed) {
        this.visasService.deleteVisaRequest(this.visa!.id, req.id!).subscribe({
          next: () => {
            this.loadVisa();
          }
        });
      }
    });
  }

  // ── VISA-003: Pre-Departure Actions Checklist ──────────────
  togglePreDepartureItem(item: PreDepartureItem): void {
    if (!this.visa || !this.visa.pre_departure_data) return;

    item.done = !item.done;
    item.completed_at = item.done ? new Date().toISOString() : null;

    this.visasService.updatePreDeparture(this.visa.id, this.visa.pre_departure_data).subscribe({
      next: (res) => {
        if (res.success) {
          const allDone = this.visa!.pre_departure_data!.every(p => p.done);
          if (allDone) {
            Swal.fire({
              icon: 'success',
              title: 'All Pre-Departure Actions Completed!',
              text: 'Student has fulfilled all pre-departure requirements.',
              timer: 3000
            });
          }
        }
      },
      error: (err) => {
        item.done = !item.done;
        Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message });
      }
    });
  }

  getPreDepartureProgress(): number {
    if (!this.visa || !this.visa.pre_departure_data || this.visa.pre_departure_data.length === 0) {
      return 0;
    }
    const completed = this.visa.pre_departure_data.filter(i => i.done).length;
    return Math.round((completed / this.visa.pre_departure_data.length) * 100);
  }

  getItemCategory(item: PreDepartureItem): string {
    const t = (item.title || '').toLowerCase();
    if (t.includes('briefing') || t.includes('orientation')) return 'Orientation';
    if (t.includes('flight') || t.includes('ticket') || t.includes('travel')) return 'Travel';
    if (t.includes('insurance') || t.includes('oshc')) return 'Insurance';
    if (t.includes('accommodation') || t.includes('housing') || t.includes('address')) return 'Housing';
    if (t.includes('forex') || t.includes('bank') || t.includes('currency')) return 'Finance';
    if (t.includes('pickup') || t.includes('transit')) return 'Transit';
    if (t.includes('enrolment') || t.includes('document') || t.includes('compliance')) return 'Compliance';
    return 'Pre-Departure';
  }

  getItemCategoryIcon(item: PreDepartureItem): string {
    const t = (item.title || '').toLowerCase();
    if (t.includes('briefing') || t.includes('orientation')) return 'bi-mortarboard-fill text-primary';
    if (t.includes('flight') || t.includes('ticket') || t.includes('travel')) return 'bi-airplane-fill text-info';
    if (t.includes('insurance') || t.includes('oshc')) return 'bi-shield-check text-success';
    if (t.includes('accommodation') || t.includes('housing') || t.includes('address')) return 'bi-house-door-fill text-amber';
    if (t.includes('forex') || t.includes('bank') || t.includes('currency')) return 'bi-currency-exchange text-indigo';
    if (t.includes('pickup') || t.includes('transit')) return 'bi-car-front-fill text-teal';
    if (t.includes('enrolment') || t.includes('document') || t.includes('compliance')) return 'bi-file-earmark-check-fill text-purple';
    return 'bi-check-circle-fill text-primary';
  }

  // ── Helper Badges & Checks ─────────────────────────────────
  getOverdueRequestsCount(): number {
    if (!this.visa || !this.visa.requests) return 0;
    return this.visa.requests.filter(r => r.status !== 'Closed' && r.days_remaining !== undefined && r.days_remaining < 0).length;
  }

  getUrgentRequestsCount(): number {
    if (!this.visa || !this.visa.requests) return 0;
    return this.visa.requests.filter(r => r.status !== 'Closed' && r.days_remaining !== undefined && r.days_remaining >= 0 && r.days_remaining <= 7).length;
  }

  getStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'Preparation': return 'status-gray';
      case 'Ready': return 'status-teal';
      case 'Submitted': return 'status-blue';
      case 'Under Assessment': return 'status-purple';
      case 'RFI-PPI': return 'status-amber animate-pulse';
      case 'AIP': return 'status-indigo';
      case 'Approved': return 'status-green';
      case 'Declined': return 'status-red';
      case 'Withdrawn': return 'status-slate';
      default: return 'status-gray';
    }
  }

  getStatusIcon(status?: string): string {
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
    if (days < 0) return { text: `Overdue by ${Math.abs(days)}d`, css: 'pill-overdue' };
    if (days === 0) return { text: 'Due Today', css: 'pill-today' };
    if (days <= 7) return { text: `Due in ${days}d`, css: 'pill-urgent' };
    return { text: `${days}d left`, css: 'pill-normal' };
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
