import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SystemSettingsService } from '../../../../core/services/system-settings.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pte-status-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 1.5rem;">
      <div>
        <h3 style="margin: 0; font-size: 1.5rem; font-weight: 600; color: #0f172a;">
          <i class="bi bi-bar-chart-steps text-primary me-2"></i>PTE Status Management
        </h3>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 0.9rem;">
          Manage PTE coaching pipeline stages, conversion progression order, badge colors, and descriptions.
        </p>
      </div>
      <button class="btn btn-primary" (click)="openModal()" style="display: flex; align-items: center; gap: 8px; border-radius: 8px; padding: 10px 18px; font-weight: 500; background: #4f46e5; border-color: #4f46e5;">
        <i class="bi bi-plus-lg"></i> Add PTE Status
      </button>
    </div>

    <!-- Filters Section -->
    <div class="card border-0 shadow-sm mb-4" style="border-radius: 12px;">
      <div class="card-body p-3">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div style="width: 320px; position: relative;">
            <i class="bi bi-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b;"></i>
            <input type="text" class="form-control" placeholder="Search PTE status..." [(ngModel)]="searchTerm" style="padding-left: 40px; height: 42px; width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; color: #334155; outline: none;">
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span class="badge" style="background: #e0e7ff; color: #4338ca; padding: 6px 12px; border-radius: 20px; font-weight: 600;">
              Total Statuses: {{ statuses.length }}
            </span>
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
            <th>BADGE COLOR</th>
            <th>DESCRIPTION</th>
            <th>STATUS</th>
            <th style="width: 120px; text-align: right;">ACTIONS</th>
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
                <div [style.background-color]="item.color || '#4f46e5'" style="width: 22px; height: 22px; border-radius: 6px; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.05);"></div>
                <span style="font-family: monospace; color: #64748b; font-size: 0.88rem;">{{ item.color || '#4f46e5' }}</span>
              </div>
            </td>
            <td class="text-muted">{{ item.description || '—' }}</td>
            <td>
              <span class="badge" [style.background]="item.is_active ? '#ecfdf5' : '#f1f5f9'" [style.color]="item.is_active ? '#059669' : '#64748b'" style="padding: 4px 10px; border-radius: 20px; font-weight: 600; font-size: 0.78rem;">
                {{ item.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td style="text-align: right;">
              <button class="btn btn-icon text-primary me-2" (click)="editModal(item)" title="Edit PTE Status">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-icon text-danger" (click)="deleteItem(item.id)" title="Delete PTE Status">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
          <tr *ngIf="filteredStatuses.length === 0">
            <td colspan="6" class="text-center text-muted py-4">No PTE statuses found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <div class="modal-backdrop" *ngIf="showModal" (click)="closeModal()">
      <div class="modal-dialog-custom" (click)="$event.stopPropagation()">
        <!-- Modal Header (Pinned) -->
        <div class="modal-header-custom">
          <h5 style="margin: 0; font-weight: 600; color: #0f172a; font-size: 1.15rem; display: flex; align-items: center; gap: 8px;">
            <i class="bi bi-bar-chart-steps text-primary"></i>
            {{ isEditing ? 'Edit PTE Status' : 'Add PTE Status' }}
          </h5>
          <button type="button" class="btn-close-modal" (click)="closeModal()" aria-label="Close">
            <i class="bi bi-x"></i>
          </button>
        </div>
        
        <!-- Modal Body (Scrollable) -->
        <div class="modal-body-custom">
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div>
              <label style="display: block; font-weight: 500; font-size: 0.88rem; color: #334155; margin-bottom: 6px;">Status Name <span class="text-danger">*</span></label>
              <input type="text" class="form-control" [(ngModel)]="currentItem.name" placeholder="e.g. Recommended, Joined, Target Achieved" style="height: 42px; border: 1px solid #cbd5e1; border-radius: 8px;">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <label style="display: block; font-weight: 500; font-size: 0.88rem; color: #334155; margin-bottom: 6px;">Stage Order</label>
                <input type="number" class="form-control" [(ngModel)]="currentItem.stage_order" placeholder="1" min="1" style="height: 42px; border: 1px solid #cbd5e1; border-radius: 8px;">
              </div>
              <div>
                <label style="display: block; font-weight: 500; font-size: 0.88rem; color: #334155; margin-bottom: 6px;">Status Color</label>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <input type="color" class="form-control form-control-color" [(ngModel)]="currentItem.color" style="width: 48px; height: 42px; border-radius: 8px; padding: 2px; cursor: pointer; border: 1px solid #cbd5e1;">
                  <input type="text" class="form-control" [(ngModel)]="currentItem.color" placeholder="#3b82f6" style="height: 42px; border: 1px solid #cbd5e1; border-radius: 8px; font-family: monospace;">
                </div>
              </div>
            </div>

            <div>
              <label style="display: block; font-weight: 500; font-size: 0.88rem; color: #334155; margin-bottom: 6px;">Description</label>
              <textarea class="form-control" rows="3" [(ngModel)]="currentItem.description" placeholder="Brief description of this progression milestone..." style="border: 1px solid #cbd5e1; border-radius: 8px; resize: vertical;"></textarea>
            </div>

            <div style="display: flex; align-items: center; gap: 10px; margin-top: 4px;">
              <input type="checkbox" id="statIsActive" [(ngModel)]="currentItem.is_active" style="width: 18px; height: 18px; border-radius: 4px; accent-color: #4f46e5; cursor: pointer;">
              <label for="statIsActive" style="font-size: 0.88rem; font-weight: 500; color: #334155; cursor: pointer; margin: 0;">Active in dropdowns</label>
            </div>
          </div>
        </div>
        
        <!-- Modal Footer (Pinned) -->
        <div class="modal-footer-custom">
          <button class="btn btn-light" (click)="closeModal()" style="padding: 9px 18px; border-radius: 8px; background: #fff; border: 1px solid #cbd5e1; font-weight: 500; color: #475569;">Cancel</button>
          <button class="btn btn-primary" (click)="saveItem()" [disabled]="!currentItem.name?.trim()" style="padding: 9px 20px; border-radius: 8px; font-weight: 500; background: #4f46e5; border-color: #4f46e5;">Save Status</button>
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
      top: 0; left: 0; right: 0; bottom: 0; 
      width: 100vw; height: 100vh; 
      background: rgba(15, 23, 42, 0.6); 
      backdrop-filter: blur(4px); 
      z-index: 99999; 
      display: flex; align-items: center; justify-content: center; 
      padding: 2rem 1rem; box-sizing: border-box; 
    }
    .modal-dialog-custom { 
      background: #fff; border-radius: 16px; width: 100%; max-width: 540px; 
      max-height: calc(100vh - 4rem); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35); 
      border: 1px solid #e2e8f0; display: flex; flex-direction: column; overflow: hidden; 
      margin: auto; position: relative; z-index: 100000; 
      animation: modalFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1); 
    }
    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.96) translateY(-8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .modal-header-custom {
      display: flex; justify-content: space-between; align-items: center; 
      padding: 18px 24px; border-bottom: 1px solid #f1f5f9; background: #fff; flex-shrink: 0;
    }
    .btn-close-modal {
      background: transparent; border: none; font-size: 1.5rem; line-height: 1; 
      color: #94a3b8; cursor: pointer; display: flex; align-items: center; 
      justify-content: center; width: 32px; height: 32px; border-radius: 6px; transition: all 0.15s ease;
    }
    .btn-close-modal:hover { color: #0f172a; background-color: #f1f5f9; }
    .modal-body-custom {
      padding: 20px 24px; overflow-y: auto; flex: 1 1 auto; min-height: 0; -webkit-overflow-scrolling: touch;
    }
    .modal-footer-custom {
      display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px; 
      border-top: 1px solid #f1f5f9; background: #f8fafc; flex-shrink: 0;
    }
  `]
})
export class PteStatusManagementComponent implements OnInit {
  statuses: any[] = [];
  searchTerm: string = '';
  showModal: boolean = false;
  isEditing: boolean = false;

  currentItem: any = {
    id: null,
    name: '',
    stage_order: 1,
    color: '#3b82f6',
    description: '',
    is_active: true
  };

  constructor(private service: SystemSettingsService) {}

  ngOnInit(): void {
    this.loadStatuses();
  }

  loadStatuses(): void {
    this.service.getPteStatuses({ all: true }).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.statuses = res.data || [];
        }
      },
      error: (err: any) => {
        console.error('Error loading PTE statuses:', err);
      }
    });
  }

  get filteredStatuses(): any[] {
    if (!this.searchTerm.trim()) {
      return this.statuses;
    }
    const q = this.searchTerm.toLowerCase();
    return this.statuses.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q)
    );
  }

  openModal(): void {
    this.isEditing = false;
    this.currentItem = {
      id: null,
      name: '',
      stage_order: this.statuses.length + 1,
      color: '#3b82f6',
      description: '',
      is_active: true
    };
    this.showModal = true;
  }

  editModal(item: any): void {
    this.isEditing = true;
    this.currentItem = {
      id: item.id,
      name: item.name,
      stage_order: item.stage_order || 1,
      color: item.color || '#3b82f6',
      description: item.description || '',
      is_active: item.is_active === 1 || item.is_active === true
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveItem(): void {
    if (!this.currentItem.name?.trim()) return;

    if (this.isEditing) {
      this.service.updatePteStatus(this.currentItem.id, this.currentItem).subscribe({
        next: (res: any) => {
          if (res && res.success) {
            Swal.fire({ icon: 'success', title: 'Updated!', text: 'PTE status updated successfully', timer: 1500, showConfirmButton: false });
            this.closeModal();
            this.loadStatuses();
          }
        },
        error: (err: any) => {
          Swal.fire('Error', err.error?.message || 'Failed to update PTE status', 'error');
        }
      });
    } else {
      this.service.createPteStatus(this.currentItem).subscribe({
        next: (res: any) => {
          if (res && res.success) {
            Swal.fire({ icon: 'success', title: 'Created!', text: 'PTE status created successfully', timer: 1500, showConfirmButton: false });
            this.closeModal();
            this.loadStatuses();
          }
        },
        error: (err: any) => {
          Swal.fire('Error', err.error?.message || 'Failed to create PTE status', 'error');
        }
      });
    }
  }

  deleteItem(id: number): void {
    Swal.fire({
      title: 'Delete PTE Status?',
      text: 'Are you sure you want to remove this status? Existing student logs may be impacted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, delete it'
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.deletePteStatus(id).subscribe({
          next: (res: any) => {
            if (res && res.success) {
              Swal.fire({ icon: 'success', title: 'Deleted!', text: 'PTE status removed', timer: 1500, showConfirmButton: false });
              this.loadStatuses();
            }
          },
          error: (err: any) => {
            Swal.fire('Error', err.error?.message || 'Failed to delete status', 'error');
          }
        });
      }
    });
  }
}
