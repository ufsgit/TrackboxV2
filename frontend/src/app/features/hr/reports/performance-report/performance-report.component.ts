import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

interface PerformanceLog {
  id: string;
  employee: string;
  department: string;
  branch: string;
  manager: string;
  reviewDate: string;
  rating: number; // 1-5
  kpiScore: number; // 0-100
  status: 'Completed' | 'Pending' | 'Under Review';
}

@Component({
  selector: 'app-performance-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './performance-report.component.html',
  styleUrl: './performance-report.component.css'
})

export class PerformanceReportComponent implements OnInit {

  // Dashboard State
  isFullScreen = false;
  isFilterExpanded = true;
  isLoading = false;
  toastMessage: string | null = null;
  toastTimeout: any;

  // Filters
  filters = {
    period: 'Q3 2023',
    department: '',
    branch: '',
    manager: '',
    rating: '',
    search: ''
  };

  departments = ['IT Support', 'Sales', 'HR', 'Finance', 'Operations'];
  branches = ['New York', 'London', 'Singapore', 'Dubai', 'Sydney'];
  managers = ['Alice Johnson', 'Robert Smith', 'Emma Watson', 'David Brown'];
  ratings = ['5 - Outstanding', '4 - Exceeds Expectations', '3 - Meets Expectations', '2 - Needs Improvement', '1 - Unacceptable'];

