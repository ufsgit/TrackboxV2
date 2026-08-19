import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

@Component({
  selector: 'app-employee-productivity-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './employee-productivity-report.component.html',
  styleUrl: './employee-productivity-report.component.css'
})
export class EmployeeProductivityReportComponent implements OnInit {
  loading: boolean = true;
  refreshing: boolean = false;
  dateRange: string = 'ytd';
  customStartDate: string = '';
  customEndDate: string = '';
  
  data: any[] = [];
  chartHeight: number = 400;

  public barChartOptions: ChartConfiguration['options'] = {
    indexAxis: 'y', // This makes it a horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800, easing: 'easeOutQuart' } as any,
    scales: {
      x: { 
        beginAtZero: true, 
        grid: { color: 'rgba(0,0,0,0.03)' },
        title: { display: true, text: 'Lead Conversion Count' }
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

  // Custom Dropdown State
  isDateDropdownOpen: boolean = false;

  constructor(
    private cdr: ChangeDetectorRef, 
    private api: ApiService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.fetchData();
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
    return labels[this.dateRange] || 'Date Range';
  }

  fetchData(isRefresh = false) {
    if (isRefresh) {
      this.refreshing = true;
    } else {
      this.loading = true;
    }
    
    let endpoint = `/reports/leads/employee-conversion?dateRange=${this.dateRange}`;
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
          // Sort by conversion count (sale_won) descending
          this.data = res.data.sort((a: any, b: any) => b.sale_won - a.sale_won);
          this.updateCharts();
        }
        setTimeout(() => {
          this.loading = false;
          this.refreshing = false;
          this.cdr.detectChanges();
        }, 150);
      },
      error: (err: any) => {
        console.error('Failed to load employee productivity report', err);
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
          data: this.data.map(d => d.sale_won), 
          label: 'Conversions', 
          backgroundColor: '#3b82f6', // A nice blue
          borderRadius: 4, 
          barPercentage: 0.6 
        }
      ]
    };
  }
}
