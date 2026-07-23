import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SystemSettingsService } from '../../../../core/services/system-settings.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-department-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 1.5rem;">
      <h3 style="margin: 0; font-size: 1.5rem; font-weight: 600;">Department Management</h3>
      <button class="btn btn-primary" (click)="openDeptModal()" style="display: flex; align-items: center; gap: 8px;">
        <i class="bi bi-plus-lg"></i> Add Department
      </button>
    </div>

    <!-- Filters Section -->
    <div class="card border-0 shadow-sm mb-4" style="border-radius: 12px;">
      <div class="card-body p-3">
        <div style="display: flex; align-items: center;">
          <!-- Search -->
          <div style="width: 300px; position: relative;">
            <i class="bi bi-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b;"></i>
            <input type="text" class="form-control" placeholder="Search department..." [(ngModel)]="searchTerm" style="padding-left: 40px; height: 42px; width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; color: #334155; outline: none;">
          </div>
        </div>
      </div>
    </div>

    <div class="table-card mt-0">
      <table class="table">
        <thead>
          <tr>
            <th>DEPARTMENT NAME</th>
            <th>BRANCH</th>
            <th>DESCRIPTION</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let dept of filteredDepartments">
            <td class="fw-bold">{{ dept.name }}</td>
            <td>{{ getBranchName(dept.branch_id) }}</td>
            <td class="text-muted">{{ dept.description || 'No description' }}</td>
            <td>
              <button class="btn btn-icon text-primary me-2" (click)="editDeptModal(dept)"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-icon text-danger" (click)="deleteDepartment(dept.id)"><i class="bi bi-trash"></i></button>
            </td>
          </tr>
          <tr *ngIf="departments.length === 0">
            <td colspan="4" class="text-center text-muted py-4">No departments found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Department Modal -->
    <div class="modal-backdrop" *ngIf="showDeptModal">
      <div class="modal-content" style="max-width: 600px;">
        <h4 style="margin-top: 0; margin-bottom: 24px; font-weight: 600;">{{ currentDept.id ? 'Edit Department' : 'Add Department' }}</h4>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Branch</label>
            <select class="form-control" [(ngModel)]="currentDept.branch_id" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
              <option value="">Select Branch</option>
              <option *ngFor="let b of branches" [value]="b.id">{{b.name}}</option>
            </select>
          </div>
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Department Name</label>
            <input type="text" class="form-control" [(ngModel)]="currentDept.name" placeholder="e.g. Sales" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
          </div>
        </div>
        
        <div style="margin-bottom: 24px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Description</label>
          <textarea class="form-control" [(ngModel)]="currentDept.description" rows="3" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;"></textarea>
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
          <button class="btn btn-light" (click)="closeDeptModal()" style="padding: 10px 20px; border-radius: 8px; background: #f1f5f9; border: none; font-weight: 500;">Cancel</button>
          <button class="btn btn-primary" (click)="saveDepartment()" style="padding: 10px 20px; border-radius: 8px; font-weight: 500;">Save Department</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-card { background: #fff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); padding: 24px; }
    .table { width: 100%; margin-bottom: 0; color: #1e293b; border-collapse: collapse; }
    .table th { color: #64748b; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; text-align: left; }
    .table td { padding: 16px 12px; vertical-align: middle; border-bottom: 1px solid #f8fafc; }
    .btn-icon { padding: 6px; border-radius: 6px; border: none; background: transparent; transition: all 0.2s; }
    .btn-icon:hover { background: #f1f5f9; }
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); z-index: 1050; display: flex; align-items: center; justify-content: center; }
    .modal-content { background: #fff; border-radius: 16px; padding: 32px; width: 100%; max-width: 500px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border: none; }
  `]
})
export class DepartmentManagementComponent implements OnInit {
  departments: any[] = [];
  branches: any[] = [];
  currentDept: any = { branch_id: '', name: '', description: '' };
  showDeptModal: boolean = false;
  searchTerm: string = '';

  constructor(private settingsService: SystemSettingsService) {}

  ngOnInit() {
    this.loadBranches();
    this.loadDepartments();
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

  get filteredDepartments() {
    if (!this.searchTerm) return this.departments;
    const term = this.searchTerm.toLowerCase();
    return this.departments.filter(d => d.name.toLowerCase().includes(term));
  }

  getBranchName(id: number) { return this.branches.find(b => b.id == id)?.name || 'N/A'; }

  openDeptModal() { this.currentDept = { branch_id: '', name: '', description: '' }; this.showDeptModal = true; }
  editDeptModal(dept: any) { this.currentDept = { ...dept }; this.showDeptModal = true; }
  closeDeptModal() { this.showDeptModal = false; }

  saveDepartment() { 
    if (this.currentDept.id) {
      this.settingsService.updateDepartment(this.currentDept.id, this.currentDept).subscribe({
        next: (res: any) => {
          if (res.success) {
            Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Department updated' });
            this.loadDepartments();
            this.closeDeptModal();
          }
        }
      });
    } else {
      this.settingsService.createDepartment(this.currentDept).subscribe({
        next: (res: any) => {
          if (res.success) {
            Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Department added' });
            this.loadDepartments();
            this.closeDeptModal();
          }
        }
      });
    }
  }

  deleteDepartment(id: number) {
    Swal.fire({ title: 'Are you sure?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes, delete it!' })
    .then((result) => {
      if (result.isConfirmed) {
        this.settingsService.deleteDepartment(id).subscribe({
          next: (res: any) => {
            if (res.success) {
              Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Department deleted' });
              this.loadDepartments();
            }
          }
        });
      }
    });
  }
}

