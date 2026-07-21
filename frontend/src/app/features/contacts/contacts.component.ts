import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ApplicationsService } from '../../core/services/applications.service';
import { SystemSettingsService } from '../../core/services/system-settings.service';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

import { ChatModalComponent } from '../shared/chat-modal/chat-modal.component';
import { TimelineComponent } from './components/timeline/timeline.component';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatModalComponent, TimelineComponent],
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
  editingContactId: number | null = null;
  agents: any[] = [];
  isAdmin = false;
  openDropdownId: number | null = null;
  showImportExportDropdown = false;

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

  get today(): string {
    return new Date().toISOString().split('T')[0];
  }

  constructor(
    private api: ApiService, 
    private router: Router, 
    private auth: AuthService,
    private appsService: ApplicationsService,
    private settingsService: SystemSettingsService
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
    const found = this.leadStatuses.find(s => s.name === statusName);
    return found ? !!found.transfer : false;
  }

  /** Returns true if the given status name has follow_needed='Yes' in DB */
  isFollowupStatus(statusName: string): boolean {
    const found = this.leadStatuses.find(s => s.name === statusName);
    return found ? (found.follow_needed === 'Yes' || found.follow_needed === true || found.follow_needed === 1) : false;
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
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.activeTag) params.tags = this.activeTag;
    if (this.activeChannel) params.channel = this.activeChannel;
    if (this.activeStatus) params.status = this.activeStatus;
    if (this.activeAgent) params.agent = this.activeAgent;
    
    this.api.get('/contacts', params).subscribe({
      next: (res: any) => {
        this.contacts = res.data.map((c: any) => ({
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

  onSearch() {
    this.currentPage = 1;
    this.loadContacts();
  }

  // Pagination methods
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
            tags: Array.isArray(res.data.tags) ? res.data.tags : JSON.parse(res.data.tags || '[]'),
            aiScore: Math.floor(Math.random() * 30) + 70, // 70-99
            leadSource: ['Facebook', 'Website Form', 'WhatsApp', 'Instagram'][Math.floor(Math.random() * 4)],
            interestedProducts: ['Software License', 'Annual Maintenance', 'Consulting', 'Hardware Bundle'][Math.floor(Math.random() * 4)]
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
    this.dummyTimeline = [
      { date: new Date(Date.now() - 86400000 * 5), type: 'created', title: 'Lead Created', desc: 'Sourced from ' + this.selectedContact.leadSource },
      { date: new Date(Date.now() - 86400000 * 4), type: 'call', title: 'Initial Discovery Call', desc: 'Discussed requirements for ' + this.selectedContact.interestedProducts },
      { date: new Date(Date.now() - 86400000 * 2), type: 'quote', title: 'Quotation Created', desc: 'Quote #QT-2026-041 sent' },
      { date: new Date(Date.now() - 86400000 * 1), type: 'status', title: 'Status Changed', desc: 'Moved to Interested' }
    ];
    this.dummyQuotations = [
      { id: 'QT-2026-041', amount: 15400, date: new Date(Date.now() - 86400000 * 2), status: 'Sent' },
      { id: 'QT-2026-012', amount: 9800, date: new Date(Date.now() - 86400000 * 15), status: 'Rejected' }
    ];
    this.dummyPOs = [
      { id: 'PO-99125', amount: 12500, date: new Date(Date.now() - 86400000 * 2), status: 'Review' },
      { id: 'PO-99124', amount: 9800, date: new Date(Date.now() - 86400000 * 14), status: 'Rejected' },
      { id: 'PO-98001', amount: 45000, date: new Date(Date.now() - 86400000 * 30), status: 'Approved' },
      { id: 'PO-97555', amount: 8200, date: new Date(Date.now() - 86400000 * 45), status: 'Price Modified' }
    ];
    this.dummyNotes = [
      { author: 'Sales Team', date: new Date(Date.now() - 86400000 * 4), content: 'Client is very focused on delivery timelines. Needs to be expedited if possible.' },
      { author: 'Admin User', date: new Date(Date.now() - 86400000 * 10), content: 'Requested demo of the new product line.' }
    ];
    this.dummyActivities = [
      { type: 'followup', title: 'Follow-up Call', dueDate: new Date(Date.now() + 86400000 * 2), priority: 'High', status: 'Pending' },
      { type: 'meeting', title: 'Product Demo', dueDate: new Date(Date.now() + 86400000 * 5), priority: 'Medium', status: 'Scheduled' }
    ];
    this.dummyHistory = [
      { type: 'call', date: new Date(Date.now() - 86400000 * 4), direction: 'outbound', duration: '5m 23s', note: 'Discussed initial requirements and pricing.' },
      { type: 'email', date: new Date(Date.now() - 86400000 * 3), direction: 'outbound', subject: 'Product Catalog', content: 'Sent the latest product catalog PDF as requested.' },
      { type: 'meeting', date: new Date(Date.now() - 86400000 * 2), direction: 'inbound', duration: '45m', note: 'In-person meeting at their office. Very positive.' },
      { type: 'call', date: new Date(Date.now() - 86400000 * 1), direction: 'inbound', duration: '2m 10s', note: 'Client called to confirm they received the quote.' }
    ];
  }

  closeDetailPanel() {
    this.showDetailPanel = false;
    this.selectedContact = null;
    this.selectedContactApplications = [];
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
    this.showAddApplicationModal = true;
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
            Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Application updated' });
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
            Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Application created' });
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
              Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Application deleted' });
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
          Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Status updated' });
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
      this.currentLead.follow_up_date = new Date(this.currentLead.follow_up_date).toISOString().split('T')[0];
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
            Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Lead updated' });
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
            Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Lead created' });
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
              Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Lead deleted' });
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
        }
      },
      error: (err: any) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.message || 'Error saving contact',
          confirmButtonColor: '#ef4444'
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

            Swal.fire({
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 3000,
              icon: 'success',
              title: 'Lead deleted successfully.'
            });
            
            // Optionally reload tags or pagination if needed, but the list is updated.
          },
          error: (err: any) => {
            Swal.fire('Error', err.error?.message || 'Failed to delete lead', 'error');
          }
        });
      }
    });
  }

  exportContacts() {
    window.open(`${this.api.apiUrl}/contacts/export`, '_blank');
  }

  importContacts(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    this.api.post('/contacts/import', formData).subscribe({
      next: (res: any) => {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: res.message,
          confirmButtonColor: '#10B981',
          timer: 2000,
          showConfirmButton: false
        });
        this.loadContacts();
        this.loadTags();
      },
      error: (err: any) => {
        Swal.fire({
          icon: 'error',
          title: 'Import Failed',
          text: err.error?.message || 'Error importing contacts',
          confirmButtonColor: '#ef4444'
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
      remark: contact.latest_remark || '',
      remarks: contact.latest_remark || '',
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
  }

  openContactDetailFromQuickStatus() {
    const contactId = this.quickStatusContactId;
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
      follow_up_date: this.isFollowupStatus(this.quickStatusData.status) ? this.quickStatusData.follow_up_date : null,
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
  }}
