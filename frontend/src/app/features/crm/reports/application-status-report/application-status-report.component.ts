import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

@Component({
  selector: 'app-application-status-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './application-status-report.component.html',
  styleUrl: './application-status-report.component.css'
})
export class ApplicationStatusReportComponent implements OnInit {
  loading: boolean = true;
  refreshing: boolean = false;

  dateRange: string = 'ytd';
  customStartDate: string = '';
  customEndDate: string = '';
  isDateDropdownOpen: boolean = false;

  totalApplications: number = 0;
  breakdown: any[] = [];

  // Chart configuration
  public pieChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%', // Makes it a donut chart
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: 'Inter, sans-serif',
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#212529',
        bodyColor: '#212529',
        borderColor: '#dee2e6',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true
      }
    }
  };

  public pieChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  isBrowser = false;

  constructor(
    private api: ApiService, 
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.fetchData();
  }

  fetchData(isRefresh = false) {
    if (isRefresh) {
      this.refreshing = true;
    } else {
      this.loading = true;
    }

    let endpoint = `/reports/applications/status-summary?dateRange=${this.dateRange}`;
    if (this.dateRange === 'custom') {
      if (!this.customStartDate || !this.customEndDate) {
        this.loading = false;
        this.refreshing = false;
        return;
      }
      endpoint += `&startDate=${this.customStartDate}&endDate=${this.customEndDate}`;
    }

    this.api.get(endpoint).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.breakdown = res.data || [];
          // Some items might be returned with 0 count, filter them out if needed, 
          // or just show them. We'll show all and sum total.
          this.totalApplications = this.breakdown.reduce((sum, item) => sum + (Number(item.count) || 0), 0);
          this.updateChart();
        }
        setTimeout(() => {
          this.loading = false;
          this.refreshing = false;
          this.cdr.detectChanges();
        }, 150);
      },
      error: (err: any) => {
        console.error('Failed to load application status report', err);
        this.loading = false;
        this.refreshing = false;
      }
    });
  }

  updateChart() {
    // Filter out zero counts for the chart if you want, or keep them. 
    // Usually it's better to hide 0-count from chart to avoid overlap, but keeping is fine.
    const chartData = this.breakdown.filter(d => Number(d.count) > 0);
    
    this.pieChartData = {
      labels: chartData.map(d => d.status),
      datasets: [
        {
          data: chartData.map(d => Number(d.count)),
          backgroundColor: chartData.map((_, i) => this.getStatusColor(i)),
          borderWidth: 0,
          hoverOffset: 4
        }
      ]
    };
  }

  toggleDateDropdown() {
    this.isDateDropdownOpen = !this.isDateDropdownOpen;
  }

  selectDateRange(range: string) {
    this.dateRange = range;
    if (range !== 'custom') {
      this.isDateDropdownOpen = false;
      this.fetchData();
    }
  }

  applyCustomDate() {
    if (this.customStartDate && this.customEndDate) {
      this.isDateDropdownOpen = false;
      this.fetchData();
    }
  }

  getDateRangeLabel(): string {
    const labels: any = {
      'today': 'Today',
      'this_week': 'This Week',
      'this_month': 'This Month',
      'last_month': 'Last Month',
      'ytd': 'Year to Date',
      'prev_year': 'Previous Year',
      'custom': 'Custom Range'
    };
    return labels[this.dateRange] || 'Year to Date';
  }

  getStatusColor(index: number): string {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316'];
    return colors[index % colors.length];
  }
}
