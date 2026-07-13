import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourseService, Course } from '../../../core/services/course.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course-management.component.html',
  styles: [`
    .course-card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05);
      border: 1px solid rgba(229, 231, 235, 0.8);
      overflow: hidden;
      margin-bottom: 24px;
    }
    .course-header {
      padding: 24px 32px;
      border-bottom: 1px solid rgba(229, 231, 235, 0.6);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .course-header h6 {
      font-size: 1.1rem;
      color: #0f172a;
      margin: 0;
    }
    .table-container {
      padding: 0;
    }
    .custom-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
    }
    .custom-table th {
      background: #f8fafc;
      padding: 16px 32px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e2e8f0;
    }
    .custom-table td {
      padding: 20px 32px;
      vertical-align: middle;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .custom-table tbody tr:last-child td {
      border-bottom: none;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: #64748b;
      min-height: 300px;
    }
    .empty-state i {
      font-size: 3rem;
      color: #cbd5e1;
      margin-bottom: 16px;
    }
    
    /* Modal Centering Fix */
    .custom-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease-out;
    }
    .custom-modal-dialog {
      background: white;
      width: 100%;
      max-width: 750px;
      margin: 0 20px;
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      overflow: hidden;
      transform: scale(0.95);
      animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      display: flex;
      flex-direction: column;
    }
    
    .custom-modal-header {
      padding: 24px 32px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .custom-modal-body {
      padding: 32px;
      overflow-y: auto;
    }
    .custom-modal-footer {
      padding: 24px 32px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleUp {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class CourseManagementComponent implements OnInit {
  courses: Course[] = [];
  loading = false;
  showAddModal = false;
  isEditMode = false;
  saving = false;

  newCourse: Course = {
    name: '',
    amount: null as any,
    duration: '',
    description: ''
  };

  constructor(
    private courseService: CourseService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses() {
    this.loading = true;
    this.courseService.getCourses().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.courses = res.data;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load courses', err);
        this.loading = false;
      }
    });
  }

  openAddModal() {
    this.isEditMode = false;
    this.newCourse = { name: '', amount: null as any, duration: '', description: '' };
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  saveCourse() {
    if (!this.newCourse.name || !this.newCourse.amount) {
      this.notificationService.showError('Course Name and Amount are required.');
      return;
    }

    this.saving = true;

    if (this.isEditMode && this.newCourse.id) {
      this.courseService.updateCourse(this.newCourse.id, this.newCourse).subscribe({
        next: (res: any) => {
          this.saving = false;
          if (res.success) {
            this.loadCourses();
            this.notificationService.showSuccess('Course updated successfully!');
            this.closeAddModal();
          }
        },
        error: (err: any) => {
          this.saving = false;
          this.notificationService.showError(err.error?.message || 'Failed to update course.');
        }
      });
    } else {
      this.courseService.createCourse(this.newCourse).subscribe({
        next: (res: any) => {
          this.saving = false;
          if (res.success) {
            this.loadCourses();
            this.notificationService.showSuccess('Course created successfully!');
            this.closeAddModal();
          }
        },
        error: (err: any) => {
          this.saving = false;
          this.notificationService.showError(err.error?.message || 'Failed to save course.');
        }
      });
    }
  }

  editCourse(course: Course) {
    this.isEditMode = true;
    this.newCourse = { ...course }; // Clone the course to edit
    this.showAddModal = true;
  }

  deleteCourse(course: Course) {
    if (!course.id) {
      this.notificationService.showError('Cannot delete this course because it lacks an ID.');
      return;
    }
    
    this.notificationService.showConfirm(`Are you sure you want to delete the course "${course.name}"?`).then((confirmed) => {
      if (confirmed) {
        this.courseService.deleteCourse(course.id!).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.courses = this.courses.filter(c => c.id !== course.id);
              this.notificationService.showSuccess('Course deleted successfully.');
            }
          },
          error: (err) => {
            this.notificationService.showError('Failed to delete course.');
          }
        });
      }
    });
  }
}
