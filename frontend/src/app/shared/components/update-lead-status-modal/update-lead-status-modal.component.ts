import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-update-lead-status-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './update-lead-status-modal.component.html',
  styleUrls: ['./update-lead-status-modal.component.css']
})
export class UpdateLeadStatusModalComponent implements OnInit, OnChanges {
  @Input() contactId: number | null = null;
  @Input() contactName: string = '';
  @Input() isOpen: boolean = false;
  @Input() initialData: any = null;

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();
  @Output() openProfile = new EventEmitter<number>();

  loading = false;
  today = new Date().toISOString().split('T')[0];

  leadStatuses: any[] = [];
  branches: any[] = [];
  departments: any[] = [];
  employees: any[] = [];

  quickStatusData = {
    status: '',
    status_id: null as number | null,
    status_name: '',
    remark: '',
    follow_up_date: '',
    branch: '',
    branch_id: null as number | null,
    department: '',
    department_id: null as number | null,
    assigned_employee: '',
    loss_reason: ''
  };

  dummyLossReasons = [
    'Price too high',
    'Chose competitor',
    'Not interested',
    'No response / Unreachable',
    'Invalid requirement',
    'Other'
  ];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadStatuses();
    this.loadBranches();
    this.loadDepartments();
    this.loadTeam();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      // Reset form first
      this.quickStatusData = {
        status: '',
        status_id: null,
        status_name: '',
        remark: '',
        follow_up_date: '',
        branch: '',
        branch_id: null,
        department: '',
        department_id: null,
        assigned_employee: '',
        loss_reason: ''
      };

      if (this.initialData) {
        // Normalize across all field variants used by different pages:
        // - Contacts page: status_name, branch_name, department_name, assigned_to, follow_up_date, remark
        // - Pending Follow-ups: status_name, branch_name, department_name, assigned_to, dueDate
        // - Today's Leads: status_name, branch_name, department_name, assigned_to, follow_up_date
        // - All Leads: status_name, branch_name, department_name, assigned_to, follow_up_date
        const d = this.initialData;
        this.quickStatusData.status = d.status_name || d.statusName || d.status || '';
        this.quickStatusData.status_name = this.quickStatusData.status;
        this.quickStatusData.remark = d.remarks || d.remark || '';
        this.quickStatusData.follow_up_date = d.follow_up_date || d.dueDate || '';
        this.quickStatusData.branch = d.branch_name || d.branch || '';
        this.quickStatusData.department = d.department_name || d.department || '';
        this.quickStatusData.assigned_employee = d.assigned_to || d.assigned_employee || '';
        this.quickStatusData.loss_reason = d.loss_reason || '';

        // Format date if it comes as a full ISO string
        if (this.quickStatusData.follow_up_date && this.quickStatusData.follow_up_date.length > 10) {
          try {
            const dt = new Date(this.quickStatusData.follow_up_date);
            if (!isNaN(dt.getTime())) {
              const yyyy = dt.getFullYear();
              const mm = String(dt.getMonth() + 1).padStart(2, '0');
              const dd = String(dt.getDate()).padStart(2, '0');
              this.quickStatusData.follow_up_date = `${yyyy}-${mm}-${dd}`;
            }
          } catch (e) { /* ignore */ }
        }
      }

