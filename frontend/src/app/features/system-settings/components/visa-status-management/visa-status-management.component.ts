import { showImpressiveSuccess } from '../../../../core/utils/impressive-alert';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SystemSettingsService } from '../../../../core/services/system-settings.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-visa-status-management',
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
            <i class="bi bi-flag-fill text-primary me-2"></i>Visa Status Management
          </h3>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 0.9rem;">
            Configure immigration pipeline stages, assessment milestones, colors, and sequence order.
          </p>
        </div>
      </div>
      <button class="btn btn-primary" (click)="openModal()" style="display: flex; align-items: center; gap: 8px; border-radius: 8px; padding: 10px 18px; font-weight: 500;">
        <i class="bi bi-plus-lg"></i> Add Visa Status
      </button>
    </div>

    <!-- Filters Section -->
    <div class="card border-0 shadow-sm mb-4" style="border-radius: 12px;">
      <div class="card-body p-3">
        <div style="display: flex; align-items: center;">
          <div style="width: 320px; position: relative;">
            <i class="bi bi-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b;"></i>
            <input type="text" class="form-control" placeholder="Search visa status..." [(ngModel)]="searchTerm" style="padding-left: 40px; height: 42px; width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; color: #334155; outline: none;">
          </div>
        </div>
      </div>
    </div>

    <!-- Statuses Table -->
    <div class="table-card mt-0">
      <table class="table">
        <thead>
          <tr>
            <th style="width: 80px;">ORDER</th>
            <th>STATUS NAME</th>
            <th>COLOR PREVIEW</th>
            <th>REQUIRES REASON?</th>
            <th>DESCRIPTION</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of filteredStatuses">
            <td>
              <span class="badge-order">{{ item.stage_order || 0 }}</span>
            </td>
            <td>
              <span class="status-pill" [style.background-color]="item.color || '#4f46e5'">
                {{ item.name }}
              </span>
            </td>
            <td>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div [style.background-color]="item.color || '#4f46e5'" style="width: 24px; height: 24px; border-radius: 6px; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.05);"></div>
                <span style="font-family: monospace; color: #64748b; font-size: 0.88rem;">{{ item.color || '#4f46e5' }}</span>
              </div>
            </td>
            <td>
              <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start;">
                <span class="badge" [style.background]="item.has_reason ? '#fef2f2' : '#f8fafc'" [style.color]="item.has_reason ? '#dc2626' : '#64748b'" [style.border]="item.has_reason ? '1px solid #fecaca' : '1px solid #e2e8f0'" style="padding: 4px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; display: inline-flex; align-items: center;">
                  <i class="bi" [ngClass]="item.has_reason ? 'bi-exclamation-circle-fill me-1 text-danger' : 'bi-dash me-1 text-muted'"></i>
                  {{ item.has_reason ? 'Requires Reason' : 'No' }}
                </span>
                <span *ngIf="item.has_reason && item.reason_category_ids && item.reason_category_ids.length > 0" class="text-muted" style="font-size: 0.75rem;">
                  <i class="bi bi-check2-circle text-success me-1"></i>{{ item.reason_category_ids.length }} categories enabled
                </span>
                <span *ngIf="item.has_reason && (!item.reason_category_ids || item.reason_category_ids.length === 0)" class="text-muted" style="font-size: 0.75rem;">
                  (All categories available)
                </span>
              </div>
            </td>
            <td class="text-muted">{{ item.description || '—' }}</td>
            <td>
              <button class="btn btn-icon text-primary me-2" (click)="editModal(item)" title="Edit Visa Status">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-icon text-danger" (click)="deleteItem(item.id)" title="Delete Visa Status">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
          <tr *ngIf="filteredStatuses.length === 0">
            <td colspan="6" class="text-center text-muted py-4">No visa statuses found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <div class="modal-backdrop" *ngIf="showModal" (click)="closeModal()">
      <div class="modal-dialog-custom" (click)="$event.stopPropagation()">
        <!-- Modal Header (Pinned) -->
        <div class="modal-header-custom">
          <h4 style="margin: 0; font-weight: 700; color: #0f172a; font-size: 1.15rem;">
            <i class="bi bi-flag-fill text-primary me-2"></i>{{ currentItem.id ? 'Edit Visa Status' : 'Add New Visa Status' }}
          </h4>
          <button type="button" class="btn-close-modal" (click)="closeModal()">&times;</button>
        </div>
        
        <!-- Modal Body (Scrollable) -->
        <div class="modal-body-custom">
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.88rem; color: #334155;">Status Name *</label>
          <input type="text" class="form-control" [(ngModel)]="currentItem.name" placeholder="e.g. Under Assessment, AIP, Approved" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.88rem; color: #334155;">Stage Order</label>
            <input type="number" class="form-control" [(ngModel)]="currentItem.stage_order" placeholder="e.g. 1, 2, 3..." style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.88rem; color: #334155;">Status Color</label>
            <div style="display: flex; gap: 8px;">
              <input type="color" class="form-control form-control-color" [(ngModel)]="currentItem.color" style="height: 44px; width: 50px; padding: 3px; border-radius: 8px; border: 1px solid #cbd5e1;">
              <input type="text" class="form-control" [(ngModel)]="currentItem.color" placeholder="#4f46e5" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; font-family: monospace;">
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.88rem; color: #334155;">Description</label>
          <textarea class="form-control" [(ngModel)]="currentItem.description" rows="2" placeholder="Briefly describe what this stage signifies in immigration..." style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;"></textarea>
        </div>

        <!-- Has Reason Toggle -->
        <div style="margin-bottom: 16px; padding: 12px 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <label style="margin: 0; font-weight: 600; font-size: 0.88rem; color: #334155; display: block;">Requires Reason Category</label>
              <small style="color: #64748b; font-size: 0.8rem;">When enabled, selecting this status requires a categorized refusal / discretion reason.</small>
            </div>
            <div class="form-check form-switch" style="margin: 0; padding-left: 2.5em;">
              <input 
                class="form-check-input" 
                type="checkbox" 
                role="switch" 
                id="hasReasonSwitch" 
                [(ngModel)]="currentItem.has_reason" 
                [checked]="!!currentItem.has_reason" 
                (change)="onHasReasonToggle()"
                style="width: 2.5em; height: 1.3em; cursor: pointer;">
            </div>
          </div>

          <!-- Multiple Checkboxes for Reason Categories (Shown when Has Reason is checked) -->
          <div *ngIf="currentItem.has_reason">
            <!-- Loading Spinner while fetching reason categories -->
            <div *ngIf="loadingReasonCategories" style="margin-top: 14px; padding: 22px; text-align: center; background: #fff; border: 1px dashed #cbd5e1; border-radius: 8px;">
              <div class="spinner-border spinner-border-sm text-primary" role="status" style="width: 1.6rem; height: 1.6rem; border-width: 0.22em;"></div>
              <div style="font-size: 0.85rem; font-weight: 500; color: #64748b; margin-top: 8px;">
                Loading reason categories...
              </div>
            </div>

            <!-- Categories Checkboxes List (Shown once loaded) -->
            <div *ngIf="!loadingReasonCategories" style="margin-top: 14px; padding-top: 14px; border-top: 1px dashed #cbd5e1;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-size: 0.82rem; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.04em;">
                  <i class="bi bi-check2-square text-primary me-1"></i> Available Reason Categories:
                </span>
                <div style="display: flex; gap: 8px;">
                  <button type="button" class="btn btn-sm btn-link p-0 text-decoration-none" (click)="selectAllCategories(true)" style="font-size: 0.78rem;">Select All</button>
                  <span style="color: #cbd5e1;">|</span>
                  <button type="button" class="btn btn-sm btn-link p-0 text-decoration-none text-muted" (click)="selectAllCategories(false)" style="font-size: 0.78rem;">Clear All</button>
                </div>
              </div>

              <div style="max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 4px;">
                <div *ngFor="let cat of availableReasonCategories" style="display: flex; align-items: flex-start; gap: 10px; padding: 8px 12px; border-radius: 6px; background: #fff; border: 1px solid #e2e8f0; transition: border-color 0.2s;" [style.border-color]="isCategorySelected(cat) ? '#6366f1' : '#e2e8f0'">
                  <input 
                    type="checkbox" 
                    [id]="'rc_' + cat.id"
                    [checked]="isCategorySelected(cat)"
                    (change)="toggleCategory(cat, $event)"
                    style="margin-top: 3px; cursor: pointer; width: 16px; height: 16px; accent-color: #4f46e5;">
                  <label [for]="'rc_' + cat.id" style="margin: 0; font-size: 0.84rem; color: #1e293b; cursor: pointer; flex: 1;">
                    <span style="font-weight: 600;">{{ cat.name }}</span>
                    <span *ngIf="cat.description" style="display: block; font-size: 0.76rem; color: #64748b; margin-top: 2px;">{{ cat.description }}</span>
                  </label>
                </div>
                <div *ngIf="availableReasonCategories.length === 0" class="text-muted text-center py-2" style="font-size: 0.82rem;">
                  No reason categories found in system settings.
                </div>
              </div>
              <small style="display: block; color: #64748b; font-size: 0.76rem; margin-top: 8px;">
                <i class="bi bi-info-circle me-1"></i> Only selected categories will appear in the visa case Reason Category dropdown when this status is chosen.
              </small>
            </div>
          </div>
        </div>
        
        <!-- Modal Footer (Pinned) -->
        <div class="modal-footer-custom">
          <button class="btn btn-light" (click)="closeModal()" style="padding: 9px 18px; border-radius: 8px; background: #fff; border: 1px solid #cbd5e1; font-weight: 500; color: #475569;">Cancel</button>
          <button class="btn btn-primary" (click)="saveItem()" [disabled]="!currentItem.name?.trim()" style="padding: 9px 20px; border-radius: 8px; font-weight: 500; background: #4f46e5; border-color: #4f46e5;">Save Visa Status</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-card { background: #fff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); padding: 24px; }
    .table { width: 100%; margin-bottom: 0; color: #1e293b; border-collapse: collapse; }
    .table th { color: #64748b; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; text-align: left; }
    .table td { padding: 16px 12px; vertical-align: middle; border-bottom: 1px solid #f8fafc; }
    .badge-order { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; background: #f1f5f9; color: #475569; font-weight: 700; font-size: 0.82rem; }
    .status-pill { padding: 6px 14px; color: white; border-radius: 20px; font-weight: 600; font-size: 0.82rem; display: inline-block; letter-spacing: 0.02em; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .btn-icon { padding: 6px; border-radius: 6px; border: none; background: transparent; transition: all 0.2s; }
    .btn-icon:hover { background: #f1f5f9; }
    .modal-backdrop { 
      position: fixed; 
      top: 0; 
      left: 0; 
      right: 0; 
      bottom: 0; 
      width: 100vw; 
      height: 100vh; 
      background: rgba(15, 23, 42, 0.6); 
      backdrop-filter: blur(4px); 
      z-index: 99999; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      padding: 2rem 1rem; 
      box-sizing: border-box;
    }
    .modal-dialog-custom { 
      background: #fff; 
      border-radius: 16px; 
      width: 100%; 
      max-width: 560px; 
      max-height: calc(100vh - 4rem); 
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35); 
      border: 1px solid #e2e8f0; 
      display: flex; 
      flex-direction: column; 
      overflow: hidden; 
      margin: auto;
      position: relative;
      z-index: 100000;
      animation: modalFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.96) translateY(-8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .modal-header-custom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 24px;
      border-bottom: 1px solid #f1f5f9;
      background: #fff;
      flex-shrink: 0;
    }
    .btn-close-modal {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      line-height: 1;
      color: #94a3b8;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      transition: all 0.15s ease;
    }
    .btn-close-modal:hover {
      color: #0f172a;
      background-color: #f1f5f9;
    }
    .modal-body-custom {
      padding: 20px 24px;
      overflow-y: auto;
      flex: 1 1 auto;
      min-height: 0;
      -webkit-overflow-scrolling: touch;
    }
    .modal-footer-custom {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 12px;
      padding: 14px 24px;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
      flex-shrink: 0;
    }
  `]
})
export class VisaStatusManagementComponent implements OnInit {
  visaStatuses: any[] = [];
  availableReasonCategories: any[] = [];
  selectedCategoryIds: Set<number> = new Set();
  currentItem: any = { name: '', color: '#4f46e5', stage_order: 1, description: '', has_reason: 0, reason_category_ids: [] };
  showModal: boolean = false;
  searchTerm: string = '';
  loadingReasonCategories: boolean = false;

  constructor(private settingsService: SystemSettingsService) {}

  ngOnInit() {
    this.loadVisaStatuses();
  }

  onHasReasonToggle() {
    if (this.currentItem.has_reason) {
      this.loadReasonCategories();
    }
  }

  loadVisaStatuses() {
    this.settingsService.getVisaStatuses().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.visaStatuses = res.data;
        }
      },
      error: (err) => console.error('Failed to load visa statuses:', err)
    });
  }

  loadReasonCategories() {
    this.loadingReasonCategories = true;
    this.settingsService.getVisaReasonCategories().subscribe({
      next: (res: any) => {
        this.loadingReasonCategories = false;
        if (res.success && res.data) {
          this.availableReasonCategories = res.data;
        }
      },
      error: (err) => {
        this.loadingReasonCategories = false;
        console.error('Failed to load reason categories:', err);
      }
    });
  }

  get filteredStatuses() {
    if (!this.searchTerm) return this.visaStatuses;
    const term = this.searchTerm.toLowerCase().trim();
    return this.visaStatuses.filter(s => 
      s.name?.toLowerCase().includes(term) || 
      s.description?.toLowerCase().includes(term)
    );
  }

  openModal() {
    const nextOrder = (this.visaStatuses.length > 0) 
      ? Math.max(...this.visaStatuses.map(s => Number(s.stage_order) || 0)) + 1 
      : 1;
    this.selectedCategoryIds.clear();
    this.currentItem = { name: '', color: '#4f46e5', stage_order: nextOrder, description: '', has_reason: 0, reason_category_ids: [] };
    this.showModal = true;
  }

  editModal(item: any) {
    this.currentItem = { ...item, has_reason: !!item.has_reason };
    this.selectedCategoryIds.clear();
    if (Array.isArray(item.reason_category_ids)) {
      item.reason_category_ids.forEach((id: any) => this.selectedCategoryIds.add(Number(id)));
    }
    if (this.currentItem.has_reason) {
      this.loadReasonCategories();
    }
    this.showModal = true;
  }

  isCategorySelected(cat: any): boolean {
    return this.selectedCategoryIds.has(Number(cat.id));
  }

  toggleCategory(cat: any, event: any) {
    const catId = Number(cat.id);
    if (event.target.checked) {
      this.selectedCategoryIds.add(catId);
    } else {
      this.selectedCategoryIds.delete(catId);
    }
  }

  selectAllCategories(select: boolean) {
    if (select) {
      this.availableReasonCategories.forEach(c => this.selectedCategoryIds.add(Number(c.id)));
    } else {
      this.selectedCategoryIds.clear();
    }
  }

  closeModal() {
    this.showModal = false;
  }

  saveItem() {
    if (!this.currentItem.name || !this.currentItem.name.trim()) {
      Swal.fire({ icon: 'warning', title: 'Required Field', text: 'Visa status name is required.' });
      return;
    }

    const payload = {
      ...this.currentItem,
      name: this.currentItem.name.trim(),
      has_reason: this.currentItem.has_reason ? 1 : 0,
      reason_category_ids: this.currentItem.has_reason ? Array.from(this.selectedCategoryIds) : []
    };

    if (this.currentItem.id) {
      this.settingsService.updateVisaStatus(this.currentItem.id, payload).subscribe({
        next: (res: any) => {
          if (res.success) {
            showImpressiveSuccess('Visa status updated successfully');
            this.loadVisaStatuses();
            this.closeModal();
          } else {
            Swal.fire({ icon: 'error', title: 'Error', text: res.message || 'Failed to update visa status' });
          }
        },
        error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Server error' })
      });
    } else {
      this.settingsService.createVisaStatus(payload).subscribe({
        next: (res: any) => {
          if (res.success) {
            showImpressiveSuccess('Visa status created successfully');
            this.loadVisaStatuses();
            this.closeModal();
          } else {
            Swal.fire({ icon: 'error', title: 'Error', text: res.message || 'Failed to create visa status' });
          }
        },
        error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Server error' })
      });
    }
  }

  deleteItem(id: number) {
    Swal.fire({
      title: 'Delete Visa Status?',
      text: 'Are you sure you want to delete this visa status? Existing visa records will retain their recorded status value.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.settingsService.deleteVisaStatus(id).subscribe({
          next: (res: any) => {
            if (res.success) {
              showImpressiveSuccess('Visa status deleted');
              this.loadVisaStatuses();
            }
          },
          error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Failed to delete' })
        });
      }
    });
  }
}
