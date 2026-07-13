import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { AttendanceService } from '../../../../core/services/attendance.service';
import { Subscription } from 'rxjs';

interface AttendanceLog {
  id: string;
  employee: string;
  department: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workingMinutes: number;
  lateMinutes: number;
  status: 'Present' | 'Late' | 'Absent' | 'Leave' | 'Half Day' | 'Remote';
}

@Component({
  selector: 'app-crm-attendance-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './attendance-report.component.html',
  styleUrl: './attendance-report.component.css'
})
export class CrmAttendanceReportComponent implements OnInit, OnDestroy {
  
  // Dashboard State
  isFullScreen = false;
  isFilterExpanded = true;
  isLoading = false;
  toastMessage: string | null = null;
  toastTimeout: any;
  sub?: Subscription;

  // Filters
  filters = {
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    department: '',
    status: '',
    search: ''
  };

  departments: string[] = [];
  statuses = ['Present', 'Late', 'Absent', 'Leave'];

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
    leave: 0,
    avgWorkingHours: '0h',
    attendanceRate: '0%',
    totalWorkHrs: '0h',
    totalLateTime: '0h'
  };

  // --- CHARTS ---

  // 1. Trend Chart (Line)
  trendChartType: ChartType = 'line';
  trendChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  };
  trendChartData: ChartConfiguration['data'] = {
    labels: ['W1', 'W2', 'W3', 'W4'],
    datasets: [{ data: [0, 0, 0, 0], label: 'Attendance %', borderColor: '#3b82f6', tension: 0.4, fill: true, backgroundColor: 'rgba(59, 130, 246, 0.1)' }]
  };

  // 2. Dept Distribution (Bar)
  deptChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };
  deptChartData: ChartConfiguration['data'] = {
    labels: ['Leads', 'CRM', 'HR', 'Ops'],
    datasets: [
      { data: [0, 0, 0, 0], label: 'Present', backgroundColor: '#22c55e', borderRadius: 4 },
      { data: [0, 0, 0, 0], label: 'Absent/Late', backgroundColor: '#ef4444', borderRadius: 4 }
    ]
  };

  constructor(private attendanceService: AttendanceService) {}

  ngOnInit() {
    this.fetchData();
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }

  fetchData() {
    this.isLoading = true;
    this.sub = this.attendanceService.getReport({
      start_date: this.filters.startDate,
      end_date: this.filters.endDate
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.allLogs = res.data.map((log: any) => ({
            id: `LOG-${log.id}`,
            employee: log.user_name || 'Unknown',
            department: log.menu || 'Unknown',
            date: log.check_in_time,
            checkIn: new Date(log.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            checkOut: log.check_out_time ? new Date(log.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
            workingMinutes: log.total_minutes || 0,
            lateMinutes: log.late_minutes || 0,
            status: log.is_late ? 'Late' : (log.total_minutes === 0 && log.check_out_time == null ? 'Present' : 'Present')
          }));
          
          // Dynamically extract unique departments, capitalize them for UI consistency
          const uniqueDepts = Array.from(new Set(this.allLogs.map(l => l.department.charAt(0).toUpperCase() + l.department.slice(1))));
          this.departments = uniqueDepts.length > 0 ? uniqueDepts : ['Lead', 'CRM', 'Operation', 'HR'];
          
          this.applyFilters();
        } else {
          this.isLoading = false;
        }
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Failed to load data');
      }
    });
  }

  applyFilters() {
    let filtered = [...this.allLogs];

    if (this.filters.department) filtered = filtered.filter(l => l.department.toLowerCase() === this.filters.department.toLowerCase());
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
  }

  calculateKPIs() {
    this.kpi.total = this.filteredLogs.length;
    this.kpi.present = this.filteredLogs.filter(l => l.status === 'Present').length;
    this.kpi.absent = this.filteredLogs.filter(l => l.status === 'Absent').length;
    this.kpi.late = this.filteredLogs.filter(l => l.status === 'Late').length;
    this.kpi.leave = this.filteredLogs.filter(l => l.status === 'Leave').length;

    const totalWorkingMins = this.filteredLogs.reduce((sum, l) => sum + l.workingMinutes, 0);
    const totalLateMins = this.filteredLogs.reduce((sum, l) => sum + (l.lateMinutes || 0), 0);
    
    this.kpi.avgWorkingHours = this.kpi.total ? (totalWorkingMins / this.kpi.total / 60).toFixed(1) + 'h' : '0h';
    this.kpi.totalWorkHrs = (totalWorkingMins / 60).toFixed(1) + 'h';
    
    // Format late time nicely
    const lateHours = Math.floor(totalLateMins / 60);
    const lateMins = totalLateMins % 60;
    this.kpi.totalLateTime = lateHours > 0 ? `${lateHours}h ${lateMins}m` : `${lateMins}m`;
    
    const presentCount = this.kpi.present + this.kpi.late;
    this.kpi.attendanceRate = this.kpi.total ? Math.round((presentCount / this.kpi.total) * 100) + '%' : '0%';
  }

  updateCharts() {
    const depts = this.departments;
    const presentData = depts.map(d => this.filteredLogs.filter(l => l.department.toLowerCase() === d.toLowerCase() && (l.status === 'Present' || l.status === 'Remote')).length);
    const absentData = depts.map(d => this.filteredLogs.filter(l => l.department.toLowerCase() === d.toLowerCase() && (l.status === 'Absent' || l.status === 'Late')).length);
    
    this.deptChartData = {
      labels: depts,
      datasets: [
        { data: presentData, label: 'Present', backgroundColor: '#22c55e', borderRadius: 4 },
        { data: absentData, label: 'Absent/Late', backgroundColor: '#ef4444', borderRadius: 4 }
      ]
    };

    // Calculate dynamic daily trend based on actual data
    const trendMap = new Map<string, number>();
    
    // Sort logs chronologically
    const sortedLogs = [...this.filteredLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sortedLogs.forEach(l => {
      const d = new Date(l.date);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      trendMap.set(dateStr, (trendMap.get(dateStr) || 0) + 1);
    });

    const labels = Array.from(trendMap.keys());
    const data = Array.from(trendMap.values());

    this.trendChartType = labels.length <= 1 ? 'bar' : 'line';

    this.trendChartData = {
      labels: labels.length > 0 ? labels : ['No Data'],
      datasets: [{ 
        data: data.length > 0 ? data : [0], 
        label: 'Total Logs', 
        borderColor: '#3b82f6', 
        tension: 0.4, 
        fill: true, 
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: this.trendChartType === 'bar' ? 4 : 0
      }]
    };
  }

  resetFilters() {
    const today = new Date().toISOString().split('T')[0];
    this.filters = { startDate: today, endDate: today, department: '', status: '', search: '' };
    this.fetchData();
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
