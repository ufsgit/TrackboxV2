import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

interface ExpenseLog {
  id: string;
  employee: string;
  department: string;
  branch: string;
  manager: string;
  category: string;
  amount: number;
  submitted: string;
  approvedDate: string;
  status: 'Approved' | 'Pending' | 'Rejected';
}

@Component({
  selector: 'app-expense-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './expense-report.component.html',
  styleUrl: './expense-report.component.css'
})
export class ExpenseReportComponent implements OnInit {

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
    category: '',
    search: ''
  };

  departments = ['IT Support', 'Sales', 'HR', 'Finance', 'Operations', 'Marketing'];
  branches = ['New York', 'London', 'Singapore', 'Dubai', 'Sydney'];
  managers = ['Alice Johnson', 'Robert Smith', 'Emma Watson', 'David Brown', 'Michael Clark'];
  categories = ['Travel', 'Meals', 'Accommodation', 'Office Supplies', 'Software', 'Client Entertainment'];
  statuses = ['Approved', 'Pending', 'Rejected'];

  // Master Data
  allLogs: ExpenseLog[] = [];
  filteredLogs: ExpenseLog[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 15;
  get totalPages(): number {
    return Math.ceil(this.filteredLogs.length / this.pageSize);
  }
  
  get paginatedLogs(): ExpenseLog[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredLogs.slice(start, start + this.pageSize);
  }

  // KPIs
  kpi = {
    totalExpenses: 0,
    approvedAmount: 0,
    pendingAmount: 0,
    rejectedAmount: 0,
    avgClaim: 0,
    highestClaim: 0
  };

  // --- CHARTS ---

  // 1. Expense Trend (Line)
  trendChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  };
  trendChartData: ChartConfiguration['data'] = {
    labels: ['W1', 'W2', 'W3', 'W4'],
    datasets: [{ data: [1200, 1900, 1500, 2500], label: 'Expenses (₹)', borderColor: '#10b981', tension: 0.4, fill: true, backgroundColor: 'rgba(16, 185, 129, 0.1)' }]
  };

  // 2. Department Expense Comparison (Bar)
  deptChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };
  deptChartData: ChartConfiguration['data'] = {
    labels: this.departments,
    datasets: [
      { data: [0,0,0,0,0,0], label: 'Approved (₹)', backgroundColor: '#3b82f6', borderRadius: 4 },
      { data: [0,0,0,0,0,0], label: 'Pending (₹)', backgroundColor: '#f59e0b', borderRadius: 4 }
    ]
  };

  // 3. Expense Category Distribution (Doughnut)
  categoryChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'right' } }
  };
  categoryChartData: ChartConfiguration['data'] = {
    labels: this.categories,
    datasets: [{ data: [0,0,0,0,0,0], backgroundColor: ['#8b5cf6', '#ef4444', '#ec4899', '#0ea5e9', '#64748b', '#10b981'], borderWidth: 0 }]
  };

  ngOnInit() {
    this.generateMockData();
    this.applyFilters();
  }

  generateMockData() {
    this.allLogs = [];
    const names = ['John Doe', 'Jane Smith', 'Alice Cooper', 'Bob Marley', 'Charlie Chaplin', 'Diana Prince', 'Eve Adams', 'Frank Castle'];
    
    for (let i = 1; i <= 150; i++) {
      const category = this.categories[Math.floor(Math.random() * this.categories.length)];
      let amount = Math.floor(Math.random() * 500) + 50;
      if (category === 'Travel' || category === 'Accommodation') amount += 1000;
      
      const randStatus = Math.random();
      let status: ExpenseLog['status'] = 'Approved';
      if (randStatus > 0.75) status = 'Pending';
      else if (randStatus > 0.65) status = 'Rejected';

      const submitDay = Math.floor(Math.random() * 28) + 1;
      
      this.allLogs.push({
        id: `EXP-${3000 + i}`,
        employee: names[i % names.length] + ' ' + i,
        department: this.departments[Math.floor(Math.random() * this.departments.length)],
        branch: this.branches[Math.floor(Math.random() * this.branches.length)],
        manager: this.managers[Math.floor(Math.random() * this.managers.length)],
        category: category,
        amount: amount,
        submitted: `2023-10-${submitDay < 10 ? '0'+submitDay : submitDay}`,
        approvedDate: status === 'Approved' ? `2023-10-${submitDay + 2 < 10 ? '0'+(submitDay+2) : (submitDay+2)}` : '-',
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
      if (this.filters.manager) filtered = filtered.filter(l => l.manager === this.filters.manager);
      if (this.filters.status) filtered = filtered.filter(l => l.status === this.filters.status);
      if (this.filters.category) filtered = filtered.filter(l => l.category === this.filters.category);
      
      if (this.filters.search) {
        const t = this.filters.search.toLowerCase();
        filtered = filtered.filter(l => l.employee.toLowerCase().includes(t) || l.id.toLowerCase().includes(t));
      }

      this.filteredLogs = filtered.sort((a,b) => new Date(b.submitted).getTime() - new Date(a.submitted).getTime());
      this.currentPage = 1;
      this.calculateKPIs();
      this.updateCharts();
      this.isLoading = false;
    }, 400); // Simulate network delay
  }

  calculateKPIs() {
    this.kpi.totalExpenses = this.filteredLogs.reduce((sum, l) => sum + l.amount, 0);
    this.kpi.approvedAmount = this.filteredLogs.filter(l => l.status === 'Approved').reduce((sum, l) => sum + l.amount, 0);
    this.kpi.pendingAmount = this.filteredLogs.filter(l => l.status === 'Pending').reduce((sum, l) => sum + l.amount, 0);
    this.kpi.rejectedAmount = this.filteredLogs.filter(l => l.status === 'Rejected').reduce((sum, l) => sum + l.amount, 0);
    
    this.kpi.avgClaim = this.filteredLogs.length ? Math.round(this.kpi.totalExpenses / this.filteredLogs.length) : 0;
    
    const amounts = this.filteredLogs.map(l => l.amount);
    this.kpi.highestClaim = amounts.length ? Math.max(...amounts) : 0;
  }

  updateCharts() {
    // Dept chart
    const appData = this.departments.map(d => this.filteredLogs.filter(l => l.department === d && l.status === 'Approved').reduce((sum, l) => sum + l.amount, 0));
    const penData = this.departments.map(d => this.filteredLogs.filter(l => l.department === d && l.status === 'Pending').reduce((sum, l) => sum + l.amount, 0));
    
    this.deptChartData = {
      labels: this.departments,
      datasets: [
        { data: appData, label: 'Approved (₹)', backgroundColor: '#3b82f6', borderRadius: 4 },
        { data: penData, label: 'Pending (₹)', backgroundColor: '#f59e0b', borderRadius: 4 }
      ]
    };

    // Category chart
    const catData = this.categories.map(c => this.filteredLogs.filter(l => l.category === c).reduce((sum, l) => sum + l.amount, 0));
    this.categoryChartData = {
      labels: this.categories,
      datasets: [{ data: catData, backgroundColor: ['#8b5cf6', '#ef4444', '#ec4899', '#0ea5e9', '#64748b', '#10b981'], borderWidth: 0 }]
    };
  }

  resetFilters() {
    this.filters = { startDate: '2023-10-01', endDate: '2023-10-31', department: '', branch: '', manager: '', status: '', category: '', search: '' };
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
      default: return 'badge bg-light text-dark';
    }
  }
}
