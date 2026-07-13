import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

interface LeaveLog {
  id: string;
  employee: string;
  department: string;
  branch: string;
  manager: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  days: number;
  status: 'Approved' | 'Pending' | 'Rejected' | 'Cancelled';
  reason: string;
}

@Component({
  selector: 'app-leave-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './leave-report.component.html',
  styleUrl: './leave-report.component.css'
})
export class LeaveReportComponent implements OnInit {

  // Dashboard State
  isFullScreen = false;
  isFilterExpanded = true;
  isLoading = false;
  toastMessage: string | null = null;
  toastTimeout: any;

  // Filters
  filters = {
    startDate: '2023-10-01',
    endDate: '2023-10-31',
    department: '',
    branch: '',
    manager: '',
    status: '',
    leaveType: '',
    search: ''
  };

  departments = ['IT Support', 'Sales', 'HR', 'Finance', 'Operations', 'Marketing'];
  branches = ['New York', 'London', 'Singapore', 'Dubai', 'Sydney'];
  managers = ['Alice Johnson', 'Robert Smith', 'Emma Watson', 'David Brown', 'Michael Clark'];
  leaveTypes = ['Annual Leave', 'Sick Leave', 'Maternity Leave', 'Casual Leave', 'Unpaid Leave'];
  statuses = ['Approved', 'Pending', 'Rejected', 'Cancelled'];

  // Master Data
  allLogs: LeaveLog[] = [];
  filteredLogs: LeaveLog[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 15;
  get totalPages(): number {
    return Math.ceil(this.filteredLogs.length / this.pageSize);
  }
  
  get paginatedLogs(): LeaveLog[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredLogs.slice(start, start + this.pageSize);
  }

  // KPIs
  kpi = {
    totalLeaves: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    cancelled: 0,
    avgLeaveDays: '0',
    totalLeaveDays: 0
  };

  // --- CHARTS ---

  // 1. Leave Trend (Line)
  trendChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  };
  trendChartData: ChartConfiguration['data'] = {
    labels: ['W1', 'W2', 'W3', 'W4'],
    datasets: [{ data: [12, 19, 15, 25], label: 'Leave Requests', borderColor: '#f59e0b', tension: 0.4, fill: true, backgroundColor: 'rgba(245, 158, 11, 0.1)' }]
  };

