import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

@Component({
  selector: 'app-employee-productivity-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './employee-productivity-report.component.html',
  styleUrl: './employee-productivity-report.component.css'
})
export class EmployeeProductivityReportComponent implements OnInit {
  loading: boolean = true;
  refreshing: boolean = false;
  dateRange: string = 'ytd';
  customStartDate: string = '';
  customEndDate: string = '';
  searchTerm: string = '';

  selectedEmployee: any = 'All';
  isEmployeeDropdownOpen: boolean = false;
  employeeSearchQuery: string = '';
  allEmployeesData: any[] = [];
  users: any[] = [];
  
  data: any[] = [];
  totals: any = { conversions: 0, leads: 0, employees: 0, topPerformer: 'N/A', avgPerEmp: '0' };
  animatedTotals: any = { conversions: 0, leads: 0, employees: 0, avgPerEmp: '0' };

  public barChartOptions: ChartConfiguration['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800, easing: 'easeOutQuart' } as any,
    scales: {
      x: { 
        beginAtZero: true, 
        suggestedMax: 5,
        grid: { color: 'rgba(0,0,0,0.03)' },
        ticks: { precision: 0, stepSize: 1, font: { size: 10 } },
        title: { display: true, text: 'Lead Conversions', font: { size: 10, weight: 'bold' } }
      },
      y: { 
        grid: { display: false },
        ticks: { font: { size: 11, weight: 'bold' } }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', padding: 10, cornerRadius: 8 }
    }
  };

  public barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  
  isBrowser = false;

  // Custom Dropdown State & View Mode
  isDateDropdownOpen: boolean = false;
  activeViewTab: 'split' | 'chart' | 'table' = 'split';

  constructor(
    private cdr: ChangeDetectorRef, 
    private api: ApiService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.fetchUsers();
    this.fetchData();
  }

  fetchUsers() {
    this.api.get('/settings/team').subscribe({
      next: (res: any) => {
        if (res && res.success && Array.isArray(res.data)) {
          this.users = res.data;
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => console.error('Error fetching users from users table:', err)
    });
  }

  onDocumentClick() {
    this.isDateDropdownOpen = false;
    this.isEmployeeDropdownOpen = false;
  }

  get filteredEmployees(): any[] {
    const q = (this.employeeSearchQuery || '').trim().toLowerCase();
    if (!q) return this.users;
    return this.users.filter(u => 
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.employee_code && u.employee_code.toLowerCase().includes(q))
    );
  }

  getSelectedEmployeeName(): string {
    if (!this.selectedEmployee || this.selectedEmployee === 'All') {
      return 'All Employees';
    }
    const u = this.users.find(usr => String(usr.id) === String(this.selectedEmployee) || (usr.name && usr.name.toLowerCase() === String(this.selectedEmployee).toLowerCase()));
    if (u && u.name) return u.name;
    return String(this.selectedEmployee);
  }

  getInitials(name: string): string {
    if (!name) return 'EM';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  toggleEmployeeDropdown(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.isDateDropdownOpen = false;
    this.isEmployeeDropdownOpen = !this.isEmployeeDropdownOpen;
  }

  selectEmployee(empId: any) {
    this.selectedEmployee = empId;
    this.isEmployeeDropdownOpen = false;

    // Fast local filter if we already have the baseline data
    if (empId !== 'All' && this.allEmployeesData && this.allEmployeesData.length > 0) {
      const key = String(empId).toLowerCase();
      const empName = this.getSelectedEmployeeName().toLowerCase();
      const matched = this.allEmployeesData.filter(d => 
        (d.employee_id !== undefined && String(d.employee_id).toLowerCase() === key) ||
        (d.employee && d.employee.toLowerCase() === key) ||
        (d.employee && d.employee.toLowerCase() === empName)
      );
      if (matched.length > 0) {
        this.data = [...matched];
      } else {
        const targetUser = this.users.find(u => String(u.id) === String(empId) || (u.name && u.name.toLowerCase() === key));
        this.data = [{
          employee_id: empId,
          employee: targetUser ? targetUser.name : this.getSelectedEmployeeName(),
          employee_code: targetUser ? (targetUser.employee_code || 'N/A') : 'N/A',
          total_leads: 0,
          sale_won: 0,
          sale_lost: 0,
          conversion_rate: '0.0',
          loss_rate: '0.0'
        }];
      }
      this.calculateTotals();
      this.updateCharts();
      if (this.isBrowser) {
        this.animateCountUp();
      } else {
        this.animatedTotals = { ...this.totals };
      }
    } else if (empId === 'All' && this.allEmployeesData && this.allEmployeesData.length > 0) {
      this.data = [...this.allEmployeesData];
      this.calculateTotals();
      this.updateCharts();
      if (this.isBrowser) {
        this.animateCountUp();
      } else {
        this.animatedTotals = { ...this.totals };
      }
    }

    this.fetchData();
  }

  setActiveTab(tab: 'split' | 'chart' | 'table') {
    this.activeViewTab = tab;
    this.cdr.detectChanges();
  }

  toggleDateDropdown(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.isEmployeeDropdownOpen = false;
    this.isDateDropdownOpen = !this.isDateDropdownOpen;
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
    return labels[this.dateRange] || 'Date Range';
  }

  fetchData(isRefresh = false) {
    if (isRefresh) {
      this.refreshing = true;
    } else {
      this.loading = true;
    }
    
    let endpoint = `/reports/leads/employee-conversion?dateRange=${this.dateRange}`;
    if (this.selectedEmployee && this.selectedEmployee !== 'All') {
      endpoint += `&employee=${encodeURIComponent(this.selectedEmployee)}`;
    }
    if (this.dateRange === 'custom') {
      if (!this.customStartDate || !this.customEndDate) {
        this.loading = false;
        this.refreshing = false;
        return;
      }
      endpoint += `&startDate=${this.customStartDate}&endDate=${this.customEndDate}`;
    }

    this.api.get(endpoint).subscribe({
      next: (res: any) => {
        if (res.success) {
          if (res.users && Array.isArray(res.users) && this.users.length === 0) {
            this.users = res.users;
          }
          const rawData: any[] = (res.data || []).sort((a: any, b: any) => (b.sale_won || 0) - (a.sale_won || 0));
          if (!this.selectedEmployee || this.selectedEmployee === 'All') {
            this.allEmployeesData = rawData;
          }
          this.data = rawData;
          this.calculateTotals();
          this.updateCharts();
          if (this.isBrowser) {
            this.animateCountUp();
          } else {
            this.animatedTotals = { ...this.totals };
          }
        }
        setTimeout(() => {
          this.loading = false;
          this.refreshing = false;
          this.cdr.detectChanges();
        }, 150);
      },
      error: (err: any) => {
        console.error('Failed to load employee productivity report', err);
        this.loading = false;
        this.refreshing = false;
      }
    });
  }

  calculateTotals() {
    const conversions = this.data.reduce((sum, r) => sum + (r.sale_won || 0), 0);
    const leads = this.data.reduce((sum, r) => sum + (r.total_leads || 0), 0);
    const employees = this.data.length;
    let topPerformer = 'None';
    if (this.selectedEmployee !== 'All' && this.data.length > 0) {
      topPerformer = this.data[0].employee || this.getSelectedEmployeeName();
    } else if (this.data.length > 0 && this.data[0].sale_won > 0) {
      topPerformer = this.data[0].employee || 'Unassigned';
    }
    const avgPerEmp = employees > 0 ? (conversions / employees).toFixed(1) : '0';
    this.totals = { conversions, leads, employees, topPerformer, avgPerEmp };
  }

  animateCountUp() {
    const duration = 800;
    const steps = 30;
    const interval = duration / steps;
    let currentStep = 0;

    const targets = { ...this.totals };
    this.animatedTotals = { conversions: 0, leads: 0, employees: 0, avgPerEmp: '0' };

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      this.animatedTotals.conversions = Math.floor(targets.conversions * ease);
      this.animatedTotals.leads = Math.floor(targets.leads * ease);
      this.animatedTotals.employees = Math.floor(targets.employees * ease);
      this.animatedTotals.avgPerEmp = (targets.avgPerEmp * ease).toFixed(1);

      this.cdr.detectChanges();

      if (currentStep >= steps) {
        clearInterval(timer);
        this.animatedTotals = { ...targets };
        this.cdr.detectChanges();
      }
    }, interval);
  }

  updateCharts() {
    this.barChartData = {
      labels: this.data.map(d => `${d.employee || 'Unassigned'}`),
      datasets: [
        { 
          data: this.data.map(d => d.sale_won), 
          label: 'Conversions', 
          backgroundColor: '#3b82f6',
          borderRadius: 6, 
          barPercentage: 0.4,
          categoryPercentage: 0.4,
          maxBarThickness: 24
        }
      ]
    };
  }

  getFilteredData(): any[] {
    if (!this.searchTerm || !this.searchTerm.trim()) {
      return this.data;
    }
    const q = this.searchTerm.toLowerCase().trim();
    return this.data.filter(r => 
      (r.employee && r.employee.toLowerCase().includes(q)) ||
      (r.employee_code && r.employee_code.toLowerCase().includes(q))
    );
  }
}
