import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactTasksService, ContactTaskItem } from '../../../core/services/contact-tasks.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contact-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-tasks.component.html',
  styleUrls: ['./contact-tasks.component.css']
})
export class ContactTasksComponent implements OnInit, OnChanges {
  @Input() contactId: number | null = null;
  @Input() studentName: string = '';
  @Input() contact: any = null;
  @Input() teamUsers: any[] = [];
  @Output() countChange = new EventEmitter<number>();
  tasks: ContactTaskItem[] = [];
  loading = false;
  submitting = false;

  // Pagination & Filters
  searchQuery = '';
  startDate = '';
  endDate = '';
  currentPage = 1;
  pageSize = 10;
  totalRecords = 0;
  totalPages = 1;

  // Modal State
  showModal = false;
  newTask: ContactTaskItem = this.getEmptyTask();

  private searchDebounceTimer: any;

  constructor(private tasksService: ContactTasksService) {}

  ngOnInit(): void {
    if (this.contactId) {
      this.loadTasks();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contactId'] && !changes['contactId'].firstChange && this.contactId) {
      this.currentPage = 1;
      this.loadTasks();
    }
  }

  loadTeamUsers(): void {
    this.tasksService.getTeamUsers().subscribe({
      next: (res: any) => {
        if (res?.success && Array.isArray(res.data)) {
          this.teamUsers = res.data.filter((u: any) => u && u.is_active !== 0 && u.is_active !== false);
        }
      },
      error: (err) => console.error('Error loading team users:', err)
    });
  }

  loadTasks(): void {
    if (!this.contactId) return;
    this.loading = true;

    this.tasksService.getTasksByContact(this.contactId, {
      search: this.searchQuery,
      start_date: this.startDate,
      end_date: this.endDate,
      page: this.currentPage,
      limit: this.pageSize
    }).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res?.success) {
          this.tasks = res.data || [];
          this.totalRecords = res.pagination?.total || this.tasks.length;
          this.totalPages = res.pagination?.totalPages || 1;
          this.countChange.emit(this.totalRecords);
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Error fetching tasks:', err);
      }
    });
  }

  onSearchChange(): void {
    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.currentPage = 1;
      this.loadTasks();
    }, 350);
  }

  onDateFilterChange(): void {
    this.currentPage = 1;
    this.loadTasks();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.startDate = '';
    this.endDate = '';
    this.currentPage = 1;
    this.loadTasks();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadTasks();
    }
  }

  openCreateModal(): void {
    this.newTask = this.getEmptyTask();
    this.loadTeamUsers(); // Only fetch if not already loaded when opening the dialog
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  onAssigneeChange(userId: number): void {
    const user = this.teamUsers.find(u => u.id === userId);
    if (user) {
      this.newTask.assigned_to_name = user.name;
    }
  }

  submitTask(): void {
    if (!this.newTask.title || !this.newTask.assigned_to) {
      Swal.fire('Required Fields', 'Please fill in Title and Assign To user.', 'warning');
      return;
    }

    if (this.newTask.is_task_date && !this.newTask.task_date) {
      Swal.fire('Required Date', 'Please select the promised submission date.', 'warning');
      return;
    }

    this.submitting = true;
    this.newTask.contact_id = Number(this.contactId);
    this.newTask.contact_name = this.studentName || this.contact?.name || 'Contact';
    this.newTask.contact_phone = this.contact?.phone || null;
    this.newTask.branch_id = this.contact?.branch_id || null;
    this.newTask.branch_name = this.contact?.branch_name || null;
    this.newTask.dept_id = this.contact?.department_id || this.contact?.dept_id || null;
    this.newTask.dept_name = this.contact?.department_name || this.contact?.dept_name || null;

    this.tasksService.createTask(this.newTask).subscribe({
      next: (res: any) => {
        this.submitting = false;
        if (res?.success) {
          this.closeModal();
          Swal.fire({
            icon: 'success',
            title: 'Task Created',
            text: 'Document task assigned successfully.',
            timer: 1500,
            showConfirmButton: false
          });
          this.currentPage = 1;
          this.loadTasks();
        } else {
          Swal.fire('Error', res?.message || 'Could not save task.', 'error');
        }
      },
      error: (err) => {
        this.submitting = false;
        Swal.fire('Error', err?.error?.message || err.message, 'error');
      }
    });
  }

  toggleStatus(task: ContactTaskItem, newStatus: number): void {
    if (!task.id) return;

    const actionText = newStatus === 1 ? 'mark this task as Completed' : 'reopen this task to Pending';
    Swal.fire({
      title: 'Update Status?',
      text: `Are you sure you want to ${actionText}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.tasksService.updateTaskStatus(task.id!, newStatus).subscribe({
          next: (res: any) => {
            if (res?.success) {
              task.status = newStatus;
              if (newStatus === 1) {
                task.completed_at = new Date().toISOString();
              } else {
                task.completed_at = null;
              }
              Swal.fire({
                icon: 'success',
                title: 'Status Updated',
                timer: 1200,
                showConfirmButton: false
              });
            } else {
              Swal.fire('Error', res?.message || 'Failed to update status', 'error');
            }
          },
          error: (err) => {
            Swal.fire('Error', err?.error?.message || err.message, 'error');
          }
        });
      }
    });
  }

  private getEmptyTask(): ContactTaskItem {
    return {
      contact_id: this.contactId || 0,
      title: '',
      description: '',
      assigned_to: null as any,
      assigned_to_name: '',
      status: 0, // Always 0 (Pending) by default
      is_task_date: 0,
      task_date: null
    };
  }
}

