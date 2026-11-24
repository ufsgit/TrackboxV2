import { showImpressiveSuccess } from '../../../../core/utils/impressive-alert';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SystemSettingsService } from '../../../../core/services/system-settings.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-visa-reason-category-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 1.5rem;">
      <div>
        <h3 style="margin: 0; font-size: 1.5rem; font-weight: 600; color: #0f172a;">
          <i class="bi bi-exclamation-octagon-fill text-danger me-2"></i>Visa Reason Category Management
        </h3>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 0.9rem;">
          Configure categorized refusal grounds, decline clauses, and official immigration rejection reasons (VISA-004).
        </p>
      </div>
      <button class="btn btn-primary" (click)="openModal()" style="display: flex; align-items: center; gap: 8px; border-radius: 8px; padding: 10px 18px; font-weight: 500;">
        <i class="bi bi-plus-lg"></i> Add Reason Category
      </button>
    </div>

    <!-- Filters Section -->
    <div class="card border-0 shadow-sm mb-4" style="border-radius: 12px;">
      <div class="card-body p-3">
        <div style="display: flex; align-items: center;">
          <div style="width: 320px; position: relative;">
            <i class="bi bi-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b;"></i>
            <input type="text" class="form-control" placeholder="Search reason category..." [(ngModel)]="searchTerm" style="padding-left: 40px; height: 42px; width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; color: #334155; outline: none;">
          </div>
        </div>
      </div>
    </div>

    <!-- Reason Categories Table -->
    <div class="table-card mt-0">
      <table class="table">
        <thead>
          <tr>
            <th style="width: 60px;">#</th>
            <th>REASON CATEGORY</th>
            <th>DESCRIPTION / CRITERIA</th>
            <th style="width: 120px;">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of filteredCategories; let i = index">
            <td>
              <span class="badge-idx">{{ i + 1 }}</span>
            </td>
            <td>
              <span class="fw-bold" style="color: #0f172a; display: inline-flex; align-items: center; gap: 8px;">
                <i class="bi bi-shield-exclamation text-danger"></i>
                {{ item.name }}
              </span>
            </td>
            <td class="text-muted">{{ item.description || 'No description provided' }}</td>
            <td>
              <button class="btn btn-icon text-primary me-2" (click)="editModal(item)" title="Edit Category">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-icon text-danger" (click)="deleteItem(item.id)" title="Delete Category">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
          <tr *ngIf="filteredCategories.length === 0">
            <td colspan="4" class="text-center text-muted py-4">No reason categories found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <div class="modal-backdrop" *ngIf="showModal">
      <div class="modal-content" style="max-width: 520px;">
        <h4 style="margin-top: 0; margin-bottom: 20px; font-weight: 600; color: #0f172a;">
          {{ currentItem.id ? 'Edit Reason Category' : 'Add New Reason Category' }}
        </h4>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.88rem; color: #334155;">Reason Category Name *</label>
          <input type="text" class="form-control" [(ngModel)]="currentItem.name" placeholder="e.g. Financial Inadequacy, GTE Requirement, English Proficiency" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
        </div>
        
        <div style="margin-bottom: 24px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.88rem; color: #334155;">Description & Criteria</label>
          <textarea class="form-control" [(ngModel)]="currentItem.description" rows="3" placeholder="Explain the refusal grounds, standard clauses, or criteria associated with this reason category..." style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;"></textarea>
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
          <button class="btn btn-light" (click)="closeModal()" style="padding: 10px 20px; border-radius: 8px; background: #f1f5f9; border: none; font-weight: 500;">Cancel</button>
          <button class="btn btn-primary" (click)="saveItem()" [disabled]="!currentItem.name?.trim()" style="padding: 10px 22px; border-radius: 8px; font-weight: 500;">Save Category</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-card { background: #fff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); padding: 24px; }
    .table { width: 100%; margin-bottom: 0; color: #1e293b; border-collapse: collapse; }
    .table th { color: #64748b; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; text-align: left; }
    .table td { padding: 16px 12px; vertical-align: middle; border-bottom: 1px solid #f8fafc; }
    .badge-idx { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: #f1f5f9; color: #64748b; font-weight: 700; font-size: 0.8rem; }
    .btn-icon { padding: 6px; border-radius: 6px; border: none; background: transparent; transition: all 0.2s; }
    .btn-icon:hover { background: #f1f5f9; }
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); z-index: 1050; display: flex; align-items: center; justify-content: center; }
    .modal-content { background: #fff; border-radius: 16px; padding: 32px; width: 100%; max-width: 520px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border: none; }
  `]
})
export class VisaReasonCategoryManagementComponent implements OnInit {
  categories: any[] = [];
  currentItem: any = { name: '', description: '' };
  showModal: boolean = false;
  searchTerm: string = '';

  constructor(private settingsService: SystemSettingsService) {}

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.settingsService.getVisaReasonCategories().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.categories = res.data;
        }
      },
      error: (err) => console.error('Failed to load visa reason categories:', err)
    });
  }

  get filteredCategories() {
    if (!this.searchTerm) return this.categories;
    const term = this.searchTerm.toLowerCase().trim();
    return this.categories.filter(c => 
      c.name?.toLowerCase().includes(term) || 
      c.description?.toLowerCase().includes(term)
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
      Swal.fire({ icon: 'warning', title: 'Required Field', text: 'Reason category name is required.' });
      return;
    }

    const payload = {
      name: this.currentItem.name.trim(),
      description: this.currentItem.description?.trim() || null
    };

    if (this.currentItem.id) {
      this.settingsService.updateVisaReasonCategory(this.currentItem.id, payload).subscribe({
        next: (res: any) => {
          if (res.success) {
            showImpressiveSuccess('Reason category updated successfully');
            this.loadCategories();
            this.closeModal();
          } else {
            Swal.fire({ icon: 'error', title: 'Error', text: res.message || 'Failed to update reason category' });
          }
        },
        error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Server error' })
      });
    } else {
      this.settingsService.createVisaReasonCategory(payload).subscribe({
        next: (res: any) => {
          if (res.success) {
            showImpressiveSuccess('Reason category created successfully');
            this.loadCategories();
            this.closeModal();
          } else {
            Swal.fire({ icon: 'error', title: 'Error', text: res.message || 'Failed to create reason category' });
          }
        },
        error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Server error' })
      });
    }
  }

  deleteItem(id: number) {
    Swal.fire({
      title: 'Delete Reason Category?',
      text: 'Are you sure you want to delete this reason category? Past visa records using this category will preserve their recorded notes.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.settingsService.deleteVisaReasonCategory(id).subscribe({
          next: (res: any) => {
            if (res.success) {
              showImpressiveSuccess('Reason category deleted');
              this.loadCategories();
            }
          },
          error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Failed to delete' })
        });
      }
    });
  }
}
