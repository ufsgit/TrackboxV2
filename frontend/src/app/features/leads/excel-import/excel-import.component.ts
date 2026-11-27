import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { SystemSettingsService } from '../../../core/services/system-settings.service';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-excel-import',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './excel-import.component.html',
  styleUrls: ['./excel-import.component.css']
})
export class ExcelImportComponent implements OnInit {
  selectedFile: File | null = null;
  excelData: any[] = [];
  excelColumns: string[] = [];
  
  branches: any[] = [];
  departments: any[] = [];
  employees: any[] = [];
  leadStatuses: any[] = [];
  channels: any[] = [];
  enquiryFors: any[] = [];
  dummyLossReasons = ['Price too high', 'Bought from competitor', 'No longer needed', 'Missing features', 'Poor communication'];

  newContact: any = {
    status: '',
    branch: '',
    department: '',
    assigned_employee: '',
    remark: '',
    follow_up_date: '',
    loss_reason: '',
    channel_preference: '',
    enquiry_for_id: ''
  };

  loading = false;
  today = new Date().toISOString().split('T')[0];

  constructor(
    private api: ApiService,
    private settingsService: SystemSettingsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadBranches();
    this.loadDepartments();
    this.loadAgents();
    this.loadLeadStatuses();
    this.loadChannels();
    this.loadEnquiryFors();
  }

