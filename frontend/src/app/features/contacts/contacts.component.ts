import { showImpressiveSuccess } from '../../core/utils/impressive-alert';
import { Component, OnInit, HostListener, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ApplicationsService } from '../../core/services/applications.service';
import { SystemSettingsService } from '../../core/services/system-settings.service';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';
import { AnimationService } from '../../core/services/animation.service';
import { ConfettiService } from '../../core/services/confetti.service';
import { CourseService, Course } from '../../core/services/course.service';
import { ChatModalComponent } from '../shared/chat-modal/chat-modal.component';
import { TimelineComponent } from './components/timeline/timeline.component';
import { UpdateLeadStatusModalComponent } from '../../shared/components/update-lead-status-modal/update-lead-status-modal.component';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatModalComponent, TimelineComponent, UpdateLeadStatusModalComponent],
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.css']
})
export class ContactsComponent implements OnInit {
  baseUrl = environment.socketUrl;
  contacts: any[] = [];
  loading = false;
  showModal = false;
  searchQuery = '';
  activeTag = '';
  activeChannel = '';
  activeStatus = '';
  activeAgent = '';
  allTags: string[] = [];
  transferredOnly: boolean = false;
  statuses: any[] = [];
  editingContactId: number | null = null;
  agents: any[] = [];
  isAdmin = false;
  openDropdownId: number | null = null;
  showImportExportDropdown = false;
  returnUrl: string | null = null;
  courses: Course[] = [];
  selectedCourseDetails: Course | null = null;
  // Quick Status Modal
  showQuickStatusModal = false;
  quickStatusLoading = false;
  quickStatusContactId: number | null = null;
  quickStatusContactName: string = '';
  quickStatusData = {
    status: '',
    status_id: null as number | null,
    status_name: '',
    remark: '',
    remarks: '',
    follow_up_date: '',
    branch: '',
    branch_id: null as number | null,
    branch_name: '',
    department: '',
    department_id: null as number | null,
    department_name: '',
    assign_type: 'employee',
    assigned_employee: '',
    loss_reason: ''
  };

  // Embedded Chat Modal
  showChatModal = false;
  activeChatContactId: number | null = null;
  activeChatConvoId: number | null = null;
  activeChatContact: any = null;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalContacts = 0;
  totalPages = 1;

  // Calendar View State
  viewMode: 'list' | 'calendar' = 'list';
  calendarCurrentDate = new Date();
  calendarWeeks: any[][] = [];
  calendarAllLeads: any[] = [];
  calendarLoading = false;
  
  // Daily Leads Modal State
  showDailyLeadsModal = false;
  selectedDailyDate: Date | null = null;
  selectedDailyLeads: any[] = [];

  toggleDropdown(contactId: number, event: Event) {
    event.stopPropagation();
    this.showImportExportDropdown = false;
    if (this.openDropdownId === contactId) {
      this.openDropdownId = null;
    } else {
      this.openDropdownId = contactId;
    }
  }

  toggleImportExportDropdown(event: Event) {
    event.stopPropagation();
    this.openDropdownId = null;
    this.showImportExportDropdown = !this.showImportExportDropdown;
  }

  @HostListener('document:click')
  closeDropdowns() {
    this.openDropdownId = null;
    this.showImportExportDropdown = false;
  }

  // Lead Details Panel
  showDetailPanel = false;
  selectedContact: any = null;
  detailLoading = false;
  detailActiveTab = 'Profile';

  dummyTimeline: any[] = [];
  dummyQuotations: any[] = [];
  dummyPOs: any[] = [];
  contactDocuments: any[] = [];
  dummyNotes: any[] = [];
  dummyActivities: any[] = [];
  dummyHistory: any[] = [];
  
  // File Upload Modal
  showUploadDocumentModal = false;
  uploadDocData: any = { documentType: '', file: null, fileName: '', notes: '' };
  documentOptions = ['Passport', 'Visa', 'Offer Letter', 'Resume', 'Other'];

  // Bulk Import Modal
  showBulkImportModal = false;
  bulkImportLoading = false;
  selectedImportFile: File | null = null;
  totalFileLeads = 0;
  bulkImportUsers: any[] = [];
  userAllocations: { userId: number, userName: string, count: number }[] = [];
  
  // New Bulk Import UI State
  globalImportSettings = {
    branch_id: '',
    department_id: '',
    status_id: '',
    enquiry_source_id: '',
    assigned_to: ''
  };
  parsedLeadsPreview: any[] = [];
  showImportDetailsView = false; // Used to toggle full page import view

  openUploadDocumentModal() {
    this.uploadDocData = { documentType: '', file: null, fileName: '', notes: '' };
    this.showUploadDocumentModal = true;
  }

