import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SystemSettingsService } from '../../../../core/services/system-settings.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-intake-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 1.5rem;">
      <h3 style="margin: 0; font-size: 1.5rem; font-weight: 600;">Intake Management</h3>
      <button class="btn btn-primary" (click)="openModal()" style="display: flex; align-items: center; gap: 8px;">
        <i class="bi bi-plus-lg"></i> Add Intake
      </button>
    </div>

    <div class="card border-0 shadow-sm mb-4" style="border-radius: 12px;">
      <div class="card-body p-3">
        <div style="display: flex; align-items: center;">
          <div style="width: 300px; position: relative;">
            <i class="bi bi-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b;"></i>
            <input type="text" class="form-control" placeholder="Search intake..." [(ngModel)]="searchTerm" style="padding-left: 40px; height: 42px; width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; color: #334155; outline: none;">
          </div>
        </div>
      </div>
    </div>

    <div class="table-card mt-0">
      <table class="table">
        <thead>
          <tr>
            <th>INTAKE NAME</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of filteredItems">
            <td class="fw-bold">{{ item.name }}</td>
            <td>
              <button class="btn btn-icon text-primary me-2" (click)="editModal(item)"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-icon text-danger" (click)="deleteItem(item.id)"><i class="bi bi-trash"></i></button>
            </td>
          </tr>
          <tr *ngIf="items.length === 0">
            <td colspan="2" class="text-center text-muted py-4">No intakes found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="modal-backdrop" *ngIf="showModal">
      <div class="modal-content" style="max-width: 500px;">
        <h4 style="margin-top: 0; margin-bottom: 24px; font-weight: 600;">{{ currentItem.id ? 'Edit Intake' : 'Add Intake' }}</h4>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Intake Name</label>
          <input type="text" class="form-control" [(ngModel)]="currentItem.name" placeholder="e.g. Spring" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
          <button class="btn btn-light" (click)="closeModal()" style="padding: 10px 20px; border-radius: 8px; background: #f1f5f9; border: none; font-weight: 500;">Cancel</button>
          <button class="btn btn-primary" (click)="saveItem()" style="padding: 10px 20px; border-radius: 8px; font-weight: 500;">Save Intake</button>
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
export class IntakeManagementComponent implements OnInit {
  items: any[] = [];
  currentItem: any = { name: '' };
  showModal: boolean = false;
  searchTerm: string = '';

  constructor(private settingsService: SystemSettingsService) {}

  ngOnInit() { this.loadItems(); }

  loadItems() {
    this.settingsService.getIntakes().subscribe({
      next: (res: any) => { if (res.success) this.items = res.data; }
    });
  }

  get filteredItems() {
    if (!this.searchTerm) return this.items;
    const term = this.searchTerm.toLowerCase();
    return this.items.filter(i => i.name.toLowerCase().includes(term));
  }

  openModal() { this.currentItem = { name: '' }; this.showModal = true; }
  editModal(item: any) { this.currentItem = { ...item }; this.showModal = true; }
  closeModal() { this.showModal = false; }

  saveItem() { 
    if (!this.currentItem.name) {
      Swal.fire('Error', 'Name is required', 'error');
      return;
    }
    if (this.currentItem.id) {
      this.settingsService.updateIntake(this.currentItem.id, this.currentItem).subscribe({
        next: (res: any) => {
          if (res.success) {
            Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Intake updated' });
            this.loadItems();
            this.closeModal();
          }
        }
      });
    } else {
      this.settingsService.createIntake(this.currentItem).subscribe({
        next: (res: any) => {
          if (res.success) {
            Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Intake added' });
            this.loadItems();
            this.closeModal();
          }
        }
      });
    }
  }

  deleteItem(id: number) {
    Swal.fire({ title: 'Are you sure?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes, delete it!' })
    .then((result) => {
      if (result.isConfirmed) {
        this.settingsService.deleteIntake(id).subscribe({
          next: (res: any) => {
            if (res.success) {
              Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Intake deleted' });
              this.loadItems();
            }
          }
        });
      }
    });
  }
}
