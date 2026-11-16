import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { WorkExperiencesService, WorkExperienceItem } from '../../../core/services/work-experiences.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contact-work-experiences',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './contact-work-experiences.component.html',
  styleUrls: ['./contact-work-experiences.component.css']
})
export class ContactWorkExperiencesComponent implements OnInit, OnChanges {
  @Input() contactId: number | null = null;
  @Input() studentName: string = '';
  @Output() countChange = new EventEmitter<number>();

  experiences: WorkExperienceItem[] = [];
  loading = false;
  saving = false;

  // In-page form state (replacing popups)
  showForm = false;
  editingIndex: number | null = null;

  currentExperience: WorkExperienceItem = this.getEmptyExperience();

  constructor(private expService: WorkExperiencesService) {}

  ngOnInit(): void {
    // ngOnInit initial load
    if (this.contactId) {
      this.loadExperiences();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Only load if contactId actually changed to a different ID and it's not the first change (which ngOnInit handles)
    if (changes['contactId'] && !changes['contactId'].firstChange && this.contactId) {
      this.loadExperiences();
    }
  }

  getEmptyExperience(): WorkExperienceItem {
    return {
      id: null,
      employer: '',
      position: '',
      experience: '',
      from_date: '',
      to_date: '',
      is_current: 0,
      sort_order: 0
    };
  }

  loadExperiences(): void {
    if (!this.contactId) return;
    this.loading = true;
    this.expService.getWorkExperiences(this.contactId).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && Array.isArray(res.data)) {
          this.experiences = res.data;
          this.countChange.emit(this.experiences.length);
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to load work experiences:', err);
      }
    });
  }

  openAddForm(): void {
    this.editingIndex = null;
    this.currentExperience = this.getEmptyExperience();
    this.showForm = true;
  }

  openEditForm(item: WorkExperienceItem, index: number): void {
    this.editingIndex = index;
    this.currentExperience = {
      ...item,
      from_date: item.from_date ? this.formatDateForInput(item.from_date) : '',
      to_date: item.to_date ? this.formatDateForInput(item.to_date) : '',
      is_current: Boolean(item.is_current)
    };
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingIndex = null;
    this.currentExperience = this.getEmptyExperience();
  }

  formatDateForInput(d: any): string {
    if (!d) return '';
    try {
      const dt = new Date(d);
      return dt.toISOString().split('T')[0];
    } catch {
      return String(d).substring(0, 10);
    }
  }

  // Drag and drop reordering
  onDrop(event: CdkDragDrop<WorkExperienceItem[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    moveItemInArray(this.experiences, event.previousIndex, event.currentIndex);

    // Update sort_order based on new order
    this.experiences.forEach((item, idx) => {
      item.sort_order = idx;
    });

    // Auto-save reordered list
    if (this.contactId) {
      this.expService.saveWorkExperiences(this.contactId, this.experiences).subscribe({
        next: (res) => {
          if (res.success && Array.isArray(res.data)) {
            this.experiences = res.data;
          }
        },
        error: (err) => {
          console.error('Failed to save reordered experiences:', err);
        }
      });
    }
  }

  saveExperience(): void {
    if (!this.currentExperience.employer?.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing Employer', text: 'Please enter the employer or company name.' });
      return;
    }
    if (!this.currentExperience.position?.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing Position', text: 'Please enter the job title or position.' });
      return;
    }

    if (!this.contactId) return;

    const isCurrentFlag = this.currentExperience.is_current ? 1 : 0;
    const toDateVal = isCurrentFlag === 1 ? null : (this.currentExperience.to_date || null);

    let updatedList = [...this.experiences];

    if (this.editingIndex !== null && this.editingIndex > -1) {
      updatedList[this.editingIndex] = {
        ...this.currentExperience,
        is_current: isCurrentFlag,
        to_date: toDateVal
      };
    } else {
      updatedList.push({
        ...this.currentExperience,
        id: null,
        is_current: isCurrentFlag,
        to_date: toDateVal,
        sort_order: updatedList.length
      });
    }

    // Re-index all sort_orders
    updatedList.forEach((item, idx) => {
      item.sort_order = idx;
    });

    this.saving = true;
    this.expService.saveWorkExperiences(this.contactId, updatedList).subscribe({
      next: (res) => {
        this.saving = false;
        if (res.success) {
          this.experiences = res.data || [];
          this.countChange.emit(this.experiences.length);
          this.cancelForm();
          Swal.fire({
            icon: 'success',
            title: 'Saved',
            text: 'Work experience saved successfully.',
            timer: 1500,
            showConfirmButton: false
          });
        }
      },
      error: (err) => {
        this.saving = false;
        console.error('Save work experience error:', err);
        Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message || 'Failed to save work experience.' });
      }
    });
  }

  deleteExperience(id: number | null | undefined): void {
    if (!id || !this.contactId) return;

    Swal.fire({
      title: 'Delete Experience?',
      text: 'Are you sure you want to remove this employment record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it'
    }).then((result) => {
      if (result.isConfirmed) {
        const remainingList = this.experiences.filter(item => item.id !== id);
        remainingList.forEach((item, idx) => item.sort_order = idx);

        this.expService.saveWorkExperiences(this.contactId!, remainingList).subscribe({
          next: (res) => {
            if (res.success) {
              this.experiences = res.data || [];
              this.countChange.emit(this.experiences.length);
              Swal.fire({
                icon: 'success',
                title: 'Deleted',
                text: 'Employment record deleted.',
                timer: 1500,
                showConfirmButton: false
              });
            }
          },
          error: (err) => {
            console.error('Delete experience error:', err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete work experience.' });
          }
        });
      }
    });
  }

  // Clear all work experiences
  clearAllExperiences(): void {
    if (!this.contactId || this.experiences.length === 0) return;

    Swal.fire({
      title: 'Remove All Work Experiences?',
      text: `This will permanently delete all ${this.experiences.length} employment records for ${this.studentName || 'this student'}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete all',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // Sending empty array [] triggers full delete in stored procedure
        this.expService.saveWorkExperiences(this.contactId!, []).subscribe({
          next: (res) => {
            if (res.success) {
              this.experiences = [];
              this.countChange.emit(0);
              this.cancelForm();
              Swal.fire({
                icon: 'success',
                title: 'Cleared',
                text: 'All employment records have been removed.',
                timer: 1500,
                showConfirmButton: false
              });
            }
          },
          error: (err) => {
            console.error('Clear all experiences error:', err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to clear work experiences.' });
          }
        });
      }
    });
  }
}
