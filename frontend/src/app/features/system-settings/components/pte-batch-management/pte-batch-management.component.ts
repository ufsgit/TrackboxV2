import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SystemSettingsService } from '../../../../core/services/system-settings.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pte-batch-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 1.5rem;">
      <div>
        <h3 style="margin: 0; font-size: 1.5rem; font-weight: 600; color: #0f172a;">
          <i class="bi bi-people-fill text-primary me-2"></i>PTE Batch Management
        </h3>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 0.9rem;">
          Manage coaching batches, schedules, assigned trainers, and seat capacity limits.
        </p>
      </div>
      <button class="btn btn-primary" (click)="openModal()" style="display: flex; align-items: center; gap: 8px; border-radius: 8px; padding: 10px 18px; font-weight: 500; background: #4f46e5; border-color: #4f46e5;">
        <i class="bi bi-plus-lg"></i> Add PTE Batch
      </button>
    </div>

    <!-- Filters Section -->
    <div class="card border-0 shadow-sm mb-4" style="border-radius: 12px;">
      <div class="card-body p-3">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div style="width: 320px; position: relative;">
            <i class="bi bi-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b;"></i>
            <input type="text" class="form-control" placeholder="Search batch..." [(ngModel)]="searchTerm" style="padding-left: 40px; height: 42px; width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; color: #334155; outline: none;">
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span class="badge" style="background: #dcfce7; color: #166534; padding: 6px 12px; border-radius: 20px; font-weight: 600;">
              Total Batches: {{ batches.length }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Batches Table -->
    <div class="table-card mt-0">
      <table class="table">
        <thead>
          <tr>
            <th>BATCH NAME</th>
            <th>SCHEDULE / TIMING</th>
            <th>ASSIGNED TRAINER</th>
            <th>SEATS CAPACITY</th>
            <th>DATES</th>
            <th>STATUS</th>
            <th style="width: 120px; text-align: right;">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of filteredBatches">
            <td>
              <div style="font-weight: 600; color: #0f172a;">{{ item.batch_name }}</div>
            </td>
            <td>
              <span class="badge" style="background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; padding: 5px 10px; border-radius: 6px; font-weight: 500;">
                <i class="bi bi-clock me-1 text-primary"></i>{{ item.schedule || 'Flexible' }}
              </span>
            </td>
            <td>
              <div style="display: flex; align-items: center; gap: 6px;">
                <i class="bi bi-person-circle text-primary"></i>
                <span style="font-weight: 500; color: #1e293b;">{{ item.trainer_name || 'Unassigned' }}</span>
              </div>
            </td>
            <td>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="flex: 1; max-width: 100px; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                  <div [style.width.%]="getProgress(item)" [style.background]="getProgressColor(item)" style="height: 100%; border-radius: 4px;"></div>
                </div>
                <span style="font-size: 0.84rem; font-weight: 600; color: #334155;">
                  {{ item.joined_count || 0 }} / {{ item.capacity || 20 }}
                </span>
              </div>
            </td>
            <td class="text-muted" style="font-size: 0.85rem;">
              <span *ngIf="item.start_date">{{ item.start_date | date:'mediumDate' }}</span>
              <span *ngIf="item.end_date"> - {{ item.end_date | date:'mediumDate' }}</span>
              <span *ngIf="!item.start_date && !item.end_date">—</span>
            </td>
            <td>
              <span class="badge" [style.background]="item.is_active ? '#ecfdf5' : '#f1f5f9'" [style.color]="item.is_active ? '#059669' : '#64748b'" style="padding: 4px 10px; border-radius: 20px; font-weight: 600; font-size: 0.78rem;">
                {{ item.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td style="text-align: right;">
              <button class="btn btn-icon text-primary me-2" (click)="editModal(item)" title="Edit Batch">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-icon text-danger" (click)="deleteItem(item.id)" title="Delete Batch">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
          <tr *ngIf="filteredBatches.length === 0">
            <td colspan="7" class="text-center text-muted py-4">No batches found.</td>
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
            <i class="bi bi-people-fill text-primary"></i>
            {{ isEditing ? 'Edit PTE Batch' : 'Add PTE Batch' }}
          </h5>
          <button type="button" class="btn-close-modal" (click)="closeModal()" aria-label="Close">
            <i class="bi bi-x"></i>
          </button>
        </div>
        
        <!-- Modal Body (Scrollable) -->
        <div class="modal-body-custom">
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div>
              <label style="display: block; font-weight: 500; font-size: 0.88rem; color: #334155; margin-bottom: 6px;">Batch Name <span class="text-danger">*</span></label>
              <input type="text" class="form-control" [(ngModel)]="currentItem.batch_name" placeholder="e.g. PTE Morning Foundation" style="height: 42px; border: 1px solid #cbd5e1; border-radius: 8px;">
            </div>

            <div>
              <label style="display: block; font-weight: 500; font-size: 0.88rem; color: #334155; margin-bottom: 6px;">Schedule / Timings</label>
              <input type="text" class="form-control" [(ngModel)]="currentItem.schedule" placeholder="e.g. Mon-Fri 08:30 AM - 10:30 AM" style="height: 42px; border: 1px solid #cbd5e1; border-radius: 8px;">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <label style="display: block; font-weight: 500; font-size: 0.88rem; color: #334155; margin-bottom: 6px;">Assigned Trainer</label>
                <select class="form-select" [(ngModel)]="currentItem.trainer_id" (change)="onTrainerChange()" style="height: 42px; border: 1px solid #cbd5e1; border-radius: 8px;">
                  <option [ngValue]="null">Select Trainer</option>
                  <option *ngFor="let t of trainers" [ngValue]="t.id">{{ t.name }} ({{ t.specialization || 'PTE' }})</option>
                </select>
              </div>
              <div>
                <label style="display: block; font-weight: 500; font-size: 0.88rem; color: #334155; margin-bottom: 6px;">Maximum Capacity</label>
                <input type="number" class="form-control" [(ngModel)]="currentItem.capacity" placeholder="20" min="1" style="height: 42px; border: 1px solid #cbd5e1; border-radius: 8px;">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <label style="display: block; font-weight: 500; font-size: 0.88rem; color: #334155; margin-bottom: 6px;">Start Date</label>
                <input type="date" class="form-control" [(ngModel)]="currentItem.start_date" style="height: 42px; border: 1px solid #cbd5e1; border-radius: 8px;">
              </div>
              <div>
                <label style="display: block; font-weight: 500; font-size: 0.88rem; color: #334155; margin-bottom: 6px;">End Date</label>
                <input type="date" class="form-control" [(ngModel)]="currentItem.end_date" style="height: 42px; border: 1px solid #cbd5e1; border-radius: 8px;">
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 10px; margin-top: 4px;">
              <input type="checkbox" id="batchIsActive" [(ngModel)]="currentItem.is_active" style="width: 18px; height: 18px; border-radius: 4px; accent-color: #4f46e5; cursor: pointer;">
              <label for="batchIsActive" style="font-size: 0.88rem; font-weight: 500; color: #334155; cursor: pointer; margin: 0;">Active for Enrollment</label>
            </div>
          </div>
        </div>
        
        <!-- Modal Footer (Pinned) -->
        <div class="modal-footer-custom">
          <button class="btn btn-light" (click)="closeModal()" style="padding: 9px 18px; border-radius: 8px; background: #fff; border: 1px solid #cbd5e1; font-weight: 500; color: #475569;">Cancel</button>
          <button class="btn btn-primary" (click)="saveItem()" [disabled]="!currentItem.batch_name?.trim()" style="padding: 9px 20px; border-radius: 8px; font-weight: 500; background: #4f46e5; border-color: #4f46e5;">Save Batch</button>
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
      background: #fff; border-radius: 16px; width: 100%; max-width: 560px; 
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
export class PteBatchManagementComponent implements OnInit {
  batches: any[] = [];
  trainers: any[] = [];
  searchTerm: string = '';
  showModal: boolean = false;
  isEditing: boolean = false;

  currentItem: any = {
    id: null,
    batch_name: '',
    schedule: '',
    trainer_id: null,
    trainer_name: '',
    capacity: 20,
    start_date: '',
    end_date: '',
    is_active: true
  };

  constructor(private service: SystemSettingsService) {}

  ngOnInit(): void {
    this.loadBatches();
    this.loadTrainers();
  }

  loadBatches(): void {
    this.service.getPteBatches({ all: true }).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.batches = res.data || [];
        }
      },
      error: (err: any) => {
        console.error('Error loading batches:', err);
      }
    });
  }

  loadTrainers(): void {
    this.service.getPteTrainers().subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.trainers = res.data || [];
        }
      }
    });
  }

  get filteredBatches(): any[] {
    if (!this.searchTerm.trim()) {
      return this.batches;
    }
    const q = this.searchTerm.toLowerCase();
    return this.batches.filter(b =>
      b.batch_name?.toLowerCase().includes(q) ||
      b.schedule?.toLowerCase().includes(q) ||
      b.trainer_name?.toLowerCase().includes(q)
    );
  }

  getProgress(item: any): number {
    const cap = item.capacity || 20;
    const joined = item.joined_count || 0;
    return Math.min(100, Math.round((joined / cap) * 100));
  }

  getProgressColor(item: any): string {
    const percent = this.getProgress(item);
    if (percent >= 90) return '#ef4444';
    if (percent >= 60) return '#f59e0b';
    return '#10b981';
  }

  onTrainerChange(): void {
    if (this.currentItem.trainer_id) {
      const found = this.trainers.find(t => t.id === this.currentItem.trainer_id);
      this.currentItem.trainer_name = found ? found.name : '';
    } else {
      this.currentItem.trainer_name = '';
    }
  }

  openModal(): void {
    this.isEditing = false;
    this.currentItem = {
      id: null,
      batch_name: '',
      schedule: '',
      trainer_id: null,
      trainer_name: '',
      capacity: 20,
      start_date: '',
      end_date: '',
      is_active: true
    };
    this.showModal = true;
  }

  editModal(item: any): void {
    this.isEditing = true;
    this.currentItem = {
      id: item.id,
      batch_name: item.batch_name,
      schedule: item.schedule || '',
      trainer_id: item.trainer_id || null,
      trainer_name: item.trainer_name || '',
      capacity: item.capacity || 20,
      start_date: item.start_date ? item.start_date.slice(0, 10) : '',
      end_date: item.end_date ? item.end_date.slice(0, 10) : '',
      is_active: item.is_active === 1 || item.is_active === true
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveItem(): void {
    if (!this.currentItem.batch_name?.trim()) return;

    if (this.isEditing) {
      this.service.updatePteBatch(this.currentItem.id, this.currentItem).subscribe({
        next: (res: any) => {
          if (res && res.success) {
            Swal.fire({ icon: 'success', title: 'Updated!', text: 'Batch updated successfully', timer: 1500, showConfirmButton: false });
            this.closeModal();
            this.loadBatches();
          }
        },
        error: (err: any) => {
          Swal.fire('Error', err.error?.message || 'Failed to update batch', 'error');
        }
      });
    } else {
      this.service.createPteBatch(this.currentItem).subscribe({
        next: (res: any) => {
          if (res && res.success) {
            Swal.fire({ icon: 'success', title: 'Created!', text: 'Batch created successfully', timer: 1500, showConfirmButton: false });
            this.closeModal();
            this.loadBatches();
          }
        },
        error: (err: any) => {
          Swal.fire('Error', err.error?.message || 'Failed to create batch', 'error');
        }
      });
    }
  }

  deleteItem(id: number): void {
    Swal.fire({
      title: 'Delete PTE Batch?',
      text: 'Are you sure you want to remove this batch?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, delete it'
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.deletePteBatch(id).subscribe({
          next: (res: any) => {
            if (res && res.success) {
              Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Batch removed', timer: 1500, showConfirmButton: false });
              this.loadBatches();
            }
          },
          error: (err: any) => {
            Swal.fire('Error', err.error?.message || 'Failed to delete batch', 'error');
          }
        });
      }
    });
  }
}