  // Master Data
  allLogs: PerformanceLog[] = [];
  filteredLogs: PerformanceLog[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 15;
  get totalPages(): number {
    return Math.ceil(this.filteredLogs.length / this.pageSize);
  }

  get paginatedLogs(): PerformanceLog[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredLogs.slice(start, start + this.pageSize);
  }

  // KPIs
  kpi = {
    totalReviews: 0,
    completed: 0,
    avgRating: 0,
    topPerformers: 0, // rating >= 4
    lowPerformers: 0  // rating <= 2
  };

  // --- CHARTS ---

  // 1. KPI Score Distribution (Line/Area)
  trendChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, max: 100 } }
  };
  trendChartData: ChartConfiguration['data'] = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [{ data: [75, 82, 78, 85], label: 'Avg KPI Score', borderColor: '#8b5cf6', tension: 0.4, fill: true, backgroundColor: 'rgba(139, 92, 246, 0.1)' }]
  };

  // 2. Department Average Rating (Bar)
  deptChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { max: 5 } }
  };
  deptChartData: ChartConfiguration['data'] = {
    labels: this.departments,
    datasets: [
      { data: [0, 0, 0, 0, 0], label: 'Avg Rating', backgroundColor: '#3b82f6', borderRadius: 4 }
    ]
  };

  // 3. Rating Distribution (Doughnut)
  ratingChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'right' } }
  };
  ratingChartData: ChartConfiguration['data'] = {
    labels: ['Outstanding', 'Exceeds', 'Meets', 'Needs Impr.', 'Unacceptable'],
    datasets: [{ data: [0, 0, 0, 0, 0], backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'], borderWidth: 0 }]
  };

  ngOnInit() {
    this.generateMockData();
    this.applyFilters();
  }

  generateMockData() {
    this.allLogs = [];
    const names = ['John Doe', 'Jane Smith', 'Alice Cooper', 'Bob Marley', 'Charlie Chaplin', 'Diana Prince', 'Eve Adams', 'Frank Castle'];

    for (let i = 1; i <= 150; i++) {
      // Gaussian-ish distribution for ratings
      const r = Math.random();
      let rating = 3;
      if (r > 0.9) rating = 5;
      else if (r > 0.65) rating = 4;
      else if (r > 0.25) rating = 3;
      else if (r > 0.05) rating = 2;
      else rating = 1;

      const kpiBase = rating * 20;
      const kpiScore = Math.min(100, Math.max(0, kpiBase + (Math.random() * 15 - 7)));

      const randStatus = Math.random();
      let status: PerformanceLog['status'] = 'Completed';
      if (randStatus > 0.85) status = 'Under Review';
      else if (randStatus > 0.75) status = 'Pending';

      this.allLogs.push({
        id: `PR-${6000 + i}`,
        employee: names[i % names.length] + ' ' + i,
        department: this.departments[Math.floor(Math.random() * this.departments.length)],
        branch: this.branches[Math.floor(Math.random() * this.branches.length)],
        manager: this.managers[Math.floor(Math.random() * this.managers.length)],
        reviewDate: `2023-09-${Math.floor(Math.random() * 28) + 1}`,
        rating: status === 'Completed' ? rating : 0,
        kpiScore: status === 'Completed' ? Math.round(kpiScore) : 0,
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

      if (this.filters.rating) {
        const targetRating = parseInt(this.filters.rating.charAt(0));
        filtered = filtered.filter(l => l.rating === targetRating);
      }

      if (this.filters.search) {
        const t = this.filters.search.toLowerCase();
        filtered = filtered.filter(l => l.employee.toLowerCase().includes(t) || l.id.toLowerCase().includes(t));
      }

      this.filteredLogs = filtered;
      this.currentPage = 1;
      this.calculateKPIs();
      this.updateCharts();
      this.isLoading = false;
    }, 400);
  }

  calculateKPIs() {
    this.kpi.totalReviews = this.filteredLogs.length;
    this.kpi.completed = this.filteredLogs.filter(l => l.status === 'Completed').length;
    this.kpi.topPerformers = this.filteredLogs.filter(l => l.status === 'Completed' && l.rating >= 4).length;
    this.kpi.lowPerformers = this.filteredLogs.filter(l => l.status === 'Completed' && l.rating <= 2).length;

    const rated = this.filteredLogs.filter(l => l.status === 'Completed');
    const totalRating = rated.reduce((sum, l) => sum + l.rating, 0);
    this.kpi.avgRating = rated.length ? Math.round((totalRating / rated.length) * 10) / 10 : 0;
  }

  updateCharts() {
    // Dept chart
    const deptAvg = this.departments.map(d => {
      const logs = this.filteredLogs.filter(l => l.department === d && l.status === 'Completed');
      if (logs.length === 0) return 0;
      return (logs.reduce((sum, l) => sum + l.rating, 0) / logs.length).toFixed(1);
    });
    this.deptChartData = {
      labels: this.departments,
      datasets: [{ data: deptAvg as any, label: 'Avg Rating', backgroundColor: '#3b82f6', borderRadius: 4 }]
    };

    // Rating Distribution chart
    const r5 = this.filteredLogs.filter(l => l.rating === 5).length;
    const r4 = this.filteredLogs.filter(l => l.rating === 4).length;
    const r3 = this.filteredLogs.filter(l => l.rating === 3).length;
    const r2 = this.filteredLogs.filter(l => l.rating === 2).length;
    const r1 = this.filteredLogs.filter(l => l.rating === 1).length;

    this.ratingChartData = {
      labels: ['Outstanding (5)', 'Exceeds (4)', 'Meets (3)', 'Needs Impr. (2)', 'Unacceptable (1)'],
      datasets: [{ data: [r5, r4, r3, r2, r1], backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'], borderWidth: 0 }]
    };
  }

  resetFilters() {
    this.filters = { period: 'Q3 2023', department: '', branch: '', manager: '', rating: '', search: '' };
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

  getRatingClass(rating: number): string {
    switch (rating) {
      case 5: return 'text-success fw-bold';
      case 4: return 'text-primary fw-bold';
      case 3: return 'text-warning fw-bold';
      case 2: return 'text-orange fw-bold';
      case 1: return 'text-danger fw-bold';
      default: return 'text-muted';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Completed': return 'badge bg-success-subtle text-success';
      case 'Under Review': return 'badge bg-warning-subtle text-warning';
      case 'Pending': return 'badge bg-secondary-subtle text-secondary';
      default: return 'badge bg-light text-dark';
    }
  }
}
