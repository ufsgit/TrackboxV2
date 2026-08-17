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
        ticks: { color: '#9ca3af', font: { size: 12 } }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', padding: 12, cornerRadius: 8 }
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
          backgroundColor: '#1d4ed8', // Darker blue to match image
          hoverBackgroundColor: '#2563eb',
          borderRadius: 0, 
          barPercentage: 0.7,
          categoryPercentage: 0.8
        }
      ]
    };
  }
}
