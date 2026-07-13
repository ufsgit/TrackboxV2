import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

interface AttendanceLog {
  id: string;
  employee: string;
  department: string;
  branch: string;
  manager: string;
  shift: string;
  checkIn: string;
  checkOut: string;
  workingHours: number;
  breakTime: number;
  lateMinutes: number;
  overtime: number;
  attendancePct: number;
  status: 'Present' | 'Late' | 'Absent' | 'Leave' | 'Half Day' | 'Remote';
}

@Component({
  selector: 'app-attendance-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './attendance-report.component.html',
  styleUrl: './attendance-report.component.css'
})
export class AttendanceReportComponent implements OnInit {
  
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
    shift: '',
    search: ''
  };

  departments = ['IT Support', 'Sales', 'HR', 'Finance', 'Operations', 'Marketing'];
  branches = ['New York', 'London', 'Singapore', 'Dubai', 'Sydney'];
  managers = ['Alice Johnson', 'Robert Smith', 'Emma Watson', 'David Brown', 'Michael Clark'];
  shifts = ['Morning (9-5)', 'Evening (2-10)', 'Night (10-6)'];
  statuses = ['Present', 'Late', 'Absent', 'Leave', 'Half Day', 'Remote'];

  // Master Data
  allLogs: AttendanceLog[] = [];
  filteredLogs: AttendanceLog[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 15;
  get totalPages(): number {
    return Math.ceil(this.filteredLogs.length / this.pageSize);
  }
  
  get paginatedLogs(): AttendanceLog[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredLogs.slice(start, start + this.pageSize);
  }

  // KPIs
  kpi = {
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    leave: 0,
    remote: 0,
    avgWorkingHours: '0h',
    overtimeHours: '0h',
    attendanceRate: '0%'
  };

  // --- CHARTS ---

  // 1. Trend Chart (Line)
  trendChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  };
  trendChartData: ChartConfiguration['data'] = {
    labels: ['W1', 'W2', 'W3', 'W4'],
    datasets: [{ data: [95, 92, 96, 89], label: 'Attendance %', borderColor: '#3b82f6', tension: 0.4, fill: true, backgroundColor: 'rgba(59, 130, 246, 0.1)' }]
  };

  // 2. Dept Distribution (Bar)
  deptChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };
  deptChartData: ChartConfiguration['data'] = {
    labels: ['IT', 'Sales', 'HR', 'Ops'],
    datasets: [
      { data: [40, 30, 10, 20], label: 'Present', backgroundColor: '#22c55e', borderRadius: 4 },
      { data: [2, 5, 1, 3], label: 'Absent/Late', backgroundColor: '#ef4444', borderRadius: 4 }
    ]
  };

  // 3. Shift Distribution (Doughnut)
  shiftChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'right' } }
  };
  shiftChartData: ChartConfiguration['data'] = {
    labels: ['Morning', 'Evening', 'Night'],
    datasets: [{ data: [60, 25, 15], backgroundColor: ['#8b5cf6', '#f59e0b', '#0ea5e9'], borderWidth: 0 }]
  };

  ngOnInit() {
    this.generateMockData();
    this.applyFilters();
  }

  generateMockData() {
    this.allLogs = [];
    const names = ['John Doe', 'Jane Smith', 'Alice Cooper', 'Bob Marley', 'Charlie Chaplin', 'Diana Prince', 'Eve Adams', 'Frank Castle'];
    
    for (let i = 1; i <= 150; i++) {
      const isLate = Math.random() > 0.8;
      const isAbsent = Math.random() > 0.9;
      const isLeave = Math.random() > 0.95;
      const isRemote = Math.random() > 0.85;

      let status: AttendanceLog['status'] = 'Present';
      if (isAbsent) status = 'Absent';
      else if (isLeave) status = 'Leave';
      else if (isLate) status = 'Late';
      else if (isRemote) status = 'Remote';

      let wHours = 0, lateM = 0, ot = 0;
      if (status !== 'Absent' && status !== 'Leave') {
        wHours = 7 + Math.random() * 3;
        if (wHours > 9) ot = wHours - 9;
        if (status === 'Late') lateM = 15 + Math.random() * 45;
      }

      this.allLogs.push({
        id: `EMP-${1000 + i}`,
        employee: names[i % names.length] + ' ' + i,
        department: this.departments[Math.floor(Math.random() * this.departments.length)],
        branch: this.branches[Math.floor(Math.random() * this.branches.length)],
        manager: this.managers[Math.floor(Math.random() * this.managers.length)],
        shift: this.shifts[Math.floor(Math.random() * this.shifts.length)],
        checkIn: status === 'Absent' || status === 'Leave' ? '-' : `09:${Math.floor(10 + Math.random()*40)} AM`,
        checkOut: status === 'Absent' || status === 'Leave' ? '-' : `06:${Math.floor(10 + Math.random()*40)} PM`,
        workingHours: Number(wHours.toFixed(1)),
        breakTime: status === 'Absent' || status === 'Leave' ? 0 : 1,
        lateMinutes: Math.floor(lateM),
        overtime: Number(ot.toFixed(1)),
        attendancePct: status === 'Absent' || status === 'Leave' ? 0 : 100,
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
      if (this.filters.shift) filtered = filtered.filter(l => l.shift === this.filters.shift);
      
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
    this.kpi.total = this.filteredLogs.length;
    this.kpi.present = this.filteredLogs.filter(l => l.status === 'Present').length;
    this.kpi.absent = this.filteredLogs.filter(l => l.status === 'Absent').length;
    this.kpi.late = this.filteredLogs.filter(l => l.status === 'Late').length;
    this.kpi.halfDay = this.filteredLogs.filter(l => l.status === 'Half Day').length;
    this.kpi.leave = this.filteredLogs.filter(l => l.status === 'Leave').length;
    this.kpi.remote = this.filteredLogs.filter(l => l.status === 'Remote').length;

    const totalWorking = this.filteredLogs.reduce((sum, l) => sum + l.workingHours, 0);
    const totalOT = this.filteredLogs.reduce((sum, l) => sum + l.overtime, 0);
    
    this.kpi.avgWorkingHours = this.kpi.total ? (totalWorking / this.kpi.total).toFixed(1) + 'h' : '0h';
    this.kpi.overtimeHours = totalOT.toFixed(1) + 'h';
    
    const presentCount = this.kpi.present + this.kpi.late + this.kpi.remote;
    this.kpi.attendanceRate = this.kpi.total ? Math.round((presentCount / this.kpi.total) * 100) + '%' : '0%';
  }

  updateCharts() {
    // Dynamically update dept chart
    const depts = this.departments;
    const presentData = depts.map(d => this.filteredLogs.filter(l => l.department === d && (l.status === 'Present' || l.status === 'Remote')).length);
    const absentData = depts.map(d => this.filteredLogs.filter(l => l.department === d && (l.status === 'Absent' || l.status === 'Late')).length);
    
    this.deptChartData = {
      labels: depts,
      datasets: [
        { data: presentData, label: 'Present', backgroundColor: '#22c55e', borderRadius: 4 },
        { data: absentData, label: 'Absent/Late', backgroundColor: '#ef4444', borderRadius: 4 }
      ]
    };

    // Dynamically update shift chart
    const shifts = this.shifts;
    const shiftData = shifts.map(s => this.filteredLogs.filter(l => l.shift === s).length);
    this.shiftChartData = {
      labels: shifts,
      datasets: [{ data: shiftData, backgroundColor: ['#8b5cf6', '#f59e0b', '#0ea5e9'], borderWidth: 0 }]
    };
  }

  resetFilters() {
    this.filters = { startDate: '2023-10-01', endDate: '2023-10-31', department: '', branch: '', manager: '', status: '', shift: '', search: '' };
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
      case 'Present': return 'badge bg-success-subtle text-success';
      case 'Late': return 'badge bg-warning-subtle text-warning';
      case 'Absent': return 'badge bg-danger-subtle text-danger';
      case 'Leave': return 'badge bg-secondary-subtle text-secondary';
      case 'Remote': return 'badge bg-info-subtle text-info';
      case 'Half Day': return 'badge bg-purple-subtle text-purple';
      default: return 'badge bg-light text-dark';
    }
  }
}