  loadEnquiryFors() {
    this.settingsService.getEnquiryFors().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.enquiryFors = res.data || [];
        }
      },
      error: (err: any) => {
        console.error('Failed to load inquiry forms (enquiry_fors):', err);
      }
    });
  }

  getSelectedEnquiryForName(): string {
    if (!this.newContact.enquiry_for_id) return '';
    const found = this.enquiryFors.find(e => String(e.id) === String(this.newContact.enquiry_for_id));
    return found ? (found.name || '') : '';
  }

  loadChannels() {
    this.settingsService.getChannels().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.channels = res.data || [];
        }
      },
      error: (err: any) => {
        console.error('Failed to load channels/sources:', err);
      }
    });
  }

  loadAgents() {
    this.api.get('/settings/team', { for_assignment: 'true' }).subscribe({
      next: (res: any) => {
        if (res.success) {
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
    this.settingsService.getStatuses({ transfer: 1 }).subscribe({
      next: (res: any) => {
        if (res.success) this.leadStatuses = res.data;
      }
    });
  }

  isTransferStatus(statusName: string): boolean {
    if (!statusName) return false;
    const clean = statusName.trim().toLowerCase();
    const found = this.leadStatuses.find(s => (s.name || '').trim().toLowerCase() === clean);
    if (!found) return false;
    const tr = found.transfer;
    return tr === true || tr === 1 || String(tr).toLowerCase() === 'true' || String(tr) === '1' || String(tr).toLowerCase() === 'yes';
  }

  isFollowupStatus(statusName: string): boolean {
    if (!statusName) return false;
    const clean = statusName.trim().toLowerCase();
    const found = this.leadStatuses.find(s => (s.name || '').trim().toLowerCase() === clean);
    if (!found) return false;
    const fn = found.follow_needed;
    return fn === 'Yes' || fn === true || fn === 1 || String(fn).toLowerCase() === 'yes' || String(fn).toLowerCase() === 'true' || String(fn) === '1';
  }

  getFilteredDepartments(branchName: string) {
    if (!branchName) return [];
    const branch = this.branches.find(b => b.name === branchName || String(b.name).toLowerCase().trim() === String(branchName).toLowerCase().trim());
    if (!branch) return [];
    return this.departments.filter(d => Number(d.branch_id) === Number(branch.id));
  }

  getFilteredEmployees(branchName: string, departmentName: string) {
    if (!branchName || !departmentName) return [];
    const branch = this.branches.find(b => b.name === branchName || String(b.name).toLowerCase().trim() === String(branchName).toLowerCase().trim());
    const branchId = branch ? Number(branch.id) : null;
    const dept = this.departments.find(d => (d.name === departmentName || String(d.name).toLowerCase().trim() === String(departmentName).toLowerCase().trim()) && (branchId ? Number(d.branch_id) === branchId : true));
    const deptId = dept ? Number(dept.id) : null;

    return (this.employees || []).filter(e => {
      const matchBranch = branchId ? (Number(e.branch_id) === branchId || String(e.branch_name || '').toLowerCase().trim() === String(branchName).toLowerCase().trim()) : true;
      const matchDept = deptId ? (Number(e.department_id) === deptId || String(e.department_name || '').toLowerCase().trim() === String(departmentName).toLowerCase().trim()) : true;
      return matchBranch && matchDept;
    });
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const bstr = e.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Parse as array of arrays first to find the real header row
        const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
        
        let headerRowIdx = -1;
        // Find the first row that has actual string content (likely headers)
        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i];
          if (row && row.some(cell => cell && typeof cell === 'string' && cell.trim().length > 0)) {
            headerRowIdx = i;
            break;
          }
        }

        if (headerRowIdx !== -1) {
          const headers = rawData[headerRowIdx];
          const rows = rawData.slice(headerRowIdx + 1);
          
          // Map rows back to objects using the detected headers
          this.excelData = rows.map(row => {
            const obj: any = {};
            headers.forEach((header: any, index: number) => {
              if (header) obj[String(header).trim()] = row[index];
            });
            return obj;
          });
          
          this.excelColumns = headers.filter(h => h).map(h => String(h).trim());
        } else {
          this.excelData = [];
          this.excelColumns = [];
        }
      };
      reader.readAsBinaryString(file);
    }
  }

  hasExcelColumn(keywords: string[]): boolean {
    if (!this.excelColumns || this.excelColumns.length === 0) return false;
    return this.excelColumns.some(col => {
      const c = (col || '').trim().toLowerCase();
      return keywords.some(k => c === k.toLowerCase() || c.includes(k.toLowerCase()));
    });
  }

  hasStatusInExcel(): boolean {
    return this.hasExcelColumn(['Status', 'Lead Status', 'Current Status', 'Stage']);
  }

  hasSourceInExcel(): boolean {
    return this.hasExcelColumn(['Source', 'Lead Source', 'Channel', 'Channel Preference', 'Origin', 'Medium']);
  }

  hasFollowUpDateInExcel(): boolean {
    return this.hasExcelColumn(['Follow-up Date', 'Follow Up Date', 'Followup Date', 'Follow Up', 'Next Follow-up', 'Reminder Date']);
  }

  formatSkipMessages(d: any, defaultMessage: string): string[] {
    if (d && Array.isArray(d.skipMessages) && d.skipMessages.length > 0) {
      return d.skipMessages;
    }
    if (d && Array.isArray(d.errors) && d.errors.length > 0) {
      const counts: { [key: string]: number } = {
        phone_exists: 0,
        phone_missing: 0,
        phone_invalid: 0,
        phone_duplicate_in_file: 0,
        status_not_found: 0,
        other: 0
      };
      d.errors.forEach((err: string) => {
        const lower = (err || '').toLowerCase();
        if (lower.includes('already exists')) counts['phone_exists']++;
        else if (lower.includes('phone number missing') || lower.includes('phone missing')) counts['phone_missing']++;
        else if (lower.includes('phone invalid')) counts['phone_invalid']++;
        else if (lower.includes('duplicate phone in excel')) counts['phone_duplicate_in_file']++;
        else if (lower.includes('does not exist in the system')) counts['status_not_found']++;
        else counts['other']++;
      });
      const labels: { [key: string]: string } = {
        phone_exists: 'Phone number already exists',
        phone_missing: 'Phone number is missing',
        phone_invalid: 'Phone number is invalid (must be 10 digits)',
        phone_duplicate_in_file: 'Duplicate phone number in Excel file',
        status_not_found: 'Status does not exist in the system',
        other: 'Other validation errors'
      };
      const msgs: string[] = [];
      for (const k of Object.keys(counts)) {
        if (counts[k] > 0) {
          const rowWord = counts[k] === 1 ? '1 row skipped' : `${counts[k]} rows skipped`;
          msgs.push(`${rowWord} – ${labels[k]}.`);
        }
      }
      if (msgs.length > 0) return msgs;
    }
    return defaultMessage ? [defaultMessage] : [];
  }

  clearFile(event: Event) {
    event.stopPropagation();
    this.selectedFile = null;
    this.excelData = [];
    this.excelColumns = [];
  }

  importLeads() {
    if (!this.selectedFile) {
      Swal.fire('Error', 'Please select an Excel file first.', 'error');
      return;
    }
    if (this.excelData.length === 0) {
      Swal.fire('Error', 'No data found in the Excel file.', 'error');
      return;
    }

    if (!this.newContact.status && !this.hasStatusInExcel()) {
      Swal.fire('Error', 'Please select a default status, or ensure your Excel sheet has a Status column.', 'error');
      return;
    }

    if (this.newContact.status && this.isTransferStatus(this.newContact.status)) {
      if (!this.newContact.branch || !this.newContact.department || !this.newContact.assigned_employee || !this.newContact.remark) {
        Swal.fire('Error', 'Please fill in all mandatory transfer fields (Branch, Department, Employee, Remark).', 'error');
        return;
      }
    }

    this.loading = true;
    
    // Prepare payload with bulk sync flag enabled
    const payload = {
      leads: this.excelData,
      useBulkImportLeads: true,
      statusAndAssignment: {
        status: this.newContact.status || '',
        branch: this.newContact.branch || '',
        department: this.newContact.department || '',
        assigned_employee: this.newContact.assigned_employee || '',
        remark: this.newContact.remark || '',
        follow_up_date: this.newContact.follow_up_date || '',
        loss_reason: this.newContact.loss_reason || '',
        channel_preference: this.newContact.channel_preference || '',
        source: this.newContact.channel_preference || '',
        enquiry_for_id: this.newContact.enquiry_for_id || null
      }
    };

    this.api.post('/contacts/import-excel', payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        const d = res.data || {};
        const invalidEmails = d.invalidEmails || [];

        if (res.success) {
          if (invalidEmails.length > 0) {
            // Build informative table for invalid emails
            const tableRows = invalidEmails.map((item: any) => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 12px; font-weight: 600; text-align: center;">Row ${item.row}</td>
                <td style="padding: 8px 12px; font-weight: 500;">${item.name}</td>
                <td style="padding: 8px 12px; color: #ef4444; font-family: monospace;">${item.email}</td>
                <td style="padding: 8px 12px; color: #dc2626; font-size: 0.85rem;">${item.error}</td>
              </tr>
            `).join('');

            const htmlContent = `
              <div style="text-align: left; font-size: 0.95rem;">
                <div style="padding: 12px 16px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; color: #92400e; margin-bottom: 16px;">
                  <i class="bi bi-exclamation-triangle-fill me-2 text-warning"></i>
                  <strong>${invalidEmails.length} record(s)</strong> have invalid email addresses. 
                  Valid records (${d.inserted}) were imported successfully.
                </div>
                <div style="max-height: 260px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem;">
                    <thead>
                      <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left;">
                        <th style="padding: 8px 12px; text-align: center;">Import Row</th>
                        <th style="padding: 8px 12px;">Student Name</th>
                        <th style="padding: 8px 12px;">Email Provided</th>
                        <th style="padding: 8px 12px;">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${tableRows}
                    </tbody>
                  </table>
                </div>
              </div>
            `;

            Swal.fire({
              title: 'Import Completed with Warnings',
              html: htmlContent,
              icon: 'warning',
              width: '680px',
              confirmButtonText: 'Understood, Go to Leads',
              confirmButtonColor: '#6366f1'
            }).then(() => {
              this.router.navigate(['/contacts']);
            });

          } else {
            const skipMessages = this.formatSkipMessages(d, '');
            let html = `
              <div style="text-align: left; font-size: 0.95rem;">
                <p style="font-weight: 600; color: #16a34a; margin-bottom: 8px;">
                  ${d.inserted} contact(s) imported successfully!
                </p>
            `;
            if (skipMessages.length > 0) {
              html += `
                <div style="padding: 10px 14px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; color: #92400e; margin-top: 10px;">
                  <div style="font-weight: 600; margin-bottom: 4px;">Skipped rows:</div>
                  <ul style="margin: 0; padding-left: 18px; line-height: 1.6;">
                    ${skipMessages.map((m: string) => `<li>${m}</li>`).join('')}
                  </ul>
                </div>
              `;
            }
            html += `</div>`;

            Swal.fire({
              title: d.skipped > 0 ? 'Import Completed with Notes' : 'Import Successful',
              html: html,
              icon: d.skipped > 0 ? 'warning' : 'success',
              width: '520px'
            }).then(() => {
              this.router.navigate(['/contacts']);
            });
          }
        } else {
          const skipMessages = this.formatSkipMessages(d, res.message || '');
          let html = `
            <div style="text-align: left; font-size: 0.95rem;">
              <p style="margin-bottom: 12px; font-weight: 600; color: #dc2626;">
                0 leads imported ${d.skipped ? `(${d.skipped} rows skipped)` : ''}:
              </p>
          `;

          if (skipMessages.length > 0) {
            html += `
              <div style="padding: 12px 16px; background: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; color: #991b1b; margin-bottom: 14px;">
                <ul style="margin: 0; padding-left: 18px; line-height: 1.8;">
                  ${skipMessages.map((m: string) => `<li><strong>${m}</strong></li>`).join('')}
                </ul>
              </div>
            `;
          }

          // Only show detected columns / expected columns if no recognizable columns were found
          const recognizedEssentialCols = ['name', 'student name', 'phone', 'mobile', 'primary phone', 'contact'];
          const hasEssentialCols = (d.detectedColumns || []).some((col: string) => 
            recognizedEssentialCols.some(k => col.toLowerCase().includes(k))
          );
          if (!hasEssentialCols && d.detectedColumns && d.detectedColumns.length > 0) {
            html += `
              <div style="font-size: 0.85rem; color: #64748b; background: #f8fafc; padding: 10px 14px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div>Detected columns in your Excel: <code>${d.detectedColumns.join(', ')}</code></div>
                <div style="margin-top: 4px;">Expected columns like: Name, Phone (or Mobile), Email, Address</div>
              </div>
            `;
          }

          html += `</div>`;

          Swal.fire({
            title: 'Import Failed',
            html: html,
            icon: 'error',
            width: '560px'
          });
        }
      },
      error: (err: any) => {
        this.loading = false;
        Swal.fire('Error', err.error?.message || 'Error connecting to server', 'error');
      }
    });
  }
}
