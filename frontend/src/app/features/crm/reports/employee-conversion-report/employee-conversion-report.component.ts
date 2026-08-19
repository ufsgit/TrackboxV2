import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-employee-conversion-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './employee-conversion-report.component.html',
  styleUrl: './employee-conversion-report.component.css'
})
export class EmployeeConversionReportComponent implements OnInit, AfterViewInit {
  loading: boolean = true;
  refreshing: boolean = false;
  dateRange: string = 'ytd';
  customStartDate: string = '';
  customEndDate: string = '';
  
  data: any[] = [];
  totals: any = { leads: 0, won: 0, lost: 0, conversion: 0, loss: 0 };
  animatedTotals: any = { leads: 0, won: 0, lost: 0, conversion: 0 };

  // Common Colors for consistency
  colorMap: any = {
    whatsapp: '#25D366',
    instagram: '#E1306C',
    facebook: '#1877F2',
    messenger: '#0084FF',
    linkedin: '#0A66C2',
    website: '#0DCAF0',
    rcs: '#198754',
    sms: '#6F42C1',
    referral: '#FFC107',
    other: '#6C757D'
  };

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800, easing: 'easeOutQuart' } as any,
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.03)' } },
      x: { grid: { display: false } }
    },
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8 } },
      tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', padding: 12, cornerRadius: 8 }
    }
  };

  public pieChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { animateRotate: true, animateScale: true, duration: 1000, easing: 'easeInOutQuart' } as any,
    plugins: {
      legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8 } },
      tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', padding: 12, cornerRadius: 8 }
    },
    cutout: '65%'
  };

  public barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public pieChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  
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

  ngAfterViewInit() {
    // any post-init if needed
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

  getEmployeeColor(employee: string): string {
    const c = (employee || '').toLowerCase();
    // Provide some default colors based on a hash of the name or just cycle through a palette
    const colors = ['#25D366', '#E1306C', '#1877F2', '#0084FF', '#0A66C2', '#0DCAF0', '#198754', '#6F42C1', '#FFC107'];
    let hash = 0;
    for (let i = 0; i < c.length; i++) hash = c.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
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
          this.data = res.data;
          this.calculateTotals();
          this.updateCharts();
          if (this.isBrowser) {
            this.animateCountUp();
          } else {
            this.animatedTotals = { ...this.totals };
          }
        }
        setTimeout(() => {
          this.loading = false;
          this.refreshing = false;
          this.cdr.detectChanges();
        }, 150); // slight delay for smooth transition
      },
      error: (err: any) => {
        console.error('Failed to load channel conversion report', err);
        this.loading = false;
        this.refreshing = false;
      }
    });
  }

  animateCountUp() {
    const duration = 800; // ms
    const steps = 30;
    const interval = duration / steps;
    let currentStep = 0;

    const targets = { ...this.totals };
    this.animatedTotals = { leads: 0, won: 0, lost: 0, conversion: 0 };

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      this.animatedTotals.leads = Math.floor(targets.leads * ease);
      this.animatedTotals.won = Math.floor(targets.won * ease);
      this.animatedTotals.lost = Math.floor(targets.lost * ease);
      this.animatedTotals.conversion = (targets.conversion * ease).toFixed(1);

      this.cdr.detectChanges();

      if (currentStep >= steps) {
        clearInterval(timer);
        this.animatedTotals = { ...targets };
        this.cdr.detectChanges();
      }
    }, interval);
  }

  updateCharts() {
    // BAR CHART
    this.barChartData = {
      labels: this.data.map(d => (d.employee || 'Unassigned').toUpperCase()),
      datasets: [
        { data: this.data.map(d => d.sale_won), label: 'Sale Won', backgroundColor: '#10b981', borderRadius: 4, barPercentage: 0.7 },
        { data: this.data.map(d => d.sale_lost), label: 'Sale Lost', backgroundColor: '#ef4444', borderRadius: 4, barPercentage: 0.7 }
      ]
    };

    // PIE CHART
    let pieLabels: string[] = [];
    let pieData: number[] = [];
    let pieColors: string[] = [];

    const totalLeads = this.totals.leads;
    let otherLeads = 0;

    this.data.forEach(d => {
      if (d.total_leads === 0) return;
      const share = (d.total_leads / totalLeads) * 100;
      if (share < 2) {
        otherLeads += d.total_leads;
      } else {
        pieLabels.push((d.employee || 'Unassigned').toUpperCase());
        pieData.push(d.total_leads);
        pieColors.push(this.getEmployeeColor(d.employee));
      }
    });

    if (otherLeads > 0) {
      pieLabels.push('OTHER');
      pieData.push(otherLeads);
      pieColors.push(this.colorMap['other']);
    }

    this.pieChartData = {
      labels: pieLabels,
      datasets: [{
        data: pieData,
        backgroundColor: pieColors,
        borderWidth: 0,
        hoverOffset: 4
      }]
    };
  }

  calculateTotals() {
    this.totals = { leads: 0, won: 0, lost: 0, conversion: 0, loss: 0 };
    for (let row of this.data) {
      this.totals.leads += row.total_leads;
      this.totals.won += row.sale_won;
      this.totals.lost += row.sale_lost;
    }
    if (this.totals.leads > 0) {
      this.totals.conversion = ((this.totals.won / this.totals.leads) * 100).toFixed(1);
      this.totals.loss = ((this.totals.lost / this.totals.leads) * 100).toFixed(1);
    }
  }

  getEmployeeIcon(employee: string): string {
    return 'bi-person-circle text-primary';
  }
}
