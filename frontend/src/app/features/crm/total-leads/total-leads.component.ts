import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { SystemSettingsService } from '../../../core/services/system-settings.service';
import { LeadProfileModalComponent } from '../../../shared/components/lead-profile-modal/lead-profile-modal.component';
import { UpdateLeadStatusModalComponent } from '../../../shared/components/update-lead-status-modal/update-lead-status-modal.component';
import {
  showImpressiveSuccess,
  showLeadCreatedSuccess,
  showLeadUpdatedSuccess,
  showLeadDeletedSuccess,
  showStatusUpdatedSuccess,
  showConfirmDelete,
  showPremiumError,
  showPremiumWarning
} from '../../../core/utils/impressive-alert';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-total-leads',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LeadProfileModalComponent, UpdateLeadStatusModalComponent],
  templateUrl: './total-leads.component.html',
  styleUrls: ['./total-leads.component.css']
})
export class TotalLeadsComponent implements OnInit {

  leads: any[] = [];
  loading = false;

  // Server-side Pagination
  currentPage = 1;
  pageSize = 15;
  totalLeads = 0;
  totalPages = 1;
  pageSizeOptions = [10, 15, 25, 50, 100];

  // Filters & Search
  searchTerm = '';
  activeStatus = '';
  activeFollowup = ''; // '', '1', '0'
  activeAgent = '';
  activePayment = '';  // '', '1', '0'

  // Dynamic Options
  statuses: any[] = [];
  agents: any[] = [];

  // Summary Metrics
  metrics: any = {
    total: 0,
    with_followup: 0,
    without_followup: 0,
    unassigned: 0,
    no_status: 0,
    with_payment: 0,
    total_payment_collected: 0
  };

  // Lead Profile Modal (Supports opening on Receipt/Payment tab or Profile tab)
  showProfileModal = false;
  profileContactId: number | null = null;
  profileInitialTab: string = 'Profile';

  // Quick Follow-up / Status Modal
  showFollowupModal = false;
  followupContactId: number | null = null;
  followupContactName = '';
  followupInitialData: any = null;

  // Fullscreen Add Lead Modal State
  showModal = false;
  showAddLeadModal = false;
  editingContactId: number | null = null;
  savingLead = false;

