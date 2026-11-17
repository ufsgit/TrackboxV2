import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ContactTasksService, ContactTaskItem } from '../../../core/services/contact-tasks.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { LeadProfileModalComponent } from '../../../shared/components/lead-profile-modal/lead-profile-modal.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LeadProfileModalComponent],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent implements OnInit {
  tasks: ContactTaskItem[] = [];
  loading = false;
  submitting = false;

  // Logged-in user information
  currentUserId: number | null = null;
  currentUserName: string = '';

  // Team users populated via get_contact_task_team_assignees
  teamUsers: any[] = [];
  otherTeamUsers: any[] = [];

  // Filters Bar (All filters pass numeric/date values (IDs), never names)
  assignedToFilter: string | number = 'all'; // 'all' (NULL/all), currentUserId (Me), or numeric user.id
  searchTerm: string = '';                   // Title search (LIKE '%...%')
  dateFilter: string = 'all';                // 'all', 'today', 'tomorrow', 'upcoming', 'overdue', 'custom'
  startDate: string = '';                    // YYYY-MM-DD
  endDate: string = '';                      // YYYY-MM-DD
  statusFilter: string = 'all';              // 'all' (NULL), '0' (Pending), '1' (Completed)

  // Metrics
  summary = {
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
    today: 0
  };

  // Pagination
  currentPage = 1;
  pageSize = 15;
  totalRecords = 0;
  totalPages = 1;
  pageSizeOptions = [10, 15, 25, 50];

  // Student Profile Modal
  showProfileModal = false;
  profileContactId: number | null = null;

  // Create Task Modal
  showModal = false;
  newTask: ContactTaskItem = this.getEmptyTask();
  contactsList: any[] = [];

  private searchDebounceTimer: any;

  constructor(
    private tasksService: ContactTasksService,
    private authService: AuthService,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.initCurrentUser();
    this.loadTeamUsers();
    this.loadTasks();
  }

  initCurrentUser(): void {
    try {
      const user = JSON.parse(localStorage.getItem('uc_user') || '{}');
      this.currentUserId = user?.id || user?.userId || null;
      this.currentUserName = user?.name || user?.username || 'Me';
    } catch (e) {
      this.currentUserId = null;
      this.currentUserName = 'Me';
    }
  }

  loadTeamUsers(): void {
    this.tasksService.getTeamUsers().subscribe({
      next: (res: any) => {
        if (res?.success && Array.isArray(res.data)) {
          this.teamUsers = res.data.filter((u: any) => u && u.is_active !== 0 && u.is_active !== false);
          // Separate other members so "Me" is distinct in the dropdown
          this.otherTeamUsers = this.teamUsers.filter((u: any) => Number(u.id) !== Number(this.currentUserId));
        }
      },
      error: (err: any) => console.error('Failed to load team users:', err)
    });
  }

  loadTasks(): void {
    this.loading = true;

    // Build filter parameters strictly with numeric IDs / dates
    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    };

    // 1. Assigned To Filter:
    // All -> NULL or 'all'
    // Me -> logged-in user numeric user_id
    // Team Member -> numeric user.id
    if (this.assignedToFilter !== 'all' && this.assignedToFilter !== '' && this.assignedToFilter !== null) {
      params.assigned_to = Number(this.assignedToFilter);
    } else {
      params.assigned_to = null;
    }

    // 2. Title Search: text input searching on title
    if (this.searchTerm && this.searchTerm.trim()) {
      params.search = this.searchTerm.trim();
    }

    // 3. Date Quick Filter & Custom Date Range:
    if (this.dateFilter === 'custom') {
      params.date_filter = 'custom';
      if (this.startDate) params.start_date = this.startDate;
      if (this.endDate) params.end_date = this.endDate;
    } else if (this.dateFilter && this.dateFilter !== 'all') {
      params.date_filter = this.dateFilter;
      if (this.dateFilter === 'today') {
        const today = this.getTodayStr();
        params.start_date = today;
        params.end_date = today;
      } else if (this.dateFilter === 'tomorrow') {
        const tomorrow = this.getTomorrowStr();
        params.start_date = tomorrow;
        params.end_date = tomorrow;
      }
    }

    // 4. Status Filter: All (NULL), 0 (Pending), 1 (Completed)
    if (this.statusFilter === '0') {
      params.status = 0;
    } else if (this.statusFilter === '1') {
      params.status = 1;
    } else {
      params.status = null;
    }

    this.tasksService.getAllTasks(params).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res?.success) {
          this.tasks = res.data || [];
          if (res.summary) {
            this.summary = res.summary;
          } else {
            this.calculateLocalSummary(this.tasks);
          }
          if (res.pagination) {
            this.currentPage = res.pagination.page;
            this.pageSize = res.pagination.limit;
            this.totalRecords = res.pagination.total;
            this.totalPages = res.pagination.totalPages;
          } else {
            this.totalRecords = this.tasks.length;
            this.totalPages = Math.ceil(this.totalRecords / this.pageSize) || 1;
          }
        } else {
          this.tasks = [];
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.tasks = [];
        console.error('Failed to load tasks:', err);
      }
    });
  }

  private calculateLocalSummary(taskList: ContactTaskItem[]): void {
    let pending = 0;
    let completed = 0;
    let overdue = 0;
    let todayCount = 0;
    const todayStr = this.getTodayStr();

    taskList.forEach(t => {
      if (t.status === 1) {
        completed++;
      } else {
        pending++;
        const tDate = this.formatDateOnly(t.task_date);
        if (tDate) {
          if (tDate < todayStr) overdue++;
          if (tDate === todayStr) todayCount++;
        }
      }
    });

    this.summary = {
      total: taskList.length,
      pending,
      completed,
      overdue,
      today: todayCount
    };
  }

  onSearchChange(): void {
    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.currentPage = 1;
      this.loadTasks();
    }, 350);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadTasks();
  }

  onDateFilterChange(): void {
    if (this.dateFilter !== 'custom') {
      this.startDate = '';
      this.endDate = '';
    }
    this.currentPage = 1;
    this.loadTasks();
  }

  resetFilters(): void {
    this.assignedToFilter = 'all';
    this.searchTerm = '';
    this.dateFilter = 'all';
    this.startDate = '';
    this.endDate = '';
    this.statusFilter = 'all';
    this.currentPage = 1;
    this.loadTasks();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadTasks();
    }
  }

  // Status toggle button: Mark Done / Reopen
  toggleTaskStatus(task: ContactTaskItem, event?: Event): void {
    if (event) event.stopPropagation();
    if (!task.id) return;

    const newStatus = task.status === 1 ? 0 : 1;
    const originalStatus = task.status;
    task.status = newStatus;

    this.tasksService.updateTaskStatus(task.id, newStatus).subscribe({
      next: (res: any) => {
        if (res?.success) {
          if (newStatus === 1) {
            task.completed_at = new Date().toISOString();
          } else {
            task.completed_at = null;
          }
          this.loadTasks();
        } else {
          task.status = originalStatus;
          Swal.fire('Error', res?.message || 'Failed to update task status', 'error');
        }
      },
      error: (err: any) => {
        task.status = originalStatus;
        Swal.fire('Error', err?.error?.message || 'Failed to update task status', 'error');
      }
    });
  }

  // Student Profile Modal trigger
  openProfile(task: ContactTaskItem): void {
    if (!task.contact_id) return;
    this.profileContactId = task.contact_id;
    this.showProfileModal = true;
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
    this.profileContactId = null;
  }

  // Date Highlighting logic
  isOverdue(task: ContactTaskItem): boolean {
    if (task.status === 1 || !task.task_date) return false;
    const todayStr = this.getTodayStr();
    const taskDateStr = this.formatDateOnly(task.task_date);
    return taskDateStr < todayStr;
  }

  isToday(task: ContactTaskItem): boolean {
    if (!task.task_date) return false;
    const todayStr = this.getTodayStr();
    const taskDateStr = this.formatDateOnly(task.task_date);
    return taskDateStr === todayStr;
  }

  isUpcoming(task: ContactTaskItem): boolean {
    if (!task.task_date) return false;
    const todayStr = this.getTodayStr();
    const taskDateStr = this.formatDateOnly(task.task_date);
    return taskDateStr > todayStr;
  }

  getTodayStr(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getTomorrowStr(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDateOnly(dateVal: any): string {
    if (!dateVal) return '';
    if (typeof dateVal === 'string') {
      return dateVal.split('T')[0];
    }
    const d = new Date(dateVal);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Create Task Modal Methods
  openCreateModal(): void {
    this.newTask = this.getEmptyTask();
    this.showModal = true;
    this.loadContactsDropdown();
  }

  closeModal(): void {
    this.showModal = false;
  }

  loadContactsDropdown(): void {
    this.api.get('/contacts?limit=50').subscribe({
      next: (res: any) => {
        if (res?.success && Array.isArray(res.data)) {
          this.contactsList = res.data;
        }
      }
    });
  }

  onContactSelect(contactId: any): void {
    const selected = this.contactsList.find(c => String(c.id) === String(contactId));
    if (selected) {
      this.newTask.contact_id = selected.id;
      this.newTask.contact_name = selected.name || 'Unnamed Lead';
      this.newTask.contact_phone = selected.phone || '';
      this.newTask.branch_id = selected.branch_id || null;
      this.newTask.branch_name = selected.branch_name || null;
      this.newTask.dept_id = selected.department_id || null;
      this.newTask.dept_name = selected.department_name || null;
    }
  }

  onAssigneeChange(event: any): void {
    const userId = Number(event.target.value);
    const user = this.teamUsers.find(u => u.id === userId);
    if (user) {
      this.newTask.assigned_to = user.id;
      this.newTask.assigned_to_name = user.name;
    } else {
      this.newTask.assigned_to = 0;
      this.newTask.assigned_to_name = '';
    }
  }

  saveTask(): void {
    if (!this.newTask.title || !this.newTask.title.trim()) {
      Swal.fire('Validation Error', 'Task title is required.', 'warning');
      return;
    }

    if (!this.newTask.assigned_to) {
      Swal.fire('Validation Error', 'Please select an assigned employee.', 'warning');
      return;
    }

    if (!this.newTask.contact_id || !this.newTask.contact_name) {
      Swal.fire('Validation Error', 'Please select a contact or lead.', 'warning');
      return;
    }

    if (this.newTask.is_task_date && !this.newTask.task_date) {
      Swal.fire('Validation Error', 'Please select a task due date.', 'warning');
      return;
    }

    this.submitting = true;
    this.tasksService.createTask(this.newTask).subscribe({
      next: (res: any) => {
        this.submitting = false;
        if (res?.success) {
          Swal.fire({
            title: 'Task Created',
            text: 'Task has been assigned successfully!',
            icon: 'success',
            timer: 1600,
            showConfirmButton: false
          });
          this.closeModal();
          this.loadTasks();
        } else {
          Swal.fire('Error', res?.message || 'Failed to create task', 'error');
        }
      },
      error: (err: any) => {
        this.submitting = false;
        Swal.fire('Error', err?.error?.message || 'Failed to create task', 'error');
      }
    });
  }

  getEmptyTask(): ContactTaskItem {
    return {
      contact_id: 0,
      contact_name: '',
      contact_phone: '',
      title: '',
      description: '',
      assigned_to: 0,
      assigned_to_name: '',
      is_task_date: true,
      task_date: this.getTodayStr(),
      status: 0
    };
  }
}
