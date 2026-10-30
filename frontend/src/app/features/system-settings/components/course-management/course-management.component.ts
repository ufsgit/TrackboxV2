import { showImpressiveSuccess } from '../../../../core/utils/impressive-alert';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SystemSettingsService } from '../../../../core/services/system-settings.service';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 1.5rem;">
      <div>
        <h3 style="margin: 0; font-size: 1.5rem; font-weight: 600;">Course Management</h3>
        <p class="text-muted mb-0" style="font-size: 0.875rem;">Manage all available courses, durations, and fee structures.</p>
      </div>
      <div style="display: flex; gap: 10px;">
        <input type="file" id="courseExcelInput" (change)="onFileChange($event)" accept=".xlsx, .xls, .csv" style="display: none;">
        <button class="btn btn-outline-primary" (click)="triggerImport()" [disabled]="importing" style="display: flex; align-items: center; gap: 6px; border-radius: 8px;">
          <span *ngIf="importing" class="spinner-border spinner-border-sm"></span>
          <i *ngIf="!importing" class="bi bi-file-earmark-arrow-up"></i> Import Excel
        </button>
        <button class="btn btn-primary" (click)="openModal()" style="display: flex; align-items: center; gap: 8px; border-radius: 8px;">
          <i class="bi bi-plus-lg"></i> Add Course
        </button>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="card border-0 shadow-sm mb-4" style="border-radius: 12px;">
      <div class="card-body p-3">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <!-- Search -->
          <div style="width: 340px; position: relative;">
            <i class="bi bi-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b;"></i>
            <input type="text" class="form-control" placeholder="Search by name, duration, or details..." [(ngModel)]="searchTerm" (ngModelChange)="currentPage = 1" style="padding-left: 40px; height: 42px; width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; color: #334155; outline: none;">
          </div>
          <div class="text-muted" style="font-size: 0.875rem;">
            Total Courses: <span class="fw-bold text-dark">{{ filteredItems.length }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="table-card mt-0">
      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading courses...</span>
        </div>
        <p class="text-muted mt-2 mb-0">Loading courses...</p>
      </div>

      <table class="table" *ngIf="!loading">
        <thead>
          <tr>
            <th style="width: 35%;">COURSE NAME</th>
            <th style="width: 20%;">DURATION</th>
            <th style="width: 20%;">AMOUNT</th>
            <th style="width: 15%; text-align: right;">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of paginatedItems">
            <td>
              <div class="fw-bold text-dark" style="font-size: 0.95rem;">{{ item.name }}</div>
              <div class="text-muted text-truncate" style="max-width: 380px; font-size: 0.8rem;" *ngIf="item.description" [title]="item.description">
                {{ item.description }}
              </div>
            </td>
            <td>
              <span class="badge bg-light text-dark border px-2 py-1" style="font-weight: 500; font-size: 0.825rem;">
                <i class="bi bi-clock me-1 text-primary"></i> {{ item.duration || 'N/A' }}
              </span>
            </td>
            <td>
              <span class="fw-bold text-success" style="font-size: 0.95rem;">
                ₹{{ item.amount | number:'1.2-2' }}
              </span>
            </td>
            <td style="text-align: right;">
              <button class="btn btn-icon text-primary me-2" (click)="editModal(item)" title="Edit Course">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-icon text-danger" (click)="deleteItem(item.id)" title="Delete Course">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
          <tr *ngIf="filteredItems.length === 0">
            <td colspan="4" class="text-center text-muted py-5">
              <i class="bi bi-journal-x fs-1 d-block mb-2 text-secondary"></i>
              No courses found.
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination Controls -->
      <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top" *ngIf="!loading && filteredItems.length > pageSize">
        <div class="text-muted" style="font-size: 0.85rem;">
          Showing {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, filteredItems.length) }} of {{ filteredItems.length }}
        </div>
        <div class="d-flex gap-1">
          <button class="btn btn-sm btn-outline-secondary" [disabled]="currentPage === 1" (click)="currentPage = currentPage - 1">
            <i class="bi bi-chevron-left"></i>
          </button>
          <span class="btn btn-sm btn-light disabled px-3">Page {{ currentPage }} of {{ totalPages }}</span>
          <button class="btn btn-sm btn-outline-secondary" [disabled]="currentPage >= totalPages" (click)="currentPage = currentPage + 1">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Course Modal -->
    <div class="modal-backdrop" *ngIf="showModal">
      <div class="modal-content" style="max-width: 550px;">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 style="margin: 0; font-weight: 600;">{{ currentItem.id ? 'Edit Course' : 'Add New Course' }}</h4>
          <button type="button" class="btn-close" (click)="closeModal()"></button>
        </div>
        
        <form (ngSubmit)="saveItem()">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 0.9rem;">
              Course Name <span class="text-danger">*</span>
            </label>
            <input type="text" class="form-control" [(ngModel)]="currentItem.name" name="name" placeholder="e.g. Full Stack Web Development" required style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 0.9rem;">
                Amount / Fee (₹) <span class="text-danger">*</span>
              </label>
              <input type="number" step="0.01" class="form-control" [(ngModel)]="currentItem.amount" name="amount" placeholder="e.g. 25000" required style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 0.9rem;">
                Duration
              </label>
              <input type="text" class="form-control" [(ngModel)]="currentItem.duration" name="duration" placeholder="e.g. 6 Months / 3 Years" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 0.9rem;">
              Description
            </label>
            <textarea class="form-control" rows="3" [(ngModel)]="currentItem.description" name="description" placeholder="Brief description of the course..." style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;"></textarea>
          </div>
          
          <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
            <button type="button" class="btn btn-light" (click)="closeModal()" style="padding: 10px 20px; border-radius: 8px; background: #f1f5f9; border: none; font-weight: 500;">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="saving" style="padding: 10px 20px; border-radius: 8px; font-weight: 500;">
              <span *ngIf="saving" class="spinner-border spinner-border-sm me-1"></span>
              {{ currentItem.id ? 'Save Changes' : 'Create Course' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .table-card { background: #fff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); padding: 24px; }
    .table { width: 100%; margin-bottom: 0; color: #1e293b; border-collapse: collapse; }
    .table th { color: #64748b; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; text-align: left; }
    .table td { padding: 14px 12px; vertical-align: middle; border-bottom: 1px solid #f8fafc; }
    .btn-icon { padding: 6px 8px; border-radius: 6px; border: none; background: transparent; transition: all 0.2s; font-size: 1rem; }
    .btn-icon:hover { background: #f1f5f9; }
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); z-index: 1050; display: flex; align-items: center; justify-content: center; }
    .modal-content { background: #fff; border-radius: 16px; padding: 32px; width: 100%; max-width: 550px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border: none; }
  `]
})
export class CourseManagementComponent implements OnInit {
  items: any[] = [];
  currentItem: any = { name: '', amount: null, duration: '', description: '' };
  showModal: boolean = false;
  searchTerm: string = '';
  loading: boolean = false;
  saving: boolean = false;
  importing: boolean = false;
  currentPage: number = 1;
  pageSize: number = 10;
  Math = Math;

  constructor(private settingsService: SystemSettingsService) {}

  ngOnInit() {
    this.loadItems();
  }

  loadItems() {
    this.loading = true;
    this.settingsService.getCourses().subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.items = res.data || [];
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error loading courses:', err);
      }
    });
  }

  get filteredItems() {
    if (!this.searchTerm) return this.items;
    const term = this.searchTerm.toLowerCase().trim();
    return this.items.filter(i => 
      (i.name && i.name.toLowerCase().includes(term)) ||
      (i.duration && i.duration.toLowerCase().includes(term)) ||
      (i.description && i.description.toLowerCase().includes(term))
    );
  }

  get totalPages(): number {
    return Math.ceil(this.filteredItems.length / this.pageSize) || 1;
  }

  get paginatedItems(): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredItems.slice(startIndex, startIndex + this.pageSize);
  }

  openModal() {
    this.currentItem = { name: '', amount: null, duration: '', description: '' };
    this.showModal = true;
  }

  editModal(item: any) {
    this.currentItem = { ...item };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.saving = false;
  }

  saveItem() {
    if (!this.currentItem.name || this.currentItem.name.trim() === '') {
      Swal.fire('Error', 'Course Name is required', 'error');
      return;
    }
    if (this.currentItem.amount === null || this.currentItem.amount === undefined || this.currentItem.amount === '') {
      Swal.fire('Error', 'Course Amount is required', 'error');
      return;
    }

    this.saving = true;
    if (this.currentItem.id) {
      this.settingsService.updateCourse(this.currentItem.id, this.currentItem).subscribe({
        next: (res: any) => {
          this.saving = false;
          if (res.success) {
            showImpressiveSuccess('Course updated successfully');
            this.loadItems();
            this.closeModal();
          } else {
            Swal.fire('Error', res.message || 'Failed to update course', 'error');
          }
        },
        error: (err: any) => {
          this.saving = false;
          Swal.fire('Error', err.error?.message || 'Failed to update course', 'error');
        }
      });
    } else {
      this.settingsService.createCourse(this.currentItem).subscribe({
        next: (res: any) => {
          this.saving = false;
          if (res.success) {
            showImpressiveSuccess('Course added successfully');
            this.loadItems();
            this.closeModal();
          } else {
            Swal.fire('Error', res.message || 'Failed to add course', 'error');
          }
        },
        error: (err: any) => {
          this.saving = false;
          Swal.fire('Error', err.error?.message || 'Failed to add course', 'error');
        }
      });
    }
  }

  deleteItem(id: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to delete this course?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.settingsService.deleteCourse(id).subscribe({
          next: (res: any) => {
            if (res.success) {
              showImpressiveSuccess('Course deleted successfully');
              this.loadItems();
            } else {
              Swal.fire('Error', res.message || 'Failed to delete course', 'error');
            }
          },
          error: (err: any) => {
            Swal.fire('Error', err.error?.message || 'Failed to delete course', 'error');
          }
        });
      }
    });
  }

  triggerImport() {
    const fileInput = document.getElementById('courseExcelInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onFileChange(event: any) {
    const target: DataTransfer = <DataTransfer>(event.target);
    if (!target.files || target.files.length !== 1) {
      Swal.fire('Error', 'Please select a single file to import', 'error');
      return;
    }

    this.importing = true;
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const bstr: string = e.target.result;
        const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
        const wsname: string = wb.SheetNames[0];
        const ws: XLSX.WorkSheet = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const newCourses: any[] = data.map((row: any) => ({
          name: row['Name'] || row['name'] || row['Course Name'] || '',
          amount: parseFloat(row['Amount'] || row['amount'] || row['Price'] || '0'),
          duration: row['Duration'] || row['duration'] || row['Duration (Months)'] || '',
          description: row['Description'] || row['description'] || ''
        })).filter(c => c.name && !isNaN(c.amount));

        if (newCourses.length === 0) {
          Swal.fire('Error', 'No valid courses found. Ensure columns Name and Amount exist.', 'error');
          this.importing = false;
          return;
        }

        // Save imported courses via API
        fetch('/api/courses/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('uc_token') || ''}`
          },
          body: JSON.stringify({ courses: newCourses })
        })
        .then(res => res.json())
        .then(res => {
          this.importing = false;
          if (res.success) {
            showImpressiveSuccess(`${newCourses.length} courses imported successfully`);
            this.loadItems();
          } else {
            Swal.fire('Error', res.message || 'Failed to import courses', 'error');
          }
        })
        .catch(err => {
          this.importing = false;
          Swal.fire('Error', 'Failed to import courses from file', 'error');
        });
      } catch (err) {
        console.error('Error parsing file:', err);
        Swal.fire('Error', 'Failed to parse file. Ensure it is a valid Excel or CSV.', 'error');
        this.importing = false;
      }

      const fileInput = document.getElementById('courseExcelInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    };
    reader.readAsBinaryString(target.files[0]);
  }
}