  closeUploadDocumentModal() {
    this.showUploadDocumentModal = false;
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      this.uploadDocData.file = file;
      this.uploadDocData.fileName = file.name;
    }
  }

  saveDocument() {
    if (!this.uploadDocData.documentType) {
      Swal.fire('Error', 'Please select a document type.', 'error');
      return;
    }
    if (!this.uploadDocData.file) {
      Swal.fire('Error', 'Please choose a file.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('documentType', this.uploadDocData.documentType);
    formData.append('notes', this.uploadDocData.notes);
    formData.append('file', this.uploadDocData.file);

    this.api.upload(`/contacts/${this.selectedContact.id}/documents`, formData).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.showAction('Document uploaded successfully!');
          this.loadDocuments(this.selectedContact.id);
          this.closeUploadDocumentModal();
        }
      },
      error: (err) => {
        Swal.fire('Error', err.error?.message || 'Error uploading document', 'error');
      }
    });
  }

  clearDocument() {
    this.uploadDocData = { documentType: '', file: null, fileName: '', notes: '' };
    const nativeInput = document.getElementById('fileUploadInputNative') as HTMLInputElement;
    if (nativeInput) {
      nativeInput.value = '';
    }
  }

  branches: any[] = [];
  departments: any[] = [];
  employees: any[] = [];
  leadStatuses: any[] = [];
  dummyLossReasons = ['Price too high', 'Bought from competitor', 'No longer needed', 'Missing features', 'Poor communication'];

  //  showAdvancedFilters = false;
  
  leadFields: any[] = [];
  groupedLeadFields: { categoryName: string, fields: any[] }[] = [];

  // Application Settings Data
  intakes: any[] = [];
  years: any[] = [];
  appStatuses: any[] = [];
  enquiryFors: any[] = [];
  channels: any[] = [];
  countries: string[] = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Ireland', 'New Zealand', 'Singapore', 'India', 'China'];

  // Dynamic Filtering Helpers
  getFilteredDepartments(branchName: string) {
    if (!branchName) return [];
    const branch = this.branches.find(b => b.name === branchName);
    if (!branch) return [];
    return this.departments.filter(d => d.branch_id === branch.id);
  }

  getFilteredEmployees(branchName: string, departmentName: string) {
    if (!branchName || !departmentName) return [];
    return this.employees.filter(e => e.branch_name === branchName && e.department_name === departmentName);
  }

  getEmployeeName(employeeId: any): string {
    if (!employeeId) return '';
    const emp = this.employees.find(e => e.id == employeeId);
    return emp ? emp.name : '';
  }

  // Application Data
  selectedContactApplications: any[] = [];
  loadingApplications: boolean = false;
  selectedContactLeads: any[] = [];
  applicationHistory: any[] = [];

  showAddApplicationModal = false;
  showAppHistoryModal = false;
  currentApplication: any = {
    country: '',
    university: '',
    course: '',
    intake_id: '',
    year_id: '',
    status_id: '',
    description: ''
  };

  showAddLeadModal = false;
  currentLead: any = {
    enquiry_for_id: '',
    status: 'New',
    loss_reason: '',
    assigned_to: '',
    follow_up_date: '',
    remark: ''
  };

  newContact: any = {
    name: '',
    phone: '',
    email: '',
    address: '',
    company: '',
    enquiry_for_id: null,
    status: '',
    status_id: null,
    status_name: '',
    remark: '',
    remarks: '',
    follow_up_date: '',
    tags: 'lead',
    channel_preference: 'whatsapp',
    assigned_to: '',
    branch: '',
    branch_id: null,
    branch_name: '',
    department: '',
    department_id: null,
    department_name: '',
    assign_type: 'employee',
    assigned_employee: '',
    loss_reason: '',
    custom_field_values: {} as Record<string, string>
  };

  // Quotation Modal
  isQuoteModalOpen = false;
  editingQuote: any = null;
  toastMessage = '';
  toastTimeout: any;

  openQuoteModal(quote: any = null) {
    if (quote) {
      this.editingQuote = { ...quote };
    } else {
      this.editingQuote = {
        id: 'QT-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900),
        client: this.selectedContact ? this.selectedContact.name : '',
        email: this.selectedContact ? this.selectedContact.email : '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        status: 'Pending Approval'
      };
    }
    this.isQuoteModalOpen = true;
  }

  closeQuoteModal() {
    this.isQuoteModalOpen = false;
    this.editingQuote = null;
  }

  submitQuote() {
    this.showAction('Quotation saved successfully!');
    this.closeQuoteModal();
  }

  showAction(message: string) {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastMessage = message;
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = '';
    }, 3000);
  }

  triggerSaveAnimation() {
    const doc = this.document;

    if (!doc.getElementById('__save-anim-styles-v4')) {
      const styleEl = doc.createElement('style');
      styleEl.id = '__save-anim-styles-v4';
      styleEl.textContent = `
        .crm-overlay {
          position: fixed; inset: 0;
          background: rgba(10,9,11,0.82);
          backdrop-filter: blur(10px) saturate(1.05);
          -webkit-backdrop-filter: blur(10px) saturate(1.05);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; z-index: 999999; visibility: hidden;
        }
        .crm-overlay.show { visibility: visible; animation: overlay-in .7s cubic-bezier(.22,.8,.3,1) forwards; }
        .crm-overlay.hide { animation: overlay-out .6s ease forwards; }
        @keyframes overlay-in { 0%{opacity:0} 100%{opacity:1} }
        @keyframes overlay-out { 0%{opacity:1} 100%{opacity:0;visibility:hidden} }

        .crm-dust {
          position: absolute; width: 3px; height: 3px; border-radius: 50%;
          background: #10b981; opacity: 0;
        }
        .crm-overlay.show .crm-dust { animation: drift 4.5s ease-in-out infinite; }
        .crm-dust:nth-child(1) { top:32%; left:30%; animation-delay:.2s; }
        .crm-dust:nth-child(2) { top:64%; left:68%; animation-delay:1.1s; }
        .crm-dust:nth-child(3) { top:70%; left:34%; animation-delay:2s; }
        .crm-dust:nth-child(4) { top:28%; left:66%; animation-delay:.7s; }
        @keyframes drift {
          0%{opacity:0;transform:translateY(0)} 30%{opacity:.55} 100%{opacity:0;transform:translateY(-26px)}
        }

        .crm-confirm {
          position: relative; display: flex; flex-direction: column; align-items: center;
          text-align: center; transform: translateY(10px) scale(0.97); opacity: 0;
        }
        .crm-overlay.show .crm-confirm { animation: confirm-in .8s cubic-bezier(.19,.83,.28,1) forwards .1s; }
        @keyframes confirm-in { to{transform:translateY(0) scale(1);opacity:1;} }

        .crm-ring-wrap { position: relative; width: 104px; height: 104px; margin-bottom: 26px; }
        .crm-ring-glow {
          position: absolute; inset: -30px; border-radius: 50%;
          background: radial-gradient(circle, rgba(16,185,129,0.25), transparent 65%);
          opacity: 0;
        }
        .crm-overlay.show .crm-ring-glow { animation: glow-pulse 2.4s ease .5s forwards; }
        @keyframes glow-pulse { 0%{opacity:0} 35%{opacity:1} 100%{opacity:0.35} }

        .crm-ring-wrap svg { width: 100%; height: 100%; }
        .crm-ring { stroke-dasharray: 289; stroke-dashoffset: 289; }
        .crm-overlay.show .crm-ring { animation: ring-draw 1s cubic-bezier(.4,.0,.2,1) forwards .05s; }
        @keyframes ring-draw { to{stroke-dashoffset:0} }

        .crm-check { stroke-dasharray: 40; stroke-dashoffset: 40; }
        .crm-overlay.show .crm-check { animation: check-draw .55s ease forwards 1.0s; }
        @keyframes check-draw { to{stroke-dashoffset:0} }

        .crm-confirm h2 {
          font-family: 'Fraunces', serif; font-style: italic; font-weight: 500; font-size: 34px;
          margin: 0 0 10px; letter-spacing: -0.01em; opacity: 0; transform: translateY(8px);
          color: #ffffff;
        }
        .crm-overlay.show .crm-confirm h2 { animation: text-up .6s ease forwards 1.35s; }
        @keyframes text-up { to{opacity:1;transform:translateY(0)} }

        .crm-confirm .crm-meta {
          font-size: 12.5px; letter-spacing: 0.06em; text-transform: uppercase; color: #9C968E;
          opacity: 0; transform: translateY(6px);
        }
        .crm-overlay.show .crm-confirm .crm-meta { animation: text-up .6s ease forwards 1.55s; }
        .crm-confirm .crm-meta .crm-gold { color: #10b981; }

        .crm-confirm .crm-rule {
          width: 34px; height: 1px; background: #10b981; margin: 16px 0 14px;
          opacity: 0; transform: scaleX(0); transform-origin: center;
        }
        .crm-overlay.show .crm-confirm .crm-rule { animation: rule-in .5s ease forwards 1.45s; }
        @keyframes rule-in { to{opacity:0.6;transform:scaleX(1)} }
      `;
      doc.head.appendChild(styleEl);
    }

    const overlay = doc.createElement('div');
    overlay.className = 'crm-overlay';

    const contactName = this.selectedContact ? this.selectedContact.name : 'System Record';
    const timestamp = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' });

    overlay.innerHTML = `
      <span class="crm-dust"></span><span class="crm-dust"></span><span class="crm-dust"></span><span class="crm-dust"></span>
      <div class="crm-confirm">
        <div class="crm-ring-wrap">
          <div class="crm-ring-glow"></div>
          <svg viewBox="0 0 104 104" fill="none">
            <circle class="crm-ring" cx="52" cy="52" r="46" stroke="#10b981" stroke-width="1.4"/>
            <path class="crm-check" d="M35 54l12 12 24-26" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2>Saved</h2>
        <div class="crm-rule"></div>
        <div class="crm-meta">${contactName} <span class="crm-gold">·</span> ${timestamp}</div>
      </div>
    `;

    doc.body.appendChild(overlay);

    // Trigger animation cleanly
    requestAnimationFrame(() => {
      overlay.classList.add('show');
    });

    // Fire confetti when checkmark animates in (around 1000ms delay)
    setTimeout(() => {
      this.confettiService.fireSuccessBurst();
    }, 1000);

    setTimeout(() => {
      overlay.classList.remove('show');
      overlay.classList.add('hide');
      setTimeout(() => overlay.remove(), 600);
    }, 2800);
  }


  get today(): string {
    return new Date().toISOString().split('T')[0];
  }

  constructor(
    private api: ApiService, 
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private appsService: ApplicationsService,
    private settingsService: SystemSettingsService,
    private animationService: AnimationService,
    private confettiService: ConfettiService,
    private courseService: CourseService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit() {
    this.isAdmin = this.auth.hasRole('admin', 'superadmin');
    this.loadContacts();
    this.loadTags();
    this.loadLeadFields();
    this.loadAgents();
    this.loadApplicationSettings();
    this.loadBranches();
    this.loadDepartments();
    this.loadLeadStatuses();
    this.loadDocumentTypes();
    this.loadChannels();
    this.loadCourses();

    // Handle deep-link from report pages: ?contactId=X&action=profile|followup
    this.route.queryParams.subscribe(params => {
      const contactId = params['contactId'];
      const action = params['action'];
      if (params['returnUrl']) {
        this.returnUrl = params['returnUrl'];
      }
      if (contactId) {
        // Wait for contacts to load, then open
        const tryOpen = () => {
          const contact = this.contacts.find((c: any) => String(c.id) === String(contactId));
          if (contact) {
            if (action === 'followup') {
              this.openQuickStatusModal(contact);
            } else {
              this.openDetailPanel(contact);
            }
            // Clear query params so it doesn't re-trigger on re-navigation
            this.router.navigate([], { queryParams: {}, replaceUrl: true });
          } else if (this.loading) {
            setTimeout(tryOpen, 300);
          } else {
            // Contact not in current page — fetch directly
            this.api.get(`/contacts/${contactId}`).subscribe({
              next: (res: any) => {
                if (res.success && res.data) {
                  const c = { ...res.data, tags: Array.isArray(res.data.tags) ? res.data.tags : JSON.parse(res.data.tags || '[]') };
                  if (action === 'followup') {
                    this.openQuickStatusModal(c);
                  } else {
                    this.openDetailPanel(c);
                  }
                  this.router.navigate([], { queryParams: {}, replaceUrl: true });
                }
              }
            });
          }
        };
        setTimeout(tryOpen, 400);
      }
    });
  }

  loadDocumentTypes() {
    this.settingsService.getDocumentTypes().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          if (res.data.length > 0) {
            this.documentOptions = res.data.map((d: any) => d.name);
          }
        }
      },
      error: (err) => console.error('Failed to load document types', err)
    });
  }

  /** Returns true if the given status name has transfer=true in DB */
  isTransferStatus(statusName: string): boolean {
    if (!statusName) return false;
    const found = this.leadStatuses.find(s => s.name === statusName);
    if (!found) return false;
    const tr = found.transfer;
    return tr === true || tr === 1 || String(tr).toLowerCase() === 'true' || String(tr) === '1' || String(tr).toLowerCase() === 'yes';
  }

  loadChannels() {
    this.settingsService.getChannels().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.channels = res.data;
        }
      }
    });
  }

  isFollowupStatus(statusName: string): boolean {
    if (!statusName) return false;
    const found = this.leadStatuses.find(s => s.name === statusName);
    if (!found) return false;
    const fn = found.follow_needed;
    return fn === 'Yes' || fn === true || fn === 1 || String(fn).toLowerCase() === 'yes' || String(fn).toLowerCase() === 'true' || String(fn) === '1';
  }

  loadApplicationSettings() {
    this.settingsService.getIntakes().subscribe({ next: (res: any) => { if(res.success) this.intakes = res.data; }});
    this.settingsService.getYears().subscribe({ next: (res: any) => { if(res.success) this.years = res.data; }});
    this.settingsService.getAppStatuses().subscribe({ next: (res: any) => { if(res.success) this.appStatuses = res.data; }});
    this.settingsService.getEnquiryFors().subscribe({ next: (res: any) => { if(res.success) this.enquiryFors = res.data; }});
  }

  loadAgents() {
    this.api.get('/settings/team').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.agents = res.data.filter((u: any) => u.role === 'agent');
          this.employees = res.data;
        }
      }
    });
  }

  loadBranches() {
    this.api.get('/system-settings/branches').subscribe({
      next: (res: any) => {
        if (res.success) this.branches = res.data;
      }
    });
  }

  loadDepartments() {
    this.api.get('/system-settings/departments').subscribe({
      next: (res: any) => {
        if (res.success) this.departments = res.data;
      }
    });
  }

  loadLeadStatuses() {
    this.settingsService.getStatuses().subscribe({
      next: (res: any) => {
        if (res.success) this.leadStatuses = res.data;
      }
    });
  }

  getStatusColor(statusName: string): string {
    if (!statusName) return '#94a3b8'; // default gray
    const status = this.leadStatuses.find(s => s.name === statusName);
    return status?.color || '#4f46e5'; // default primary
  }

  loadLeadFields() {
    this.api.get('/settings/lead-fields').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.leadFields = res.data;
          const grouped: any = {};
          this.leadFields.forEach(f => {
            const cat = f.category_name || 'Uncategorized';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(f);
          });
          this.groupedLeadFields = Object.keys(grouped).map(cat => ({
            categoryName: cat,
            fields: grouped[cat]
          })).sort((a, b) => a.categoryName === 'Uncategorized' ? 1 : b.categoryName === 'Uncategorized' ? -1 : a.categoryName.localeCompare(b.categoryName));
        }
      }
    });
  }

  loadContacts() {
    this.loading = true;
    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    };
    if (this.activeStatus?.trim() !== 'NO DATE' && this.activeStatus?.trim() !== 'No Follow Up') {
      params.has_followup = 1;
    }
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.activeTag) params.tags = this.activeTag;
    if (this.activeChannel) params.channel = this.activeChannel;
    if (this.activeStatus) params.status = this.activeStatus;
    if (this.activeAgent) params.agent = this.activeAgent;
    if (this.transferredOnly) params.transferred_only = true;
    
    this.api.get('/contacts', params).subscribe({
      next: (res: any) => {
        this.contacts = res.data
          .map((c: any) => ({
            ...c,
            tags: Array.isArray(c.tags) ? c.tags : JSON.parse(c.tags || '[]')
          }));
        this.totalContacts = res.total || 0;
        this.totalPages = Math.max(1, Math.ceil(this.totalContacts / this.pageSize));
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }


  loadTags() {
    this.api.get('/contacts/tags').subscribe({
      next: (res: any) => this.allTags = res.data
    });
  }

  applyFilters() {
    this.currentPage = 1;
    if (this.viewMode === 'calendar') {
      this.loadCalendarData(false);
    } else {
      this.loadContacts();
    }
  }

  toggleTransferredOnly() {
    this.transferredOnly = !this.transferredOnly;
    this.applyFilters();
  }

  onSearch() {
    this.applyFilters();
  }

  // Pagination methods
  onPageSizeChange() {
    this.currentPage = 1;
    this.loadContacts();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadContacts();
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  prevPage() {
    this.goToPage(this.currentPage - 1);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  get paginationStart(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalContacts);
  }

  // ── Lead Detail Panel ──────────────────────────────────────────────────────

  openDetailPanel(contact: any) {
    this.showDetailPanel = true;
    this.detailLoading = true;
    this.selectedContact = null;
    this.detailActiveTab = 'Profile';
    this.api.get(`/contacts/${contact.id}`).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.selectedContact = {
            ...res.data,
            tags: Array.isArray(res.data.tags) ? res.data.tags : JSON.parse(res.data.tags || '[]')
          };
          this.generateDummyData();
          this.loadApplications(contact.id);
          this.loadLeads(contact.id);
          this.loadDocuments(contact.id);
          this.loadContactHistory(contact.id);
        }
        this.detailLoading = false;
      },
      error: () => this.detailLoading = false
    });
  }

  generateDummyData() {
    this.dummyTimeline = [];
    this.dummyQuotations = [];
    this.dummyPOs = [];
    this.dummyNotes = [];
    this.dummyActivities = [];
    this.dummyHistory = [];
  }

  closeDetailPanel() {
    this.showDetailPanel = false;
    this.selectedContact = null;
    this.selectedContactApplications = [];
    if (this.returnUrl) {
      const target = this.returnUrl;
      this.returnUrl = null;
      this.router.navigateByUrl(target);
    }
  }

  // --- APPLICATIONS LOGIC ---
  loadApplications(contactId: number) {
    this.appsService.getApplications(contactId).subscribe({
      next: (res: any) => {
        if (res.success) this.selectedContactApplications = res.data;
      }
    });
  }

  loadDocuments(contactId: number) {
    this.api.get(`/contacts/${contactId}/documents`).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.contactDocuments = res.data;
        }
      }
    });
  }

  loadContactHistory(contactId: number) {
    this.historyLoading = true;
    this.contactHistory = [];
    this.api.get(`/contacts/${contactId}/history`).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.contactHistory = res.data;
        }
        this.historyLoading = false;
      },
      error: () => {
        this.historyLoading = false;
      }
    });
  }

  openAddApplicationModal() {
    this.currentApplication = { contact_id: this.selectedContact.id, country: '', university: '', course: '', intake_id: '', year_id: '', status_id: '', description: '' };
    this.selectedCourseDetails = null;
    this.showAddApplicationModal = true;
  }

  loadCourses() {
    this.courseService.getCourses().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.courses = res.data;
        }
      },
      error: (err) => console.error('Failed to load courses', err)
    });
  }

  onCourseSelect() {
    const course = this.courses.find(c => c.name === this.currentApplication.course);
    this.selectedCourseDetails = course || null;
  }


  // --- BULK IMPORT & EXPORT LOGIC ---
  
  exportContacts() {
    window.open(`${environment.apiUrl}/contacts/export?token=${localStorage.getItem('uc_token')}`, '_blank');
  }

  openBulkImportModal() {
    this.showImportDetailsView = true;
    this.selectedImportFile = null;
    this.totalFileLeads = 0;
    this.userAllocations = [];
    this.parsedLeadsPreview = [];
    this.globalImportSettings = {
      branch_id: '',
      department_id: '',
      status_id: '',
      enquiry_source_id: '',
      assigned_to: ''
    };
    this.showImportExportDropdown = false;
    
    // Fetch users for allocation
    this.api.get('/settings/team').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.bulkImportUsers = res.data;
        }
      }
    });
  }

  closeBulkImportModal() {
    this.showImportDetailsView = false;
    this.selectedImportFile = null;
    this.totalFileLeads = 0;
    this.userAllocations = [];
    this.parsedLeadsPreview = [];
  }

  downloadExcelTemplate() {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet([
      { 'Full Name': '', 'Mobile': '', 'Whatsapp': '', 'Email': '', 'Address': '', 'Remarks': '' }
    ]);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads_Template');
    XLSX.writeFile(wb, 'lead_import_template.xlsx');
  }

  onBulkImportFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImportFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
        this.totalFileLeads = jsonData.length;
        this.parsedLeadsPreview = jsonData.slice(0, 5); // Preview first 5
      };
      reader.readAsArrayBuffer(file);
    }
  }

  addUserAllocation() {
    this.userAllocations.push({ userId: 0, userName: '', count: 0 });
  }
  
  removeUserAllocation(index: number) {
    this.userAllocations.splice(index, 1);
  }
  
  autoDistributeCounts() {
    if (this.userAllocations.length === 0 || this.totalFileLeads === 0) return;
    
    const baseCount = Math.floor(this.totalFileLeads / this.userAllocations.length);
    let remainder = this.totalFileLeads % this.userAllocations.length;
    
    this.userAllocations.forEach((alloc, i) => {
      alloc.count = baseCount + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;
    });
  }
  
  get totalAssignedLeads(): number {
    return this.userAllocations.reduce((sum, alloc) => sum + (alloc.count || 0), 0);
  }

  submitBulkImport() {
    if (!this.selectedImportFile) {
      Swal.fire('Error', 'Please select a file to import.', 'error');
      return;
    }
    
    if (this.totalAssignedLeads > this.totalFileLeads) {
      Swal.fire('Error', 'Total assigned leads cannot exceed the total leads in the file.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedImportFile);
    
    // Append global settings
    formData.append('branch_id', this.globalImportSettings.branch_id);
    formData.append('department_id', this.globalImportSettings.department_id);
    formData.append('status_id', this.globalImportSettings.status_id);
    formData.append('enquiry_source_id', this.globalImportSettings.enquiry_source_id);
    if (this.globalImportSettings.assigned_to) {
      formData.append('assigned_to', this.globalImportSettings.assigned_to);
    }

    const validAllocations = this.userAllocations.filter(a => a.userId && a.count > 0);
    if (validAllocations.length > 0) {
      formData.append('assignments', JSON.stringify(validAllocations));
    }

    this.bulkImportLoading = true;
    this.api.post('/contacts/import', formData).subscribe({
      next: (res: any) => {
        this.bulkImportLoading = false;
        if (res.success) {
          Swal.fire('Success', res.message, 'success');
          this.closeBulkImportModal();
          this.loadContacts();
        } else {
          Swal.fire('Error', res.message, 'error');
        }
      },
      error: (err) => {
        this.bulkImportLoading = false;
        Swal.fire('Error', err.error?.message || 'Failed to import contacts.', 'error');

      }
    });
  }

  openEditApplicationModal(app: any) {
    this.currentApplication = { ...app };
    this.showAddApplicationModal = true;
  }

  saveApplication() {
    if (!this.currentApplication.country || !this.currentApplication.university || !this.currentApplication.course) {
      Swal.fire('Error', 'Country, University, and Course are required.', 'error');
      return;
    }

    if (this.currentApplication.id) {
      this.appsService.updateApplication(this.currentApplication.id, this.currentApplication).subscribe({
        next: (res: any) => {
          if (res.success) {
            showImpressiveSuccess('Application updated');
            this.loadApplications(this.selectedContact.id);
            this.showAddApplicationModal = false;
          }
        },
        error: (err) => Swal.fire('Error', err.error.message || 'Error updating application', 'error')
      });
    } else {
      this.appsService.createApplication(this.currentApplication).subscribe({
        next: (res: any) => {
          if (res.success) {
            showImpressiveSuccess('Application created');
            this.loadApplications(this.selectedContact.id);
            this.showAddApplicationModal = false;
          }
        },
        error: (err) => Swal.fire('Error', err.error.message || 'Error creating application', 'error')
      });
    }
  }

  deleteApplication(id: number) {
    Swal.fire({ title: 'Are you sure?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes, delete it!' })
    .then((result) => {
      if (result.isConfirmed) {
        this.appsService.deleteApplication(id).subscribe({
          next: (res: any) => {
            if (res.success) {
              showImpressiveSuccess('Application deleted');
              this.loadApplications(this.selectedContact.id);
            }
          }
        });
      }
    });
  }

  updateApplicationStatus(app: any, statusId: number) {
    if (app.status_id === statusId) return;
    const updatedApp = { ...app, status_id: statusId };
    this.appsService.updateApplication(app.id, updatedApp).subscribe({
      next: (res: any) => {
        if (res.success) {
          showImpressiveSuccess('Status updated');
          this.loadApplications(this.selectedContact.id);
        }
      }
    });
  }

  openAppHistoryModal(applicationId: number) {
    this.applicationHistory = [];
    this.appsService.getApplicationHistory(applicationId).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.applicationHistory = res.data;
          this.showAppHistoryModal = true;
        }
      }
    });
  }

  openEditFromDetail() {
    if (this.selectedContact) {
      const contact = this.selectedContact;
      this.closeDetailPanel();
      this.openEditModal(contact);
    }
  }

  goToChatFromDetail() {
    if (this.selectedContact) {
      const contact = this.selectedContact;
      this.closeDetailPanel();
      this.goToChat(contact);
    }
  }

  // ── Leads Management ────────────────────────────────────────────────────────

  loadLeads(contactId: number) {
    this.api.get(`/contacts/${contactId}/leads`).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.selectedContactLeads = res.data;
        }
      }
    });
  }

  openAddLeadModal() {
    this.currentLead = {
      enquiry_for_id: '',
      status: 'New',
      loss_reason: '',
      assigned_to: '',
      follow_up_date: '',
      remark: '',
      branch: '',
      department: '',
      assign_type: 'auto'
    };
    this.showAddLeadModal = true;
  }

  openEditLeadModal(lead: any) {
    this.currentLead = { ...lead };
    if (this.currentLead.follow_up_date) {
      const dt = new Date(this.currentLead.follow_up_date);
      if (!isNaN(dt.getTime())) {
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const dd = String(dt.getDate()).padStart(2, '0');
        this.currentLead.follow_up_date = `${yyyy}-${mm}-${dd}`;
      }
    }
    
    // Resolve branch & department from assigned_to employee if it exists
    this.currentLead.branch = '';
    this.currentLead.department = '';
    this.currentLead.assign_type = 'auto';

    if (this.currentLead.assigned_to) {
      const emp = this.employees.find((e: any) => e.id === this.currentLead.assigned_to);
      if (emp) {
        this.currentLead.branch = emp.branch_name;
        this.currentLead.department = emp.department_name;
        this.currentLead.assign_type = 'employee';
      }
    }
    this.showAddLeadModal = true;
  }

  saveLead() {
    if (!this.currentLead.status) {
      Swal.fire('Error', 'Status is required.', 'error');
      return;
    }

    if (this.isTransferStatus(this.currentLead.status)) {
      if (!this.currentLead.branch || !this.currentLead.department || !this.currentLead.assigned_to) {
        Swal.fire('Error', 'Branch, Department, and Employee are required for this status.', 'error');
        return;
      }
    }

    const payload = { ...this.currentLead };

    if (!this.isFollowupStatus(payload.status)) {
      payload.follow_up_date = null;
    }

    if (this.isTransferStatus(payload.status)) {
      if (payload.assign_type === 'auto') {
        const emps = this.getFilteredEmployees(payload.branch, payload.department);
        payload.assigned_to = emps.length ? emps[0].id : null;
      }
    } else {
      payload.assigned_to = null;
      payload.remark = null;
    }

    if (payload.status !== 'Sales Loss') {
      payload.loss_reason = null;
    }

    if (payload.id) {
      this.api.put(`/leads/${payload.id}`, payload).subscribe({
        next: (res: any) => {
          if (res.success) {
            showImpressiveSuccess('Lead updated');
            this.loadLeads(this.selectedContact.id);
            this.showAddLeadModal = false;
          }
        },
        error: (err: any) => Swal.fire('Error', err.error.message || 'Error updating lead', 'error')
      });
    } else {
      this.api.post(`/contacts/${this.selectedContact.id}/leads`, payload).subscribe({
        next: (res: any) => {
          if (res.success) {
            showImpressiveSuccess('Lead created');
            this.loadLeads(this.selectedContact.id);
            this.showAddLeadModal = false;
          }
        },
        error: (err: any) => Swal.fire('Error', err.error.message || 'Error creating lead', 'error')
      });
    }
  }

  deleteLead(id: number) {
    Swal.fire({ title: 'Are you sure?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes, delete it!' })
    .then((result) => {
      if (result.isConfirmed) {
        this.api.delete(`/leads/${id}`).subscribe({
          next: (res: any) => {
            if (res.success) {
              showImpressiveSuccess('Lead deleted');
              this.loadLeads(this.selectedContact.id);
            }
          }
        });
      }
    });
  }

  // ── Modal Actions ──────────────────────────────────────────────────────────

  showHistoryModal = false;
  contactHistory: any[] = [];
  historyLoading = false;

  openHistoryModal(contact: any) {
    this.showHistoryModal = true;
    this.historyLoading = true;
    this.contactHistory = [];
    this.api.get(`/contacts/${contact.id}/history`).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.contactHistory = res.data;
        }
        this.historyLoading = false;
      },
      error: () => this.historyLoading = false
    });
  }

  closeHistoryModal() {
    this.showHistoryModal = false;
    this.contactHistory = [];
  }

  getFieldTypeIcon(fieldType: string): string {
    const icons: Record<string, string> = {
      text: 'bi-type',
      number: 'bi-123',
      dropdown: 'bi-chevron-down',
      date: 'bi-calendar3',
      dob: 'bi-cake2',
      email: 'bi-envelope',
      phone: 'bi-telephone',
      textarea: 'bi-textarea-t'
    };
    return icons[fieldType] || 'bi-type';
  }

  formatFieldValue(field: any): string {
    if (!field.value) return '—';
    if (field.field_type === 'dob' || field.field_type === 'date') {
      try {
        const d = new Date(field.value);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      } catch { return field.value; }
    }
    return field.value;
  }

  // ── Add / Edit Modal ───────────────────────────────────────────────────────

  openAddModal() {
    this.editingContactId = null;
    this.newContact = {
      name: '', phone: '', email: '', address: '', company: '', enquiry_for_id: null,
      status: '', remark: '', follow_up_date: '',
      tags: 'lead', channel_preference: 'whatsapp', assigned_to: '',
      branch: '', department: '', assign_type: 'employee', assigned_employee: '', loss_reason: '',
      custom_field_values: {}
    };
    // Pre-init custom fields
    this.leadFields.forEach(f => {
      this.newContact.custom_field_values[f.id] = '';
    });
    this.showModal = true;
  }

  openEditModal(contact: any) {
    this.editingContactId = contact.id;
    const tagsArray = Array.isArray(contact.tags) ? contact.tags : [];
    this.newContact = {
      name: contact.name || '',
      phone: contact.phone || '',
      email: contact.email || '',
      address: contact.address || '',
      company: contact.company || '',
      enquiry_for_id: contact.enquiry_for_id || null,
      status: contact.status || '',
      remark: contact.remark || '',
      follow_up_date: contact.follow_up_date ? new Date(contact.follow_up_date).toISOString().split('T')[0] : '',
      tags: tagsArray.join(', '),
      channel_preference: contact.channel_preference || 'whatsapp',
      assigned_to: contact.assigned_to || '',
      branch: contact.branch || '',
      department: contact.department || '',
      assign_type: contact.assign_type || 'employee',
      assigned_employee: contact.assigned_employee || '',
      loss_reason: contact.loss_reason || '',
      custom_field_values: {}
    };

    // Populate custom field values from the detailed contact
    if (contact.custom_fields && Array.isArray(contact.custom_fields)) {
      contact.custom_fields.forEach((f: any) => {
        this.newContact.custom_field_values[f.field_id] = f.value || '';
      });
    } else {
      // If we don't have custom_fields yet, fetch them
      this.leadFields.forEach(f => {
        this.newContact.custom_field_values[f.id] = '';
      });
      this.api.get(`/contacts/${contact.id}`).subscribe({
        next: (res: any) => {
          if (res.success && res.data.custom_fields) {
            res.data.custom_fields.forEach((f: any) => {
              this.newContact.custom_field_values[f.field_id] = f.value || '';
            });
          }
        }
      });
    }

    this.showModal = true;
  }

  saveContact() {
    if (!this.newContact.name || !this.newContact.phone) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Fields',
        text: 'Name and Phone are required',
        confirmButtonColor: '#10B981'
      });
      return;
    }

    if (!this.newContact.status) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Fields',
        text: 'Status is required',
        confirmButtonColor: '#10B981'
      });
      return;
    }

    if (this.isTransferStatus(this.newContact.status)) {
      if (!this.newContact.branch || !this.newContact.department || !this.newContact.assigned_employee) {
        Swal.fire({
          icon: 'error',
          title: 'Missing Fields',
          text: 'Branch, Department, and Employee are required for this status.',
          confirmButtonColor: '#10B981'
        });
        return;
      }
    }

    // Phone validation for exactly 12 digits
    const numericPhone = this.newContact.phone.replace(/\D/g, '');
    if (numericPhone.length !== 12) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Phone Number',
        text: 'Phone number must be exactly 12 digits (including country code).',
        confirmButtonColor: '#10B981'
      });
      return;
    }
    // Optionally update the phone to be the numeric one, or keep user formatting
    this.newContact.phone = numericPhone;

    if (this.newContact.status === 'Branch' || this.newContact.status === 'Sales Loss') {
      Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: 'The status has been updated successfully.',
        confirmButtonColor: '#10B981'
      });
      this.showModal = false;
      return;
    }

    const selStatus = this.leadStatuses?.find((s: any) => s.name === this.newContact.status);
    if (selStatus) {
      this.newContact.status_id = selStatus.id;
      this.newContact.status_name = selStatus.name;
    }

    const selBranch = this.branches?.find((b: any) => b.name === this.newContact.branch);
    if (selBranch) {
      this.newContact.branch_id = selBranch.id;
      this.newContact.branch_name = selBranch.name;
    }

    const selDept = this.departments?.find((d: any) => d.name === this.newContact.department);
    if (selDept) {
      this.newContact.department_id = selDept.id;
      this.newContact.department_name = selDept.name;
    }

    if (this.newContact.assign_type === 'employee' && this.newContact.assigned_employee) {
      const selEmp = this.employees?.find((e: any) => e.name === this.newContact.assigned_employee);
      if (selEmp) {
        this.newContact.assigned_to = selEmp.id;
      }
    } else if (this.newContact.assign_type === 'auto') {
      this.newContact.assigned_to = null;
    }

    const payload = {
      ...this.newContact,
      follow_up_date: this.newContact.follow_up_date || null,
      tags: this.newContact.tags ? this.newContact.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : [],
      custom_field_values: this.newContact.custom_field_values
    };

    const request = this.editingContactId 
      ? this.api.put(`/contacts/${this.editingContactId}`, payload)
      : this.api.post('/contacts', payload);

    request.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.loadContacts();
          this.loadTags();
          this.showModal = false;
          this.triggerSaveAnimation();
        }
      },
      error: (err: any) => {
        const isDuplicate = err.status === 409;
        Swal.fire({
          icon: isDuplicate ? 'warning' : 'error',
          title: isDuplicate ? 'Duplicate Contact' : 'Error',
          text: err.error?.message || 'Error saving contact',
          confirmButtonColor: isDuplicate ? '#f59e0b' : '#ef4444'
        });
      }
    });
  }

  deleteContactFromDetail(id: number) {
    this.deleteContact(id);
  }

  deleteContact(id: number) {
    Swal.fire({
      title: 'Are you sure you want to delete this lead?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.delete(`/contacts/${id}`).subscribe({
          next: () => {
            // Remove it from the list immediately without requiring a page refresh
            this.contacts = this.contacts.filter(c => c.id !== id);
            this.totalContacts--;
            
            // Close detail panel if open
            if (this.selectedContact?.id === id) {
              this.closeDetailPanel();
            }

            showImpressiveSuccess('Lead deleted successfully.');
            
            // Optionally reload tags or pagination if needed, but the list is updated.
          },
          error: (err: any) => {
            Swal.fire('Error', err.error?.message || 'Failed to delete lead', 'error');
          }
        });
      }
    });
  }



  goToChat(contact: any) {
    this.activeChatContact = contact;
    this.api.post('/conversations', { 
      contact_id: contact.id, 
      channel: contact.channel_preference || 'whatsapp' 
    }).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.activeChatContactId = contact.id;
          this.activeChatConvoId = res.data.id;
          this.showChatModal = true;
        }
      },
      error: (err: any) => {
        this.activeChatContact = null;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.message || 'Error opening chat',
          confirmButtonColor: '#ef4444'
        });
      }
    });
  }

  closeChatModal() {
    this.showChatModal = false;
    const contact = this.activeChatContact;
    this.activeChatContact = null;
    if (contact) {
      this.openDetailPanel(contact);
    }
  }

  // ═══════════════════ QUICK STATUS MODAL ═══════════════════

  openQuickStatusModal(contact: any) {
    this.quickStatusContactId = contact.id;
    this.quickStatusContactName = contact.name;
    
    let parsedDate = '';
    if (contact.follow_up_date) {
      try {
        const d = new Date(contact.follow_up_date);
        if (!isNaN(d.getTime())) {
          parsedDate = d.toISOString().split('T')[0];
        }
      } catch (e) {
        // ignore invalid dates
      }
    }

    this.quickStatusData = {
      status: contact.status_name || contact.status || '',
      status_id: contact.status_id || null,
      status_name: contact.status_name || '',
      remark: '',
      remarks: '',
      follow_up_date: contact.follow_up_date ? (() => { const d = new Date(contact.follow_up_date); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })() : '',
      branch: contact.branch_name || contact.branch || '',
      branch_id: contact.branch_id || null,
      branch_name: contact.branch_name || '',
      department: contact.department_name || contact.department || '',
      department_id: contact.department_id || null,
      department_name: contact.department_name || '',
      assign_type: contact.assign_type || 'employee',
      assigned_employee: contact.assigned_to || contact.assigned_employee || '',
      loss_reason: contact.loss_reason || ''
    };
    this.showQuickStatusModal = true;
  }

  closeQuickStatusModal() {
    this.showQuickStatusModal = false;
    this.quickStatusContactId = null;
    if (this.returnUrl && !this.showDetailPanel) {
      const target = this.returnUrl;
      this.returnUrl = null;
      this.router.navigateByUrl(target);
    }
  }

  openContactDetailFromQuickStatus(id?: number) {
    const contactId = id || this.quickStatusContactId;
    this.closeQuickStatusModal();
    if (contactId) {
      const contact = this.contacts.find((c: any) => c.id === contactId);
      if (contact) {
        this.openDetailPanel(contact);
      }
    }
  }

  openContactHistoryFromQuickStatus() {
    const contactId = this.quickStatusContactId;
    this.closeQuickStatusModal();
    if (contactId) {
      const contact = this.contacts.find((c: any) => c.id === contactId);
      if (contact) {
        this.openHistoryModal(contact);
      }
    }
  }

  saveQuickStatus() {
    if (!this.quickStatusContactId) return;
    
    this.quickStatusLoading = true;
    
    const selStatus = this.leadStatuses?.find((s: any) => s.name === this.quickStatusData.status);
    if (selStatus) {
      this.quickStatusData.status_id = selStatus.id;
      this.quickStatusData.status_name = selStatus.name;
    }

    const selBranch = this.branches?.find((b: any) => b.name === this.quickStatusData.branch);
    if (selBranch) {
      this.quickStatusData.branch_id = selBranch.id;
      this.quickStatusData.branch_name = selBranch.name;
    } else {
      this.quickStatusData.branch_id = null;
      this.quickStatusData.branch_name = '';
    }

    const selDept = this.departments?.find((d: any) => d.name === this.quickStatusData.department);
    if (selDept) {
      this.quickStatusData.department_id = selDept.id;
      this.quickStatusData.department_name = selDept.name;
    } else {
      this.quickStatusData.department_id = null;
      this.quickStatusData.department_name = '';
    }

    let mappedAssignedTo = null;
    if (this.quickStatusData.assign_type === 'employee' && this.quickStatusData.assigned_employee) {
      const selEmp = this.employees?.find((e: any) => e.name === this.quickStatusData.assigned_employee);
      if (selEmp) {
        mappedAssignedTo = selEmp.id;
      }
    }

    // copy remark to remarks
    this.quickStatusData.remarks = this.quickStatusData.remark;

    let payload: any = { 
      ...this.quickStatusData,
      assigned_to: mappedAssignedTo
    };

    if (this.quickStatusData.status === 'Branch' || this.quickStatusData.status === 'Sales Loss') {
      Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: 'The status has been updated successfully.',
        confirmButtonColor: '#3b82f6'
      });
      this.closeQuickStatusModal();
      return;
    }

    this.quickStatusLoading = true;

    // Support auto assign logic before saving
    let finalAssignedEmployee = this.quickStatusData.assigned_employee;
    if (this.isTransferStatus(this.quickStatusData.status) && this.quickStatusData.assign_type === 'auto') {
      const emps = this.getFilteredEmployees(this.quickStatusData.branch, this.quickStatusData.department);
      if (emps.length > 0) finalAssignedEmployee = emps[0].id;
    }

    const updateData: any = {
      status_id: this.quickStatusData.status_id,
      status_name: this.quickStatusData.status_name,
      remarks: this.quickStatusData.remark,
      follow_up_date: (this.isFollowupStatus(this.quickStatusData.status) && this.quickStatusData.follow_up_date) ? this.quickStatusData.follow_up_date : null,
      loss_reason: this.quickStatusData.status === 'Sales Loss' ? this.quickStatusData.loss_reason : null
    };

    if (this.isTransferStatus(this.quickStatusData.status)) {
      if (this.quickStatusData.branch_id) {
        updateData.branch_id = this.quickStatusData.branch_id;
        updateData.branch_name = this.quickStatusData.branch_name;
      }
      if (this.quickStatusData.department_id) {
        updateData.department_id = this.quickStatusData.department_id;
        updateData.department_name = this.quickStatusData.department_name;
      }
      if (finalAssignedEmployee) {
        updateData.assigned_to = finalAssignedEmployee;
      }
    }

    this.api.put(`/contacts/${this.quickStatusContactId}`, updateData).subscribe({
      next: (res: any) => {
        this.quickStatusLoading = false;
          if (res.success) {
          Swal.fire({
            icon: 'success',
            title: 'Status Updated',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
          });
          
          // Trigger gamification if status is a "success" state
          const gamifiedStatuses = ['sales won', 'converted', 'admitted', 'payment received', 'enrolled', 'visa approved'];
          if (this.quickStatusData.status_name && gamifiedStatuses.includes(this.quickStatusData.status_name.toLowerCase())) {
            this.animationService.triggerConversionSuccess();
          }

          this.closeQuickStatusModal();
          this.loadContacts();
        } else {
          Swal.fire('Error', res.message || 'Failed to update status', 'error');
        }
      },
      error: () => {
        this.quickStatusLoading = false;
        Swal.fire('Error', 'Failed to update status', 'error');
      }
    });
  }

  // ═══════════════════ CALENDAR VIEW ═══════════════════

  toggleViewMode() {
    this.viewMode = this.viewMode === 'list' ? 'calendar' : 'list';
    if (this.viewMode === 'calendar') {
      this.calendarCurrentDate = new Date();
      this.loadCalendarData(true);
    }
  }

  prevCalendarMonth() {
    this.calendarCurrentDate = new Date(this.calendarCurrentDate.getFullYear(), this.calendarCurrentDate.getMonth() - 1, 1);
    this.loadCalendarData(false);
  }

  nextCalendarMonth() {
    this.calendarCurrentDate = new Date(this.calendarCurrentDate.getFullYear(), this.calendarCurrentDate.getMonth() + 1, 1);
    this.loadCalendarData(false);
  }

  loadCalendarData(autoOpenToday: boolean = false) {
    this.calendarLoading = true;
    // We fetch a larger limit to ensure we get most leads for the calendar view. 
    // In a production scenario with millions of leads, we'd want a dedicated endpoint.
    const params: any = { limit: 5000 };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.activeTag) params.tags = this.activeTag;
    if (this.activeChannel) params.channel = this.activeChannel;
    if (this.activeStatus) params.status = this.activeStatus;
    if (this.activeAgent) params.agent = this.activeAgent;
    if (this.transferredOnly) params.transferred_only = true;

    this.api.get('/contacts', params).subscribe({
      next: (res: any) => {
        this.calendarAllLeads = res.data || [];
        this.generateCalendarWeeks();
        this.calendarLoading = false;
      },
      error: () => {
        this.calendarLoading = false;
        Swal.fire('Error', 'Failed to load calendar data', 'error');
      }
    });
  }

  generateCalendarWeeks() {
    const year = this.calendarCurrentDate.getFullYear();
    const month = this.calendarCurrentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let currentDay = new Date(year, month, 1 - firstDay.getDay());
    this.calendarWeeks = [];
    
    const today = new Date();
    const todayY = today.getFullYear();
    const todayM = today.getMonth();
    const todayD = today.getDate();
    
    while (currentDay <= lastDay || currentDay.getDay() !== 0) {
      if (currentDay.getDay() === 0) {
        this.calendarWeeks.push([]);
      }
      
      const y = currentDay.getFullYear();
      const m = String(currentDay.getMonth() + 1).padStart(2, '0');
      const d = String(currentDay.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const leadsOnDay = this.calendarAllLeads.filter(l => {
        if (l.follow_up_date) {
          return l.follow_up_date.startsWith(dateStr);
        }
        if (l.created_at) {
          return l.created_at.startsWith(dateStr);
        }
        return false;
      });
      
      this.calendarWeeks[this.calendarWeeks.length - 1].push({
        date: new Date(currentDay),
        isCurrentMonth: currentDay.getMonth() === month,
        isToday: (y === todayY && currentDay.getMonth() === todayM && currentDay.getDate() === todayD),
        leads: leadsOnDay,
        count: leadsOnDay.length
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
  }

  goToToday() {
    this.calendarCurrentDate = new Date();
    this.loadCalendarData(false);
  }

  openDailyLeadsModal(day: any) {
    if (!day) return;
    this.selectedDailyDate = day.date;
    this.selectedDailyLeads = day.leads || [];
    this.showDailyLeadsModal = true;
  }

  closeDailyLeadsModal() {
    this.showDailyLeadsModal = false;
    this.selectedDailyDate = null;
    this.selectedDailyLeads = [];
  }

}

