import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ApplicationsService } from '../../../core/services/applications.service';
import { ReceiptsService } from '../../../core/services/receipts.service';
import { SystemSettingsService } from '../../../core/services/system-settings.service';
import { CourseService } from '../../../core/services/course.service';
import { AuthService } from '../../../core/services/auth.service';
import { TimelineComponent } from '../../../features/contacts/components/timeline/timeline.component';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lead-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TimelineComponent],
  templateUrl: './lead-profile-modal.component.html',
  styleUrls: ['./lead-profile-modal.component.css']
})
export class LeadProfileModalComponent implements OnInit, OnChanges {
  @Input() contactId: number | null = null;
  @Input() isOpen: boolean = false;
  @Input() initialFollowupData: any = null;
  @Input() initialTab: string = 'Profile';
  @Output() close = new EventEmitter<void>();
  @Output() contactUpdated = new EventEmitter<void>();

  baseUrl = environment.socketUrl;
  selectedContact: any = null;
  detailLoading = false;
  detailActiveTab = 'Profile';

  // Applications Tab
  selectedContactApplications: any[] = [];
  loadingApplications = false;
  showAddApplicationModal = false;
  savingApplication = false;
  currentApplication: any = {
    id: null,
    contact_id: null,
    country: 'New Zealand',
    university: '',
    course: '',
    intake_id: '',
    year_id: '',
    status_id: '',
    description: ''
  };
  appStatuses: any[] = [];
  universities: any[] = [];
  courses: any[] = [];
  intakes: any[] = [];
  years: any[] = [];
  selectedCourseDetails: any = null;

  // Documents Tab
  contactDocuments: any[] = [];
  loadingDocuments = false;
  showUploadDocumentModal = false;
  uploadDocData: any = {
    documentType: '',
    file: null,
    fileName: '',
    notes: ''
  };
  documentOptions: string[] = [
    'Passport',
    'Academic Transcript',
    'IELTS / PTE Scorecard',
    'Statement of Purpose (SOP)',
    'Letter of Recommendation (LOR)',
    'Resume / CV',
    'Financial Documents',
    'Offer Letter',
    'Visa Application / Receipt',
    'Other'
  ];

  // Receipts Tab
  selectedContactReceipts: any[] = [];
  loadingReceipts = false;
  showAddReceiptModal = false;
  savingReceipt = false;
  currentReceipt: any = {
    id: null,
    receipt_type_id: '',
    receipt_type_name: '',
    amount: '',
    receipt_date: '',
    description: ''
  };
  receiptTypes: any[] = [];
  totalReceiptAmount = 0;

  // Qualifications Tab
  selectedContactQualifications: any[] = [];
  loadingQualifications = false;
  showAddQualificationModal = false;
  savingQualification = false;
  currentQualification: any = {
    id: null,
    qualification: '',
    institution: '',
    completion_year: '',
    percentage_cgpa: '',
    backlogs: '0',
    study_gap: '',
    is_highest: 0,
    sort_order: 0
  };

  // Work Experience Tab
  selectedContactExperiences: any[] = [];
  loadingExperiences = false;
  showAddExperienceModal = false;
  savingExperience = false;
  currentExperience: any = {
    id: null,
    employer: '',
    position: '',
    experience: '',
    from_date: '',
    to_date: '',
    is_current: 0,
    sort_order: 0
  };

  // Edit Lead Modal State
  showEditModal: boolean = false;
  savingEdit: boolean = false;
  countryCodes: any[] = [];
  selectedCountryCode: string = '+91';
  enquiryFors: any[] = [];
  channels: any[] = [];
  leadFields: any[] = [];
  groupedLeadFields: any[] = [];
  today: string = new Date().toISOString().split('T')[0];

  editForm: any = {
    name: '',
    phone: '',
    country_code: '+91',
    email: '',
    tags: '',
    enquiry_for_id: null,
    channel_preference: '',
    address: '',
    custom_field_values: {} as Record<string, string>
  };
  leadStatuses: any[] = [];
  agentsList: any[] = [];

