import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SystemSettingsService } from '../../../../core/services/system-settings.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-branch-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 1.5rem;">
      <h3 style="margin: 0; font-size: 1.5rem; font-weight: 600;">Branch Management</h3>
      <button class="btn btn-primary" (click)="openBranchModal()" style="display: flex; align-items: center; gap: 8px;">
        <i class="bi bi-plus-lg"></i> Add Branch
      </button>
    </div>

    <!-- Filters Section -->
    <div class="card border-0 shadow-sm mb-4" style="border-radius: 12px;">
      <div class="card-body p-3">
        <div style="display: flex; align-items: center;">
          <!-- Search -->
          <div style="width: 300px; position: relative;">
            <i class="bi bi-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b;"></i>
            <input type="text" class="form-control" placeholder="Search branch..." [(ngModel)]="searchTerm" style="padding-left: 40px; height: 42px; width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; color: #334155; outline: none;">
          </div>
        </div>
      </div>
    </div>

    <div class="table-card mt-0">
      <table class="table">
        <thead>
          <tr>
            <th>BRANCH NAME</th>
            <th>BRANCH CODE</th>
            <th>LOCATION</th>
            <th>PHONE</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let branch of filteredBranches">
            <td class="fw-bold">{{ branch.name }}</td>
            <td><span class="code-badge">{{ branch.code || 'N/A' }}</span></td>
            <td class="text-muted">{{ branch.location || 'N/A' }}</td>
            <td class="text-muted">{{ branch.phone || 'N/A' }}</td>
            <td>
              <button class="btn btn-icon text-primary me-2" (click)="editBranchModal(branch)"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-icon text-danger" (click)="deleteBranch(branch.id)"><i class="bi bi-trash"></i></button>
            </td>
          </tr>
          <tr *ngIf="branches.length === 0">
            <td colspan="5" class="text-center text-muted py-4">No branches found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Branch Modal -->
    <div class="modal-backdrop" *ngIf="showBranchModal">
      <div class="modal-content" style="max-width: 600px;">
        <h4 style="margin-top: 0; margin-bottom: 24px; font-weight: 600;">{{ currentBranch.id ? 'Edit Branch' : 'Add Branch' }}</h4>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Branch Name</label>
            <input type="text" class="form-control" [(ngModel)]="currentBranch.name" placeholder="e.g. Main Office" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Branch Code</label>
            <input type="text" class="form-control" [(ngModel)]="currentBranch.code" placeholder="e.g. MN-01" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Location</label>
          <input type="text" class="form-control" [(ngModel)]="currentBranch.location" placeholder="e.g. 123 Main St, New York" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
        </div>
        
        <div style="margin-bottom: 24px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Phone</label>
          <input type="text" class="form-control" [(ngModel)]="currentBranch.phone" placeholder="e.g. +1 234 567 8900" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
          <button class="btn btn-light" (click)="closeBranchModal()" style="padding: 10px 20px; border-radius: 8px; background: #f1f5f9; border: none; font-weight: 500;">Cancel</button>
          <button class="btn btn-primary" (click)="saveBranch()" style="padding: 10px 20px; border-radius: 8px; font-weight: 500;">Save Branch</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-card { background: #fff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); padding: 24px; }
    .table { width: 100%; margin-bottom: 0; color: #1e293b; border-collapse: collapse; }
    .table th { color: #64748b; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; text-align: left; }
    .table td { padding: 16px 12px; vertical-align: middle; border-bottom: 1px solid #f8fafc; }
    .code-badge { padding: 4px 10px; background: #f1f5f9; color: #475569; border-radius: 6px; font-size: 0.75rem; font-weight: 600; font-family: monospace; }
    .btn-icon { padding: 6px; border-radius: 6px; border: none; background: transparent; transition: all 0.2s; }
    .btn-icon:hover { background: #f1f5f9; }
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); z-index: 1050; display: flex; align-items: center; justify-content: center; }
    .modal-content { background: #fff; border-radius: 16px; padding: 32px; width: 100%; max-width: 500px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border: none; }
  `]
})
export class BranchManagementComponent implements OnInit {
  branches: any[] = [];
  currentBranch: any = { name: '', code: '', location: '', phone: '' };
  showBranchModal: boolean = false;
  searchTerm: string = '';

  constructor(private settingsService: SystemSettingsService) {}

  ngOnInit() {
    this.loadBranches();
  }

  loadBranches() {
    this.settingsService.getBranches().subscribe({
      next: (res: any) => { if(res.success) this.branches = res.data; }
    });
  }

  get filteredBranches() {
    if (!this.searchTerm) return this.branches;
    const term = this.searchTerm.toLowerCase();
    return this.branches.filter(b => b.name.toLowerCase().includes(term) || (b.code && b.code.toLowerCase().includes(term)));
  }

  openBranchModal() { this.currentBranch = { name: '', code: '', location: '', phone: '' }; this.showBranchModal = true; }
  editBranchModal(branch: any) { this.currentBranch = { ...branch }; this.showBranchModal = true; }
  closeBranchModal() { this.showBranchModal = false; }

  saveBranch() { 
    if (this.currentBranch.id) {
      this.settingsService.updateBranch(this.currentBranch.id, this.currentBranch).subscribe({
        next: (res: any) => {
          if (res.success) {
            Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Branch updated' });
            this.loadBranches();
            this.closeBranchModal();
          }
        }
      });
    } else {
      this.settingsService.createBranch(this.currentBranch).subscribe({
        next: (res: any) => {
          if (res.success) {
            Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Branch added' });
            this.loadBranches();
            this.closeBranchModal();
          }
        }
      });
    }
  }

  deleteBranch(id: number) {
    Swal.fire({ title: 'Are you sure?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes, delete it!' })
    .then((result) => {
      if (result.isConfirmed) {
        this.settingsService.deleteBranch(id).subscribe({
          next: (res: any) => {
            if (res.success) {
              Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Branch deleted' });
              this.loadBranches();
            }
          }
        });
      }
    });
  }
}
