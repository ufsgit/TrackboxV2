import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../../core/services/api.service';
import { SystemSettingsService } from '../../../../../core/services/system-settings.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-bulk-transfer-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bulk-transfer-modal.component.html',
  styleUrls: ['./bulk-transfer-modal.component.css']
})
export class BulkTransferModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() selectedContactIds: Set<number> = new Set();
  @Input() isAllAcrossPages = false;
  @Input() totalLeads = 0;
  @Input() searchQuery = '';
  @Input() activeStatus = '';

  @Output() close = new EventEmitter<void>();
  @Output() transferCompleted = new EventEmitter<void>();

  loadingData = false;
  transferLoading = false;

  // Master data
  branches: any[] = [];
  departments: any[] = [];
  agents: any[] = [];
  leadStatuses: any[] = [];

  // Transfer Form State
  targetType: 'single' | 'split' = 'single';
  targetAgent: any = '';
  selectedBranch: string = '';
  selectedDepartment: string = '';
  selectedStatus: string = '';
  remarks: string = '';
  allocations: { userId: any; userName: string; count: number }[] = [];

  constructor(
    private api: ApiService,
    private settingsService: SystemSettingsService
  ) {}

  ngOnInit(): void {
    this.loadDependencies();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.resetForm();
      if (this.branches.length === 0) {
        this.loadDependencies();
      }
    }
  }

  loadDependencies(): void {
    this.loadingData = true;

    // Branches
    this.api.get('/system-settings/branches').subscribe({
      next: (res: any) => { if (res.success) this.branches = res.data || []; },
      error: () => {}
    });

    // Departments
    this.api.get('/system-settings/departments').subscribe({
      next: (res: any) => { if (res.success) this.departments = res.data || []; },
      error: () => {}
    });

    // Agents / Team
    this.api.get('/settings/team').subscribe({
      next: (res: any) => {
        if (res.success && Array.isArray(res.data)) {
          this.agents = res.data.filter((u: any) => u.status === 'Active' || u.status === 1 || u.status === undefined);
        }
      },
      error: () => {}
    });

    // Lead Statuses
    this.settingsService.getStatuses().subscribe({
      next: (res: any) => {
        if (res.success) this.leadStatuses = res.data || [];
        this.loadingData = false;
      },
      error: () => { this.loadingData = false; }
    });
  }

  resetForm(): void {
    this.targetType = 'single';
    this.targetAgent = '';
    this.selectedBranch = '';
    this.selectedDepartment = '';
    this.selectedStatus = '';
    this.remarks = '';
    this.allocations = [];
    this.transferLoading = false;
  }

  closeModal(): void {
    if (this.transferLoading) return;
    this.close.emit();
  }

  onBranchChange(): void {
    this.selectedDepartment = '';
    this.validateTargetAgent();
  }

  onDepartmentChange(): void {
    this.validateTargetAgent();
  }

  validateTargetAgent(): void {
    if (this.targetAgent) {
      const allowed = this.getFilteredEmployees();
      const stillValid = allowed.some(a => String(a.id) === String(this.targetAgent));
      if (!stillValid) {
        this.targetAgent = '';
      }
    }
  }

  getFilteredDepartments(): any[] {
    if (!this.selectedBranch) return this.departments;
    const branch = this.branches.find(b => String(b.id) === String(this.selectedBranch) || b.name === this.selectedBranch);
    const branchId = branch ? String(branch.id) : String(this.selectedBranch);
    const branchName = branch ? branch.name : this.selectedBranch;

    const matched = this.departments.filter(d => 
      (d.branch_id !== null && d.branch_id !== undefined && String(d.branch_id) === branchId) || 
      (d.branch_name && d.branch_name === branchName)
    );
    return matched.length > 0 ? matched : this.departments;
  }

  getFilteredEmployees(): any[] {
    let list = this.agents || [];
    if (!list || list.length === 0) return [];

    let branchId: string | null = null;
    let branchName: string | null = null;
    if (this.selectedBranch) {
      const branch = this.branches.find(b => String(b.id) === String(this.selectedBranch) || b.name === this.selectedBranch);
      branchId = branch ? String(branch.id) : String(this.selectedBranch);
      branchName = branch ? branch.name : this.selectedBranch;
    }

    let deptId: string | null = null;
    let deptName: string | null = null;
    if (this.selectedDepartment) {
      const dept = this.departments.find(d => String(d.id) === String(this.selectedDepartment) || d.name === this.selectedDepartment);
      deptId = dept ? String(dept.id) : String(this.selectedDepartment);
      deptName = dept ? dept.name : this.selectedDepartment;
    }

    if (branchId && deptId) {
      const matched = list.filter(e => {
        const matchB = (e.branch_id && String(e.branch_id) === branchId) || (e.branch_name && e.branch_name === branchName);
        const matchD = (e.department_id && String(e.department_id) === deptId) || (e.department_name && e.department_name === deptName);
        return matchB && matchD;
      });
      if (matched.length > 0) return matched;

      const deptOnly = list.filter(e => (e.department_id && String(e.department_id) === deptId) || (e.department_name && e.department_name === deptName));
      if (deptOnly.length > 0) return deptOnly;

      const branchOnly = list.filter(e => (e.branch_id && String(e.branch_id) === branchId) || (e.branch_name && e.branch_name === branchName));
      if (branchOnly.length > 0) return branchOnly;
    } else if (branchId) {
      const branchOnly = list.filter(e => (e.branch_id && String(e.branch_id) === branchId) || (e.branch_name && e.branch_name === branchName));
      if (branchOnly.length > 0) return branchOnly;
    } else if (deptId) {
      const deptOnly = list.filter(e => (e.department_id && String(e.department_id) === deptId) || (e.department_name && e.department_name === deptName));
      if (deptOnly.length > 0) return deptOnly;
    }

    return list;
  }

  addAllocation(): void {
    this.allocations.push({ userId: '', userName: '', count: 0 });
  }

  removeAllocation(index: number): void {
    this.allocations.splice(index, 1);
  }

  onAllocationUserChange(index: number): void {
    const alloc = this.allocations[index];
    if (alloc && alloc.userId) {
      const found = this.agents.find(a => String(a.id) === String(alloc.userId));
      alloc.userName = found ? found.name : '';
    }
  }

  autoDistributeCounts(): void {
    if (this.allocations.length === 0) return;
    const total = this.effectiveLeadCount;
    if (total <= 0) return;

    const base = Math.floor(total / this.allocations.length);
    let remainder = total % this.allocations.length;

    this.allocations.forEach((alloc) => {
      alloc.count = base + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;
    });
  }

  get effectiveLeadCount(): number {
    return this.isAllAcrossPages ? this.totalLeads : (this.selectedContactIds?.size || 0);
  }

  get totalAllocated(): number {
    return this.allocations.reduce((sum, a) => sum + (Number(a.count) || 0), 0);
  }

  get targetAgentObj(): any {
    if (!this.targetAgent) return null;
    return this.agents.find(a => String(a.id) === String(this.targetAgent)) || null;
  }

  get branchName(): string {
    if (!this.selectedBranch) return 'Keep Existing';
    const b = this.branches.find(br => String(br.id) === String(this.selectedBranch) || br.name === this.selectedBranch);
    return b ? b.name : this.selectedBranch;
  }

  get departmentName(): string {
    if (!this.selectedDepartment) return 'Keep Existing';
    const d = this.departments.find(dp => String(dp.id) === String(this.selectedDepartment) || dp.name === this.selectedDepartment);
    return d ? d.name : this.selectedDepartment;
  }

  get statusName(): string {
    if (!this.selectedStatus) return 'Keep Existing';
    const s = this.leadStatuses.find(st => String(st.id) === String(this.selectedStatus) || st.name === this.selectedStatus);
    return s ? s.name : this.selectedStatus;
  }

  executeTransfer(): void {
    if (this.transferLoading) return;

    if (this.effectiveLeadCount === 0) {
      Swal.fire('No Leads Selected', 'Please select at least one lead from the table to transfer.', 'warning');
      return;
    }

    if (this.targetType === 'single') {
      if (!this.targetAgent) {
        Swal.fire('Employee Required', 'Please choose the employee to receive the leads.', 'warning');
        return;
      }
    } else {
      const valid = this.allocations.filter(a => a.userId && Number(a.count) > 0);
      if (valid.length === 0) {
        Swal.fire('Allocation Required', 'Please add at least one employee with a lead count greater than 0.', 'warning');
        return;
      }
    }

    const proceedWithIds = (contactIds: number[]) => {
      const payload: any = {
        contact_ids: contactIds,
        remarks: this.remarks ? this.remarks.trim() : undefined
      };

      if (this.targetType === 'single') {
        payload.target_agent_id = this.targetAgent;
      } else {
        payload.allocations = this.allocations.filter(a => a.userId && Number(a.count) > 0);
      }

      if (this.selectedBranch) {
        const bObj = this.branches.find(b => String(b.id) === String(this.selectedBranch) || b.name === this.selectedBranch);
        payload.branch_id = bObj ? bObj.id : undefined;
        payload.branch_name = bObj ? bObj.name : this.selectedBranch;
      }
      if (this.selectedDepartment) {
        const dObj = this.departments.find(d => String(d.id) === String(this.selectedDepartment) || d.name === this.selectedDepartment);
        payload.department_id = dObj ? dObj.id : undefined;
        payload.department_name = dObj ? dObj.name : this.selectedDepartment;
      }
      if (this.selectedStatus) {
        const sObj = this.leadStatuses.find(s => String(s.id) === String(this.selectedStatus) || s.name === this.selectedStatus);
        payload.new_status_id = sObj ? sObj.id : undefined;
        payload.new_status_name = sObj ? sObj.name : this.selectedStatus;
      }

      const targetDesc = this.targetType === 'single'
        ? (this.targetAgentObj?.name || 'Selected Employee')
        : `${this.allocations.length} team members`;

      Swal.fire({
        title: 'Confirm Bulk Transfer',
        text: `Are you sure you want to transfer ${contactIds.length} lead(s) to ${targetDesc}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#4f46e5',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, Transfer Leads'
      }).then((result) => {
        if (result.isConfirmed) {
          this.transferLoading = true;
          this.api.post('/contacts/bulk-transfer', payload).subscribe({
            next: (res: any) => {
              this.transferLoading = false;
              if (res.success) {
                Swal.fire({
                  icon: 'success',
                  title: 'Transferred Successfully',
                  text: res.message || 'Leads have been reallocated.',
                  timer: 2500,
                  showConfirmButton: false
                });
                this.closeModal();
                this.transferCompleted.emit();
              } else {
                Swal.fire('Transfer Error', res.message || 'Failed to transfer leads.', 'error');
              }
            },
            error: (err: any) => {
              this.transferLoading = false;
              const msg = err.error?.message || err.message || 'Failed to transfer leads.';
              Swal.fire('Transfer Failed', msg, 'error');
            }
          });
        }
      });
    };

    // If "All Across Pages" is selected, fetch all IDs from server matching the current filters
    if (this.isAllAcrossPages) {
      this.transferLoading = true;
      const queryParams: any = {
        limit: 10000,
        page: 1
      };
      if (this.searchQuery && this.searchQuery.trim()) {
        queryParams.search = this.searchQuery.trim();
      }
      if (this.activeStatus) {
        queryParams.status = this.activeStatus;
      }

      this.api.get('/contacts', queryParams).subscribe({
        next: (res: any) => {
          this.transferLoading = false;
          const leadsList = res.data?.contacts || res.data || [];
          const allIds = leadsList.map((c: any) => c.id).filter(Boolean);
          if (allIds.length === 0) {
            Swal.fire('No Leads Found', 'No leads matched the current filter to transfer.', 'warning');
            return;
          }
          proceedWithIds(allIds);
        },
        error: (err) => {
          this.transferLoading = false;
          Swal.fire('Error', 'Failed to retrieve all leads for transfer.', 'error');
        }
      });
    } else {
      proceedWithIds(Array.from(this.selectedContactIds));
    }
  }
}
