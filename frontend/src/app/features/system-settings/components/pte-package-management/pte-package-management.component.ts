import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SystemSettingsService } from '../../../../core/services/system-settings.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pte-package-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 1.5rem;">
      <div>
        <h3 style="margin: 0; font-size: 1.5rem; font-weight: 600; color: #0f172a;">
          <i class="bi bi-box-seam-fill text-primary me-2"></i>PTE Package Management
        </h3>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 0.9rem;">
          Configure training courses, packages, pricing fees, duration, and mock test limits.
        </p>
      </div>
      <button class="btn btn-primary" (click)="openModal()" style="display: flex; align-items: center; gap: 8px; border-radius: 8px; padding: 10px 18px; font-weight: 500; background: #4f46e5; border-color: #4f46e5;">
        <i class="bi bi-plus-lg"></i> Add PTE Package
      </button>
    </div>

    <!-- Filters Section -->
    <div class="card border-0 shadow-sm mb-4" style="border-radius: 12px;">
      <div class="card-body p-3">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div style="width: 320px; position: relative;">
            <i class="bi bi-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b;"></i>
            <input type="text" class="form-control" placeholder="Search package..." [(ngModel)]="searchTerm" style="padding-left: 40px; height: 42px; width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; color: #334155; outline: none;">
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span class="badge" style="background: #e0f2fe; color: #0369a1; padding: 6px 12px; border-radius: 20px; font-weight: 600;">
              Total Packages: {{ packages.length }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Packages Table -->
    <div class="table-card mt-0">
      <table class="table">
        <thead>
          <tr>
            <th>PACKAGE NAME</th>
            <th>DURATION</th>
            <th>FEE / PRICE</th>
            <th>SESSIONS</th>
            <th>MOCK TESTS</th>
            <th>STATUS</th>
            <th style="width: 120px; text-align: right;">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of filteredPackages">
            <td>
              <div style="font-weight: 600; color: #0f172a;">{{ item.name }}</div>
              <small class="text-muted" *ngIf="item.description">{{ item.description }}</small>
            </td>
            <td>
              <span class="badge" style="background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; padding: 5px 10px; border-radius: 6px; font-weight: 500;">
                <i class="bi bi-clock me-1 text-primary"></i>{{ item.duration || 'Flexible' }}
              </span>
            </td>
            <td>
              <span style="font-weight: 600; color: #059669; font-size: 0.95rem;">
                {{ (item.price || 0) | currency:'INR':'symbol':'1.0-2' }}
              </span>
            </td>
            <td>
              <span style="font-weight: 500; color: #475569;">{{ item.total_sessions || 0 }} Classes</span>
            </td>
            <td>
              <span class="badge" style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 12px; font-weight: 600;">
                <i class="bi bi-file-earmark-check me-1"></i>{{ item.mock_tests_count || 0 }} Mocks
              </span>
            </td>
            <td>
              <span class="badge" [style.background]="item.is_active ? '#ecfdf5' : '#f1f5f9'" [style.color]="item.is_active ? '#059669' : '#64748b'" style="padding: 4px 10px; border-radius: 20px; font-weight: 600; font-size: 0.78rem;">
                {{ item.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td style="text-align: right;">
              <button class="btn btn-icon text-primary me-2" (click)="editModal(item)" title="Edit Package">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-icon text-danger" (click)="deleteItem(item.id)" title="Delete Package">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
          <tr *ngIf="filteredPackages.length === 0">
            <td colspan="7" class="text-center text-muted py-4">No packages found.</td>
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
            <i class="bi bi-box-seam-fill text-primary"></i>
            {{ isEditing ? 'Edit PTE Package' : 'Add PTE Package' }}
          </h5>
          <button type="button" class="btn-close-modal" (click)="closeModal()" aria-label="Close">
            <i class="bi bi-x"></i>
          </button>
        </div>
        
        <!-- Modal Body (Scrollable) -->
        <div class="modal-body-custom">
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div>
              <label style="display: block; font-weight: 500; font-size: 0.88rem; color: #334155; margin-bottom: 6px;">Package Name <span class="text-danger">*</span></label>
              <input type="text" class="form-control" [(ngModel)]="currentItem.name" placeholder="e.g. Standard Coaching (30 Days)" style="height: 42px; border: 1px solid #cbd5e1; border-radius: 8px;">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <label style="display: block; font-weight: 500; font-size: 0.88rem; color: #334155; margin-bottom: 6px;">Duration</label>
                <input type="text" class="form-control" [(ngModel)]="currentItem.duration" placeholder="e.g. 30 Days / 4 Weeks" style="height: 42px; border: 1px solid #cbd5e1; border-radius: 8px;">
              </div>
              <div>
                <label style="display: block; font-weight: 500; font-size: 0.88rem; color: #334155; margin-bottom: 6px;">Price / Fee</label>
                <div style="position: relative;">
                  <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-weight: 600; color: #64748b;">₹</span>
                  <input type="number" class="form-control" [(ngModel)]="currentItem.price" placeholder="12000" min="0" style="padding-left: 28px; height: 42px; border: 1px solid #cbd5e1; border-radius: 8px;">
                </div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <label style="display: block; font-weight: 500; font-size: 0.88rem; color: #334155; margin-bottom: 6px;">Total Sessions</label>
                <input type="number" class="form-control" [(ngModel)]="currentItem.total_sessions" placeholder="30" min="1" style="height: 42px; border: 1px solid #cbd5e1; border-radius: 8px;">
              </div>
              <div>
                <label style="display: block; font-weight: 500; font-size: 0.88rem; color: #334155; margin-bottom: 6px;">Mock Tests Included</label>
                <input type="number" class="form-control" [(ngModel)]="currentItem.mock_tests_count" placeholder="5" min="0" style="height: 42px; border: 1px solid #cbd5e1; border-radius: 8px;">
              </div>
            </div>

            <div>
              <label style="display: block; font-weight: 500; font-size: 0.88rem; color: #334155; margin-bottom: 6px;">Description / Package Highlights</label>
              <textarea class="form-control" rows="3" [(ngModel)]="currentItem.description" placeholder="Course highlights, material inclusions, target score guarantee..." style="border: 1px solid #cbd5e1; border-radius: 8px; resize: vertical;"></textarea>
            </div>

            <div style="display: flex; align-items: center; gap: 10px; margin-top: 4px;">
              <input type="checkbox" id="pkgIsActive" [(ngModel)]="currentItem.is_active" style="width: 18px; height: 18px; border-radius: 4px; accent-color: #4f46e5; cursor: pointer;">
              <label for="pkgIsActive" style="font-size: 0.88rem; font-weight: 500; color: #334155; cursor: pointer; margin: 0;">Active for Student Enrollment</label>
            </div>
          </div>
        </div>
        
        <!-- Modal Footer (Pinned) -->
        <div class="modal-footer-custom">
          <button class="btn btn-light" (click)="closeModal()" style="padding: 9px 18px; border-radius: 8px; background: #fff; border: 1px solid #cbd5e1; font-weight: 500; color: #475569;">Cancel</button>
          <button class="btn btn-primary" (click)="saveItem()" [disabled]="!currentItem.name?.trim()" style="padding: 9px 20px; border-radius: 8px; font-weight: 500; background: #4f46e5; border-color: #4f46e5;">Save Package</button>
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
export class PtePackageManagementComponent implements OnInit {
  packages: any[] = [];
  searchTerm: string = '';
  showModal: boolean = false;
  isEditing: boolean = false;

  currentItem: any = {
    id: null,
    name: '',
    duration: '30 Days',
    price: 12000,
    total_sessions: 30,
    mock_tests_count: 5,
    description: '',
    is_active: true
  };

  constructor(private service: SystemSettingsService) {}

  ngOnInit(): void {
    this.loadPackages();
  }

  loadPackages(): void {
    this.service.getPtePackages({ all: true }).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.packages = res.data || [];
        }
      },
      error: (err: any) => {
        console.error('Error loading PTE packages:', err);
      }
    });
  }

  get filteredPackages(): any[] {
    if (!this.searchTerm.trim()) {
      return this.packages;
    }
    const q = this.searchTerm.toLowerCase();
    return this.packages.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.duration?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  }

  openModal(): void {
    this.isEditing = false;
    this.currentItem = {
      id: null,
      name: '',
      duration: '30 Days',
      price: 12000,
      total_sessions: 30,
      mock_tests_count: 5,
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
      duration: item.duration || '30 Days',
      price: item.price || 0,
      total_sessions: item.total_sessions || 20,
      mock_tests_count: item.mock_tests_count || 5,
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
      this.service.updatePtePackage(this.currentItem.id, this.currentItem).subscribe({
        next: (res: any) => {
          if (res && res.success) {
            Swal.fire({ icon: 'success', title: 'Updated!', text: 'PTE package updated successfully', timer: 1500, showConfirmButton: false });
            this.closeModal();
            this.loadPackages();
          }
        },
        error: (err: any) => {
          Swal.fire('Error', err.error?.message || 'Failed to update package', 'error');
        }
      });
    } else {
      this.service.createPtePackage(this.currentItem).subscribe({
        next: (res: any) => {
          if (res && res.success) {
            Swal.fire({ icon: 'success', title: 'Created!', text: 'PTE package created successfully', timer: 1500, showConfirmButton: false });
            this.closeModal();
            this.loadPackages();
          }
        },
        error: (err: any) => {
          Swal.fire('Error', err.error?.message || 'Failed to create package', 'error');
        }
      });
    }
  }

  deleteItem(id: number): void {
    Swal.fire({
      title: 'Delete PTE Package?',
      text: 'Are you sure you want to remove this coaching package?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, delete it'
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.deletePtePackage(id).subscribe({
          next: (res: any) => {
            if (res && res.success) {
              Swal.fire({ icon: 'success', title: 'Deleted!', text: 'PTE package removed', timer: 1500, showConfirmButton: false });
              this.loadPackages();
            }
          },
          error: (err: any) => {
            Swal.fire('Error', err.error?.message || 'Failed to delete package', 'error');
          }
        });
      }
    });
  }
}
