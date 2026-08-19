import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

@Component({
  selector: 'app-student-pipeline-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './student-pipeline-report.component.html',
  styleUrl: './student-pipeline-report.component.css'
})
export class StudentPipelineReportComponent implements OnInit {
  loading: boolean = true;
  refreshing: boolean = false;
  
  selectedDate: string = new Date().toISOString().split('T')[0];
  selectedStatus: string = 'All';
  selectedEmployee: string = 'All';
  
  statuses: any[] = [];
  users: any[] = [];
  
  data: any[] = [];
  chartHeight: number = 400;

  // Custom Dropdown State
  isCalendarOpen: boolean = false;
  isEmployeeDropdownOpen: boolean = false;
  isStatusDropdownOpen: boolean = false;
  employeeSearchQuery: string = '';

  // Custom Calendar State
  currentMonth: Date = new Date();
  calendarDays: Date[] = [];

  public barChartOptions: ChartConfiguration['options'] = {
    indexAxis: 'y', // Horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800, easing: 'easeOutQuart' } as any,
    scales: {
      x: { 
        beginAtZero: true, 
        grid: { color: 'rgba(0,0,0,0.03)' },
        title: { display: true, text: 'Assigned Leads' }
      },
      y: { 
        grid: { display: false }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', padding: 12, cornerRadius: 8 }
    }
  };

  public barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  
  isBrowser = false;

  constructor(
    private cdr: ChangeDetectorRef, 
    private api: ApiService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.generateCalendar();
    this.fetchDropdowns();
    this.fetchData();
  }

  fetchDropdowns() {
    this.api.get('/system-settings/statuses').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.statuses = res.data;
        }
      },
      error: (err: any) => console.error('Failed to load statuses', err)
    });

    this.api.get('/settings/team').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.users = res.data.filter((u: any) => u.role === 'agent');
        }
      },
      error: (err: any) => console.error('Failed to load users', err)
    });
  }

  fetchData(isRefresh = false) {
    if (isRefresh) {
      this.refreshing = true;
    } else {
      this.loading = true;
    }
    
    let endpoint = `/reports/leads/student-pipeline?date=${this.selectedDate}`;
    
    if (this.selectedStatus && this.selectedStatus !== 'All') {
      endpoint += `&status=${encodeURIComponent(this.selectedStatus)}`;
    }

    if (this.selectedEmployee && this.selectedEmployee !== 'All') {
      endpoint += `&employee=${encodeURIComponent(this.selectedEmployee)}`;
    }

    this.api.get(endpoint).subscribe({
      next: (res: any) => {
        if (res.success) {
          // Data is already sorted descending by backend, but let's ensure it just in case
          this.data = res.data.sort((a: any, b: any) => b.assigned_leads - a.assigned_leads);
          this.updateCharts();
        }
        setTimeout(() => {
          this.loading = false;
          this.refreshing = false;
          this.cdr.detectChanges();
        }, 150);
      },
      error: (err: any) => {
        console.error('Failed to load student pipeline report', err);
        this.loading = false;
        this.refreshing = false;
      }
    });
  }

  updateCharts() {
    this.chartHeight = Math.max(400, this.data.length * 40);
    this.barChartData = {
      labels: this.data.map(d => `${d.employee_code || 'N/A'} - ${d.employee || 'Unassigned'}`),
      datasets: [
        { 
          data: this.data.map(d => d.assigned_leads), 
          label: 'Assigned Leads', 
          backgroundColor: '#8b5cf6', // A distinct purple to separate from productivity report
          borderRadius: 4, 
          barPercentage: 0.6 
        }
      ]
    };
  }

  // --- Filter Logic ---

  toggleCalendar() {
    this.isCalendarOpen = !this.isCalendarOpen;
    if (this.isCalendarOpen) {
      this.isEmployeeDropdownOpen = false;
      this.isStatusDropdownOpen = false;
      this.currentMonth = new Date(this.selectedDate);
      this.generateCalendar();
    }
  }

  toggleEmployeeDropdown() {
    this.isEmployeeDropdownOpen = !this.isEmployeeDropdownOpen;
    if (this.isEmployeeDropdownOpen) {
      this.isCalendarOpen = false;
      this.isStatusDropdownOpen = false;
    }
  }

  toggleStatusDropdown() {
    this.isStatusDropdownOpen = !this.isStatusDropdownOpen;
    if (this.isStatusDropdownOpen) {
      this.isCalendarOpen = false;
      this.isEmployeeDropdownOpen = false;
    }
  }

  // Calendar Logic
  generateCalendar() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    this.calendarDays = [];
    
    // Previous month padding
    const startingDay = firstDay.getDay(); // 0 is Sunday
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      this.calendarDays.push(new Date(year, month - 1, prevMonthLastDay - i));
    }
    
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      this.calendarDays.push(new Date(year, month, i));
    }
    
    // Next month padding (to complete 42 days grid, 6 rows)
    const remainingDays = 42 - this.calendarDays.length;
    for (let i = 1; i <= remainingDays; i++) {
      this.calendarDays.push(new Date(year, month + 1, i));
    }
  }

  prevMonth(event: Event) {
    event.stopPropagation();
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth(event: Event) {
    event.stopPropagation();
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.generateCalendar();
  }

  selectDate(d: Date, event: Event) {
    event.stopPropagation();
    // Adjust for local timezone offset when getting ISO string
    const offset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - offset)).toISOString().split('T')[0];
    
    this.selectedDate = localISOTime;
    this.isCalendarOpen = false;
    this.fetchData();
  }

  get formattedSelectedDate(): string {
    const d = new Date(this.selectedDate);
    if (isNaN(d.getTime())) return this.selectedDate;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  isSameDate(d1: Date, d2String: string): boolean {
    const d2 = new Date(d2String);
    if (isNaN(d2.getTime())) return false;
    return d1.getFullYear() === d2.getFullYear() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getDate() === d2.getDate();
  }

  isToday(d: Date): boolean {
    const today = new Date();
    return d.getFullYear() === today.getFullYear() && 
           d.getMonth() === today.getMonth() && 
           d.getDate() === today.getDate();
  }

  isCurrentMonth(d: Date): boolean {
    return d.getMonth() === this.currentMonth.getMonth();
  }

  // Employee Logic
  get filteredUsers() {
    if (!this.employeeSearchQuery) return this.users;
    return this.users.filter(u => u.name.toLowerCase().includes(this.employeeSearchQuery.toLowerCase()));
  }

  selectEmployee(id: string) {
    this.selectedEmployee = id;
    this.isEmployeeDropdownOpen = false;
    this.fetchData();
  }

  getSelectedEmployeeName(): string {
    if (this.selectedEmployee === 'All') return 'All Employees';
    const user = this.users.find(u => u.id === this.selectedEmployee);
    return user ? user.name : 'All Employees';
  }

  getInitials(name: string): string {
    if (!name || name === 'Unassigned') return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // Status Logic
  selectStatus(status: string) {
    this.selectedStatus = status;
    this.isStatusDropdownOpen = false;
    this.fetchData();
  }

  getStatusColor(index: number): string {
    const colors = ['#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#6366f1', '#14b8a6'];
    return colors[index % colors.length];
  }
}
