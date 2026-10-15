import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-employee-conversion-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './employee-conversion-report.component.html',
  styleUrl: './employee-conversion-report.component.css'
})
export class EmployeeConversionReportComponent implements OnInit, AfterViewInit, OnDestroy {
  loading: boolean = true;
  refreshing: boolean = false;
  dateRange: string = 'ytd';
  customStartDate: string = '';
  customEndDate: string = '';
  
  data: any[] = [];
  topEmployees4: any[] = [];
  topEmployees3: any[] = [];
  private colorCache: { [key: string]: string } = {};

  totals: any = { leads: 0, won: 0, lost: 0, conversion: 0, loss: 0 };
  animatedTotals: any = { leads: 0, won: 0, lost: 0, conversion: 0 };

  private countTimer: any = null;
  private apiSub: Subscription | null = null;

  // Common Colors for consistency
  colorPalette: string[] = [
    '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', 
    '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4', '#64748b'
  ];

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: 'easeOutQuart' } as any,
    scales: {
      y: { 
        beginAtZero: true, 
        suggestedMax: 5,
        grid: { color: 'rgba(0,0,0,0.03)' },
        ticks: { precision: 0, stepSize: 1, font: { size: 10 } }
      },
      x: { 
        grid: { display: false },
        ticks: { font: { size: 11, weight: 'bold' } }
      }
    },
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 7, font: { size: 11, weight: 'bold' } } },
      tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', padding: 10, cornerRadius: 8 }
    }
  };

  public pieChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { animateRotate: true, animateScale: true, duration: 600, easing: 'easeInOutQuart' } as any,
    plugins: {
      legend: { 
        display: false 
      },
      tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', padding: 10, cornerRadius: 8 }
    },
    cutout: '72%'
  };

  public barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public pieChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  
  isBrowser = false;

  // Custom Dropdown State & View Tab
  isDateDropdownOpen: boolean = false;
  activeViewTab: 'charts' | 'table' | 'split' = 'charts';

  constructor(
    private cdr: ChangeDetectorRef, 
    private ngZone: NgZone,
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

  ngOnDestroy() {
    if (this.countTimer) {
      clearInterval(this.countTimer);
      this.countTimer = null;
    }
    if (this.apiSub) {
      this.apiSub.unsubscribe();
      this.apiSub = null;
    }
  }

  onDocumentClick() {
    this.isDateDropdownOpen = false;
  }

  setActiveTab(tab: 'charts' | 'table' | 'split') {
    this.activeViewTab = tab;
    this.cdr.detectChanges();
  }

  toggleDateDropdown(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
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
    if (this.colorCache[c]) return this.colorCache[c];
    let hash = 0;
    for (let i = 0; i < c.length; i++) hash = c.charCodeAt(i) + ((hash << 5) - hash);
    const color = this.colorPalette[Math.abs(hash) % this.colorPalette.length];
    this.colorCache[c] = color;
    return color;
  }

  fetchData(isRefresh = false) {
    if (this.countTimer) {
      clearInterval(this.countTimer);
      this.countTimer = null;
    }

    if (this.apiSub) {
      this.apiSub.unsubscribe();
      this.apiSub = null;
    }

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

    this.apiSub = this.api.get(endpoint).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          const rawData: any[] = Array.isArray(res.data) ? res.data : [];
          this.data = rawData.map((row: any) => ({
            ...row,
            color: this.getEmployeeColor(row.employee)
          }));
          this.calculateTotals();
          this.prepareTopEmployees();
          this.updateCharts();
          if (this.isBrowser) {
            this.animateCountUp();
          } else {
            this.animatedTotals = { ...this.totals };
          }
        } else {
          this.data = [];
          this.calculateTotals();
          this.prepareTopEmployees();
          this.updateCharts();
          this.animatedTotals = { ...this.totals };
        }
        this.loading = false;
        this.refreshing = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to load employee conversion report', err);
        this.data = [];
        this.calculateTotals();
        this.prepareTopEmployees();
        this.updateCharts();
        this.animatedTotals = { ...this.totals };
        this.loading = false;
        this.refreshing = false;
        this.cdr.detectChanges();
      }
    });
  }

  private prepareTopEmployees() {
    if (!this.data || this.data.length === 0) {
      this.topEmployees4 = [];
      this.topEmployees3 = [];
      return;
    }
    const sorted = [...this.data]
      .sort((a, b) => (Number(b.total_leads) || 0) - (Number(a.total_leads) || 0))
      .map(emp => ({
        ...emp,
        share_percentage: this.totals.leads > 0 ? (((Number(emp.total_leads) || 0) / this.totals.leads) * 100).toFixed(1) : '0'
      }));

    this.topEmployees4 = sorted.slice(0, 4);
    this.topEmployees3 = sorted.slice(0, 3);
  }

  animateCountUp() {
    if (this.countTimer) {
      clearInterval(this.countTimer);
      this.countTimer = null;
    }

    const duration = 600; // ms
    const steps = 20;
    const interval = duration / steps;
    let currentStep = 0;

    const targets = { ...this.totals };
    this.animatedTotals = { leads: 0, won: 0, lost: 0, conversion: 0 };

    this.ngZone.runOutsideAngular(() => {
      this.countTimer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

        const currentLeads = Math.floor(targets.leads * ease);
        const currentWon = Math.floor(targets.won * ease);
        const currentLost = Math.floor(targets.lost * ease);
        const currentConversion = (targets.conversion * ease).toFixed(1);

        this.ngZone.run(() => {
          this.animatedTotals.leads = currentLeads;
          this.animatedTotals.won = currentWon;
          this.animatedTotals.lost = currentLost;
          this.animatedTotals.conversion = currentConversion;
          this.cdr.detectChanges();
        });

        if (currentStep >= steps) {
          clearInterval(this.countTimer);
          this.countTimer = null;
          this.ngZone.run(() => {
            this.animatedTotals = { ...targets };
            this.cdr.detectChanges();
          });
        }
      }, interval);
    });
  }

  updateCharts() {
    // BAR CHART
    this.barChartData = {
      labels: this.data.map(d => (d.employee || 'Unassigned').toUpperCase()),
      datasets: [
        { 
          data: this.data.map(d => d.sale_won), 
          label: 'Sale Won', 
          backgroundColor: '#10b981', 
          borderRadius: 6, 
          barPercentage: 0.4,
          categoryPercentage: 0.4,
          maxBarThickness: 28
        },
        { 
          data: this.data.map(d => d.sale_lost), 
          label: 'Sale Lost', 
          backgroundColor: '#ef4444', 
          borderRadius: 6, 
          barPercentage: 0.4,
          categoryPercentage: 0.4,
          maxBarThickness: 28
        }
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
      const share = totalLeads > 0 ? (d.total_leads / totalLeads) * 100 : 0;
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
      pieColors.push('#64748b');
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
    return 'bi-person-badge';
  }

  getTopEmployees(limit: number = 4): any[] {
    return limit === 3 ? this.topEmployees3 : this.topEmployees4;
  }
}
