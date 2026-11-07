import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../../core/services/api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-send-email-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './send-email-modal.component.html',
  styleUrls: ['./send-email-modal.component.css']
})
export class SendEmailModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isOpen = false;
  @Input() selectedContactIds: Set<number> = new Set();
  @Input() isAllAcrossPages = false;
  @Input() totalLeads = 0;
  @Input() searchQuery = '';
  @Input() activeStatus = '';

  @Output() close = new EventEmitter<void>();
  @Output() emailSent = new EventEmitter<void>();

  bulkEmailLoadingPreview = false;
  bulkEmailSending = false;
  bulkEmailRefreshing = false;
  bulkEmailSubject = "{{first_name}}, let's discuss your next career step!";
  bulkEmailBody = `Hi {{first_name}},

We are excited to connect with you!

Whether you're looking to upskill, explore new certifications, or kickstart your career with our hands-on industry programs, our team is here to support you at every milestone.

We invite you to schedule a free 1-on-1 counseling session with one of our academic mentors this week to map out the best path forward for your goals.

If you're interested, simply reply to this email with "YES" or share your preferred call time.

Best regards,
Student Admissions & Relations
Trackbox CRM Team`;

  bulkEmailPreview: any = {
    totalTargeted: 0,
    validCount: 0,
    invalidCount: 0,
    missingCount: 0,
    validRecipients: [],
    invalidRecipients: [],
    missingRecipients: []
  };

  showAudienceDrawer = false;
  showInvalidListDrawer = false;

  toggleAudienceDrawer(): void {
    this.showAudienceDrawer = !this.showAudienceDrawer;
    if (this.showAudienceDrawer) {
      this.showInvalidListDrawer = false;
    }
  }

  toggleInvalidDrawer(): void {
    this.showInvalidListDrawer = !this.showInvalidListDrawer;
    if (this.showInvalidListDrawer) {
      this.showAudienceDrawer = false;
    }
  }
  bulkEmailCampaignId: string | null = null;
  bulkEmailResultsView = false;
  bulkEmailResults: any[] = [];
  emailTemplates: any[] = [];
  selectedTemplateId: string | null = null;
  attachments: Array<{ name: string; content: string; size: number; type: string }> = [];
  private bulkEmailRefreshTimer: any = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadEmailTemplates();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.initModalState();
    }
  }

  ngOnDestroy(): void {
    if (this.bulkEmailRefreshTimer) {
      clearTimeout(this.bulkEmailRefreshTimer);
      this.bulkEmailRefreshTimer = null;
    }
  }

  initModalState(): void {
    this.bulkEmailResultsView = false;
    this.bulkEmailCampaignId = null;
    this.bulkEmailResults = [];
    this.showAudienceDrawer = false;
    this.showInvalidListDrawer = false;
    this.attachments = [];
    
    this.selectedTemplateId = null;
    this.loadEmailTemplates();
    this.fetchBulkEmailPreview();
  }

  loadEmailTemplates(): void {
    this.api.get('/templates').subscribe({
      next: (res: any) => {
        if (res.success && Array.isArray(res.data)) {
          this.emailTemplates = res.data;
        }
      },
      error: (err: any) => console.error('Failed to load email templates', err)
    });
  }

  onEmailTemplateSelected(event: any): void {
    const templateId = event.target.value;
    this.selectedTemplateId = templateId;
    if (!templateId) return;

    const found = this.emailTemplates.find(t => String(t.id) === String(templateId));
    if (found) {
      if (found.name) {
        this.bulkEmailSubject = found.name;
      }
      if (found.body) {
        this.bulkEmailBody = found.body;
      }
    }
  }

  getCleanTemplateName(name: string): string {
    if (!name) return 'Template';
    let clean = name.replace(/\{\{[^}]+\}\},?\s*/gi, '').trim();
    if (!clean) clean = name;
    return clean.length > 32 ? clean.slice(0, 32) + '...' : clean;
  }

  closeModal(): void {
    if (this.bulkEmailSending) return;
    if (this.bulkEmailRefreshTimer) {
      clearTimeout(this.bulkEmailRefreshTimer);
      this.bulkEmailRefreshTimer = null;
    }
    this.close.emit();
  }

  toggleInvalidEmailDetails(): void {
    this.toggleInvalidDrawer();
  }

  getLivePreviewRecipientName(): string {
    if (this.bulkEmailPreview?.validRecipients && this.bulkEmailPreview.validRecipients.length > 0) {
      return this.bulkEmailPreview.validRecipients[0].name || 'Recipient';
    }
    return 'Recipient';
  }

  getLivePreviewRecipientEmail(): string {
    if (this.bulkEmailPreview?.validRecipients && this.bulkEmailPreview.validRecipients.length > 0) {
      return this.bulkEmailPreview.validRecipients[0].email || 'lead@example.com';
    }
    return 'lead@example.com';
  }

  getLivePreviewSubject(): string {
    if (!this.bulkEmailSubject) return 'No subject entered';
    const name = this.getLivePreviewRecipientName();
    const firstName = name.split(' ')[0] || name;
    return this.bulkEmailSubject
      .replace(/\{\{first_name\}\}/gi, firstName)
      .replace(/\{\{name\}\}/gi, name);
  }

  getLivePreviewBody(): string {
    if (!this.bulkEmailBody) return 'Type your message to see the live preview...';
    const name = this.getLivePreviewRecipientName();
    const firstName = name.split(' ')[0] || name;
    return this.bulkEmailBody
      .replace(/\{\{first_name\}\}/gi, firstName)
      .replace(/\{\{name\}\}/gi, name);
  }

  insertVariableTag(tag: string): void {
    if (!this.bulkEmailBody) {
      this.bulkEmailBody = tag;
    } else {
      this.bulkEmailBody += ' ' + tag;
    }
  }

  onFilesSelected(event: any): void {
    const files: FileList = event.target?.files;
    if (!files || files.length === 0) return;

    const maxFileSize = 10 * 1024 * 1024; // 10MB per file
    const maxTotalSize = 12 * 1024 * 1024; // 12MB total limit

    let currentTotalSize = this.attachments.reduce((sum, a) => sum + (a.size || 0), 0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > maxFileSize) {
        Swal.fire('File Too Large', `"${file.name}" exceeds the 10MB limit. Please attach a smaller file.`, 'warning');
        continue;
      }

      if (currentTotalSize + file.size > maxTotalSize) {
        Swal.fire('Total Size Exceeded', `Total attachments cannot exceed 12MB. "${file.name}" was not added.`, 'warning');
        break;
      }

      // Skip duplicate filename
      if (this.attachments.some(a => a.name === file.name)) {
        continue;
      }

      currentTotalSize += file.size;

      const reader = new FileReader();
      reader.onload = () => {
        const resultStr = reader.result as string;
        const base64Data = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;

        this.attachments.push({
          name: file.name,
          content: base64Data,
          size: file.size,
          type: file.type || 'application/octet-stream'
        });
      };
      reader.readAsDataURL(file);
    }

    // Reset input so user can choose another file or the same file again if removed
    event.target.value = '';
  }

  removeAttachment(index: number): void {
    if (index >= 0 && index < this.attachments.length) {
      this.attachments.splice(index, 1);
    }
  }

  clearAllAttachments(): void {
    this.attachments = [];
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getTotalAttachmentSize(): string {
    const totalBytes = this.attachments.reduce((sum, a) => sum + (a.size || 0), 0);
    return this.formatFileSize(totalBytes);
  }

  getAttachmentTypeClass(filename: string): string {
    const ext = (filename || '').split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return 'type-image';
    if (ext === 'pdf') return 'type-pdf';
    if (['doc', 'docx', 'txt', 'rtf'].includes(ext || '')) return 'type-doc';
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return 'type-sheet';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) return 'type-zip';
    return 'type-generic';
  }

  getAttachmentBootstrapIcon(filename: string): string {
    const ext = (filename || '').split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return 'bi-file-earmark-image-fill';
    if (ext === 'pdf') return 'bi-file-earmark-pdf-fill';
    if (['doc', 'docx'].includes(ext || '')) return 'bi-file-earmark-word-fill';
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return 'bi-file-earmark-excel-fill';
    if (ext === 'txt') return 'bi-file-earmark-text-fill';
    if (['zip', 'rar', '7z'].includes(ext || '')) return 'bi-file-earmark-zip-fill';
    return 'bi-paperclip';
  }

  fetchBulkEmailPreview(): void {
    if (this.bulkEmailLoadingPreview) return;
    this.bulkEmailLoadingPreview = true;
    const filterPayload: any = {
      search: this.searchQuery ? this.searchQuery.trim() : null,
      status: this.activeStatus || null
    };

    // If specific IDs are selected AND not in "Select all across pages" mode, send selected_contact_ids
    if (!this.isAllAcrossPages && this.selectedContactIds && this.selectedContactIds.size > 0) {
      filterPayload.selected_contact_ids = Array.from(this.selectedContactIds);
    }

    this.api.post('/contacts/preview-bulk-email', filterPayload).subscribe({
      next: (res: any) => {
        this.bulkEmailLoadingPreview = false;
        if (res.success && res.data) {
          this.bulkEmailPreview = {
            ...res.data,
            validRecipients: res.data.validRecipients || [],
            invalidRecipients: res.data.invalidRecipients || [],
            missingRecipients: res.data.missingRecipients || []
          };
        }
      },
      error: (err: any) => {
        this.bulkEmailLoadingPreview = false;
        Swal.fire('Error', err.error?.message || 'Failed to fetch email recipient preview', 'error');
      }
    });
  }

  sendBulkEmailViaBrevo(): void {
    if (!this.bulkEmailSubject.trim()) {
      Swal.fire('Subject Required', 'Please enter an email subject line before sending.', 'warning');
      return;
    }
    if (!this.bulkEmailBody.trim()) {
      Swal.fire('Message Required', 'Please enter your email message body before sending.', 'warning');
      return;
    }
    if (this.bulkEmailPreview.validCount === 0) {
      Swal.fire('No Valid Recipients', 'There are no recipients with valid email addresses matching the selected leads.', 'info');
      return;
    }

    const targetDesc = (!this.isAllAcrossPages && this.selectedContactIds && this.selectedContactIds.size > 0)
      ? `<strong>${this.selectedContactIds.size} individually selected leads</strong> (${this.bulkEmailPreview.validCount} valid email addresses)`
      : `<strong>All ${this.bulkEmailPreview.validCount} filtered leads</strong> with valid email addresses`;

    const attachmentSummaryHtml = this.attachments.length > 0
      ? `<div style="margin-top: 8px; padding: 6px 10px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; font-size: 0.85rem; color: #1e40af;">
           📎 <strong>${this.attachments.length} Attachment${this.attachments.length > 1 ? 's' : ''}:</strong> ${this.attachments.map(a => a.name).join(', ')} (${this.getTotalAttachmentSize()})
         </div>`
      : '';

    Swal.fire({
      title: 'Confirm Send',
      html: `
        <div style="text-align: left; font-size: 0.95rem;">
          <p>You are about to send personalized emails to ${targetDesc}.</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-top: 10px;">
            <div><strong>Subject:</strong> ${this.bulkEmailSubject}</div>
            <div style="margin-top: 4px; color: #64748b; font-size: 0.85rem;">Sender: sreelakshmichoicecampaigns8@gmail.com</div>
            ${attachmentSummaryHtml}
          </div>
          <p style="margin-top: 12px; font-size: 0.85rem; color: #059669;">
            <i class="bi bi-shield-check me-1"></i> Each email will be logged in the lead's timeline with delivery tracking.
          </p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Send to ${this.bulkEmailPreview.validCount} Recipients`,
      confirmButtonColor: '#4f46e5',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.bulkEmailSending = true;
        const sendPayload: any = {
          search: this.searchQuery ? this.searchQuery.trim() : null,
          status: this.activeStatus || null,
          subject: this.bulkEmailSubject.trim(),
          body: this.bulkEmailBody.trim(),
          template_id: this.selectedTemplateId || null,
          attachments: this.attachments.map(a => ({
            name: a.name,
            content: a.content,
            size: a.size,
            type: a.type
          }))
        };

        if (!this.isAllAcrossPages && this.selectedContactIds && this.selectedContactIds.size > 0) {
          sendPayload.selected_contact_ids = Array.from(this.selectedContactIds);
        }

        this.api.post('/contacts/send-bulk-email', sendPayload).subscribe({
          next: (res: any) => {
            this.bulkEmailSending = false;
            if (res.success) {
              this.emailSent.emit();
              this.closeModal();

              Swal.fire({
                title: 'Success!',
                text: 'Email sent successfully',
                icon: 'success',
                confirmButtonColor: '#4f46e5',
                timer: 3000,
                timerProgressBar: true
              });
            } else {
              Swal.fire('Failed to Send', res.message || 'Unable to send email.', 'warning');
            }
          },
          error: (err: any) => {
            this.bulkEmailSending = false;
            const apiMessage = err.error?.message || err.message || 'Failed to send email.';
            Swal.fire('Send Failed', apiMessage, 'error');
          }
        });
      }
    });
  }

  refreshEmailStatusFromBrevo(): void {
    if (!this.bulkEmailCampaignId || this.bulkEmailRefreshing) return;
    this.bulkEmailRefreshing = true;

    this.api.post('/contacts/email-status/refresh', { campaign_id: this.bulkEmailCampaignId }).subscribe({
      next: (res: any) => {
        this.bulkEmailRefreshing = false;
        if (res.success && res.data?.updatedRows) {
          const updated = res.data.updatedRows;
          updated.forEach((u: any) => {
            const found = this.bulkEmailResults.find(r => 
              (u.id && r.id === u.id) ||
              (u.contactId && String(r.contactId) === String(u.contactId)) ||
              (u.email && r.email?.toLowerCase() === u.email?.toLowerCase())
            );
            if (found) {
              found.status = u.status;
              found.reason = u.reason;
              found.deliveredAt = u.deliveredAt;
              found.openedAt = u.openedAt;
            }
          });
        }
      },
      error: (err: any) => {
        this.bulkEmailRefreshing = false;
        console.error('Failed to refresh status from Brevo', err);
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'delivered': return 'bg-success text-white';
      case 'opened':
      case 'clicked': return 'bg-primary text-white';
      case 'queued': return 'bg-secondary text-white';
      case 'deferred':
      case 'soft_bounce': return 'bg-warning text-dark';
      case 'hard_bounce':
      case 'blocked':
      case 'spam':
      case 'invalid_email':
      case 'failed': return 'bg-danger text-white';
      default: return 'bg-light text-dark border';
    }
  }

  getDeliverySummaryText(): string {
    if (!this.bulkEmailResults || this.bulkEmailResults.length === 0) return '';
    const counts: any = {};
    this.bulkEmailResults.forEach(r => {
      const st = r.status || 'queued';
      counts[st] = (counts[st] || 0) + 1;
    });

    const parts = [];
    if (counts['delivered']) parts.push(`${counts['delivered']} delivered`);
    if (counts['opened']) parts.push(`${counts['opened']} opened`);
    if (counts['clicked']) parts.push(`${counts['clicked']} clicked`);
    if (counts['deferred']) parts.push(`${counts['deferred']} deferred`);
    if (counts['soft_bounce']) parts.push(`${counts['soft_bounce']} soft bounce`);
    if (counts['hard_bounce']) parts.push(`${counts['hard_bounce']} hard bounce`);
    if (counts['blocked']) parts.push(`${counts['blocked']} blocked`);
    if (counts['failed']) parts.push(`${counts['failed']} failed`);
    return parts.length > 0 ? parts.join(' • ') : 'Queued for delivery';
  }
}
