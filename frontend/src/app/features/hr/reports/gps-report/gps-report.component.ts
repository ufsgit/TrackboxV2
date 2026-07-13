import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

interface GpsLog {
  id: string;
  employee: string;
  department: string;
  branch: string;
  date: string;
  distanceKm: number;
  stops: number;
  checkInTime: string;
  checkOutTime: string;
  status: 'Active' | 'Completed' | 'Off-Grid';
}

@Component({
  selector: 'app-gps-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './gps-report.component.html',
  styleUrl: './gps-report.component.css'
})
export class GpsReportComponent implements OnInit {

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
    status: '',
    search: ''
  };

  departments = ['Sales', 'Delivery', 'Field Maintenance', 'Operations'];
  branches = ['New York', 'London', 'Singapore', 'Dubai', 'Sydney'];
  statuses = ['Active', 'Completed', 'Off-Grid'];

  // Master Data
  allLogs: GpsLog[] = [];
  filteredLogs: GpsLog[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 15;
  get totalPages(): number {
    return Math.ceil(this.filteredLogs.length / this.pageSize);
  }

  get paginatedLogs(): GpsLog[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredLogs.slice(start, start + this.pageSize);
  }

  // KPIs
  kpi = {
    totalTrips: 0,
    totalDistance: 0,
    avgDistance: 0,
    activeAgents: 0,
    totalStops: 0
  };

  // --- CHARTS ---

  // 1. Distance Trend (Line)
  trendChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  };
  trendChartData: ChartConfiguration['data'] = {
    labels: ['W1', 'W2', 'W3', 'W4'],
    datasets: [{ data: [350, 420, 310, 500], label: 'Total Distance (km)', borderColor: '#0ea5e9', tension: 0.4, fill: true, backgroundColor: 'rgba(14, 165, 233, 0.1)' }]
  };

  // 2. Department Distance (Bar)
  deptChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };
  deptChartData: ChartConfiguration['data'] = {
    labels: this.departments,
    datasets: [
      { data: [0, 0, 0, 0], label: 'Total km', backgroundColor: '#3b82f6', borderRadius: 4 }
    ]
  };

  // 3. Status Distribution (Doughnut)
  statusChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'right' } }
  };
  statusChartData: ChartConfiguration['data'] = {
    labels: this.statuses,
    datasets: [{ data: [0, 0, 0], backgroundColor: ['#22c55e', '#64748b', '#ef4444'], borderWidth: 0 }]
  };

  ngOnInit() {
    this.generateMockData();
    this.applyFilters();
  }

  generateMockData() {
    this.allLogs = [];
    const names = ['Michael Scott', 'Jim Halpert', 'Pam Beesly', 'Dwight Schrute', 'Stanley Hudson'];

    for (let i = 1; i <= 150; i++) {
      const randStatus = Math.random();
      let status: GpsLog['status'] = 'Completed';
      if (randStatus > 0.8) status = 'Active';
      else if (randStatus > 0.7) status = 'Off-Grid';

      this.allLogs.push({
        id: `GPS-${5000 + i}`,
        employee: names[i % names.length] + ' ' + i,
        department: this.departments[Math.floor(Math.random() * this.departments.length)],
        branch: this.branches[Math.floor(Math.random() * this.branches.length)],
        date: `2023-10-${Math.floor(Math.random() * 28) + 1}`,
        distanceKm: Math.floor(Math.random() * 150) + 10,
        stops: Math.floor(Math.random() * 10) + 1,
        checkInTime: '08:00 AM',
        checkOutTime: status === 'Completed' ? '05:00 PM' : '-',
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
      if (this.filters.status) filtered = filtered.filter(l => l.status === this.filters.status);

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
    this.kpi.totalTrips = this.filteredLogs.length;
    this.kpi.totalDistance = this.filteredLogs.reduce((sum, l) => sum + l.distanceKm, 0);
    this.kpi.totalStops = this.filteredLogs.reduce((sum, l) => sum + l.stops, 0);
    this.kpi.activeAgents = this.filteredLogs.filter(l => l.status === 'Active').length;
    this.kpi.avgDistance = this.kpi.totalTrips ? Math.round(this.kpi.totalDistance / this.kpi.totalTrips) : 0;
  }

  updateCharts() {
    // Dept chart
    const deptKm = this.departments.map(d => this.filteredLogs.filter(l => l.department === d).reduce((sum, l) => sum + l.distanceKm, 0));
    this.deptChartData = {
      labels: this.departments,
      datasets: [{ data: deptKm, label: 'Total km', backgroundColor: '#3b82f6', borderRadius: 4 }]
    };

    // Status chart
    const statusData = this.statuses.map(s => this.filteredLogs.filter(l => l.status === s).length);
    this.statusChartData = {
      labels: this.statuses,
      datasets: [{ data: statusData, backgroundColor: ['#22c55e', '#64748b', '#ef4444'], borderWidth: 0 }]
    };
  }

  resetFilters() {
    this.filters = { startDate: '2023-10-01', endDate: '2023-10-31', department: '', branch: '', status: '', search: '' };
    this.applyFilters();
  }

  exportData(format: string) {
    this.showToast(`GPS Report exported successfully as ${format.toUpperCase()}`);
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
      case 'Completed': return 'badge bg-secondary-subtle text-secondary';
      case 'Off-Grid': return 'badge bg-danger-subtle text-danger';
      default: return 'badge bg-light text-dark';
    }
  }
}
