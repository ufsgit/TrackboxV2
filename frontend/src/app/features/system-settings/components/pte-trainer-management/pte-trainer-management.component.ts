import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SystemSettingsService } from '../../../../core/services/system-settings.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pte-trainer-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 1.5rem;">
      <div>
        <h3 style="margin: 0; font-size: 1.5rem; font-weight: 600; color: #0f172a;">
          <i class="bi bi-person-video3 text-primary me-2"></i>PTE Trainer Management
        </h3>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 0.9rem;">
          Manage instructors, language trainers, specializations, contact details, and user accounts.
        </p>
      </div>
      <button class="btn btn-primary" (click)="openModal()" style="display: flex; align-items: center; gap: 8px; border-radius: 8px; padding: 10px 18px; font-weight: 500; background: #4f46e5; border-color: #4f46e5;">
        <i class="bi bi-plus-lg"></i> Add PTE Trainer
      </button>
    </div>

    <!-- Filters Section -->
    <div class="card border-0 shadow-sm mb-4" style="border-radius: 12px;">
      <div class="card-body p-3">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div style="width: 320px; position: relative;">
            <i class="bi bi-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b;"></i>
            <input type="text" class="form-control" placeholder="Search trainer..." [(ngModel)]="searchTerm" style="padding-left: 40px; height: 42px; width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; color: #334155; outline: none;">
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span class="badge" style="background: #fef3c7; color: #92400e; padding: 6px 12px; border-radius: 20px; font-weight: 600;">
              Total Trainers: {{ trainers.length }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Trainers Table -->
    <div class="table-card mt-0">
      <table class="table">
        <thead>
          <tr>
            <th>TRAINER NAME</th>
            <th>SPECIALIZATION</th>
            <th>CONTACT DETAILS</th>
            <th>LINKED USER ACCOUNT</th>
            <th>STATUS</th>
            <th style="width: 120px; text-align: right;">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of filteredTrainers">
            <td>
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 36px; height: 36px; border-radius: 50%; background: #e0e7ff; color: #4338ca; display: flex; align-items: center; justify-content: center; font-weight: 600;">
                  {{ (item.name || 'T')[0] }}
                </div>
                <div>
                  <div style="font-weight: 600; color: #0f172a;">{{ item.name }}</div>
                </div>
              </div>
            </td>
            <td>
              <span class="badge" style="background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; padding: 5px 10px; border-radius: 6px; font-weight: 500;">
                <i class="bi bi-award me-1 text-primary"></i>{{ item.specialization || 'PTE Academic' }}
              </span>
            </td>
            <td>
              <div style="display: flex; flex-direction: column; gap: 2px;">
                <div *ngIf="item.email" style="font-size: 0.85rem; color: #475569;">
                  <i class="bi bi-envelope me-1 text-muted"></i>{{ item.email }}
                </div>
                <div *ngIf="item.phone" style="font-size: 0.85rem; color: #475569;">
                  <i class="bi bi-telephone me-1 text-muted"></i>{{ item.phone }}
                </div>
                <div *ngIf="!item.email && !item.phone" class="text-muted">—</div>
              </div>
            </td>
            <td>
              <span *ngIf="item.user_name" class="badge" style="background: #ede9fe; color: #6d28d9; padding: 5px 10px; border-radius: 6px;">
                <i class="bi bi-person-badge me-1"></i>{{ item.user_name }}
              </span>
              <span *ngIf="!item.user_name" class="text-muted" style="font-size: 0.85rem;">Not linked</span>
            </td>
            <td>
              <span class="badge" [style.background]="item.is_active ? '#ecfdf5' : '#f1f5f9'" [style.color]="item.is_active ? '#059669' : '#64748b'" style="padding: 4px 10px; border-radius: 20px; font-weight: 600; font-size: 0.78rem;">
                {{ item.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td style="text-align: right;">
              <button class="btn btn-icon text-primary me-2" (click)="editModal(item)" title="Edit Trainer">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-icon text-danger" (click)="deleteItem(item.id)" title="Delete Trainer">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
          <tr *ngIf="filteredTrainers.length === 0">
            <td colspan="6" class="text-center text-muted py-4">No trainers found.</td>
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
            <i class="bi bi-person-video3 text-primary"></i>
            {{ isEditing ? 'Edit PTE Trainer' : 'Add PTE Trainer' }}
          </h5>
          <button type="button" class="btn-close-modal" (click)="closeModal()" aria-label="Close">
            <i class="bi bi-x"></i>
          </button>
        </div>
        
        <!-- Modal Body (Scrollable) -->
        <div class="modal-body-custom">
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div>
              <label style="display: block; font-weight: 500; font-size: 0.88rem; color: #334155; margin-bottom: 6px;">Trainer Full Name <span class="text-danger">*</span></label>
              <input type="text" class="form-control" [(ngModel)]="currentItem.name" placeholder="e.g. Dr. Sarah Jenkins" style="height: 42px; border: 1px solid #cbd5e1; border-radius: 8px;">
            </div>

            <div>
              <label style="display: block; font-weight: 500; font-size: 0.88rem; color: #334155; margin-bottom: 6px;">Specialization</label>
              <input type="text" class="form-control" [(ngModel)]="currentItem.specialization" placeholder="e.g. PTE Speaking & Pronunciation / Master Trainer" style="height: 42px; border: 1px solid #cbd5e1; border-radius: 8px;">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <label style="display: block; font-weight: 500; font-size: 0.88rem; color: #334155; margin-bottom: 6px;">Email Address</label>
                <input type="email" class="form-control" [(ngModel)]="currentItem.email" placeholder="trainer@domain.com" style="height: 42px; border: 1px solid #cbd5e1; border-radius: 8px;">
              </div>
              <div>
                <label style="display: block; font-weight: 500; font-size: 0.88rem; color: #334155; margin-bottom: 6px;">Phone Number</label>
                <input type="text" class="form-control" [(ngModel)]="currentItem.phone" placeholder="+91 98765 43210" style="height: 42px; border: 1px solid #cbd5e1; border-radius: 8px;">
              </div>
            </div>

            <div>
              <label style="display: block; font-weight: 500; font-size: 0.88rem; color: #334155; margin-bottom: 6px;">Link to CRM User Account (Optional)</label>
              <select class="form-select" [(ngModel)]="currentItem.user_id" style="height: 42px; border: 1px solid #cbd5e1; border-radius: 8px;">
                <option [ngValue]="null">None / External Trainer</option>
                <option *ngFor="let u of userList" [ngValue]="u.id">{{ u.name }} ({{ u.email }})</option>
              </select>
              <small style="color: #64748b; font-size: 0.78rem; display: block; margin-top: 4px;">
                Linking allows the trainer to log in and evaluate their assigned batches and mock tests.
              </small>
            </div>

            <div style="display: flex; align-items: center; gap: 10px; margin-top: 4px;">
              <input type="checkbox" id="trainerIsActive" [(ngModel)]="currentItem.is_active" style="width: 18px; height: 18px; border-radius: 4px; accent-color: #4f46e5; cursor: pointer;">
              <label for="trainerIsActive" style="font-size: 0.88rem; font-weight: 500; color: #334155; cursor: pointer; margin: 0;">Active for Batch & Enrollment Assignment</label>
            </div>
          </div>
        </div>
        
        <!-- Modal Footer (Pinned) -->
        <div class="modal-footer-custom">
          <button class="btn btn-light" (click)="closeModal()" style="padding: 9px 18px; border-radius: 8px; background: #fff; border: 1px solid #cbd5e1; font-weight: 500; color: #475569;">Cancel</button>
          <button class="btn btn-primary" (click)="saveItem()" [disabled]="!currentItem.name?.trim()" style="padding: 9px 20px; border-radius: 8px; font-weight: 500; background: #4f46e5; border-color: #4f46e5;">Save Trainer</button>
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
export class PteTrainerManagementComponent implements OnInit {
  trainers: any[] = [];
  userList: any[] = [];
  searchTerm: string = '';
  showModal: boolean = false;
  isEditing: boolean = false;

  currentItem: any = {
    id: null,
    name: '',
    email: '',
    phone: '',
    specialization: 'PTE Academic',
    user_id: null,
    is_active: true
  };

  constructor(private service: SystemSettingsService) {}

  ngOnInit(): void {
    this.loadTrainers();
    this.loadUsers();
  }

  loadTrainers(): void {
    this.service.getPteTrainers({ all: true }).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.trainers = res.data || [];
        }
      },
      error: (err: any) => {
        console.error('Error loading trainers:', err);
      }
    });
  }

  loadUsers(): void {
    this.service.getTeams().subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.userList = res.data || [];
        } else if (Array.isArray(res)) {
          this.userList = res;
        }
      }
    });
  }

  get filteredTrainers(): any[] {
    if (!this.searchTerm.trim()) {
      return this.trainers;
    }
    const q = this.searchTerm.toLowerCase();
    return this.trainers.filter(t =>
      t.name?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.specialization?.toLowerCase().includes(q)
    );
  }

  openModal(): void {
    this.isEditing = false;
    this.currentItem = {
      id: null,
      name: '',
      email: '',
      phone: '',
      specialization: 'PTE Academic',
      user_id: null,
      is_active: true
    };
    this.showModal = true;
  }

  editModal(item: any): void {
    this.isEditing = true;
    this.currentItem = {
      id: item.id,
      name: item.name,
      email: item.email || '',
      phone: item.phone || '',
      specialization: item.specialization || 'PTE Academic',
      user_id: item.user_id || null,
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
      this.service.updatePteTrainer(this.currentItem.id, this.currentItem).subscribe({
        next: (res: any) => {
          if (res && res.success) {
            Swal.fire({ icon: 'success', title: 'Updated!', text: 'Trainer updated successfully', timer: 1500, showConfirmButton: false });
            this.closeModal();
            this.loadTrainers();
          }
        },
        error: (err: any) => {
          Swal.fire('Error', err.error?.message || 'Failed to update trainer', 'error');
        }
      });
    } else {
      this.service.createPteTrainer(this.currentItem).subscribe({
        next: (res: any) => {
          if (res && res.success) {
            Swal.fire({ icon: 'success', title: 'Created!', text: 'Trainer added successfully', timer: 1500, showConfirmButton: false });
            this.closeModal();
            this.loadTrainers();
          }
        },
        error: (err: any) => {
          Swal.fire('Error', err.error?.message || 'Failed to create trainer', 'error');
        }
      });
    }
  }

  deleteItem(id: number): void {
    Swal.fire({
      title: 'Delete PTE Trainer?',
      text: 'Are you sure you want to remove this trainer profile?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, delete it'
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.deletePteTrainer(id).subscribe({
          next: (res: any) => {
            if (res && res.success) {
              Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Trainer removed', timer: 1500, showConfirmButton: false });
              this.loadTrainers();
            }
          },
          error: (err: any) => {
            Swal.fire('Error', err.error?.message || 'Failed to delete trainer', 'error');
          }
        });
      }
    });
  }
}