      // Always fetch fresh contact data if contactId is available to keep everything in sync
      if (this.contactId) {
        this.fetchContactData();
      }
    }
  }

  fetchContactData() {
    if (!this.contactId) return;
    this.api.get(`/contacts/${this.contactId}`).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          const c = res.data;
          // Use API as source of truth — it has the latest saved state
          this.quickStatusData.status = c.status_name || this.quickStatusData.status || '';
          this.quickStatusData.status_name = this.quickStatusData.status;
          this.quickStatusData.remark = c.remarks || c.remark || this.quickStatusData.remark || '';
          // Format date
          const rawDate = c.follow_up_date || this.quickStatusData.follow_up_date || '';
          if (rawDate && rawDate.length > 10) {
            try {
              const dt = new Date(rawDate);
              if (!isNaN(dt.getTime())) {
                const yyyy = dt.getFullYear();
                const mm = String(dt.getMonth() + 1).padStart(2, '0');
                const dd = String(dt.getDate()).padStart(2, '0');
                this.quickStatusData.follow_up_date = `${yyyy}-${mm}-${dd}`;
              }
            } catch (e) { this.quickStatusData.follow_up_date = rawDate; }
          } else {
            this.quickStatusData.follow_up_date = rawDate;
          }
          this.quickStatusData.branch = c.branch_name || c.branch || this.quickStatusData.branch || '';
          this.quickStatusData.department = c.department_name || c.department || this.quickStatusData.department || '';
          this.quickStatusData.assigned_employee = c.assigned_to || this.quickStatusData.assigned_employee || '';
          this.quickStatusData.loss_reason = c.loss_reason || this.quickStatusData.loss_reason || '';
        }
      }
    });
  }

  loadStatuses() {
    this.api.get('/system-settings/statuses').subscribe({
      next: (res: any) => {
        if (res.success) this.leadStatuses = res.data || [];
      }
    });
  }

  loadBranches() {
    this.api.get('/system-settings/branches').subscribe({
      next: (res: any) => {
        if (res.success) this.branches = res.data || [];
      }
    });
  }

  loadDepartments() {
    this.api.get('/system-settings/departments').subscribe({
      next: (res: any) => {
        if (res.success) this.departments = res.data || [];
      }
    });
  }

  loadTeam() {
    this.api.get('/settings/team').subscribe({
      next: (res: any) => {
        if (res.success) this.employees = res.data || [];
      }
    });
  }

  isTransferStatus(statusName: string): boolean {
    const found = this.leadStatuses.find(s => s.name === statusName);
    return found ? !!found.transfer : false;
  }

  isFollowupStatus(statusName: string): boolean {
    const found = this.leadStatuses.find(s => s.name === statusName);
    return found ? (found.follow_needed === 'Yes' || found.follow_needed === true || found.follow_needed === 1) : true;
  }

  getFilteredDepartments(branchName: string): any[] {
    if (!branchName) return this.departments;
    const b = this.branches.find(br => br.name === branchName);
    if (!b) return this.departments;
    return this.departments.filter(d => d.branch_id === b.id);
  }

  getFilteredEmployees(branchName: string, deptName: string): any[] {
    let filtered = this.employees;
    if (branchName) {
      const b = this.branches.find(br => br.name === branchName);
      if (b) filtered = filtered.filter(e => e.branch_id === b.id || e.branch === branchName);
    }
    if (deptName) {
      const d = this.departments.find(dp => dp.name === deptName);
      if (d) filtered = filtered.filter(e => e.department_id === d.id || e.department === deptName);
    }
    return filtered;
  }

  onViewProfile() {
    if (this.contactId) {
      const id = this.contactId;
      this.closeModal();
      // Add a slight delay so the current modal fully closes before the new one is triggered.
      setTimeout(() => {
        this.openProfile.emit(id);
      }, 100);
    }
  }

  saveStatus() {
    if (!this.contactId) return;
    this.loading = true;

    const selStatus = this.leadStatuses.find(s => s.name === this.quickStatusData.status);
    if (selStatus) {
      this.quickStatusData.status_id = selStatus.id;
      this.quickStatusData.status_name = selStatus.name;
    }

    const selBranch = this.branches.find(b => b.name === this.quickStatusData.branch);
    if (selBranch) {
      this.quickStatusData.branch_id = selBranch.id;
    }

    const selDept = this.departments.find(d => d.name === this.quickStatusData.department);
    if (selDept) {
      this.quickStatusData.department_id = selDept.id;
    }

    const updateData: any = {
      status_id: this.quickStatusData.status_id,
      status_name: this.quickStatusData.status || this.quickStatusData.status_name,
      remarks: this.quickStatusData.remark,
      follow_up_date: (this.isFollowupStatus(this.quickStatusData.status) && this.quickStatusData.follow_up_date) ? this.quickStatusData.follow_up_date : null,
      loss_reason: this.quickStatusData.status === 'Sales Loss' ? this.quickStatusData.loss_reason : null
    };

    if (this.isTransferStatus(this.quickStatusData.status)) {
      if (this.quickStatusData.branch_id) {
        updateData.branch_id = this.quickStatusData.branch_id;
        updateData.branch_name = this.quickStatusData.branch;
      }
      if (this.quickStatusData.department_id) {
        updateData.department_id = this.quickStatusData.department_id;
        updateData.department_name = this.quickStatusData.department;
      }
      if (this.quickStatusData.assigned_employee) {
        updateData.assigned_to = this.quickStatusData.assigned_employee;
      }
    }

    this.api.put(`/contacts/${this.contactId}`, updateData).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          Swal.fire({
            icon: 'success',
            title: 'Status Updated',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
          });
          this.saved.emit();
          this.closeModal();
        } else {
          Swal.fire('Error', res.message || 'Failed to update status', 'error');
        }
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'Failed to update status', 'error');
      }
    });
  }

  closeModal() {
    this.isOpen = false;
    this.close.emit();
  }
}
