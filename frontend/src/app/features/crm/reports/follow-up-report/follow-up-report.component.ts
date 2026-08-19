import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

@Component({
  selector: 'app-follow-up-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './follow-up-report.component.html',
  styleUrl: './follow-up-report.component.css'
})
export class FollowUpReportComponent implements OnInit {
  loading: boolean = true;
  refreshing: boolean = false;
  
  dateRange: string = 'ytd';
  customStartDate: string = '';
  customEndDate: string = '';
  selectedStatus: string = 'All';
  selectedEmployee: string = 'All';
  
  isDateDropdownOpen: boolean = false;
  isEmployeeDropdownOpen: boolean = false;
  isStatusDropdownOpen: boolean = false;
  employeeSearchQuery: string = '';
  
  statuses: any[] = [];
  users: any[] = [];
  
  data: any[] = [];
  summary: any = {
    totalFollowUps: 0,
    averageFollowUps: 0,
    highestFollowUps: 0,
    lowestFollowUps: 0,
    totalEmployees: 0
  };

  chartHeight: number = 400;

  public barChartOptions: ChartConfiguration['options'] = {
    indexAxis: 'y', // Horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800, easing: 'easeOutQuart' } as any,
    scales: {
      x: { 
        display: false,
        beginAtZero: true, 
        grid: { display: false }
      },
      y: { 
        grid: { display: false },
        ticks: { color: '#6c757d', font: { size: 12, family: 'Inter, sans-serif' } }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: { 
        backgroundColor: '#ffffff', 
        titleColor: '#212529',
        bodyColor: '#212529',
        borderColor: '#dee2e6',
        borderWidth: 1,
        padding: 12, 
        cornerRadius: 8,
        displayColors: false
      }
    }
  };

  public barChartPlugins: any[] = [];
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

  resetFilter() {
    this.dateRange = 'ytd';
    this.customStartDate = '';
    this.customEndDate = '';
    this.selectedStatus = 'All';
    this.selectedEmployee = 'All';
    this.fetchData();
  }

  fetchData(isRefresh = false) {
    if (isRefresh) {
      this.refreshing = true;
    } else {
      this.loading = true;
    }
    
    let endpoint = `/reports/leads/follow-up-report?dateRange=${this.dateRange}`;
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
          this.data = res.data;
          this.summary = res.summary || this.summary;
          this.updateCharts();
        }
        setTimeout(() => {
          this.loading = false;
          this.refreshing = false;
          this.cdr.detectChanges();
        }, 150);
      },
      error: (err: any) => {
        console.error('Failed to load follow up report', err);
        this.loading = false;
        this.refreshing = false;
      }
    });
  }

  updateCharts() {
    this.chartHeight = Math.max(400, this.data.length * 40);
    this.barChartData = {
      labels: this.data.map(d => `${d.employee_code || 'N/A'}`), // Only Employee Code as in the image
      datasets: [
        { 
          data: this.data.map(d => d.follow_up_count), 
          label: 'Follow-Up Count', 
          backgroundColor: '#3b82f6', // Bright, modern blue
          hoverBackgroundColor: '#2563eb',
          borderRadius: 6, // Slightly rounded corners for modern look
          barPercentage: 0.6,
          categoryPercentage: 0.8
        }
      ]
    };
  }

  // Custom Filter Logic
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

  selectStatus(status: string) {
    this.selectedStatus = status;
    this.isStatusDropdownOpen = false;
    this.fetchData();
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
    return labels[this.dateRange] || 'Year to Date';
  }

  getInitials(name: string): string {
    if (!name || name === 'Unassigned') return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getStatusColor(index: number): string {
    const colors = ['#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#6366f1', '#14b8a6'];
    return colors[index % colors.length];
  }
}
