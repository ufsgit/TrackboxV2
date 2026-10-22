import { showImpressiveSuccess, showLeadDeletedSuccess, showConfirmDelete } from '../../../../core/utils/impressive-alert';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReceiptsService } from '../../../../core/services/receipts.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-receipt-type-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 12px;">
      <div>
        <h3 style="margin: 0; font-size: 1.5rem; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 10px;">
          <i class="bi bi-receipt-cutoff text-success"></i> Receipt Type Management
        </h3>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 0.88rem;">Manage fee categories, tuition deposits, and payment classifications</p>
      </div>
      <button class="btn btn-success" (click)="openModal()" style="display: flex; align-items: center; gap: 8px; border-radius: 10px; font-weight: 600; padding: 10px 18px; background: linear-gradient(135deg, #10b981, #059669); border: none; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
        <i class="bi bi-plus-lg"></i> Add Receipt Type
      </button>
    </div>

    <div class="card border-0 shadow-sm mb-4" style="border-radius: 12px;">
      <div class="card-body p-3">
        <div style="display: flex; align-items: center;">
          <div style="width: 320px; position: relative;">
            <i class="bi bi-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b;"></i>
            <input type="text" class="form-control" placeholder="Search receipt types..." [(ngModel)]="searchTerm" style="padding-left: 40px; height: 42px; width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; color: #334155; outline: none;">
          </div>
        </div>
      </div>
    </div>

    <div class="table-card mt-0">
      <table class="table">
        <thead>
          <tr>
            <th style="width: 80px;">#</th>
            <th>RECEIPT TYPE NAME</th>
            <th>CREATED DATE</th>
            <th style="text-align: right;">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of filteredItems; let i = index">
            <td class="text-muted">{{ i + 1 }}</td>
            <td class="fw-bold">
              <span class="type-badge">
                <i class="bi bi-tag-fill me-1 text-success"></i> {{ item.name }}
              </span>
            </td>
            <td class="text-muted" style="font-size: 0.88rem;">
              {{ item.created_at ? (item.created_at | date:'mediumDate') : '—' }}
            </td>
            <td style="text-align: right;">
              <button class="btn btn-icon text-primary me-2" (click)="editModal(item)" title="Edit Type">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-icon text-danger" (click)="deleteItem(item.id)" title="Delete Type">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
          <tr *ngIf="items.length === 0">
            <td colspan="4" class="text-center text-muted py-5">
              <div class="mb-2"><i class="bi bi-receipt" style="font-size: 2rem; color: #cbd5e1;"></i></div>
              <p class="mb-0">No receipt types defined yet. Click "Add Receipt Type" to create one.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Form -->
    <div class="modal-backdrop" *ngIf="showModal">
      <div class="modal-content" style="max-width: 500px;">
        <h4 style="margin-top: 0; margin-bottom: 24px; font-weight: 700; color: #0f172a;">
          {{ currentItem.id ? 'Edit Receipt Type' : 'Add Receipt Type' }}
        </h4>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.88rem; color: #475569;">
            Receipt Type Name *
          </label>
          <input type="text" class="form-control" [(ngModel)]="currentItem.name" placeholder="e.g. Tuition Fee, Registration Fee, Visa Charge" style="width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; font-size: 0.95rem;">
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
          <button class="btn btn-light" (click)="closeModal()" style="padding: 10px 20px; border-radius: 8px; background: #f1f5f9; border: none; font-weight: 600; color: #64748b;">
            Cancel
          </button>
          <button class="btn btn-success" (click)="saveItem()" style="padding: 10px 22px; border-radius: 8px; font-weight: 600; background: linear-gradient(135deg, #10b981, #059669); border: none; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
            {{ currentItem.id ? 'Update Type' : 'Save Type' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-card { background: #fff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); padding: 24px; }
    .table { width: 100%; margin-bottom: 0; color: #1e293b; border-collapse: collapse; }
    .table th { color: #64748b; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; text-align: left; }
    .table td { padding: 16px 12px; vertical-align: middle; border-bottom: 1px solid #f8fafc; }
    .type-badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 6px; background: rgba(16, 185, 129, 0.08); color: #047857; font-weight: 600; font-size: 0.9rem; }
    .btn-icon { padding: 6px 10px; border-radius: 6px; border: none; background: transparent; transition: all 0.2s; font-size: 1.1rem; }
    .btn-icon:hover { background: #f1f5f9; }
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); z-index: 1050; display: flex; align-items: center; justify-content: center; }
    .modal-content { background: #fff; border-radius: 16px; padding: 32px; width: 100%; max-width: 500px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border: none; }
  `]
})
export class ReceiptTypeManagementComponent implements OnInit {
  items: any[] = [];
  currentItem: any = { name: '' };
  showModal: boolean = false;
  searchTerm: string = '';

  constructor(private receiptsService: ReceiptsService) {}

  ngOnInit() { this.loadItems(); }

  loadItems() {
    this.receiptsService.getReceiptTypes().subscribe({
      next: (res: any) => { if (res.success) this.items = res.data; }
    });
  }

  get filteredItems() {
    if (!this.searchTerm) return this.items;
    const term = this.searchTerm.toLowerCase();
    return this.items.filter(i => i.name?.toLowerCase().includes(term));
  }

  openModal() {
    this.currentItem = { name: '' };
    this.showModal = true;
  }

  editModal(item: any) {
    this.currentItem = { ...item };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.currentItem = { name: '' };
  }

  saveItem() {
    if (!this.currentItem.name || !this.currentItem.name.trim()) {
      Swal.fire('Warning', 'Receipt type name is required.', 'warning');
      return;
    }

    if (this.currentItem.id) {
      this.receiptsService.updateReceiptType(this.currentItem.id, this.currentItem.name).subscribe({
        next: (res: any) => {
          if (res.success) {
            showImpressiveSuccess('Receipt type updated successfully');
            this.closeModal();
            this.loadItems();
          }
        },
        error: (err) => Swal.fire('Error', err.error?.message || 'Error updating receipt type', 'error')
      });
    } else {
      this.receiptsService.createReceiptType(this.currentItem.name).subscribe({
        next: (res: any) => {
          if (res.success) {
            showImpressiveSuccess('Receipt type created successfully');
            this.closeModal();
            this.loadItems();
          }
        },
        error: (err) => Swal.fire('Error', err.error?.message || 'Error creating receipt type', 'error')
      });
    }
  }

  deleteItem(id: number) {
    showConfirmDelete('Delete Receipt Type?', 'Are you sure you want to delete this receipt type?').then(confirmed => {
      if (confirmed) {
        this.receiptsService.deleteReceiptType(id).subscribe({
          next: (res: any) => {
            if (res.success) {
              showLeadDeletedSuccess('Receipt Type');
              this.loadItems();
            }
          },
          error: (err) => Swal.fire('Error', err.error?.message || 'Error deleting receipt type', 'error')
        });
      }
    });
  }
}
