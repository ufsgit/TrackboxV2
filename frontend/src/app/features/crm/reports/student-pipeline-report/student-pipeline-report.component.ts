import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

@Component({
  selector: 'app-student-pipeline-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './student-pipeline-report.component.html',
  styleUrl: './student-pipeline-report.component.css'
})
export class StudentPipelineReportComponent implements OnInit {
  loading: boolean = true;
  refreshing: boolean = false;
  dateRange: string = 'ytd';
  customStartDate: string = '';
  customEndDate: string = '';
  selectedStatus: string = 'All';
  statuses: any[] = [];
  
  data: any[] = [];
  chartHeight: number = 400;

  public barChartOptions: ChartConfiguration['options'] = {
    indexAxis: 'y', // Horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800, easing: 'easeOutQuart' } as any,
    scales: {
      x: { 
        beginAtZero: true, 
        grid: { color: 'rgba(0,0,0,0.03)' },
        title: { display: true, text: 'Assigned Leads' }
      },
      y: { 
        grid: { display: false }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', padding: 12, cornerRadius: 8 }
    }
  };

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
    this.fetchStatuses();
    this.fetchData();
  }

  fetchStatuses() {
    this.api.get('/system-settings/statuses').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.statuses = res.data;
        }
      },
      error: (err: any) => console.error('Failed to load statuses', err)
    });
  }

  fetchData(isRefresh = false) {
    if (isRefresh) {
      this.refreshing = true;
    } else {
      this.loading = true;
    }
    
    let endpoint = `/reports/leads/student-pipeline?dateRange=${this.dateRange}`;
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

    this.api.get(endpoint).subscribe({
      next: (res: any) => {
        if (res.success) {
          // Data is already sorted descending by backend, but let's ensure it just in case
          this.data = res.data.sort((a: any, b: any) => b.assigned_leads - a.assigned_leads);
          this.updateCharts();
        }
        setTimeout(() => {
          this.loading = false;
          this.refreshing = false;
          this.cdr.detectChanges();
        }, 150);
      },
      error: (err: any) => {
        console.error('Failed to load student pipeline report', err);
        this.loading = false;
        this.refreshing = false;
      }
    });
  }

  updateCharts() {
    this.chartHeight = Math.max(400, this.data.length * 40);
    this.barChartData = {
      labels: this.data.map(d => `${d.employee_code || 'N/A'} - ${d.employee || 'Unassigned'}`),
      datasets: [
        { 
          data: this.data.map(d => d.assigned_leads), 
          label: 'Assigned Leads', 
          backgroundColor: '#8b5cf6', // A distinct purple to separate from productivity report
          borderRadius: 4, 
          barPercentage: 0.6 
        }
      ]
    };
  }
}
