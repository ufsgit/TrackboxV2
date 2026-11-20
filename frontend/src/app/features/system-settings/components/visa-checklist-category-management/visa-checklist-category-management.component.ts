import { showImpressiveSuccess } from '../../../../core/utils/impressive-alert';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SystemSettingsService } from '../../../../core/services/system-settings.service';
import Swal from 'sweetalert2';

export interface VisaChecklistCategory {
  id?: number;
  name: string;
  description?: string;
  is_active?: boolean | number;
}

@Component({
  selector: 'app-visa-checklist-category-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <!-- Top Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 12px;">
      <div style="display: flex; align-items: center; gap: 14px;">
        <a routerLink="/system-settings" class="btn btn-light" style="display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; padding: 8px 14px; font-weight: 500; color: #475569; background: #fff; border: 1px solid #cbd5e1; text-decoration: none;" title="Back to Settings">
          <i class="bi bi-arrow-left"></i> Settings
        </a>
        <div>
          <h3 style="margin: 0; font-size: 1.5rem; font-weight: 600; color: #0f172a; display: flex; align-items: center; gap: 8px;">
            <i class="bi bi-tags-fill text-success"></i> Checklist Category Management
            <span style="font-size: 0.72rem; padding: 3px 8px; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; border-radius: 6px; font-weight: 600;">VISA-003</span>
          </h3>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 0.9rem;">
            Configure categorized groups for pre-departure checklist requirements (Orientation, Travel, Insurance, etc.).
          </p>
        </div>
      </div>
      <button class="btn btn-primary" (click)="openModal()" style="display: flex; align-items: center; gap: 8px; border-radius: 8px; padding: 10px 18px; font-weight: 600; background: #059669; border: none; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);">
        <i class="bi bi-plus-lg"></i> Add Category
      </button>
    </div>

    <!-- Filters Section -->
    <div class="card border-0 shadow-sm mb-4" style="border-radius: 12px; background: #fff;">
      <div class="card-body p-3">
        <div style="display: flex; align-items: center;">
          <div style="width: 320px; position: relative;">
            <i class="bi bi-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b;"></i>
            <input 
              type="text" 
              class="form-control" 
              placeholder="Search category name..." 
              [(ngModel)]="searchTerm" 
              style="padding-left: 40px; height: 42px; width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; color: #334155; outline: none; font-size: 0.9rem;">
          </div>
        </div>
      </div>
    </div>

    <!-- Categories Table -->
    <div class="table-card mt-0" style="background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
      <table class="table" style="margin: 0; width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
            <th style="width: 60px; padding: 14px 16px; font-size: 0.75rem; font-weight: 700; color: #64748b; letter-spacing: 0.05em; text-transform: uppercase;">#</th>
            <th style="width: 260px; padding: 14px 16px; font-size: 0.75rem; font-weight: 700; color: #64748b; letter-spacing: 0.05em; text-transform: uppercase;">CATEGORY NAME</th>
            <th style="padding: 14px 16px; font-size: 0.75rem; font-weight: 700; color: #64748b; letter-spacing: 0.05em; text-transform: uppercase;">DESCRIPTION & CRITERIA</th>
            <th style="width: 110px; padding: 14px 16px; font-size: 0.75rem; font-weight: 700; color: #64748b; letter-spacing: 0.05em; text-transform: uppercase; text-align: right;">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of filteredCategories; let i = index" style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease;">
            <!-- # -->
            <td style="padding: 14px 16px;">
              <span class="badge-idx" style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 6px; background: #f1f5f9; color: #475569; font-weight: 700; font-size: 0.8rem; border: 1px solid #cbd5e1;">
                {{ i + 1 }}
              </span>
            </td>

            <!-- Category Name -->
            <td style="padding: 14px 16px;">
              <span class="fw-bold" style="color: #0f172a; display: inline-flex; align-items: center; gap: 8px; font-size: 0.92rem;">
                <span [style.background]="getCategoryBg(item.name)" [style.color]="getCategoryColor(item.name)" [style.border]="'1px solid ' + getCategoryBorder(item.name)" style="padding: 5px 12px; border-radius: 6px; font-size: 0.82rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
                  <i class="bi" [ngClass]="getCategoryIcon(item.name)"></i>
                  {{ item.name }}
                </span>
              </span>
            </td>

            <!-- Description -->
            <td style="padding: 14px 16px; color: #64748b; font-size: 0.88rem;">
              {{ item.description || 'No description provided' }}
            </td>

            <!-- Actions -->
            <td style="padding: 14px 16px; text-align: right;">
              <button class="btn btn-icon text-primary me-2" (click)="editModal(item)" title="Edit Category" style="background: none; border: none; cursor: pointer; color: #2563eb; padding: 6px 8px; border-radius: 6px;">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-icon text-danger" (click)="deleteItem(item.id!)" title="Delete Category" style="background: none; border: none; cursor: pointer; color: #dc2626; padding: 6px 8px; border-radius: 6px;">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>

          <!-- Empty State -->
          <tr *ngIf="filteredCategories.length === 0">
            <td colspan="4" style="text-align: center; color: #64748b; padding: 48px 16px;">
              <i class="bi bi-tags" style="font-size: 2.2rem; color: #94a3b8; display: block; margin-bottom: 8px;"></i>
              <div style="font-weight: 600; font-size: 1rem; color: #334155;">No checklist categories found</div>
              <div style="font-size: 0.85rem; color: #94a3b8; margin-top: 4px;">Click "+ Add Category" above to create a new category.</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <div *ngIf="showModal" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px;">
      <div style="background: #ffffff; border-radius: 16px; width: 100%; max-width: 520px; box-shadow: 0 20px 40px rgba(0,0,0,0.15); border: 1px solid #e2e8f0; overflow: hidden; animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);">
        
        <!-- Modal Header -->
        <div style="padding: 18px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 8px; background: #ecfdf5; color: #059669; display: flex; align-items: center; justify-content: center; font-size: 1.15rem;">
              <i class="bi bi-tags"></i>
            </div>
            <div>
              <h5 style="margin: 0; font-weight: 700; color: #0f172a; font-size: 1.15rem;">
                {{ currentItem.id ? 'Edit Checklist Category' : 'Add Checklist Category' }}
              </h5>
              <span style="font-size: 0.78rem; color: #64748b;">VISA-003 Pre-Departure Requirement Category</span>
            </div>
          </div>
          <button type="button" (click)="closeModal()" style="background: none; border: none; font-size: 1.25rem; color: #94a3b8; cursor: pointer; line-height: 1; padding: 4px;">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <!-- Modal Body -->
        <div style="padding: 24px;">
          <!-- Name -->
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 0.88rem; color: #334155;">
              Category Name <span style="color: #dc2626;">*</span>
            </label>
            <input 
              type="text" 
              class="form-control" 
              [(ngModel)]="currentItem.name" 
              placeholder="e.g. Orientation, Travel, Insurance, Housing, Finance" 
              style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; font-size: 0.9rem; color: #1e293b; outline: none;">
          </div>

          <!-- Description -->
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 0.88rem; color: #334155;">
              Description & Scope
            </label>
            <textarea 
              class="form-control" 
              [(ngModel)]="currentItem.description" 
              rows="3" 
              placeholder="Briefly describe what requirements fall under this category..." 
              style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; font-size: 0.9rem; color: #1e293b; outline: none; resize: vertical;"></textarea>
          </div>
        </div>

        <!-- Modal Footer -->
        <div style="padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 12px;">
          <button 
            type="button" 
            class="btn btn-light" 
            (click)="closeModal()" 
            style="padding: 9px 18px; border-radius: 8px; background: #fff; border: 1px solid #cbd5e1; font-weight: 600; color: #475569;">
            Cancel
          </button>
          <button 
            type="button" 
            class="btn btn-primary" 
            (click)="saveItem()" 
            [disabled]="!currentItem.name || !currentItem.name.trim() || saving" 
            style="padding: 9px 22px; border-radius: 8px; background: #059669; border: none; font-weight: 600; color: #fff; box-shadow: 0 2px 6px rgba(5,150,105,0.3);">
            <i class="bi bi-check-lg me-1" *ngIf="!saving"></i>
            {{ saving ? 'Saving...' : (currentItem.id ? 'Update Category' : 'Save Category') }}
          </button>
        </div>

      </div>
    </div>
  `
})
export class VisaChecklistCategoryManagementComponent implements OnInit {
  categories: VisaChecklistCategory[] = [];
  searchTerm: string = '';
  showModal: boolean = false;
  saving: boolean = false;

  currentItem: VisaChecklistCategory = {
    name: '',
    description: ''
  };

  constructor(private systemSettingsService: SystemSettingsService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.systemSettingsService.getVisaChecklistCategories().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.categories = res.data;
        }
      },
      error: (err: any) => {
        console.error('Error loading checklist categories:', err);
      }
    });
  }

  get filteredCategories(): VisaChecklistCategory[] {
    if (!this.searchTerm.trim()) {
      return this.categories;
    }
    const q = this.searchTerm.toLowerCase().trim();
    return this.categories.filter(c =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  }

  openModal(): void {
    this.currentItem = {
      name: '',
      description: ''
    };
    this.showModal = true;
  }

  editModal(item: VisaChecklistCategory): void {
    this.currentItem = {
      id: item.id,
      name: item.name,
      description: item.description || ''
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveItem(): void {
    if (!this.currentItem.name || !this.currentItem.name.trim()) return;

    this.saving = true;
    const payload = {
      name: this.currentItem.name.trim(),
      description: this.currentItem.description?.trim() || null
    };

    if (this.currentItem.id) {
      this.systemSettingsService.updateVisaChecklistCategory(this.currentItem.id, payload).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          showImpressiveSuccess('Category Updated!', 'Checklist category updated successfully.');
          this.loadCategories();
        },
        error: (err: any) => {
          this.saving = false;
          Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Failed to update category' });
        }
      });
    } else {
      this.systemSettingsService.createVisaChecklistCategory(payload).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          showImpressiveSuccess('Category Created!', 'New checklist category added successfully.');
          this.loadCategories();
        },
        error: (err: any) => {
          this.saving = false;
          Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Failed to create category' });
        }
      });
    }
  }

  deleteItem(id: number): void {
    Swal.fire({
      title: 'Delete Category?',
      text: 'Are you sure you want to delete this checklist category? Requirements using this category will retain their label.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete category'
    }).then((result) => {
      if (result.isConfirmed) {
        this.systemSettingsService.deleteVisaChecklistCategory(id).subscribe({
          next: () => {
            showImpressiveSuccess('Category Deleted', 'Checklist category removed.');
            this.loadCategories();
          },
          error: (err: any) => {
            Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Failed to delete category' });
          }
        });
      }
    });
  }

  getCategoryIcon(cat: string): string {
    const c = (cat || '').toLowerCase();
    if (c.includes('orient') || c.includes('brief')) return 'bi-compass';
    if (c.includes('travel') || c.includes('flight')) return 'bi-airplane';
    if (c.includes('insur') || c.includes('oshc')) return 'bi-shield-check';
    if (c.includes('hous') || c.includes('accom')) return 'bi-house-check';
    if (c.includes('finan') || c.includes('forex') || c.includes('bank')) return 'bi-cash-coin';
    if (c.includes('transit') || c.includes('pickup')) return 'bi-car-front';
    if (c.includes('complian') || c.includes('enrol') || c.includes('doc')) return 'bi-file-earmark-check';
    return 'bi-check2-circle';
  }

  getCategoryColor(cat: string): string {
    const c = (cat || '').toLowerCase();
    if (c.includes('orient')) return '#0284c7';
    if (c.includes('travel')) return '#2563eb';
    if (c.includes('insur')) return '#059669';
    if (c.includes('hous')) return '#d97706';
    if (c.includes('finan')) return '#7c3aed';
    if (c.includes('transit')) return '#ea580c';
    if (c.includes('complian')) return '#0d9488';
    return '#475569';
  }

  getCategoryBg(cat: string): string {
    const c = (cat || '').toLowerCase();
    if (c.includes('orient')) return '#f0f9ff';
    if (c.includes('travel')) return '#eff6ff';
    if (c.includes('insur')) return '#ecfdf5';
    if (c.includes('hous')) return '#fffbeb';
    if (c.includes('finan')) return '#f5f3ff';
    if (c.includes('transit')) return '#fff7ed';
    if (c.includes('complian')) return '#f0fdfa';
    return '#f8fafc';
  }

  getCategoryBorder(cat: string): string {
    const c = (cat || '').toLowerCase();
    if (c.includes('orient')) return '#bae6fd';
    if (c.includes('travel')) return '#bfdbfe';
    if (c.includes('insur')) return '#a7f3d0';
    if (c.includes('hous')) return '#fde68a';
    if (c.includes('finan')) return '#ddd6fe';
    if (c.includes('transit')) return '#fed7aa';
    if (c.includes('complian')) return '#99f6e4';
    return '#e2e8f0';
  }
}
