import { showImpressiveSuccess } from '../../../../core/utils/impressive-alert';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SystemSettingsService } from '../../../../core/services/system-settings.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-visa-type-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 1.5rem;">
      <div style="display: flex; align-items: center; gap: 14px;">
        <a routerLink="/system-settings" class="btn btn-light" style="display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; padding: 8px 14px; font-weight: 500; color: #475569; background: #fff; border: 1px solid #cbd5e1; text-decoration: none;" title="Back to Settings">
          <i class="bi bi-arrow-left"></i> Settings
        </a>
        <div>
          <h3 style="margin: 0; font-size: 1.5rem; font-weight: 600; color: #0f172a;">
            <i class="bi bi-passport text-primary me-2"></i>Visa Type Management
          </h3>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 0.9rem;">
            Configure visa classifications available across student applications, case records, and intake workflows.
          </p>
        </div>
      </div>
      <button class="btn btn-primary" (click)="openModal()" style="display: flex; align-items: center; gap: 8px; border-radius: 8px; padding: 10px 18px; font-weight: 500;">
        <i class="bi bi-plus-lg"></i> Add Visa Type
      </button>
    </div>

    <!-- Filters Section -->
    <div class="card border-0 shadow-sm mb-4" style="border-radius: 12px;">
      <div class="card-body p-3">
        <div style="display: flex; align-items: center;">
          <div style="width: 320px; position: relative;">
            <i class="bi bi-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b;"></i>
            <input type="text" class="form-control" placeholder="Search visa type..." [(ngModel)]="searchTerm" style="padding-left: 40px; height: 42px; width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; color: #334155; outline: none;">
          </div>
        </div>
      </div>
    </div>

    <!-- Types Table -->
    <div class="table-card mt-0">
      <table class="table">
        <thead>
          <tr>
            <th>VISA TYPE NAME</th>
            <th>DESCRIPTION</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of filteredVisaTypes">
            <td>
              <span class="fw-bold" style="color: #1e293b; display: inline-flex; align-items: center; gap: 8px;">
                <i class="bi bi-patch-check-fill text-primary"></i>
                {{ item.name }}
              </span>
            </td>
            <td class="text-muted">{{ item.description || 'No description provided' }}</td>
            <td>
              <button class="btn btn-icon text-primary me-2" (click)="editModal(item)" title="Edit Visa Type">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-icon text-danger" (click)="deleteItem(item.id)" title="Delete Visa Type">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
          <tr *ngIf="filteredVisaTypes.length === 0">
            <td colspan="3" class="text-center text-muted py-4">No visa types found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <div class="modal-backdrop" *ngIf="showModal">
      <div class="modal-content" style="max-width: 500px;">
        <h4 style="margin-top: 0; margin-bottom: 20px; font-weight: 600; color: #0f172a;">
          {{ currentItem.id ? 'Edit Visa Type' : 'Add New Visa Type' }}
        </h4>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.88rem; color: #334155;">Visa Type Name *</label>
          <input type="text" class="form-control" [(ngModel)]="currentItem.name" placeholder="e.g. Student Visa, Dependent Visa, Work Visa" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
        </div>
        
        <div style="margin-bottom: 24px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.88rem; color: #334155;">Description</label>
          <textarea class="form-control" [(ngModel)]="currentItem.description" rows="3" placeholder="Briefly describe who this visa subclass applies to..." style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;"></textarea>
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
          <button class="btn btn-light" (click)="closeModal()" style="padding: 10px 20px; border-radius: 8px; background: #f1f5f9; border: none; font-weight: 500;">Cancel</button>
          <button class="btn btn-primary" (click)="saveItem()" [disabled]="!currentItem.name?.trim()" style="padding: 10px 22px; border-radius: 8px; font-weight: 500;">Save Visa Type</button>
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
export class VisaTypeManagementComponent implements OnInit {
  visaTypes: any[] = [];
  currentItem: any = { name: '', description: '' };
  showModal: boolean = false;
  searchTerm: string = '';

  constructor(private settingsService: SystemSettingsService) {}

  ngOnInit() {
    this.loadVisaTypes();
  }

  loadVisaTypes() {
    this.settingsService.getVisaTypes().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.visaTypes = res.data;
        }
      },
      error: (err) => console.error('Failed to load visa types:', err)
    });
  }

  get filteredVisaTypes() {
    if (!this.searchTerm) return this.visaTypes;
    const term = this.searchTerm.toLowerCase().trim();
    return this.visaTypes.filter(t => 
      t.name?.toLowerCase().includes(term) || 
      t.description?.toLowerCase().includes(term)
    );
  }

  openModal() {
    this.currentItem = { name: '', description: '' };
    this.showModal = true;
  }

  editModal(item: any) {
    this.currentItem = { ...item };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveItem() {
    if (!this.currentItem.name || !this.currentItem.name.trim()) {
      Swal.fire({ icon: 'warning', title: 'Required Field', text: 'Visa type name is required.' });
      return;
    }

    if (this.currentItem.id) {
      this.settingsService.updateVisaType(this.currentItem.id, this.currentItem).subscribe({
        next: (res: any) => {
          if (res.success) {
            showImpressiveSuccess('Visa type updated successfully');
            this.loadVisaTypes();
            this.closeModal();
          } else {
            Swal.fire({ icon: 'error', title: 'Error', text: res.message || 'Failed to update visa type' });
          }
        },
        error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Server error' })
      });
    } else {
      this.settingsService.createVisaType(this.currentItem).subscribe({
        next: (res: any) => {
          if (res.success) {
            showImpressiveSuccess('Visa type created successfully');
            this.loadVisaTypes();
            this.closeModal();
          } else {
            Swal.fire({ icon: 'error', title: 'Error', text: res.message || 'Failed to create visa type' });
          }
        },
        error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Server error' })
      });
    }
  }

  deleteItem(id: number) {
    Swal.fire({
      title: 'Delete Visa Type?',
      text: 'Are you sure you want to delete this visa type? Existing visa cases will retain their recorded name.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.settingsService.deleteVisaType(id).subscribe({
          next: (res: any) => {
            if (res.success) {
              showImpressiveSuccess('Visa type deleted');
              this.loadVisaTypes();
            }
          },
          error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Failed to delete' })
        });
      }
    });
  }
}