  newContact: any = {
    name: '',
    phone: '',
    country_code: '+91',
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
    channel_preference: '',
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

  countryCodes: any[] = [];
  selectedCountryCode: string = '+91';

  enquiryFors: any[] = [];
  channels: any[] = [];
  leadStatuses: any[] = [];
  branches: any[] = [];
  departments: any[] = [];
  employees: any[] = [];
  leadFields: any[] = [];
  groupedLeadFields: any[] = [];
  dummyLossReasons: string[] = [
    'Price too high',
    'Chose competitor',
    'Not ready to buy',
    'Timing was off',
    'Invalid contact',
    'Features missing',
    'Other'
  ];
  today: string = new Date().toISOString().split('T')[0];

  private searchDebounceTimer: any;

  constructor(
    private api: ApiService,
    private router: Router,
    private settingsService: SystemSettingsService
  ) {}

  ngOnInit(): void {
    this.loadStatuses();
    this.loadLeadStatuses();
    this.loadAgents();
    this.loadCountryCodes();
    this.loadEnquiryFors();
    this.loadChannels();
    this.loadBranches();
    this.loadDepartments();
    this.loadLeadFields();
    this.loadLeads();
  }

  loadLeads(): void {
    this.loading = true;
    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    };

    if (this.searchTerm && this.searchTerm.trim()) {
      params.search = this.searchTerm.trim();
    }
    if (this.activeStatus) {
      params.status = this.activeStatus;
    }
    if (this.activeFollowup) {
      params.has_followup = this.activeFollowup;
    }
    if (this.activeAgent) {
      params.agent = this.activeAgent;
    }
    if (this.activePayment) {
      params.has_payment = this.activePayment;
    }

    this.api.get('/contacts/total-leads', params).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.leads = (res.data || []).map((lead: any) => ({
            ...lead,
            tags: Array.isArray(lead.tags) ? lead.tags : JSON.parse(lead.tags || '[]')
          }));
          this.totalLeads = res.total || 0;
          this.totalPages = res.totalPages || Math.max(1, Math.ceil(this.totalLeads / this.pageSize));
          if (res.metrics) {
            this.metrics = {
              ...this.metrics,
              ...res.metrics
            };
          }
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Failed to load total leads:', err);
        this.loading = false;
      }
    });
  }

  loadStatuses(): void {
    this.api.get('/system-settings/statuses').subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.statuses = res.data || [];
        }
      },
      error: () => {}
    });
  }

  loadLeadStatuses(): void {
    this.settingsService.getStatuses().subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.leadStatuses = res.data || [];
        }
      },
      error: () => {}
    });
  }

  loadAgents(): void {
    this.api.get('/contacts/agents').subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.agents = res.data;
        } else if (Array.isArray(res)) {
          this.agents = res;
        }
      },
      error: () => {}
    });

    this.api.get('/settings/team').subscribe({
      next: (res: any) => {
        if (res && res.success && Array.isArray(res.data)) {
          this.employees = res.data;
          if (!this.agents || this.agents.length === 0) {
            this.agents = res.data;
          }
        }
      },
      error: () => {}
    });
  }

  loadCountryCodes(): void {
    this.settingsService.getCountryCodes().subscribe({
      next: (res: any) => {
        if (res && res.success && Array.isArray(res.data)) {
          this.countryCodes = res.data;
          const defaultCountry = this.countryCodes.find((c: any) => c.is_default);
          if (defaultCountry && !this.selectedCountryCode) {
            this.selectedCountryCode = defaultCountry.country_code;
          }
        }
      },
      error: (err: any) => {
        console.error('Failed to load country codes:', err);
      }
    });
  }

  loadEnquiryFors(): void {
    this.settingsService.getEnquiryFors().subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.enquiryFors = res.data || [];
        }
      },
      error: () => {}
    });
  }

  loadChannels(): void {
    this.settingsService.getChannels().subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.channels = res.data || [];
        }
      },
      error: () => {}
    });
  }

  loadBranches(): void {
    this.api.get('/system-settings/branches').subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.branches = res.data || [];
        }
      },
      error: () => {}
    });
  }

  loadDepartments(): void {
    this.api.get('/system-settings/departments').subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.departments = res.data || [];
        }
      },
      error: () => {}
    });
  }

  loadLeadFields(): void {
    this.api.get('/settings/lead-fields').subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.leadFields = res.data || [];
          const grouped: any = {};
          this.leadFields.forEach((f: any) => {
            const cat = f.category_name || 'Additional Details';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(f);
          });
          this.groupedLeadFields = Object.keys(grouped).map(catName => ({
            categoryName: catName,
            fields: grouped[catName]
          }));
        }
      },
      error: () => {}
    });
  }

  onSearchChange(): void {
    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.currentPage = 1;
      this.loadLeads();
    }, 350);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadLeads();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadLeads();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.loadLeads();
  }

  hasActiveFilters(): boolean {
    return !!(
      (this.searchTerm && this.searchTerm.trim()) ||
      this.activeStatus ||
      this.activeFollowup ||
      this.activeAgent ||
      this.activePayment
    );
  }

  resetAllFilters(): void {
    this.searchTerm = '';
    this.activeStatus = '';
    this.activeFollowup = '';
    this.activeAgent = '';
    this.activePayment = '';
    this.currentPage = 1;
    this.loadLeads();
  }

  get pages(): number[] {
    const pageList: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pageList.push(i);
    }
    return pageList;
  }

  // --- Lead Profile & Payment Details Interaction ---

  openLeadProfile(lead: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const contactId = lead?.id || lead?.contact_id;
    if (!contactId) return;
    this.profileContactId = contactId;
    this.profileInitialTab = 'Profile';
    this.showProfileModal = true;
  }

  openPaymentDetails(lead: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const contactId = lead?.id || lead?.contact_id;
    if (!contactId) return;
    this.profileContactId = contactId;
    this.profileInitialTab = 'Receipt';
    this.showProfileModal = true;
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
    this.profileContactId = null;
    this.profileInitialTab = 'Profile';
  }

  onContactUpdated(): void {
    this.loadLeads();
  }

  // --- Quick Follow-up Modal ---

  openFollowupModal(lead: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const contactId = lead?.id || lead?.contact_id;
    if (!contactId) return;
    this.followupContactId = contactId;
    this.followupContactName = lead.name || 'Lead';
    this.followupInitialData = lead;
    this.showFollowupModal = true;
  }

  closeFollowupModal(): void {
    this.showFollowupModal = false;
    this.followupContactId = null;
    this.followupContactName = '';
    this.followupInitialData = null;
  }

  openProfileFromFollowup(contactId: number): void {
    this.closeFollowupModal();
    this.profileContactId = contactId;
    this.profileInitialTab = 'Profile';
    this.showProfileModal = true;
  }

  // --- Add Lead Modal Logic ---

  openAddModal(): void {
    this.editingContactId = null;
    this.loadChannels();
    this.selectedCountryCode = '+91';
    this.newContact = {
      name: '',
      phone: '',
      country_code: '+91',
      email: '',
      address: '',
      company: '',
      enquiry_for_id: null,
      status: '',
      remark: '',
      follow_up_date: '',
      tags: 'lead',
      channel_preference: '',
      assigned_to: '',
      branch: '',
      department: '',
      assign_type: 'employee',
      assigned_employee: '',
      loss_reason: '',
      custom_field_values: {}
    };
    if (this.leadFields && this.leadFields.length) {
      this.leadFields.forEach((f: any) => {
        this.newContact.custom_field_values[f.id] = '';
      });
    }
    this.showModal = true;
    this.showAddLeadModal = true;
  }

  closeAddModal(): void {
    this.showModal = false;
    this.showAddLeadModal = false;
    this.editingContactId = null;
  }

  openAddLeadModal(): void {
    this.openAddModal();
  }

  closeAddLeadModal(): void {
    this.closeAddModal();
  }

  saveContact(): void {
    if (!this.newContact.name || !this.newContact.phone) {
      showPremiumWarning('Missing Fields', 'Name and Phone are required.');
      return;
    }

    if (!this.newContact.status) {
      showPremiumWarning('Missing Fields', 'Status is required.');
      return;
    }

    if (this.isTransferStatus(this.newContact.status)) {
      if (!this.newContact.branch || !this.newContact.department || !this.newContact.assigned_employee) {
        showPremiumWarning('Missing Fields', 'Branch, Department, and Employee are required for this status.');
        return;
      }
    }

    // Phone cleaning & validation
    const rawCleanPhone = (this.newContact.phone || '').toString().replace(/\s+/g, '');
    const numericPhone = rawCleanPhone.replace(/\D/g, '');

    if (this.selectedCountryCode === '+91') {
      if (numericPhone.length === 9) {
        showPremiumWarning(
          'Invalid Phone Number',
          'The phone number contains only 9 digits. India (+91) requires a valid 10-digit mobile number.'
        );
        return;
      }
      if (numericPhone.length !== 10) {
        showPremiumWarning(
          'Invalid Phone Number',
          `Phone number must be exactly 10 digits for India (+91). You entered ${numericPhone.length} digits.`
        );
        return;
      }
    } else {
      const expectedLen = this.getSelectedCountryLength();
      if (expectedLen && numericPhone.length !== expectedLen) {
        showPremiumWarning(
          'Invalid Phone Number',
          `Phone number must be ${expectedLen} digits for ${this.selectedCountryCode}. You entered ${numericPhone.length} digits.`
        );
        return;
      } else if (numericPhone.length < 7 || numericPhone.length > 15) {
        showPremiumWarning(
          'Invalid Phone Number',
          'Phone number must be between 7 and 15 digits.'
        );
        return;
      }
    }

    this.newContact.phone = numericPhone;
    this.newContact.country_code = this.selectedCountryCode;

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

    const payload: any = {
      ...this.newContact,
      follow_up_date: this.newContact.follow_up_date || null,
      tags: this.newContact.tags ? this.newContact.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : [],
      custom_field_values: this.newContact.custom_field_values
    };

    const leadName = this.newContact.name || 'Lead';
    this.savingLead = true;

    this.api.post('/contacts', payload).subscribe({
      next: (res: any) => {
        this.savingLead = false;
        if (res && res.success) {
          this.closeAddModal();
          showLeadCreatedSuccess(leadName);
          this.loadLeads();
        }
      },
      error: (err: any) => {
        this.savingLead = false;
        const isDuplicate = err.status === 409;
        showPremiumError(
          isDuplicate ? 'Duplicate Contact' : 'Failed to Save Lead',
          err.error?.message || 'Error saving lead'
        );
      }
    });
  }

  isTransferStatus(statusName: string): boolean {
    if (!statusName) return false;
    const found = this.leadStatuses.find((s: any) => s.name === statusName);
    if (!found) return false;
    const tr = found.transfer;
    return tr === true || tr === 1 || String(tr).toLowerCase() === 'true' || String(tr) === '1' || String(tr).toLowerCase() === 'yes';
  }

  isFollowupStatus(statusName: string): boolean {
    if (!statusName) return false;
    const found = this.leadStatuses.find((s: any) => s.name === statusName);
    if (!found) return false;
    const fn = found.follow_needed;
    return fn === 'Yes' || fn === true || fn === 1 || String(fn).toLowerCase() === 'yes' || String(fn).toLowerCase() === 'true' || String(fn) === '1';
  }

  getFilteredDepartments(branchName: string): any[] {
    if (!branchName) return [];
    const branch = this.branches.find((b: any) => b.name === branchName);
    if (!branch) return [];
    return this.departments.filter((d: any) => d.branch_id === branch.id);
  }

  getFilteredEmployees(branchName: string, departmentName: string): any[] {
    if (!branchName || !departmentName) return [];
    return this.employees.filter((e: any) => e.branch_name === branchName && e.department_name === departmentName);
  }

  isChannelInList(name: string): boolean {
    if (!name || !this.channels) return false;
    return this.channels.some((c: any) => c.name?.toLowerCase() === name.toLowerCase());
  }

  allowOnlyDigits(event: KeyboardEvent): boolean {
    if (event.ctrlKey || event.metaKey) return true;
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  onPhonePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const clipboardData = event.clipboardData || (window as any).clipboardData;
    const pastedText = clipboardData ? clipboardData.getData('text') : '';
    this.handlePastedPhone(pastedText);
  }

  handlePastedPhone(rawText: string): void {
    if (!rawText) return;
    let cleaned = rawText.replace(/\s+/g, '').trim();

    if (cleaned.startsWith('+')) {
      for (const cc of this.countryCodes) {
        if (cleaned.startsWith(cc.country_code)) {
          this.selectedCountryCode = cc.country_code;
          this.newContact.country_code = cc.country_code;
          cleaned = cleaned.slice(cc.country_code.length);
          break;
        }
      }
    }

    if (this.selectedCountryCode === '+91' && cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = cleaned.slice(1);
    }

    const digits = cleaned.replace(/\D/g, '');
    const maxLen = this.getSelectedCountryLength();
    this.newContact.phone = maxLen ? digits.slice(0, maxLen) : digits;
  }

  onPhoneInput(event: any): void {
    const input = event.target as HTMLInputElement;
    let val = (input.value || '').replace(/\s+/g, '');

    if (val.startsWith('+')) {
      for (const cc of this.countryCodes) {
        if (val.startsWith(cc.country_code)) {
          this.selectedCountryCode = cc.country_code;
          this.newContact.country_code = cc.country_code;
          val = val.slice(cc.country_code.length);
          break;
        }
      }
    }

    if (this.selectedCountryCode === '+91' && val.startsWith('0') && val.length === 11) {
      val = val.slice(1);
    }

    const digits = val.replace(/\D/g, '');
    const maxLen = this.getSelectedCountryLength();
    this.newContact.phone = maxLen ? digits.slice(0, maxLen) : digits;
    input.value = this.newContact.phone;
  }

  getSelectedCountryLength(): number {
    const found = this.countryCodes.find((c: any) => c.country_code === this.selectedCountryCode);
    return found?.phone_length || 10;
  }

  // --- UI Formatters ---

  getLeadInitials(name: string): string {
    if (!name) return 'L';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }

  getAvatarColor(id: number | undefined): string {
    const colors = [
      'avatar-blue',
      'avatar-emerald',
      'avatar-violet',
      'avatar-amber',
      'avatar-pink',
      'avatar-cyan'
    ];
    return colors[(id || 0) % colors.length];
  }

  getStatusColor(statusName: string): string {
    if (!statusName) return '#94a3b8';
    const s = statusName.trim().toLowerCase();
    const map: Record<string, string> = {
      'new': '#3b82f6',
      'pending': '#6366f1',
      'interested': '#0ea5e9',
      'contacted': '#8b5cf6',
      'follow up': '#f59e0b',
      'won': '#10b981',
      'converted': '#10b981',
      'lost': '#ef4444',
      'not interested': '#f43f5e',
      'admitted': '#059669',
      'enrolled': '#047857'
    };
    return map[s] || '#6366f1';
  }

  getEmployeeName(agentId: any): string {
    if (!agentId) return 'Unassigned';
    const found = this.agents.find(a => String(a.id) === String(agentId));
    return found ? found.name : `Agent #${agentId}`;
  }
}
