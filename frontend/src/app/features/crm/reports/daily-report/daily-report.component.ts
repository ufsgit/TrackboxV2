import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-daily-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './daily-report.component.html',
  styleUrl: './daily-report.component.css'
})
export class DailyReportComponent implements OnInit {
  loading: boolean = true;
  refreshing: boolean = false;

  // Filters
  dateRange: string = 'today';
  customStartDate: string = '';
  customEndDate: string = '';
  selectedStatus: string = 'All';
  selectedEmployee: string = 'All';
  searchQuery: string = '';
  employeeSearchQuery: string = '';

  // Dropdown States
  isDateDropdownOpen: boolean = false;
  isEmployeeDropdownOpen: boolean = false;
  isStatusDropdownOpen: boolean = false;

  // Master Dropdown Data
  statuses: any[] = [];
  users: any[] = [];

  // Summary Metrics
  totalFollowUps: number = 0;
  uniqueLeads: number = 0;
  activeAgents: number = 0;
  statusBreakdown: any[] = [];
  hourlyDistribution: any[] = [];

  // Table Data & Pagination (Server-Side)
  entries: any[] = [];
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  // Lead quick view modal state
  selectedLeadForModal: any = null;

  isBrowser: boolean = false;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Set default custom dates to today
    const today = new Date().toISOString().split('T')[0];
    this.customStartDate = today;
    this.customEndDate = today;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.isDateDropdownOpen = false;
    this.isEmployeeDropdownOpen = false;
    this.isStatusDropdownOpen = false;
  }

  ngOnInit() {
    this.fetchDropdowns();
    this.fetchData();
  }

  fetchDropdowns() {
    // 1. Statuses from system settings
    this.api.get('/system-settings/statuses').subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.statuses = res.data.map((s: any) => ({
            ...s,
            name: (s.name || '').trim()
          }));
        }
      },
      error: (err: any) => console.error('Failed to load statuses', err)
    });

    // 2. Real Agents / Employees from team settings
    this.api.get('/settings/team').subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.users = res.data;
        }
      },
      error: (err: any) => console.error('Failed to load team users', err)
    });
  }

  fetchData(isRefresh = false) {
    if (isRefresh) {
      this.refreshing = true;
    } else {
      this.loading = true;
    }

    let url = `/reports/daily?dateRange=${this.dateRange}&page=${this.currentPage}&limit=${this.pageSize}`;

    if (this.dateRange === 'custom') {
      if (!this.customStartDate || !this.customEndDate) {
        this.loading = false;
        this.refreshing = false;
        return;
      }
      url += `&startDate=${this.customStartDate}&endDate=${this.customEndDate}`;
    }

    if (this.selectedStatus && this.selectedStatus !== 'All') {
      url += `&status=${encodeURIComponent(this.selectedStatus)}`;
    }

    if (this.selectedEmployee && this.selectedEmployee !== 'All') {
      url += `&employee=${encodeURIComponent(this.selectedEmployee)}`;
    }

    if (this.searchQuery && this.searchQuery.trim()) {
      url += `&search=${encodeURIComponent(this.searchQuery.trim())}`;
    }

    this.api.get(url).subscribe({
      next: (res: any) => {
        if (res.success) {
          const d = res.data;
          this.totalFollowUps = d.totalFollowUps || 0;
          this.uniqueLeads = d.uniqueLeads || 0;
          this.activeAgents = d.activeAgents || 0;
          this.statusBreakdown = d.statusBreakdown || [];
          this.hourlyDistribution = d.hourlyDistribution || [];
          this.entries = d.entries || [];
          this.currentPage = d.page || this.currentPage;
          this.totalPages = d.totalPages || 1;

          // Dynamically sync dropdown lists from backend report response if available
          if (d.dropdowns?.users?.length) {
            this.users = d.dropdowns.users;
          }
          if (d.dropdowns?.statuses?.length) {
            this.statuses = d.dropdowns.statuses;
          }
        }
        this.loading = false;
        this.refreshing = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to fetch daily report:', err);
        this.loading = false;
        this.refreshing = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Filter Actions
  toggleDateDropdown(e: Event) {
    e.stopPropagation();
    this.isDateDropdownOpen = !this.isDateDropdownOpen;
    this.isEmployeeDropdownOpen = false;
    this.isStatusDropdownOpen = false;
  }

  selectDateRange(range: string) {
    this.dateRange = range;
    if (range !== 'custom') {
      this.isDateDropdownOpen = false;
      this.currentPage = 1;
      this.fetchData();
    } else {
      if (!this.customStartDate) {
        this.customStartDate = new Date().toISOString().split('T')[0];
      }
      if (!this.customEndDate) {
        this.customEndDate = new Date().toISOString().split('T')[0];
      }
    }
  }

  applyCustomDate() {
    if (this.customStartDate && this.customEndDate) {
      this.isDateDropdownOpen = false;
      this.currentPage = 1;
      this.fetchData();
    }
  }

  toggleEmployeeDropdown(e: Event) {
    e.stopPropagation();
    this.isEmployeeDropdownOpen = !this.isEmployeeDropdownOpen;
    this.isDateDropdownOpen = false;
    this.isStatusDropdownOpen = false;
  }

  selectEmployee(empId: any) {
    this.selectedEmployee = empId;
    this.isEmployeeDropdownOpen = false;
    this.currentPage = 1;
    this.fetchData();
  }

  toggleStatusDropdown(e: Event) {
    e.stopPropagation();
    this.isStatusDropdownOpen = !this.isStatusDropdownOpen;
    this.isDateDropdownOpen = false;
    this.isEmployeeDropdownOpen = false;
  }

  selectStatus(statusName: string) {
    this.selectedStatus = (statusName || '').trim();
    this.isStatusDropdownOpen = false;
    this.currentPage = 1;
    this.fetchData();
  }

  onSearchChange() {
    this.currentPage = 1;
    this.fetchData();
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.fetchData();
  }

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages && p !== this.currentPage) {
      this.currentPage = p;
      this.fetchData();
    }
  }

  resetFilters() {
    this.dateRange = 'today';
    this.selectedStatus = 'All';
    this.selectedEmployee = 'All';
    this.searchQuery = '';
    this.currentPage = 1;
    this.fetchData();
  }

  // Label Helpers
  getDateRangeLabel(): string {
    const labels: Record<string, string> = {
      'today': 'Today',
      'yesterday': 'Yesterday',
      'this_week': 'This Week',
      'this_month': 'This Month',
      'last_month': 'Last Month',
      'all': 'All Time',
      'custom': 'Custom Range'
    };
    return labels[this.dateRange] || 'Select Date';
  }

  getSelectedEmployeeName(): string {
    if (this.selectedEmployee === 'All') return 'All Employees';
    const found = this.users.find(u => String(u.id) === String(this.selectedEmployee));
    return found ? found.name : 'Selected Employee';
  }

  get filteredUsers(): any[] {
    if (!this.employeeSearchQuery.trim()) return this.users;
    const q = this.employeeSearchQuery.toLowerCase();
    return this.users.filter(u => (u.name && u.name.toLowerCase().includes(q)) || (u.employee_code && u.employee_code.toLowerCase().includes(q)));
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }

  getStatusBadgeClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('won') || s.includes('converted')) return 'badge-status-won';
    if (s.includes('lost') || s.includes('rejected')) return 'badge-status-lost';
    if (s.includes('pending')) return 'badge-status-pending';
    if (s.includes('contacted') || s.includes('calling')) return 'badge-status-contacted';
    return 'badge-status-default';
  }

  get paginationStart(): number {
    if (this.totalFollowUps === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalFollowUps);
  }

  get pages(): number[] {
    const list: number[] = [];
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(this.totalPages, start + 4);
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    for (let i = start; i <= end; i++) {
      list.push(i);
    }
    return list;
  }

  openLead(item: any) {
    if (item.phone || item.lead_name) {
      this.router.navigate(['/contacts'], { queryParams: { search: item.phone || item.lead_name } });
    }
  }

  viewRemarks(item: any) {
    this.selectedLeadForModal = item;
  }

  closeModal() {
    this.selectedLeadForModal = null;
  }
}