  constructor(
    private api: ApiService,
    private appsService: ApplicationsService,
    private receiptsService: ReceiptsService,
    private settingsService: SystemSettingsService,
    private courseService: CourseService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadAppStatuses();
    this.loadUniversities();
    this.loadCourses();
    this.loadIntakes();
    this.loadYears();
    this.loadReceiptTypes();
    this.loadEditOptions();
    this.loadCountryCodes();
    this.loadEnquiryFors();
    this.loadChannels();
    this.loadLeadFields();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen && this.contactId) {
      this.detailActiveTab = this.initialTab || 'Profile';
      this.loadContactDetails();
      this.loadApplications();
      this.loadDocuments();
      this.loadReceipts();
      this.loadQualifications();
      this.loadExperiences();
    }
  }

  // --- Core Contact Details ---

  loadContactDetails() {
    if (!this.contactId) return;
    this.detailLoading = true;
    this.api.get(`/contacts/${this.contactId}`).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          const c = res.data;
          c.tags = Array.isArray(c.tags) ? c.tags : JSON.parse(c.tags || '[]');
          if (c.custom_fields && typeof c.custom_fields === 'string') {
            try { c.custom_fields = JSON.parse(c.custom_fields); } catch(e) {}
          }
          this.selectedContact = c;
        }
        this.detailLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading contact details:', err);
        this.detailLoading = false;
      }
    });
  }

  closeModal() {
    this.isOpen = false;
    this.showEditModal = false;
    this.showAddApplicationModal = false;
    this.showUploadDocumentModal = false;
    this.showAddReceiptModal = false;
    this.selectedContact = null;
    this.close.emit();
  }

  formatFieldValue(field: any): string {
    if (!field || field.value === undefined || field.value === null) return '';
    if (Array.isArray(field.value)) return field.value.join(', ');
    return String(field.value);
  }

  // --- Lookup Data Loaders ---

  loadAppStatuses() {
    this.api.get('/applications/statuses').subscribe({
      next: (res: any) => {
        if (res && res.success) this.appStatuses = res.data || [];
      },
      error: () => {}
    });
  }

  loadUniversities() {
    this.settingsService.getUniversities().subscribe({
      next: (res: any) => {
        if (res && res.success) this.universities = res.data || [];
      },
      error: () => {}
    });
  }

  loadCourses() {
    this.courseService.getCourses().subscribe({
      next: (res: any) => {
        if (res && res.success) this.courses = res.data || [];
      },
      error: () => {}
    });
  }

  loadIntakes() {
    this.settingsService.getIntakes().subscribe({
      next: (res: any) => {
        if (res && res.success) this.intakes = res.data || [];
      },
      error: () => {}
    });
  }

  loadYears() {
    this.settingsService.getYears().subscribe({
      next: (res: any) => {
        if (res && res.success) this.years = res.data || [];
      },
      error: () => {}
    });
  }

  loadReceiptTypes() {
    this.receiptsService.getReceiptTypes().subscribe({
      next: (res: any) => {
        if (res && res.success) this.receiptTypes = res.data || [];
      },
      error: () => {}
    });
  }

  loadEditOptions() {
    this.api.get('/system-settings/statuses').subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.leadStatuses = res.data || [];
        }
      },
      error: () => {}
    });

    this.api.get('/settings/team').subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.agentsList = res.data;
        } else if (Array.isArray(res)) {
          this.agentsList = res;
        }
      },
      error: () => {
        this.api.get('/contacts/agents').subscribe({
          next: (res: any) => {
            if (res && res.data) this.agentsList = res.data;
          },
          error: () => {}
        });
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

  isChannelInList(name: string): boolean {
    if (!name || !this.channels) return false;
    return this.channels.some((c: any) => c.name?.toLowerCase() === name.toLowerCase());
  }

  // --- Top Actions: WhatsApp Message, Email, Edit, Delete ---

  goToChat() {
    if (!this.selectedContact) return;
    const phone = (this.selectedContact.phone || '').toString().replace(/\D/g, '');
    if (!phone) {
      Swal.fire({
        icon: 'warning',
        title: 'No Phone Number',
        text: 'This lead does not have a valid phone number recorded for messaging.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    this.api.post('/conversations', { 
      contact_id: this.selectedContact.id, 
      channel: this.selectedContact.channel_preference || 'whatsapp' 
    }).subscribe({
      next: () => {},
      error: () => {}
    });

    window.open(`https://wa.me/${phone}`, '_blank');
  }

  sendMail() {
    if (!this.selectedContact) return;
    const email = (this.selectedContact.email || '').trim();
    if (!email || email === '—' || email === '-') {
      Swal.fire({
        icon: 'warning',
        title: 'No Email Address',
        text: `${this.selectedContact.name || 'This lead'} does not have a valid email address recorded.`,
        confirmButtonColor: '#3b82f6'
      });
      return;
    }
    window.location.href = `mailto:${email}?subject=Follow-up with ${encodeURIComponent(this.selectedContact.name || '')}`;
  }

  loadCountryCodes() {
    this.settingsService.getCountryCodes().subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.countryCodes = res.data || [];
          const def = this.countryCodes.find((c: any) => c.is_default);
          if (def && !this.selectedCountryCode) {
            this.selectedCountryCode = def.country_code;
          }
        }
      },
      error: () => {}
    });
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
          this.editForm.country_code = cc.country_code;
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
    this.editForm.phone = maxLen ? digits.slice(0, maxLen) : digits;
  }

  onPhoneInput(event: any): void {
    const input = event.target as HTMLInputElement;
    let val = (input.value || '').replace(/\s+/g, '');

    if (val.startsWith('+')) {
      for (const cc of this.countryCodes) {
        if (val.startsWith(cc.country_code)) {
          this.selectedCountryCode = cc.country_code;
          this.editForm.country_code = cc.country_code;
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
    this.editForm.phone = maxLen ? digits.slice(0, maxLen) : digits;
    input.value = this.editForm.phone;
  }

  getSelectedCountryLength(): number {
    const found = this.countryCodes.find(c => c.country_code === this.selectedCountryCode);
    return found?.phone_length || 10;
  }

  openEdit() {
    if (!this.selectedContact) return;
    this.loadChannels();
    this.loadEnquiryFors();
    this.loadLeadFields();
    this.loadCountryCodes();

    let phone = (this.selectedContact.phone || '').toString().replace(/\s+/g, '');
    let countryCode = this.selectedContact.country_code || '+91';

    if (phone.startsWith('+')) {
      for (const cc of this.countryCodes) {
        if (phone.startsWith(cc.country_code)) {
          countryCode = cc.country_code;
          phone = phone.slice(cc.country_code.length);
          break;
        }
      }
    }
    phone = phone.replace(/\D/g, '');
    this.selectedCountryCode = countryCode;

    const tagsArray = Array.isArray(this.selectedContact.tags)
      ? this.selectedContact.tags
      : (typeof this.selectedContact.tags === 'string' && this.selectedContact.tags.startsWith('['))
        ? JSON.parse(this.selectedContact.tags || '[]')
        : (this.selectedContact.tags ? [this.selectedContact.tags] : []);

    this.editForm = {
      name: this.selectedContact.name || '',
      phone: phone,
      country_code: countryCode,
      email: this.selectedContact.email || '',
      tags: tagsArray.join(', '),
      enquiry_for_id: this.selectedContact.enquiry_for_id || null,
      channel_preference: this.selectedContact.channel_preference || '',
      address: this.selectedContact.address || '',
      custom_field_values: {} as Record<string, string>
    };

    if (this.selectedContact.custom_fields && Array.isArray(this.selectedContact.custom_fields)) {
      this.selectedContact.custom_fields.forEach((f: any) => {
        this.editForm.custom_field_values[f.field_id || f.id] = f.value || '';
      });
    } else {
      this.leadFields.forEach(f => {
        this.editForm.custom_field_values[f.id] = '';
      });
      if (this.selectedContact.id) {
        this.api.get(`/contacts/${this.selectedContact.id}`).subscribe({
          next: (res: any) => {
            if (res && res.success && res.data?.custom_fields) {
              res.data.custom_fields.forEach((f: any) => {
                this.editForm.custom_field_values[f.field_id || f.id] = f.value || '';
              });
            }
          }
        });
      }
    }

    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
  }

  saveEdit() {
    if (!this.selectedContact?.id) return;
    if (!this.editForm.name || !this.editForm.name.trim() || !this.editForm.phone) {
      Swal.fire('Validation Error', 'Full Name and Phone are required.', 'warning');
      return;
    }

    const rawCleanPhone = (this.editForm.phone || '').toString().replace(/\s+/g, '');
    const numericPhone = rawCleanPhone.replace(/\D/g, '');

    if (this.selectedCountryCode === '+91') {
      if (numericPhone.length === 9) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Phone Number',
          text: 'The phone number contains only 9 digits. India (+91) requires a valid 10-digit mobile number.',
          confirmButtonColor: '#3b82f6'
        });
        return;
      }
      if (numericPhone.length !== 10) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Phone Number',
          text: `Phone number must be exactly 10 digits for India (+91). You entered ${numericPhone.length} digits.`,
          confirmButtonColor: '#3b82f6'
        });
        return;
      }
    } else {
      const expectedLen = this.getSelectedCountryLength();
      if (expectedLen && numericPhone.length !== expectedLen) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Phone Number',
          text: `Phone number must be ${expectedLen} digits for ${this.selectedCountryCode}. You entered ${numericPhone.length} digits.`,
          confirmButtonColor: '#3b82f6'
        });
        return;
      } else if (numericPhone.length < 7 || numericPhone.length > 15) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Phone Number',
          text: 'Phone number must be between 7 and 15 digits.',
          confirmButtonColor: '#3b82f6'
        });
        return;
      }
    }

    const payload: any = {
      name: this.editForm.name.trim(),
      phone: numericPhone,
      country_code: this.selectedCountryCode,
      email: this.editForm.email || null,
      tags: this.editForm.tags ? this.editForm.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : [],
      channel_preference: this.editForm.channel_preference || null,
      enquiry_for_id: this.editForm.enquiry_for_id || null,
      address: this.editForm.address || null,
      custom_field_values: this.editForm.custom_field_values,
      is_follow_up: false
    };

    this.savingEdit = true;
    this.api.put(`/contacts/${this.selectedContact.id}`, payload).subscribe({
      next: () => {
        this.savingEdit = false;
        this.showEditModal = false;
        Swal.fire({
          icon: 'success',
          title: 'Lead Updated',
          text: 'Lead details have been updated successfully.',
          timer: 1500,
          showConfirmButton: false
        });
        this.loadContactDetails();
        this.contactUpdated.emit();
      },
      error: (err: any) => {
        this.savingEdit = false;
        Swal.fire('Error', err.error?.message || 'Failed to update lead', 'error');
      }
    });
  }

  deleteContact() {
    if (!this.selectedContact) return;
    Swal.fire({
      title: 'Delete Lead?',
      text: `Are you sure you want to delete lead "${this.selectedContact.name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.delete(`/contacts/${this.selectedContact.id}`).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Lead has been deleted.',
              timer: 1500,
              showConfirmButton: false
            });
            this.contactUpdated.emit();
            this.closeModal();
          },
          error: (err: any) => Swal.fire('Error', err.error?.message || 'Failed to delete lead', 'error')
        });
      }
    });
  }

  // --- APPLICATION TAB FUNCTIONALITY ---

  loadApplications() {
    if (!this.contactId) return;
    this.loadingApplications = true;
    this.appsService.getApplications(this.contactId).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.selectedContactApplications = res.data || [];
        }
        this.loadingApplications = false;
      },
      error: () => { this.loadingApplications = false; }
    });
  }

  getSelectedAppStatusColor(): string {
    if (!this.currentApplication?.status_id) return '#94a3b8';
    const s = this.appStatuses.find((x: any) => x.id == this.currentApplication.status_id);
    return s?.color || '#6366f1';
  }

  getSelectedAppStatusName(): string {
    if (!this.currentApplication?.status_id) return 'Not Selected';
    const s = this.appStatuses.find((x: any) => x.id == this.currentApplication.status_id);
    return s?.name || 'Not Selected';
  }

  onCourseSelect(): void {
    const course = this.courses.find(c => c.name === this.currentApplication.course);
    this.selectedCourseDetails = course || null;
  }

  isUniversityInList(name: string): boolean {
    if (!name || !this.universities) return true;
    return this.universities.some(u => u.name && u.name.toLowerCase() === name.toLowerCase());
  }

  openAddApplicationModal() {
    this.currentApplication = {
      id: null,
      contact_id: this.contactId || this.selectedContact?.id,
      country: 'New Zealand',
      university: '',
      course: '',
      intake_id: '',
      year_id: '',
      status_id: this.appStatuses.length > 0 ? this.appStatuses[0].id : '',
      description: ''
    };
    this.selectedCourseDetails = null;
    this.loadUniversities();
    this.loadCourses();
    this.showAddApplicationModal = true;
  }

  openEditApplicationModal(app: any) {
    this.currentApplication = {
      id: app.id,
      contact_id: app.contact_id || this.contactId,
      country: app.country || 'New Zealand',
      university: app.university || '',
      course: app.course || '',
      intake_id: app.intake_id || '',
      year_id: app.year_id || '',
      status_id: app.status_id || '',
      description: app.description || ''
    };
    const course = this.courses ? this.courses.find(c => c.name === this.currentApplication.course) : null;
    this.selectedCourseDetails = course || null;
    this.loadUniversities();
    this.loadCourses();
    this.showAddApplicationModal = true;
  }

  saveApplication() {
    if (!this.currentApplication.university || !this.currentApplication.course) {
      Swal.fire('Validation Error', 'University and Course are required fields.', 'warning');
      return;
    }

    this.currentApplication.country = this.currentApplication.country || 'New Zealand';
    this.currentApplication.contact_id = this.currentApplication.contact_id || this.contactId || this.selectedContact?.id;
    this.savingApplication = true;

    if (this.currentApplication.id) {
      this.appsService.updateApplication(this.currentApplication.id, this.currentApplication).subscribe({
        next: (res: any) => {
          this.savingApplication = false;
          if (res && res.success) {
            Swal.fire({
              icon: 'success',
              title: 'Application Updated',
              text: 'Application details updated successfully.',
              timer: 1500,
              showConfirmButton: false
            });
            this.showAddApplicationModal = false;
            this.loadApplications();
          }
        },
        error: (err: any) => {
          this.savingApplication = false;
          Swal.fire('Error', err.error?.message || 'Failed to update application', 'error');
        }
      });
    } else {
      this.appsService.createApplication(this.currentApplication).subscribe({
        next: (res: any) => {
          this.savingApplication = false;
          if (res && res.success) {
            Swal.fire({
              icon: 'success',
              title: 'Application Added',
              text: 'New application registered successfully.',
              timer: 1500,
              showConfirmButton: false
            });
            this.showAddApplicationModal = false;
            this.loadApplications();
          }
        },
        error: (err: any) => {
          this.savingApplication = false;
          Swal.fire('Error', err.error?.message || 'Failed to create application', 'error');
        }
      });
    }
  }

  deleteApplication(appId: number) {
    Swal.fire({
      title: 'Delete Application?',
      text: 'Are you sure you want to delete this application? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it'
    }).then((result) => {
      if (result.isConfirmed) {
        this.appsService.deleteApplication(appId).subscribe({
          next: (res: any) => {
            if (res && res.success) {
              Swal.fire({
                icon: 'success',
                title: 'Deleted',
                text: 'Application deleted successfully.',
                timer: 1500,
                showConfirmButton: false
              });
              this.loadApplications();
            }
          },
          error: (err: any) => Swal.fire('Error', err.error?.message || 'Failed to delete application', 'error')
        });
      }
    });
  }

  updateApplicationStatus(app: any, statusId: number) {
    if (app.status_id === statusId) return;
    const payload = { ...app, status_id: statusId };
    this.appsService.updateApplication(app.id, payload).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          app.status_id = statusId;
          const found = this.appStatuses.find(s => s.id === statusId);
          if (found) {
            app.status_name = found.name;
            app.status_color = found.color;
          }
        }
      },
      error: (err: any) => Swal.fire('Error', err.error?.message || 'Failed to change status', 'error')
    });
  }

  // --- DOCUMENTS TAB FUNCTIONALITY ---

  loadDocuments() {
    if (!this.contactId) return;
    this.loadingDocuments = true;
    this.api.get(`/contacts/${this.contactId}/documents`).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.contactDocuments = res.data || [];
        }
        this.loadingDocuments = false;
      },
      error: () => { this.loadingDocuments = false; }
    });
  }

  openUploadDocumentModal() {
    this.uploadDocData = {
      documentType: '',
      file: null,
      fileName: '',
      notes: ''
    };
    this.showUploadDocumentModal = true;
  }

  closeUploadDocumentModal() {
    this.showUploadDocumentModal = false;
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.uploadDocData.file = event.target.files[0];
      this.uploadDocData.fileName = event.target.files[0].name;
    }
  }

  saveDocument() {
    if (!this.uploadDocData.documentType) {
      Swal.fire('Error', 'Please select a document type.', 'warning');
      return;
    }
    if (!this.uploadDocData.file) {
      Swal.fire('Error', 'Please choose a file to upload.', 'warning');
      return;
    }

    const cId = this.contactId || this.selectedContact?.id;
    if (!cId) return;

    const formData = new FormData();
    formData.append('documentType', this.uploadDocData.documentType);
    formData.append('notes', this.uploadDocData.notes || '');
    formData.append('file', this.uploadDocData.file);

    this.api.upload(`/contacts/${cId}/documents`, formData).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          Swal.fire({
            icon: 'success',
            title: 'Uploaded',
            text: 'Document uploaded successfully.',
            timer: 1500,
            showConfirmButton: false
          });
          this.closeUploadDocumentModal();
          this.loadDocuments();
        }
      },
      error: (err: any) => {
        Swal.fire('Error', err.error?.message || 'Failed to upload document', 'error');
      }
    });
  }

  deleteDocument(doc: any, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!this.contactId || !doc) return;

    Swal.fire({
      title: 'Delete Document?',
      text: `Are you sure you want to delete "${doc.file_name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it'
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.delete(`/contacts/${this.contactId}/documents/${doc.id}`).subscribe({
          next: (res: any) => {
            if (res && res.success) {
              this.contactDocuments = this.contactDocuments.filter((d: any) => d.id !== doc.id);
            }
          }
        });
      }
    });
  }

  // --- RECEIPT TAB FUNCTIONALITY ---

  loadReceipts() {
    if (!this.contactId) return;
    this.loadingReceipts = true;
    this.receiptsService.getContactReceipts(this.contactId).subscribe({
      next: (res: any) => {
        this.selectedContactReceipts = (res && res.success) ? (res.data || []) : [];
        this.totalReceiptAmount = this.selectedContactReceipts.reduce(
          (sum: number, r: any) => sum + Number(r.amount || 0), 0
        );
        this.loadingReceipts = false;
      },
      error: () => {
        this.api.get(`/receipts/contact/${this.contactId}`).subscribe({
          next: (res2: any) => {
            this.selectedContactReceipts = (res2 && res2.success) ? (res2.data || []) : [];
            this.totalReceiptAmount = this.selectedContactReceipts.reduce(
              (sum: number, r: any) => sum + Number(r.amount || 0), 0
            );
            this.loadingReceipts = false;
          },
          error: () => { this.loadingReceipts = false; }
        });
      }
    });
  }

  openAddReceiptModal() {
    this.currentReceipt = {
      id: null,
      receipt_type_id: this.receiptTypes.length > 0 ? this.receiptTypes[0].id : '',
      receipt_type_name: '',
      amount: '',
      receipt_date: new Date().toISOString().split('T')[0],
      description: ''
    };
    this.loadReceiptTypes();
    this.showAddReceiptModal = true;
  }

  openEditReceiptModal(r: any) {
    let formattedDate = '';
    if (r.receipt_date) {
      try {
        const d = new Date(r.receipt_date);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toISOString().split('T')[0];
        } else {
          formattedDate = String(r.receipt_date).split('T')[0];
        }
      } catch (e) {
        formattedDate = String(r.receipt_date).split('T')[0];
      }
    }

    this.currentReceipt = {
      id: r.id,
      receipt_type_id: r.receipt_type_id || '',
      receipt_type_name: r.receipt_type_name || '',
      amount: r.amount,
      receipt_date: formattedDate,
      description: r.description || r.remarks || ''
    };
    this.loadReceiptTypes();
    this.showAddReceiptModal = true;
  }

  saveReceipt() {
    if (!this.currentReceipt.amount || Number(this.currentReceipt.amount) <= 0) {
      Swal.fire('Validation Error', 'Please enter a valid receipt amount.', 'warning');
      return;
    }
    if (!this.currentReceipt.receipt_date) {
      Swal.fire('Validation Error', 'Please select a receipt date.', 'warning');
      return;
    }

    const cId = this.contactId || this.selectedContact?.id;
    if (!cId) return;

    const payload = {
      contact_id: cId,
      receipt_type_id: this.currentReceipt.receipt_type_id || null,
      receipt_type_name: this.currentReceipt.receipt_type_name || null,
      amount: Number(this.currentReceipt.amount),
      receipt_date: this.currentReceipt.receipt_date,
      description: this.currentReceipt.description || ''
    };

    this.savingReceipt = true;

    if (this.currentReceipt.id) {
      this.receiptsService.updateReceipt(this.currentReceipt.id, payload).subscribe({
        next: (res: any) => {
          this.savingReceipt = false;
          if (res && res.success) {
            Swal.fire({
              icon: 'success',
              title: 'Receipt Updated',
              text: 'Receipt has been updated successfully.',
              timer: 1500,
              showConfirmButton: false
            });
            this.showAddReceiptModal = false;
            this.loadReceipts();
            this.contactUpdated.emit();
          }
        },
        error: (err: any) => {
          this.savingReceipt = false;
          Swal.fire('Error', err.error?.message || 'Failed to update receipt', 'error');
        }
      });
    } else {
      this.receiptsService.createReceipt(payload).subscribe({
        next: (res: any) => {
          this.savingReceipt = false;
          if (res && res.success) {
            Swal.fire({
              icon: 'success',
              title: 'Receipt Created',
              text: 'Receipt recorded successfully.',
              timer: 1500,
              showConfirmButton: false
            });
            this.showAddReceiptModal = false;
            this.loadReceipts();
            this.contactUpdated.emit();
          }
        },
        error: (err: any) => {
          this.savingReceipt = false;
          Swal.fire('Error', err.error?.message || 'Failed to create receipt', 'error');
        }
      });
    }
  }

  deleteReceipt(receiptId: number) {
    Swal.fire({
      title: 'Delete Receipt?',
      text: 'Are you sure you want to delete this receipt? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it'
    }).then((result) => {
      if (result.isConfirmed) {
        this.receiptsService.deleteReceipt(receiptId).subscribe({
          next: (res: any) => {
            if (res && res.success) {
              Swal.fire({
                icon: 'success',
                title: 'Deleted',
                text: 'Receipt has been deleted.',
                timer: 1500,
                showConfirmButton: false
              });
              this.loadReceipts();
              this.contactUpdated.emit();
            }
          },
          error: (err: any) => Swal.fire('Error', err.error?.message || 'Failed to delete receipt', 'error')
        });
      }
    });
  }

  // --- UI Helpers ---

  getLeadName(): string {
    return this.selectedContact?.name || this.initialFollowupData?.leadName || 'Lead Profile';
  }

  getPhone(): string {
    return this.selectedContact?.phone || this.initialFollowupData?.phone || '';
  }

  getAssignee(): string {
    return this.selectedContact?.assigned_employee_name || this.initialFollowupData?.assignee || '';
  }

  getDueDate(): string {
    return this.selectedContact?.follow_up_date || this.initialFollowupData?.dueDate || '';
  }

  getLeadStatus(): string {
    return this.selectedContact?.status_name || this.initialFollowupData?.statusName || '';
  }

  getRemarks(): string {
    return this.selectedContact?.latest_remark || this.initialFollowupData?.remarks || '';
  }

  getFollowupStatus(): string {
    if (this.selectedContact?.followup_status) return this.selectedContact.followup_status;
    if (this.initialFollowupData?.status) return this.initialFollowupData.status;
    const fDate = this.selectedContact?.follow_up_date || this.initialFollowupData?.dueDate;
    if (!fDate) return '';
    try {
      const d = new Date(fDate);
      const now = new Date();
      d.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      if (d.getTime() < now.getTime()) return 'Overdue';
      if (d.getTime() === now.getTime()) return 'Due Today';
      return 'Upcoming';
    } catch (e) {
      return '';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Overdue': return 'badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle px-3 py-1';
      case 'Due Today': return 'badge rounded-pill bg-warning-subtle text-warning border border-warning-subtle px-3 py-1';
      case 'Upcoming': return 'badge rounded-pill bg-info-subtle text-info border border-info-subtle px-3 py-1';
      default: return 'badge rounded-pill bg-light text-dark px-3 py-1';
    }
  }

  // --- Qualifications UI Logic ---

  loadQualifications() {
    this.selectedContactQualifications = [];
  }

  openAddQualificationModal() {
    this.currentQualification = {
      id: null,
      qualification: '',
      institution: '',
      completion_year: '',
      percentage_cgpa: '',
      backlogs: '0',
      study_gap: '',
      is_highest: 0,
      sort_order: 0
    };
    this.showAddQualificationModal = true;
  }

  openEditQualificationModal(q: any) {
    this.currentQualification = { ...q };
    this.showAddQualificationModal = true;
  }

  saveQualification() {
    if (!this.currentQualification.qualification || !this.currentQualification.institution) {
      Swal.fire('Validation Error', 'Please enter Qualification and Institution.', 'warning');
      return;
    }

    if (this.currentQualification.is_highest) {
      this.selectedContactQualifications.forEach(item => item.is_highest = 0);
    }

    if (this.currentQualification.id) {
      const idx = this.selectedContactQualifications.findIndex(item => item.id === this.currentQualification.id);
      if (idx > -1) {
        this.selectedContactQualifications[idx] = { ...this.currentQualification };
      }
      Swal.fire({ icon: 'success', title: 'Updated', text: 'Qualification updated successfully.', timer: 1500, showConfirmButton: false });
    } else {
      const newEntry = {
        ...this.currentQualification,
        id: Date.now()
      };
      this.selectedContactQualifications.unshift(newEntry);
      Swal.fire({ icon: 'success', title: 'Added', text: 'Qualification recorded successfully.', timer: 1500, showConfirmButton: false });
    }
    this.showAddQualificationModal = false;
  }

  deleteQualification(id: any) {
    Swal.fire({
      title: 'Delete Qualification?',
      text: 'Are you sure you want to remove this qualification record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it'
    }).then((result) => {
      if (result.isConfirmed) {
        this.selectedContactQualifications = this.selectedContactQualifications.filter(item => item.id !== id);
        Swal.fire({ icon: 'success', title: 'Deleted', text: 'Qualification record deleted.', timer: 1500, showConfirmButton: false });
      }
    });
  }

  // --- Work Experience UI Logic ---

  loadExperiences() {
    this.selectedContactExperiences = [];
  }

  openAddExperienceModal() {
    this.currentExperience = {
      id: null,
      employer: '',
      position: '',
      experience: '',
      from_date: '',
      to_date: '',
      is_current: 0,
      sort_order: 0
    };
    this.showAddExperienceModal = true;
  }

  openEditExperienceModal(exp: any) {
    this.currentExperience = { ...exp };
    this.showAddExperienceModal = true;
  }

  saveExperience() {
    if (!this.currentExperience.employer || !this.currentExperience.position) {
      Swal.fire('Validation Error', 'Please enter Employer name and Position title.', 'warning');
      return;
    }

    if (this.currentExperience.is_current) {
      this.currentExperience.to_date = null;
    }

    if (this.currentExperience.id) {
      const idx = this.selectedContactExperiences.findIndex(item => item.id === this.currentExperience.id);
      if (idx > -1) {
        this.selectedContactExperiences[idx] = { ...this.currentExperience };
      }
      Swal.fire({ icon: 'success', title: 'Updated', text: 'Work experience updated successfully.', timer: 1500, showConfirmButton: false });
    } else {
      const newEntry = {
        ...this.currentExperience,
        id: Date.now()
      };
      this.selectedContactExperiences.unshift(newEntry);
      Swal.fire({ icon: 'success', title: 'Added', text: 'Work experience recorded successfully.', timer: 1500, showConfirmButton: false });
    }
    this.showAddExperienceModal = false;
  }

  deleteExperience(id: any) {
    Swal.fire({
      title: 'Delete Experience?',
      text: 'Are you sure you want to remove this employment record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it'
    }).then((result) => {
      if (result.isConfirmed) {
        this.selectedContactExperiences = this.selectedContactExperiences.filter(item => item.id !== id);
        Swal.fire({ icon: 'success', title: 'Deleted', text: 'Employment record deleted.', timer: 1500, showConfirmButton: false });
      }
    });
  }
}
