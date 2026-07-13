import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

interface EmployeeLog {
  id: string;
  name: string;
  department: string;
  branch: string;
  role: string;
  joinDate: string;
  salary: number;
  status: 'Active' | 'On Leave' | 'Terminated';
}

@Component({
  selector: 'app-employee-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './employee-report.component.html',
  styleUrl: './employee-report.component.css'
})

export class EmployeeReportComponent implements OnInit {

  // Dashboard State
  isFullScreen = false;
  isFilterExpanded = true;
  isLoading = false;
  toastMessage: string | null = null;
  toastTimeout: any;

  // Filters
  filters = {
    department: '',
    branch: '',
    role: '',
    status: 'Active',
    search: ''
  };

  departments = ['IT Support', 'Sales', 'HR', 'Finance', 'Operations'];
  branches = ['New York', 'London', 'Singapore', 'Dubai', 'Sydney'];
  roles = ['Manager', 'Senior Executive', 'Executive', 'Analyst', 'Coordinator'];
  statuses = ['Active', 'On Leave', 'Terminated'];

  // Master Data
  allLogs: EmployeeLog[] = [];
  filteredLogs: EmployeeLog[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 15;
  get totalPages(): number {
    return Math.ceil(this.filteredLogs.length / this.pageSize);
  }

  get paginatedLogs(): EmployeeLog[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredLogs.slice(start, start + this.pageSize);
  }

  // KPIs
  kpi = {
    totalEmployees: 0,
    activeEmployees: 0,
    newHires: 0, // Joined this year
    totalPayroll: 0,
    avgSalary: 0
  };

  // --- CHARTS ---

  // 1. Hiring Trend (Line)
  trendChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  };
  trendChartData: ChartConfiguration['data'] = {
    labels: ['2020', '2021', '2022', '2023'],
    datasets: [{ data: [15, 22, 35, 45], label: 'New Hires', borderColor: '#22c55e', tension: 0.4, fill: true, backgroundColor: 'rgba(34, 197, 94, 0.1)' }]
  };

  // 2. Headcount by Department (Bar)
  deptChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } }
  };
  deptChartData: ChartConfiguration['data'] = {
    labels: this.departments,
    datasets: [
      { data: [0, 0, 0, 0, 0], label: 'Headcount', backgroundColor: '#3b82f6', borderRadius: 4 }
    ]
  };

  // 3. Status Distribution (Doughnut)
  statusChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'right' } }
  };
  statusChartData: ChartConfiguration['data'] = {
    labels: this.statuses,
    datasets: [{ data: [0, 0, 0], backgroundColor: ['#10b981', '#f59e0b', '#ef4444'], borderWidth: 0 }]
  };

  ngOnInit() {
    this.generateMockData();
    this.applyFilters();
  }

  generateMockData() {
    this.allLogs = [];
    const firstNames = ['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
    const lastNames = ['Doe', 'Smith', 'Cooper', 'Marley', 'Chaplin', 'Prince', 'Adams', 'Castle', 'Hopper', 'Ford'];

    for (let i = 1; i <= 250; i++) {
      const randStatus = Math.random();
      let status: EmployeeLog['status'] = 'Active';
      if (randStatus > 0.95) status = 'Terminated';
      else if (randStatus > 0.85) status = 'On Leave';

      const role = this.roles[Math.floor(Math.random() * this.roles.length)];
      let baseSalary = 50000;
      if (role === 'Manager') baseSalary = 120000;
      else if (role === 'Senior Executive') baseSalary = 90000;
      else if (role === 'Analyst') baseSalary = 70000;

      const year = 2020 + Math.floor(Math.random() * 4); // 2020 to 2023
      const month = Math.floor(Math.random() * 12) + 1;
      const day = Math.floor(Math.random() * 28) + 1;

      this.allLogs.push({
        id: `EMP-${1000 + i}`,
        name: firstNames[Math.floor(Math.random() * firstNames.length)] + ' ' + lastNames[Math.floor(Math.random() * lastNames.length)],
        department: this.departments[Math.floor(Math.random() * this.departments.length)],
        branch: this.branches[Math.floor(Math.random() * this.branches.length)],
        role: role,
        joinDate: `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`,
        salary: baseSalary + Math.floor(Math.random() * 20000),
        status: status
      });
    }
  }

  applyFilters() {
    this.isLoading = true;
    setTimeout(() => {
      let filtered = [...this.allLogs];

      if (this.filters.department) filtered = filtered.filter(l => l.department === this.filters.department);
      if (this.filters.branch) filtered = filtered.filter(l => l.branch === this.filters.branch);
      if (this.filters.role) filtered = filtered.filter(l => l.role === this.filters.role);
      if (this.filters.status) filtered = filtered.filter(l => l.status === this.filters.status);

      if (this.filters.search) {
        const t = this.filters.search.toLowerCase();
        filtered = filtered.filter(l => l.name.toLowerCase().includes(t) || l.id.toLowerCase().includes(t));
      }

      this.filteredLogs = filtered;
      this.currentPage = 1;
      this.calculateKPIs();
      this.updateCharts();
      this.isLoading = false;
    }, 400);
  }

  calculateKPIs() {
    this.kpi.totalEmployees = this.filteredLogs.length;
    this.kpi.activeEmployees = this.filteredLogs.filter(l => l.status === 'Active').length;
    this.kpi.newHires = this.filteredLogs.filter(l => l.joinDate.startsWith('2023')).length;

    this.kpi.totalPayroll = this.filteredLogs.reduce((sum, l) => sum + l.salary, 0);
    this.kpi.avgSalary = this.kpi.totalEmployees ? Math.round(this.kpi.totalPayroll / this.kpi.totalEmployees) : 0;
  }

  updateCharts() {
    // Dept chart
    const deptHeadcount = this.departments.map(d => this.filteredLogs.filter(l => l.department === d).length);
    this.deptChartData = {
      labels: this.departments,
      datasets: [{ data: deptHeadcount, label: 'Headcount', backgroundColor: '#3b82f6', borderRadius: 4 }]
    };

    // Status chart
    const active = this.filteredLogs.filter(l => l.status === 'Active').length;
    const leave = this.filteredLogs.filter(l => l.status === 'On Leave').length;
    const terminated = this.filteredLogs.filter(l => l.status === 'Terminated').length;

    this.statusChartData = {
      labels: this.statuses,
      datasets: [{ data: [active, leave, terminated], backgroundColor: ['#10b981', '#f59e0b', '#ef4444'], borderWidth: 0 }]
    };

    // Yearly Hiring
    const h20 = this.filteredLogs.filter(l => l.joinDate.startsWith('2020')).length;
    const h21 = this.filteredLogs.filter(l => l.joinDate.startsWith('2021')).length;
    const h22 = this.filteredLogs.filter(l => l.joinDate.startsWith('2022')).length;
    const h23 = this.filteredLogs.filter(l => l.joinDate.startsWith('2023')).length;

    this.trendChartData = {
      labels: ['2020', '2021', '2022', '2023'],
      datasets: [{ data: [h20, h21, h22, h23], label: 'New Hires', borderColor: '#22c55e', tension: 0.4, fill: true, backgroundColor: 'rgba(34, 197, 94, 0.1)' }]
    };
  }

  resetFilters() {
    this.filters = { department: '', branch: '', role: '', status: 'Active', search: '' };
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
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => this.toastMessage = null, 3000);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active': return 'badge bg-success-subtle text-success';
      case 'On Leave': return 'badge bg-warning-subtle text-warning';
      case 'Terminated': return 'badge bg-danger-subtle text-danger';
      default: return 'badge bg-light text-dark';
    }
  }
}
