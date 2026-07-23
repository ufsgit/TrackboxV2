import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SystemSettingsService } from '../../../../core/services/system-settings.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-status-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 1.5rem;">
      <h3 style="margin: 0; font-size: 1.5rem; font-weight: 600;">Lead Status</h3>
      <button class="btn btn-primary" (click)="openStatusModal()" style="display: flex; align-items: center; gap: 8px;">
        <i class="bi bi-plus-lg"></i> Add Status
      </button>
    </div>

    <!-- Filters Section -->
    <div class="card border-0 shadow-sm mb-4" style="border-radius: 12px;">
      <div class="card-body p-3">
        <div style="display: flex; align-items: center;">
          <!-- Search -->
          <div style="width: 300px; position: relative;">
            <i class="bi bi-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b;"></i>
            <input type="text" class="form-control" placeholder="Search status..." [(ngModel)]="searchTerm" style="padding-left: 40px; height: 42px; width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; color: #334155; outline: none;">
          </div>
        </div>
      </div>
    </div>

    <div class="table-card mt-0">
      <table class="table">
        <thead>
          <tr>
            <th>STATUS NAME</th>
            <th>TYPE</th>
            <th>COLOR</th>
            <th>FOLLOW-UP REQUIRED</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let status of filteredStatuses">
            <td class="fw-bold">
              <span class="status-badge" [ngStyle]="{'background-color': status.color + '20', 'color': status.color}">
                {{ status.name }}
              </span>
            </td>
            <td>
              <span *ngIf="status.type" class="badge" [ngStyle]="{'background': status.type === 'sale' ? '#10B981' : '#EF4444'}">
                {{ status.type === 'sale' ? 'Sale' : 'Sale Lost' }}
              </span>
              <span *ngIf="!status.type" style="color:#94a3b8;">—</span>
            </td>
            <td><code>{{ status.color }}</code></td>
            <td style="color: #334155; font-weight: 500;">
              {{ status.follow_needed || 'N/A' }}
            </td>
            <td>
              <button class="btn btn-icon text-primary me-2" (click)="editStatusModal(status)"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-icon text-danger" (click)="deleteStatus(status.id)"><i class="bi bi-trash"></i></button>
            </td>
          </tr>
          <tr *ngIf="statuses.length === 0">
            <td colspan="4" class="text-center text-muted py-4">No statuses found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Status Modal -->
    <div class="modal-backdrop" *ngIf="showStatusModal">
      <div class="modal-content" style="max-width: 600px;">
        <h4 style="margin-top: 0; margin-bottom: 24px; font-weight: 600;">{{ currentStatus.id ? 'Edit Status' : 'Add Status' }}</h4>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Status Name</label>
          <input type="text" class="form-control" [(ngModel)]="currentStatus.name" placeholder="e.g. Won, Follow-up" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
        </div>

        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Type</label>
          <select class="form-control" [(ngModel)]="currentStatus.type" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
            <option value="">-- Select Type --</option>
            <option value="sale">Sale</option>
            <option value="sale_lost">Sale Lost</option>
          </select>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Color Code (Hex)</label>
            <div style="display: flex; gap: 8px;">
              <input type="color" class="form-control" [(ngModel)]="currentStatus.color" style="padding: 2px; width: 42px; height: 42px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
              <input type="text" class="form-control" [(ngModel)]="currentStatus.color" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; flex: 1;">
            </div>
          </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-top: 10px;">
                <input type="checkbox" id="followUpCheck" [ngModel]="currentStatus.follow_needed === 'Yes'" (ngModelChange)="currentStatus.follow_needed = $event ? 'Yes' : 'No'" style="width: 18px; height: 18px;">
                <label for="followUpCheck" style="font-weight: 500; font-size: 0.9rem; cursor: pointer;">Follow-up Required?</label>
              </div>
              <div style="display: flex; align-items: center; gap: 8px; margin-top: 10px;">
                <input type="checkbox" id="transferCheck" [(ngModel)]="currentStatus.transfer" style="width: 18px; height: 18px;">
                <label for="transferCheck" style="font-weight: 500; font-size: 0.9rem; cursor: pointer;">Transfer to Department?</label>
              </div>
              
              <div *ngIf="currentStatus.transfer" style="margin-top: 16px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Select Department</label>
                <select class="form-control" [(ngModel)]="currentStatus.department_id" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
                  <option value="">Select Department</option>
                  <option *ngFor="let d of departments" [value]="d.id">{{d.name}}</option>
                </select>
              </div>
            </div>
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
          <button class="btn btn-light" (click)="closeStatusModal()" style="padding: 10px 20px; border-radius: 8px; background: #f1f5f9; border: none; font-weight: 500;">Cancel</button>
          <button class="btn btn-primary" (click)="saveStatus()" style="padding: 10px 20px; border-radius: 8px; font-weight: 500;">Save Status</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-card { background: #fff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); padding: 24px; }
    .table { width: 100%; margin-bottom: 0; color: #1e293b; border-collapse: collapse; }
    .table th { color: #64748b; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; text-align: left; }
    .table td { padding: 16px 12px; vertical-align: middle; border-bottom: 1px solid #f8fafc; }
    .status-badge { padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; display: inline-block; }
    .badge { padding: 6px 12px; color: white; border-radius: 20px; font-weight: 500; font-size: 0.8rem; }
    .btn-icon { padding: 6px; border-radius: 6px; border: none; background: transparent; transition: all 0.2s; }
    .btn-icon:hover { background: #f1f5f9; }
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); z-index: 1050; display: flex; align-items: center; justify-content: center; }
    .modal-content { background: #fff; border-radius: 16px; padding: 32px; width: 100%; max-width: 500px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border: none; }
  `]
})
export class StatusManagementComponent implements OnInit {
  statuses: any[] = [];
  departments: any[] = [];
  currentStatus: any = { name: '', color: '#4F46E5', follow_needed: 'Yes', sequence: 0, transfer: false, department_id: '', type: '' };
  showStatusModal: boolean = false;
  searchTerm: string = '';

  constructor(private settingsService: SystemSettingsService) {}

  ngOnInit() {
    this.loadStatuses();
    this.loadDepartments();
  }

  loadStatuses() {
    this.settingsService.getStatuses().subscribe({
      next: (res: any) => { if (res.success) this.statuses = res.data; }
    });
  }

  loadDepartments() {
    this.settingsService.getDepartments().subscribe({
      next: (res: any) => { if (res.success) this.departments = res.data; }
    });
  }

  get filteredStatuses() {
    if (!this.searchTerm) return this.statuses;
    const term = this.searchTerm.toLowerCase();
    return this.statuses.filter(s => s.name.toLowerCase().includes(term));
  }

  openStatusModal() { this.currentStatus = { name: '', color: '#4F46E5', follow_needed: 'Yes', sequence: 0, transfer: false, department_id: '', type: '' }; this.showStatusModal = true; }
  editStatusModal(status: any) { this.currentStatus = { ...status, transfer: !!status.transfer }; this.showStatusModal = true; }
  closeStatusModal() { this.showStatusModal = false; }

  saveStatus() { 
    if (this.currentStatus.id) {
      this.settingsService.updateStatus(this.currentStatus.id, this.currentStatus).subscribe({
        next: (res: any) => {
          if (res.success) {
            Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Status updated' });
            this.loadStatuses();
            this.closeStatusModal();
          }
        }
      });
    } else {
      this.settingsService.createStatus(this.currentStatus).subscribe({
        next: (res: any) => {
          if (res.success) {
            Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Status added' });
            this.loadStatuses();
            this.closeStatusModal();
          }
        }
      });
    }
  }

  deleteStatus(id: number) {
    Swal.fire({ title: 'Are you sure?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes, delete it!' })
    .then((result) => {
      if (result.isConfirmed) {
        this.settingsService.deleteStatus(id).subscribe({
          next: (res: any) => {
            if (res.success) {
              Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Status deleted' });
              this.loadStatuses();
            }
          }
        });
      }
    });
  }
}

