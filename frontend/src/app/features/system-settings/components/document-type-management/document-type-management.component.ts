import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SystemSettingsService } from '../../../../core/services/system-settings.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-document-type-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 1.5rem;">
      <h3 style="margin: 0; font-size: 1.5rem; font-weight: 600;">Document Type Management</h3>
      <button class="btn btn-primary" (click)="openModal()" style="display: flex; align-items: center; gap: 8px;">
        <i class="bi bi-plus-lg"></i> Add Document Type
      </button>
    </div>

    <!-- Filters Section -->
    <div class="card border-0 shadow-sm mb-4" style="border-radius: 12px;">
      <div class="card-body p-3">
        <div style="display: flex; align-items: center;">
          <!-- Search -->
          <div style="width: 300px; position: relative;">
            <i class="bi bi-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b;"></i>
            <input type="text" class="form-control" placeholder="Search document type..." [(ngModel)]="searchTerm" style="padding-left: 40px; height: 42px; width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; color: #334155; outline: none;">
          </div>
        </div>
      </div>
    </div>

    <div class="table-card mt-0">
      <table class="table">
        <thead>
          <tr>
            <th>DOCUMENT TYPE NAME</th>
            <th>DESCRIPTION</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let docType of filteredDocumentTypes">
            <td class="fw-bold">{{ docType.name }}</td>
            <td class="text-muted">{{ docType.description || 'No description' }}</td>
            <td>
              <button class="btn btn-icon text-primary me-2" (click)="editModal(docType)"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-icon text-danger" (click)="deleteDocumentType(docType.id)"><i class="bi bi-trash"></i></button>
            </td>
          </tr>
          <tr *ngIf="documentTypes.length === 0">
            <td colspan="3" class="text-center text-muted py-4">No document types found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Document Type Modal -->
    <div class="modal-backdrop" *ngIf="showModal">
      <div class="modal-content" style="max-width: 500px;">
        <h4 style="margin-top: 0; margin-bottom: 24px; font-weight: 600;">{{ currentDocumentType.id ? 'Edit Document Type' : 'Add Document Type' }}</h4>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Document Type Name</label>
          <input type="text" class="form-control" [(ngModel)]="currentDocumentType.name" placeholder="e.g. Passport" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
        </div>
        
        <div style="margin-bottom: 24px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Description</label>
          <textarea class="form-control" [(ngModel)]="currentDocumentType.description" rows="3" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;"></textarea>
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
          <button class="btn btn-light" (click)="closeModal()" style="padding: 10px 20px; border-radius: 8px; background: #f1f5f9; border: none; font-weight: 500;">Cancel</button>
          <button class="btn btn-primary" (click)="saveDocumentType()" style="padding: 10px 20px; border-radius: 8px; font-weight: 500;">Save</button>
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
export class DocumentTypeManagementComponent implements OnInit {
  documentTypes: any[] = [];
  currentDocumentType: any = { name: '', description: '' };
  showModal: boolean = false;
  searchTerm: string = '';

  constructor(private settingsService: SystemSettingsService) {}

  ngOnInit() {
    this.loadDocumentTypes();
  }

  loadDocumentTypes() {
    this.settingsService.getDocumentTypes().subscribe({
      next: (res: any) => { if(res.success) this.documentTypes = res.data; }
    });
  }

  get filteredDocumentTypes() {
    if (!this.searchTerm) return this.documentTypes;
    const term = this.searchTerm.toLowerCase();
    return this.documentTypes.filter(d => d.name.toLowerCase().includes(term));
  }

  openModal() { this.currentDocumentType = { name: '', description: '' }; this.showModal = true; }
  editModal(docType: any) { this.currentDocumentType = { ...docType }; this.showModal = true; }
  closeModal() { this.showModal = false; }

  saveDocumentType() { 
    if (this.currentDocumentType.id) {
      this.settingsService.updateDocumentType(this.currentDocumentType.id, this.currentDocumentType).subscribe({
        next: (res: any) => {
          if (res.success) {
            Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Document type updated' });
            this.loadDocumentTypes();
            this.closeModal();
          } else {
            Swal.fire({ icon: 'error', title: 'Error', text: res.message || 'Failed to update document type' });
          }
        },
        error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Server error' })
      });
    } else {
      this.settingsService.createDocumentType(this.currentDocumentType).subscribe({
        next: (res: any) => {
          if (res.success) {
            Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Document type added' });
            this.loadDocumentTypes();
            this.closeModal();
          } else {
            Swal.fire({ icon: 'error', title: 'Error', text: res.message || 'Failed to create document type' });
          }
        },
        error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'Server error' })
      });
    }
  }

  deleteDocumentType(id: number) {
    Swal.fire({ title: 'Are you sure?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes, delete it!' })
    .then((result) => {
      if (result.isConfirmed) {
        this.settingsService.deleteDocumentType(id).subscribe({
          next: (res: any) => {
            if (res.success) {
              Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Document type deleted' });
              this.loadDocumentTypes();
            }
          }
        });
      }
    });
  }
}

