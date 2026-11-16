import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { QualificationsService, QualificationItem } from '../../../core/services/qualifications.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contact-qualifications',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './contact-qualifications.component.html',
  styleUrls: ['./contact-qualifications.component.css']
})
export class ContactQualificationsComponent implements OnInit, OnChanges {
  @Input() contactId: number | null = null;
  @Input() studentName: string = '';
  @Output() countChange = new EventEmitter<number>();

  qualifications: QualificationItem[] = [];
  loading = false;
  saving = false;
  
  // In-page form state (replacing popups)
  showForm = false;
  editingIndex: number | null = null;

  currentQualification: QualificationItem = this.getEmptyQualification();

  constructor(private qualService: QualificationsService) {}

  ngOnInit(): void {
    // ngOnInit initial load
    if (this.contactId) {
      this.loadQualifications();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Only load if contactId actually changed to a different ID and it's not the first change (which ngOnInit handles)
    if (changes['contactId'] && !changes['contactId'].firstChange && this.contactId) {
      this.loadQualifications();
    }
  }

  getEmptyQualification(): QualificationItem {
    return {
      id: null,
      qualification: '',
      institution: '',
      completion_year: '',
      percentage_cgpa: '',
      backlogs: '0',
      study_gap: '',
      is_highest: 0,
      sort_order: 0
    };
  }

  loadQualifications(): void {
    if (!this.contactId) return;
    this.loading = true;
    this.qualService.getQualifications(this.contactId).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && Array.isArray(res.data)) {
          this.qualifications = res.data;
          this.countChange.emit(this.qualifications.length);
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to load qualifications:', err);
      }
    });
  }

  // Open inline form for adding new
  openAddForm(): void {
    this.editingIndex = null;
    this.currentQualification = this.getEmptyQualification();
    this.showForm = true;
  }

  // Open inline form for editing existing
  openEditForm(item: QualificationItem, index: number): void {
    this.editingIndex = index;
    this.currentQualification = {
      ...item,
      is_highest: Boolean(item.is_highest)
    };
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingIndex = null;
    this.currentQualification = this.getEmptyQualification();
  }

  // Drag and drop reordering
  onDrop(event: CdkDragDrop<QualificationItem[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    moveItemInArray(this.qualifications, event.previousIndex, event.currentIndex);

    // Update sort_order based on new order
    this.qualifications.forEach((item, idx) => {
      item.sort_order = idx;
    });

    // Auto-save the new order quietly
    if (this.contactId) {
      this.qualService.saveQualifications(this.contactId, this.qualifications).subscribe({
        next: (res) => {
          if (res.success && Array.isArray(res.data)) {
            this.qualifications = res.data;
          }
        },
        error: (err) => {
          console.error('Failed to save reordered qualifications:', err);
        }
      });
    }
  }

  saveQualification(): void {
    if (!this.currentQualification.qualification?.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing Degree', text: 'Please enter the qualification title.' });
      return;
    }
    if (!this.currentQualification.institution?.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing Institution', text: 'Please enter the college or school name.' });
      return;
    }

    if (!this.contactId) return;

    const isHighestFlag = this.currentQualification.is_highest ? 1 : 0;
    let updatedList = [...this.qualifications];

    // If marked as highest, reset other items
    if (isHighestFlag === 1) {
      updatedList = updatedList.map(item => ({ ...item, is_highest: 0 }));
    }

    if (this.editingIndex !== null && this.editingIndex > -1) {
      // Edit existing
      updatedList[this.editingIndex] = {
        ...this.currentQualification,
        is_highest: isHighestFlag
      };
    } else {
      // Add new to end (or beginning)
      updatedList.push({
        ...this.currentQualification,
        id: null,
        is_highest: isHighestFlag,
        sort_order: updatedList.length
      });
    }

    // Re-index all sort_orders
    updatedList.forEach((item, idx) => {
      item.sort_order = idx;
    });

    this.saving = true;
    this.qualService.saveQualifications(this.contactId, updatedList).subscribe({
      next: (res) => {
        this.saving = false;
        if (res.success) {
          this.qualifications = res.data || [];
          this.countChange.emit(this.qualifications.length);
          this.cancelForm();
          Swal.fire({
            icon: 'success',
            title: 'Saved',
            text: 'Academic qualifications saved successfully.',
            timer: 1500,
            showConfirmButton: false
          });
        }
      },
      error: (err) => {
        this.saving = false;
        console.error('Save qualifications error:', err);
        Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message || 'Failed to save qualification.' });
      }
    });
  }

  deleteQualification(id: number | null | undefined): void {
    if (!id || !this.contactId) return;

    Swal.fire({
      title: 'Delete Qualification?',
      text: 'Are you sure you want to remove this academic record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it'
    }).then((result) => {
      if (result.isConfirmed) {
        const remainingList = this.qualifications.filter(item => item.id !== id);
        remainingList.forEach((item, idx) => item.sort_order = idx);

        this.qualService.saveQualifications(this.contactId!, remainingList).subscribe({
          next: (res) => {
            if (res.success) {
              this.qualifications = res.data || [];
              this.countChange.emit(this.qualifications.length);
              Swal.fire({
                icon: 'success',
                title: 'Deleted',
                text: 'Academic record removed.',
                timer: 1500,
                showConfirmButton: false
              });
            }
          },
          error: (err) => {
            console.error('Delete qualification error:', err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete qualification.' });
          }
        });
      }
    });
  }

  // Clear all qualifications
  clearAllQualifications(): void {
    if (!this.contactId || this.qualifications.length === 0) return;

    Swal.fire({
      title: 'Remove All Qualifications?',
      text: `This will permanently delete all ${this.qualifications.length} qualification records for ${this.studentName || 'this student'}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete all',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // Sending empty array [] triggers full delete in stored procedure
        this.qualService.saveQualifications(this.contactId!, []).subscribe({
          next: (res) => {
            if (res.success) {
              this.qualifications = [];
              this.countChange.emit(0);
              this.cancelForm();
              Swal.fire({
                icon: 'success',
                title: 'Cleared',
                text: 'All qualification records have been removed.',
                timer: 1500,
                showConfirmButton: false
              });
            }
          },
          error: (err) => {
            console.error('Clear all qualifications error:', err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to clear qualifications.' });
          }
        });
      }
    });
  }
}