  // 2. Department Leave Comparison (Bar)
  deptChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };
  deptChartData: ChartConfiguration['data'] = {
    labels: this.departments,
    datasets: [
      { data: [0,0,0,0,0,0], label: 'Approved', backgroundColor: '#22c55e', borderRadius: 4 },
      { data: [0,0,0,0,0,0], label: 'Pending', backgroundColor: '#f59e0b', borderRadius: 4 }
    ]
  };

  // 3. Leave Type Distribution (Doughnut)
  typeChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'right' } }
  };
  typeChartData: ChartConfiguration['data'] = {
    labels: this.leaveTypes,
    datasets: [{ data: [0,0,0,0,0], backgroundColor: ['#8b5cf6', '#ef4444', '#ec4899', '#0ea5e9', '#64748b'], borderWidth: 0 }]
  };

  ngOnInit() {
    this.generateMockData();
    this.applyFilters();
  }

  generateMockData() {
    this.allLogs = [];
    const names = ['John Doe', 'Jane Smith', 'Alice Cooper', 'Bob Marley', 'Charlie Chaplin', 'Diana Prince', 'Eve Adams', 'Frank Castle'];
    
    for (let i = 1; i <= 150; i++) {
      const type = this.leaveTypes[Math.floor(Math.random() * this.leaveTypes.length)];
      let days = Math.floor(Math.random() * 5) + 1;
      if (type === 'Maternity Leave') days = Math.floor(Math.random() * 60) + 30;
      
      const randStatus = Math.random();
      let status: LeaveLog['status'] = 'Approved';
      if (randStatus > 0.8) status = 'Pending';
      else if (randStatus > 0.7) status = 'Rejected';
      else if (randStatus > 0.65) status = 'Cancelled';

      this.allLogs.push({
        id: `LR-${2000 + i}`,
        employee: names[i % names.length] + ' ' + i,
        department: this.departments[Math.floor(Math.random() * this.departments.length)],
        branch: this.branches[Math.floor(Math.random() * this.branches.length)],
        manager: this.managers[Math.floor(Math.random() * this.managers.length)],
        leaveType: type,
        fromDate: `2023-10-${Math.floor(Math.random() * 20) + 1}`,
        toDate: `2023-10-${Math.floor(Math.random() * 10) + 20}`,
        days: days,
        status: status,
        reason: type === 'Sick Leave' ? 'Fever and cold' : (type === 'Annual Leave' ? 'Family vacation' : 'Personal reasons')
      });
    }
  }

  applyFilters() {
    this.isLoading = true;
    setTimeout(() => {
      let filtered = [...this.allLogs];

      if (this.filters.department) filtered = filtered.filter(l => l.department === this.filters.department);
      if (this.filters.branch) filtered = filtered.filter(l => l.branch === this.filters.branch);
      if (this.filters.manager) filtered = filtered.filter(l => l.manager === this.filters.manager);
      if (this.filters.status) filtered = filtered.filter(l => l.status === this.filters.status);
      if (this.filters.leaveType) filtered = filtered.filter(l => l.leaveType === this.filters.leaveType);
      
      if (this.filters.search) {
        const t = this.filters.search.toLowerCase();
        filtered = filtered.filter(l => l.employee.toLowerCase().includes(t) || l.id.toLowerCase().includes(t));
      }

      this.filteredLogs = filtered;
      this.currentPage = 1;
      this.calculateKPIs();
      this.updateCharts();
      this.isLoading = false;
    }, 400); // Simulate network delay
  }

  calculateKPIs() {
    this.kpi.totalLeaves = this.filteredLogs.length;
    this.kpi.approved = this.filteredLogs.filter(l => l.status === 'Approved').length;
    this.kpi.rejected = this.filteredLogs.filter(l => l.status === 'Rejected').length;
    this.kpi.pending = this.filteredLogs.filter(l => l.status === 'Pending').length;
    this.kpi.cancelled = this.filteredLogs.filter(l => l.status === 'Cancelled').length;
    
    this.kpi.totalLeaveDays = this.filteredLogs.reduce((sum, l) => sum + l.days, 0);
    this.kpi.avgLeaveDays = this.kpi.totalLeaves ? (this.kpi.totalLeaveDays / this.kpi.totalLeaves).toFixed(1) : '0';
  }

  updateCharts() {
    // Dept chart
    const appData = this.departments.map(d => this.filteredLogs.filter(l => l.department === d && l.status === 'Approved').length);
    const penData = this.departments.map(d => this.filteredLogs.filter(l => l.department === d && l.status === 'Pending').length);
    
    this.deptChartData = {
      labels: this.departments,
      datasets: [
        { data: appData, label: 'Approved', backgroundColor: '#22c55e', borderRadius: 4 },
        { data: penData, label: 'Pending', backgroundColor: '#f59e0b', borderRadius: 4 }
      ]
    };

    // Type chart
    const typeData = this.leaveTypes.map(t => this.filteredLogs.filter(l => l.leaveType === t).length);
    this.typeChartData = {
      labels: this.leaveTypes,
      datasets: [{ data: typeData, backgroundColor: ['#8b5cf6', '#ef4444', '#ec4899', '#0ea5e9', '#64748b'], borderWidth: 0 }]
    };
  }

  resetFilters() {
    this.filters = { startDate: '2023-10-01', endDate: '2023-10-31', department: '', branch: '', manager: '', status: '', leaveType: '', search: '' };
    this.applyFilters();
  }

  exportData(format: string) {
    this.showToast(`Report exported successfully as ${format.toUpperCase()}`);
  }

  printReport() {
    window.print();
  }

  toggleFullScreen() {
    this.isFullScreen = !this.isFullScreen;
    if (this.isFullScreen) {
      document.documentElement.requestFullscreen().catch();
    } else {
      document.exitFullscreen().catch();
    }
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    if(this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => this.toastMessage = null, 3000);
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'Approved': return 'badge bg-success-subtle text-success';
      case 'Pending': return 'badge bg-warning-subtle text-warning';
      case 'Rejected': return 'badge bg-danger-subtle text-danger';
      case 'Cancelled': return 'badge bg-secondary-subtle text-secondary';
      default: return 'badge bg-light text-dark';
    }
  }

  getTypeClass(type: string): string {
    switch(type) {
      case 'Annual Leave': return 'text-purple fw-bold';
      case 'Sick Leave': return 'text-danger fw-bold';
      case 'Maternity Leave': return 'text-pink fw-bold';
      case 'Casual Leave': return 'text-info fw-bold';
      default: return 'text-secondary fw-bold';
    }
  }
}
