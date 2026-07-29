import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ApplicationsService } from '../../../core/services/applications.service';
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
  @Output() close = new EventEmitter<void>();
  @Output() contactUpdated = new EventEmitter<void>();

  baseUrl = environment.socketUrl;
  selectedContact: any = null;
  detailLoading = false;
  detailActiveTab = 'Profile';

  // Applications
  selectedContactApplications: any[] = [];
  loadingApplications = false;
  appStatuses: any[] = [];

  // Documents
  contactDocuments: any[] = [];
  loadingDocuments = false;

  constructor(
    private api: ApiService,
    private appsService: ApplicationsService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadAppStatuses();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen && this.contactId) {
      this.detailActiveTab = 'Profile';
      this.loadContactDetails();
      this.loadApplications();
      this.loadDocuments();
    }
  }

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
      error: (err) => {
        console.error('Error loading contact details:', err);
        this.detailLoading = false;
      }
    });
  }

  loadApplications() {
    if (!this.contactId) return;
    this.loadingApplications = true;
    this.appsService.getApplications(this.contactId).subscribe({
      next: (res: any) => {
        if (res.success) this.selectedContactApplications = res.data || [];
        this.loadingApplications = false;
      },
      error: () => { this.loadingApplications = false; }
    });
  }

  loadAppStatuses() {
    this.api.get('/applications/statuses').subscribe({
      next: (res: any) => {
        if (res.success) this.appStatuses = res.data || [];
      },
      error: () => {}
    });
  }

  loadDocuments() {
    if (!this.contactId) return;
    this.loadingDocuments = true;
    this.api.get(`/contacts/${this.contactId}/documents`).subscribe({
      next: (res: any) => {
        if (res.success) this.contactDocuments = res.data || [];
        this.loadingDocuments = false;
      },
      error: () => { this.loadingDocuments = false; }
    });
  }

  closeModal() {
    this.isOpen = false;
    this.selectedContact = null;
    this.close.emit();
  }

  formatFieldValue(field: any): string {
    if (!field || field.value === undefined || field.value === null) return '';
    if (Array.isArray(field.value)) return field.value.join(', ');
    return String(field.value);
  }

  updateApplicationStatus(app: any, statusId: number) {
    this.appsService.updateApplication(app.id, { status_id: statusId }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.loadApplications();
        }
      }
    });
  }

  deleteContact() {
    if (!this.selectedContact) return;
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete lead "${this.selectedContact.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.delete(`/contacts/${this.selectedContact.id}`).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Lead has been deleted.', 'success');
            this.contactUpdated.emit();
            this.closeModal();
          },
          error: (err) => Swal.fire('Error', err.error?.message || 'Failed to delete lead', 'error')
        });
      }
    });
  }
}
