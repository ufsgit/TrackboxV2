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
  
  dateRange: string = 'today';
  customStartDate: string = '';
  customEndDate: string = '';
  isDateDropdownOpen: boolean = false;
  
  selectedStatus: string = 'All';
  selectedEmployee: string = 'All';
  
  statuses: any[] = [];
  users: any[] = [];
  
  data: any[] = [];
  chartHeight: number = 400;

  // Custom Dropdown State
  isEmployeeDropdownOpen: boolean = false;
  isStatusDropdownOpen: boolean = false;
  employeeSearchQuery: string = '';

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
    
    let endpoint = `/reports/leads/student-pipeline?dateRange=${this.dateRange}`;
    if (this.dateRange === 'custom') {
      if (!this.customStartDate || !this.customEndDate) {
        this.loading = false;
        this.refreshing = false;
        return;
      }
      endpoint += `&startDate=${this.customStartDate}&endDate=${this.customEndDate}`;
    }
    
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
          this.data = res.data.sort((a: any, b: any) => b.total_leads - a.total_leads);
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
          data: this.data.map(d => d.total_leads), 
          label: 'Assigned Leads', 
          backgroundColor: '#8b5cf6', // A distinct purple to separate from productivity report
          borderRadius: 4, 
          barPercentage: 0.6 
        }
      ]
    };
  }

  // --- Filter Logic ---

  toggleDateDropdown() {
    this.isDateDropdownOpen = !this.isDateDropdownOpen;
    if (this.isDateDropdownOpen) {
      this.isEmployeeDropdownOpen = false;
      this.isStatusDropdownOpen = false;
    }
  }

  toggleEmployeeDropdown() {
    this.isEmployeeDropdownOpen = !this.isEmployeeDropdownOpen;
    if (this.isEmployeeDropdownOpen) {
      this.isDateDropdownOpen = false;
      this.isStatusDropdownOpen = false;
    }
  }

  toggleStatusDropdown() {
    this.isStatusDropdownOpen = !this.isStatusDropdownOpen;
    if (this.isStatusDropdownOpen) {
      this.isDateDropdownOpen = false;
      this.isEmployeeDropdownOpen = false;
    }
  }

  // Date Range Logic
  selectDateRange(range: string) {
    this.dateRange = range;
    if (range !== 'custom') {
      this.isDateDropdownOpen = false;
      this.fetchData();
    }
  }

  applyCustomDate() {
    if (this.customStartDate && this.customEndDate) {
      this.isDateDropdownOpen = false;
      this.fetchData();
    }
  }

  getDateRangeLabel(): string {
    const labels: any = {
      'today': 'Today',
      'this_week': 'This Week',
      'this_month': 'This Month',
      'last_month': 'Last Month',
      'ytd': 'Year to Date',
      'prev_year': 'Previous Year',
      'custom': 'Custom Range'
    };
    return labels[this.dateRange] || 'Today';
  }

  // Employee Logic


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
