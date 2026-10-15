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
  dummyLossReasons = ['Price too high', 'Bought from competitor', 'No longer needed', 'Missing features', 'Poor communication'];

  newContact: any = {
    status: '',
    branch: '',
    department: '',
    assigned_employee: '',
    remark: '',
    follow_up_date: '',
    loss_reason: ''
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
  }

  loadAgents() {
    this.api.get('/settings/team').subscribe({
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
    this.settingsService.getStatuses().subscribe({
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
    const branch = this.branches.find(b => b.name === branchName);
    if (!branch) return [];
    return this.departments.filter(d => d.branch_id === branch.id);
  }

  getFilteredEmployees(branchName: string, departmentName: string) {
    if (!branchName || !departmentName) return [];
    return this.employees.filter(e => e.branch_name === branchName && e.department_name === departmentName);
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

    if (!this.newContact.status) {
      Swal.fire('Error', 'Please select a status.', 'error');
      return;
    }

    if (this.isTransferStatus(this.newContact.status)) {
      if (!this.newContact.branch || !this.newContact.department || !this.newContact.assigned_employee || !this.newContact.remark) {
        Swal.fire('Error', 'Please fill in all mandatory transfer fields (Branch, Department, Employee, Remark).', 'error');
        return;
      }
    }

    this.loading = true;
    
    // Prepare payload
    const payload = {
      leads: this.excelData,
      statusAndAssignment: {
        status: this.newContact.status,
        branch: this.newContact.branch,
        department: this.newContact.department,
        assigned_employee: this.newContact.assigned_employee,
        remark: this.newContact.remark,
        follow_up_date: this.newContact.follow_up_date,
        loss_reason: this.newContact.loss_reason
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
            const msg = `${res.message}${d.skipped ? `\n${d.skipped} row(s) skipped (duplicates or invalid phone).` : ''}`;
            Swal.fire('Import Successful', msg, 'success').then(() => {
              this.router.navigate(['/contacts']);
            });
          }
        } else {
          // Show detected columns to help user fix their Excel file
          let detail = res.message || 'Failed to import leads.';
          if (d.detectedColumns && d.detectedColumns.length > 0) {
            detail += `\n\nDetected columns in your Excel:\n${d.detectedColumns.join(', ')}\n\nExpected columns like:\nName, Phone (or Mobile), Email, Address, Tags`;
          }
          Swal.fire({ title: 'Import Failed', html: detail.replace(/\n/g, '<br>'), icon: 'error' });
        }
      },
      error: (err: any) => {
        this.loading = false;
        Swal.fire('Error', err.error?.message || 'Error connecting to server', 'error');
      }
    });
  }
}
