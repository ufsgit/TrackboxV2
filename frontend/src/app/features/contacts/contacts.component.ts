import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

import { ChatModalComponent } from '../shared/chat-modal/chat-modal.component';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatModalComponent],
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.css']
})
export class ContactsComponent implements OnInit {
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
  quickStatusData = {
    status: '',
    remark: '',
    follow_up_date: '',
    branch: '',
    department: '',
    assign_type: 'auto',
    assigned_employee: '',
    loss_reason: ''
  };

  // Embedded Chat Modal
  showChatModal = false;
  activeChatContactId: number | null = null;
  activeChatConvoId: number | null = null;

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
  dummyDocuments: any[] = [];
  dummyNotes: any[] = [];
  dummyActivities: any[] = [];
  dummyHistory: any[] = [];

  dummyBranches = ['Head Office', 'North Branch', 'South Branch', 'East Branch', 'West Branch'];
  dummyDepartments = ['Sales', 'Marketing', 'Support', 'IT', 'HR'];
  dummyEmployees = ['Alice Smith', 'Bob Johnson', 'Charlie Brown', 'David Lee', 'Eva Green'];
  dummyLossReasons = ['Price too high', 'Bought from competitor', 'No longer needed', 'Missing features', 'Poor communication'];

  // Custom fields from Settings
  leadFields: any[] = [];

  newContact: any = {
    name: '',
    phone: '',
    email: '',
    address: '',
    status: '',
    remark: '',
    follow_up_date: '',
    tags: 'lead',
    channel_preference: 'whatsapp',
    assigned_to: '',
    branch: '',
    department: '',
    assign_type: 'auto',
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

  constructor(private api: ApiService, private router: Router, private auth: AuthService) {}

  ngOnInit() {
    this.isAdmin = this.auth.hasRole('admin', 'superadmin');
    this.loadContacts();
    this.loadTags();
    this.loadLeadFields();
    if (this.isAdmin) this.loadAgents();
  }

  loadAgents() {
    this.api.get('/settings/team').subscribe({
      next: (res: any) => this.agents = res.data.filter((u: any) => u.role === 'agent')
    });
  }

  loadLeadFields() {
    this.api.get('/settings/lead-fields').subscribe({
      next: (res: any) => {
        if (res.success) this.leadFields = res.data;
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
    this.dummyDocuments = [
      { name: 'Company_Profile.pdf', type: 'pdf', size: '2.4 MB' },
      { name: 'Requirements_Doc.docx', type: 'doc', size: '1.1 MB' },
      { name: 'Site_Photos.zip', type: 'zip', size: '14.5 MB' }
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

  // ── History Modal ──────────────────────────────────────────────────────────

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
      name: '', phone: '', email: '', address: '',
      status: '', remark: '', follow_up_date: '',
      tags: 'lead', channel_preference: 'whatsapp', assigned_to: '',
      branch: '', department: '', assign_type: 'auto', assigned_employee: '', loss_reason: '',
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
      status: contact.status || '',
      remark: contact.remark || '',
      follow_up_date: contact.follow_up_date ? new Date(contact.follow_up_date).toISOString().split('T')[0] : '',
      tags: tagsArray.join(', '),
      channel_preference: contact.channel_preference || 'whatsapp',
      assigned_to: contact.assigned_to || '',
      branch: contact.branch || '',
      department: contact.department || '',
      assign_type: contact.assign_type || 'auto',
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

    const payload = {
      ...this.newContact,
      tags: this.newContact.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t),
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

  deleteContact(id: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.delete(`/contacts/${id}`).subscribe({
          next: () => {
            this.loadContacts();
            this.loadTags();
            Swal.fire('Deleted!', 'Contact has been deleted.', 'success');
          },
          error: (err: any) => {
            Swal.fire('Error', err.error?.message || 'Failed to delete contact', 'error');
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
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.message || 'Error opening chat',
          confirmButtonColor: '#ef4444'
        });
      }
    });
  }

  // ═══════════════════ QUICK STATUS MODAL ═══════════════════

  openQuickStatusModal(contact: any) {
    this.quickStatusContactId = contact.id;
    this.quickStatusData = {
      status: contact.status || '',
      remark: contact.remark || '',
      follow_up_date: contact.follow_up_date ? new Date(contact.follow_up_date).toISOString().split('T')[0] : '',
      branch: contact.branch || '',
      department: contact.department || '',
      assign_type: contact.assign_type || 'auto',
      assigned_employee: contact.assigned_employee || '',
      loss_reason: contact.loss_reason || ''
    };
    this.showQuickStatusModal = true;
  }

  closeQuickStatusModal() {
    this.showQuickStatusModal = false;
    this.quickStatusContactId = null;
  }

  saveQuickStatus() {
    if (!this.quickStatusContactId) return;
    
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

    // We can use the existing update API endpoint. We only pass the fields we want to update.
    const updateData = {
      status: this.quickStatusData.status,
      remark: this.quickStatusData.remark,
      follow_up_date: this.quickStatusData.status === 'Interested' ? this.quickStatusData.follow_up_date : null,
      branch: this.quickStatusData.status === 'Branch' ? this.quickStatusData.branch : null,
      department: this.quickStatusData.status === 'Branch' ? this.quickStatusData.department : null,
      assign_type: this.quickStatusData.status === 'Branch' ? this.quickStatusData.assign_type : null,
      assigned_employee: this.quickStatusData.status === 'Branch' && this.quickStatusData.assign_type === 'employee' ? this.quickStatusData.assigned_employee : null,
      loss_reason: this.quickStatusData.status === 'Sales Loss' ? this.quickStatusData.loss_reason : null
    };

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
