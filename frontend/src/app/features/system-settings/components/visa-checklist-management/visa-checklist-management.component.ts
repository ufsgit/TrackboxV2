import { showImpressiveSuccess } from '../../../../core/utils/impressive-alert';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SystemSettingsService } from '../../../../core/services/system-settings.service';
import Swal from 'sweetalert2';

export interface VisaChecklistItem {
  id?: number;
  title: string;
  category: string;
  description?: string;
  stage_order?: number;
  is_active?: boolean | number;
}

@Component({
  selector: 'app-visa-checklist-management',
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
            <i class="bi bi-check2-square text-success"></i> Pre-Departure Checklist Management
            <span style="font-size: 0.72rem; padding: 3px 8px; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; border-radius: 6px; font-weight: 600;">VISA-003</span>
          </h3>
           
        </div>
      </div>
      <button class="btn btn-primary" (click)="openModal()" style="display: flex; align-items: center; gap: 8px; border-radius: 8px; padding: 10px 18px; font-weight: 600; background: #059669; border: none; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);">
        <i class="bi bi-plus-lg"></i> Add Requirement
      </button>
    </div>

    <!-- Checklist Table -->
    <div class="table-card mt-0" style="background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
      <table class="table" style="margin: 0; width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
            <th style="width: 70px; padding: 14px 16px; font-size: 0.75rem; font-weight: 700; color: #64748b; letter-spacing: 0.05em; text-transform: uppercase;">ORDER</th>
            <th style="padding: 14px 16px; font-size: 0.75rem; font-weight: 700; color: #64748b; letter-spacing: 0.05em; text-transform: uppercase;">REQUIREMENT TITLE</th>
            <th style="width: 150px; padding: 14px 16px; font-size: 0.75rem; font-weight: 700; color: #64748b; letter-spacing: 0.05em; text-transform: uppercase;">CATEGORY</th>
            <th style="padding: 14px 16px; font-size: 0.75rem; font-weight: 700; color: #64748b; letter-spacing: 0.05em; text-transform: uppercase;">INSTRUCTIONS / DESCRIPTION</th>
            <th style="width: 110px; padding: 14px 16px; font-size: 0.75rem; font-weight: 700; color: #64748b; letter-spacing: 0.05em; text-transform: uppercase;">STATUS</th>
            <th style="width: 100px; padding: 14px 16px; font-size: 0.75rem; font-weight: 700; color: #64748b; letter-spacing: 0.05em; text-transform: uppercase; text-align: right;">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of filteredItems" style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease;">
            <!-- Order -->
            <td style="padding: 14px 16px;">
              <span class="badge-order" style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 6px; background: #f1f5f9; color: #475569; font-weight: 700; font-size: 0.8rem; border: 1px solid #cbd5e1;">
                {{ item.stage_order || 0 }}
              </span>
            </td>

            <!-- Title -->
            <td style="padding: 14px 16px;">
              <div style="font-weight: 600; color: #1e293b; display: flex; align-items: center; gap: 8px; font-size: 0.92rem;">
                <i class="bi" [ngClass]="getCategoryIcon(item.category)" [style.color]="getCategoryColor(item.category)"></i>
                <span>{{ item.title }}</span>
              </div>
            </td>

            <!-- Category -->
            <td style="padding: 14px 16px;">
              <span [style.background]="getCategoryBg(item.category)" [style.color]="getCategoryColor(item.category)" [style.border]="'1px solid ' + getCategoryBorder(item.category)" style="padding: 4px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; display: inline-flex; align-items: center; gap: 5px;">
                <i class="bi" [ngClass]="getCategoryIcon(item.category)"></i>
                {{ item.category }}
              </span>
            </td>

            <!-- Description -->
            <td style="padding: 14px 16px; color: #64748b; font-size: 0.85rem;">
              {{ item.description || '—' }}
            </td>

            <!-- Status -->
            <td style="padding: 14px 16px;">
              <span (click)="toggleActive(item)" style="cursor: pointer; padding: 4px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;" [style.background]="item.is_active ? '#ecfdf5' : '#f1f5f9'" [style.color]="item.is_active ? '#059669' : '#64748b'" [style.border]="item.is_active ? '1px solid #a7f3d0' : '1px solid #e2e8f0'" [title]="item.is_active ? 'Click to deactivate' : 'Click to activate'">
                <i class="bi" [ngClass]="item.is_active ? 'bi-check2' : 'bi-dash'"></i>
                {{ item.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>

            <!-- Actions -->
            <td style="padding: 14px 16px; text-align: right;">
              <button class="btn btn-icon text-primary me-2" (click)="editModal(item)" title="Edit Requirement" style="background: none; border: none; cursor: pointer; color: #2563eb; padding: 6px 8px; border-radius: 6px;">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-icon text-danger" (click)="deleteItem(item.id!)" title="Delete Requirement" style="background: none; border: none; cursor: pointer; color: #dc2626; padding: 6px 8px; border-radius: 6px;">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>

          <!-- Empty State -->
          <tr *ngIf="filteredItems.length === 0">
            <td colspan="6" style="text-align: center; color: #64748b; padding: 48px 16px;">
              <i class="bi bi-check2-circle" style="font-size: 2.2rem; color: #94a3b8; display: block; margin-bottom: 8px;"></i>
              <div style="font-weight: 600; font-size: 1rem; color: #334155;">No checklist requirements found</div>
              <div style="font-size: 0.85rem; color: #94a3b8; margin-top: 4px;">Click "+ Add Requirement" above to define a new pre-departure task.</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add / Edit Modal -->
    <div *ngIf="showModal" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px;">
      <div style="background: #ffffff; border-radius: 16px; width: 100%; max-width: 540px; box-shadow: 0 20px 40px rgba(0,0,0,0.15); border: 1px solid #e2e8f0; overflow: hidden; animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);">
        
        <!-- Modal Header -->
        <div style="padding: 18px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 8px; background: #ecfdf5; color: #059669; display: flex; align-items: center; justify-content: center; font-size: 1.15rem;">
              <i class="bi bi-check2-square"></i>
            </div>
            <div>
              <h5 style="margin: 0; font-weight: 700; color: #0f172a; font-size: 1.15rem;">
                {{ currentItem.id ? 'Edit Checklist Requirement' : 'Add Checklist Requirement' }}
              </h5>
              <span style="font-size: 0.78rem; color: #64748b;">VISA-003 Standard Pre-Departure Requirement</span>
            </div>
          </div>
          <button type="button" (click)="closeModal()" style="background: none; border: none; font-size: 1.25rem; color: #94a3b8; cursor: pointer; line-height: 1; padding: 4px;">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <!-- Modal Body -->
        <div style="padding: 24px;">
          <!-- Title -->
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 0.88rem; color: #334155;">
              Checklist Requirement Title <span style="color: #dc2626;">*</span>
            </label>
            <input 
              type="text" 
              class="form-control" 
              [(ngModel)]="currentItem.title" 
              placeholder="e.g. Flight Ticket & Travel Booking Verification" 
              style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; font-size: 0.9rem; color: #1e293b; outline: none;">
          </div>

          <!-- Two-column: Category & Sequence Order -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 0.88rem; color: #334155;">
                Category <span style="color: #dc2626;">*</span>
              </label>
              <select 
                class="form-select" 
                [(ngModel)]="currentItem.category" 
                style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; font-size: 0.9rem; color: #1e293b; outline: none;">
                <option *ngFor="let cat of categoriesList" [value]="cat.name">{{ cat.name }}</option>
              </select>
            </div>

            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 0.88rem; color: #334155;">
                Sequence Order
              </label>
              <input 
                type="number" 
                min="0"
                class="form-control" 
                [(ngModel)]="currentItem.stage_order" 
                placeholder="e.g. 1, 2, 3..." 
                style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; font-size: 0.9rem; color: #1e293b; outline: none;">
            </div>
          </div>

          <!-- Description / Instructions -->
          <div style="margin-bottom: 18px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 0.88rem; color: #334155;">
              Operational Instructions / Description
            </label>
            <textarea 
              class="form-control" 
              [(ngModel)]="currentItem.description" 
              rows="3" 
              placeholder="Enter instructions for the counselor or student..." 
              style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; font-size: 0.9rem; color: #1e293b; outline: none; resize: vertical;"></textarea>
          </div>

          <!-- Active Toggle -->
          <div style="display: flex; align-items: center; gap: 8px;">
            <input 
              type="checkbox" 
              id="chkActive" 
              [(ngModel)]="currentItem.is_active" 
              style="width: 18px; height: 18px; border-radius: 4px; accent-color: #059669; cursor: pointer;">
            <label for="chkActive" style="font-weight: 600; font-size: 0.88rem; color: #334155; cursor: pointer; user-select: none;">
              Active (Available for newly approved student visas)
            </label>
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
            [disabled]="!currentItem.title || !currentItem.title.trim() || saving" 
            style="padding: 9px 22px; border-radius: 8px; background: #059669; border: none; font-weight: 600; color: #fff; box-shadow: 0 2px 6px rgba(5,150,105,0.3);">
            <i class="bi bi-check-lg me-1" *ngIf="!saving"></i>
            {{ saving ? 'Saving...' : (currentItem.id ? 'Update Requirement' : 'Save Requirement') }}
          </button>
        </div>

      </div>
    </div>
  `
})
export class VisaChecklistManagementComponent implements OnInit {
  checklistItems: VisaChecklistItem[] = [];
  categoriesList: any[] = [];
  searchTerm: string = '';
  selectedCategory: string = 'All';
  showModal: boolean = false;
  saving: boolean = false;

  currentItem: VisaChecklistItem = {
    title: '',
    category: 'Orientation',
    description: '',
    stage_order: 1,
    is_active: true
  };

  constructor(private systemSettingsService: SystemSettingsService) {}

  ngOnInit(): void {
    this.loadChecklists();
    this.loadCategories();
  }

  loadChecklists(): void {
    this.systemSettingsService.getVisaChecklists().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.checklistItems = res.data;
        }
      },
      error: (err: any) => {
        console.error('Error loading visa checklists:', err);
      }
    });
  }

  loadCategories(): void {
    this.systemSettingsService.getVisaChecklistCategories().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.categoriesList = res.data;
        }
      },
      error: (err: any) => {
        console.error('Error loading checklist categories:', err);
      }
    });
  }

  get filteredItems(): VisaChecklistItem[] {
    return this.checklistItems;
  }

  openModal(): void {
    const nextOrder = (this.checklistItems.length || 0) + 1;
    this.currentItem = {
      title: '',
      category: this.categoriesList[0]?.name || 'Orientation',
      description: '',
      stage_order: nextOrder,
      is_active: true
    };
    this.showModal = true;
  }

  editModal(item: VisaChecklistItem): void {
    this.currentItem = {
      id: item.id,
      title: item.title,
      category: item.category || 'Orientation',
      description: item.description || '',
      stage_order: item.stage_order || 0,
      is_active: !!item.is_active
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  toggleActive(item: VisaChecklistItem): void {
    const newStatus = !item.is_active;
    this.systemSettingsService.updateVisaChecklist(item.id!, {
      ...item,
      is_active: newStatus ? 1 : 0
    }).subscribe({
      next: () => {
        item.is_active = newStatus;
      },
      error: (err) => {
        Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Could not update status' });
      }
    });
  }

  saveItem(): void {
    if (!this.currentItem.title || !this.currentItem.title.trim()) return;

    this.saving = true;
    const payload = {
      title: this.currentItem.title.trim(),
      category: this.currentItem.category || 'Orientation',
      description: this.currentItem.description?.trim() || null,
      stage_order: this.currentItem.stage_order || 0,
      is_active: this.currentItem.is_active ? 1 : 0
    };

    if (this.currentItem.id) {
      this.systemSettingsService.updateVisaChecklist(this.currentItem.id, payload).subscribe({
        next: (res: any) => {
          this.saving = false;
          this.closeModal();
          showImpressiveSuccess('Requirement Updated!', 'Pre-departure checklist item updated successfully.');
          this.loadChecklists();
        },
        error: (err: any) => {
          this.saving = false;
          Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Failed to update requirement' });
        }
      });
    } else {
      this.systemSettingsService.createVisaChecklist(payload).subscribe({
        next: (res: any) => {
          this.saving = false;
          this.closeModal();
          showImpressiveSuccess('Requirement Created!', 'New pre-departure checklist item added to master templates.');
          this.loadChecklists();
        },
        error: (err: any) => {
          this.saving = false;
          Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Failed to create requirement' });
        }
      });
    }
  }

  deleteItem(id: number): void {
    Swal.fire({
      title: 'Delete Checklist Item?',
      text: 'Are you sure you want to remove this pre-departure checklist requirement? This will not affect previously finalized student visas.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete requirement'
    }).then((result) => {
      if (result.isConfirmed) {
        this.systemSettingsService.deleteVisaChecklist(id).subscribe({
          next: () => {
            showImpressiveSuccess('Requirement Deleted', 'Checklist item removed from master templates.');
            this.loadChecklists();
          },
          error: (err) => {
            Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Failed to delete requirement' });
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
