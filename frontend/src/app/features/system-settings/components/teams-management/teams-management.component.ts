import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SystemSettingsService } from '../../../../core/services/system-settings.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-teams-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 1.5rem;">
      <h3 style="margin: 0; font-size: 1.5rem; font-weight: 600;">Agent Management</h3>
      <button class="btn btn-primary" (click)="openTeamModal()" style="display: flex; align-items: center; gap: 8px;">
        <i class="bi bi-plus-lg"></i> Add Agent
      </button>
    </div>

    <!-- Filters Section -->
    <div class="card border-0 shadow-sm mb-4" style="border-radius: 12px;">
      <div class="card-body p-3">
        <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 16px; align-items: center;">
          
          <!-- Search (Left side) -->
          <div style="flex: 1; max-width: 400px; min-width: 250px; position: relative;">
            <i class="bi bi-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b;"></i>
            <input type="text" class="form-control" placeholder="Search agent..." [(ngModel)]="searchTerm" style="padding-left: 40px; height: 42px; width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; color: #334155; outline: none;">
          </div>
          
          <!-- Filters (Right side) -->
          <div style="display: flex; gap: 16px;">
            <!-- Branch Filter -->
            <div style="width: 200px;">
              <select class="form-select" [(ngModel)]="filterBranchId" style="height: 42px; width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; color: #334155; padding: 0 12px; outline: none;">
                <option value="">All Branches</option>
                <option *ngFor="let b of branches" [value]="b.id">{{b.name}}</option>
              </select>
            </div>
            
            <!-- Department Filter -->
            <div style="width: 200px;">
              <select class="form-select" [(ngModel)]="filterDeptId" [disabled]="!filterBranchId" style="height: 42px; width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; color: #334155; padding: 0 12px; outline: none;">
                <option value="">All Departments</option>
                <option *ngFor="let d of departments" [value]="d.id" [hidden]="d.branch_id != filterBranchId">{{d.name}}</option>
              </select>
            </div>
          </div>

        </div>
      </div>
    </div>

    <div class="table-card mt-0">
      <table class="table">
        <thead>
          <tr>
            <th>AGENT</th>
            <th>BRANCH & DEPT</th>
            <th>EMAIL/USERNAME</th>
            <th>ROLE</th>
            <th>STATUS</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let member of filteredTeams">
            <td>
              <div class="d-flex align-items-center">
                <div class="avatar me-3">{{ member.name[0] | uppercase }}</div>
                <div>
                  <div class="fw-bold">{{ member.name }}</div>
                </div>
              </div>
            </td>
            <td>
              <div>{{ getBranchName(member.branch_id) }}</div>
              <small class="text-muted">{{ getDeptName(member.department_id) }}</small>
            </td>
            <td>{{ member.email }}</td>
            <td><span class="role-badge">{{ member.role | uppercase }}</span></td>
            <td>
              <span class="status-badge" [ngClass]="member.is_active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
                {{ member.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <button class="btn btn-icon text-primary me-2" (click)="editTeamModal(member)"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-icon text-danger" (click)="deleteTeam(member.id)"><i class="bi bi-trash"></i></button>
            </td>
          </tr>
          <tr *ngIf="filteredTeams.length === 0">
            <td colspan="6" class="text-center text-muted py-4">No agents found matching the filters.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Team Modal -->
    <div class="modal-backdrop" *ngIf="showTeamModal">
      <div class="modal-content" style="max-width: 600px;">
        <h4 style="margin-top: 0; margin-bottom: 24px; font-weight: 600;">{{ currentTeam.id ? 'Edit Agent' : 'Add Agent' }}</h4>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Branch</label>
            <select class="form-control" [(ngModel)]="currentTeam.branch_id" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
              <option value="">Select Branch</option>
              <option *ngFor="let b of branches" [value]="b.id">{{b.name}}</option>
            </select>
          </div>
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Department</label>
            <select class="form-control" [(ngModel)]="currentTeam.department_id" [disabled]="!currentTeam.branch_id" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
              <option value="">Select Department</option>
              <option *ngFor="let d of departments" [value]="d.id" [hidden]="d.branch_id != currentTeam.branch_id">{{d.name}}</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Agent Name</label>
            <input type="text" class="form-control" [(ngModel)]="currentTeam.name" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Username</label>
            <input type="text" class="form-control" [(ngModel)]="currentTeam.username" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Email</label>
            <input type="email" class="form-control" [(ngModel)]="currentTeam.email" [disabled]="currentTeam.id" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Password</label>
            <input type="password" class="form-control" [(ngModel)]="currentTeam.password" [placeholder]="currentTeam.id ? 'Leave blank to keep current' : ''" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Employee Code</label>
            <input type="text" class="form-control" [(ngModel)]="currentTeam.employee_code" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Designation</label>
            <select class="form-control" [(ngModel)]="currentTeam.designation_id" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
              <option value="">Select Designation</option>
              <option *ngFor="let des of designations" [value]="des.id">{{des.name}}</option>
            </select>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 24px;">
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Date of Joining</label>
            <input type="date" class="form-control" [(ngModel)]="currentTeam.date_of_joining" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Role</label>
            <select class="form-control" [(ngModel)]="currentTeam.role" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="agent">Agent</option>
            </select>
          </div>
          <div style="display: flex; align-items: flex-end;">
            <div style="display: flex; align-items: center; gap: 8px; padding-bottom: 10px;">
              <input type="checkbox" id="isActiveSwitch" [(ngModel)]="currentTeam.is_active" style="width: 18px; height: 18px;">
              <label for="isActiveSwitch" style="font-weight: 500; font-size: 0.9rem; cursor: pointer;">Is Active</label>
            </div>
          </div>
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
          <button class="btn btn-light" (click)="closeTeamModal()" style="padding: 10px 20px; border-radius: 8px; background: #f1f5f9; border: none; font-weight: 500;">Cancel</button>
          <button class="btn btn-primary" (click)="saveTeam()" style="padding: 10px 20px; border-radius: 8px; font-weight: 500;">Save Agent</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-card { background: #fff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); padding: 24px; }
    .table { width: 100%; margin-bottom: 0; color: #1e293b; border-collapse: collapse; }
    .table th { color: #64748b; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; text-align: left; }
    .table td { padding: 16px 12px; vertical-align: middle; border-bottom: 1px solid #f8fafc; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; background: #e0e7ff; color: #4f46e5; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 1.1rem; }
    .role-badge, .status-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
    .role-badge { background: #f1f5f9; color: #475569; }
    .btn-icon { padding: 6px; border-radius: 6px; border: none; background: transparent; transition: all 0.2s; }
    .btn-icon:hover { background: #f1f5f9; }
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); z-index: 1050; display: flex; align-items: center; justify-content: center; }
    .modal-content { background: #fff; border-radius: 16px; padding: 32px; width: 100%; max-width: 500px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border: none; }
  `]
})
export class TeamsManagementComponent implements OnInit {
  teams: any[] = [];
  branches: any[] = [];
  departments: any[] = [];
  designations: any[] = [];
  currentTeam: any = { branch_id: '', department_id: '', name: '', username: '', email: '', password: '', role: 'agent', is_active: true, employee_code: '', designation_id: '', date_of_joining: '' };
  showTeamModal: boolean = false;
  
  searchTerm: string = '';
  filterBranchId: string | number = '';
  filterDeptId: string | number = '';

  constructor(private settingsService: SystemSettingsService) {}

  ngOnInit() {
    this.loadBranches();
    this.loadDepartments();
    this.loadDesignations();
    this.loadTeams();
  }

  loadDesignations() {
    this.settingsService.getDesignations().subscribe({
      next: (res: any) => { if(res.success) this.designations = res.data; }
    });
  }

  loadBranches() {
    this.settingsService.getBranches().subscribe({
      next: (res: any) => { if(res.success) this.branches = res.data; }
    });
  }

  loadDepartments() {
    this.settingsService.getDepartments().subscribe({
      next: (res: any) => { if(res.success) this.departments = res.data; }
    });
  }

  loadTeams() {
    this.settingsService.getTeams().subscribe({
      next: (res: any) => { if(res.success) this.teams = res.data; }
    });
  }

  get filteredTeams() {
    return this.teams.filter(t => {
      let match = true;
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        match = t.name.toLowerCase().includes(term) || t.email.toLowerCase().includes(term);
      }
      if (match && this.filterBranchId) {
        match = t.branch_id == this.filterBranchId;
      }
      if (match && this.filterDeptId) {
        match = t.department_id == this.filterDeptId;
      }
      return match;
    });
  }

  getBranchName(id: number) { return this.branches.find(b => b.id == id)?.name || 'N/A'; }
  getDeptName(id: number) { return this.departments.find(d => d.id == id)?.name || 'N/A'; }

  openTeamModal() { 
    this.currentTeam = { branch_id: '', department_id: '', name: '', username: '', email: '', password: '', role: 'agent', is_active: true, employee_code: '', designation_id: '', date_of_joining: '' }; 
    this.showTeamModal = true; 
  }

  editTeamModal(team: any) {
    this.currentTeam = { ...team, password: '', date_of_joining: team.date_of_joining ? new Date(team.date_of_joining).toISOString().split('T')[0] : '' };
    this.showTeamModal = true;
  }

  closeTeamModal() { this.showTeamModal = false; }

  saveTeam() { 
    if (this.currentTeam.id) {
      this.settingsService.updateTeamMember(this.currentTeam.id, this.currentTeam).subscribe({
        next: (res: any) => {
          if (res.success) {
            Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Employee updated' });
            this.loadTeams();
            this.closeTeamModal();
          }
        },
        error: (err: any) => Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'error', title: err.error.message || 'Error updating employee' })
      });
    } else {
      this.settingsService.createTeamMember(this.currentTeam).subscribe({
        next: (res: any) => {
          if (res.success) {
            Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Employee added' });
            this.loadTeams();
            this.closeTeamModal();
          }
        },
        error: (err: any) => Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'error', title: err.error.message || 'Error adding employee' })
      });
    }
  }

  deleteTeam(id: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this employee!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.settingsService.deleteTeamMember(id).subscribe({
          next: (res: any) => {
            if (res.success) {
              Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Employee deleted' });
              this.loadTeams();
            }
          }
        });
      }
    });
  }
}
