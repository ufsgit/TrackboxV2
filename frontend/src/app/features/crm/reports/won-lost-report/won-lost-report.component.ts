import { Component, OnInit, ChangeDetectorRef, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-won-lost-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './won-lost-report.component.html',
  styleUrl: './won-lost-report.component.css'
})
export class WonLostReportComponent implements OnInit {
  searchTerm: string = '';
  loading: boolean = false;
  dateRange: string = 'ytd';
  customStartDate: string = '';
  customEndDate: string = '';
  
  // Animated KPI values
  kpi_won      = 0;
  kpi_lost     = 0;
  kpi_winRate  = 0;

  deals: any[] = [];

  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1200,
      easing: 'easeOutQuint',
      delay: 100
    } as any,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 24, usePointStyle: true, pointStyleWidth: 12, font: { size: 14, weight: 'bold' as any } }
      },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.92)',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(99,102,241,0.3)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12
      }
    }
  };

  public chartLabels: string[] = ['Won', 'Lost'];
  public chartData: ChartData<'pie'> = {
    labels: this.chartLabels,
    datasets: [{
      data: [0, 0],
      backgroundColor: ['#22c55e', '#ef4444'],
      hoverBackgroundColor: ['#16a34a', '#dc2626'],
      borderWidth: 3,
      borderColor: '#ffffff',
      hoverOffset: 10
    }]
  };
  public chartType: ChartType = 'pie';

  constructor(
    private cdr: ChangeDetectorRef, 
    private ngZone: NgZone,
    private api: ApiService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.loading = true;
    let endpoint = `/reports/leads/won-lost?dateRange=${this.dateRange}`;
    if (this.dateRange === 'custom') {
      if (!this.customStartDate || !this.customEndDate) {
        this.loading = false;
        return;
      }
      endpoint += `&startDate=${this.customStartDate}&endDate=${this.customEndDate}`;
    }

    this.api.get(endpoint).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.deals = res.data;
          this.updateDashboard();
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to load won/lost report', err);
        this.loading = false;
      }
    });
  }

  updateDashboard() {
    const wonCount = this.deals.filter(d => d.status === 'Won').length;
    const lostCount = this.deals.filter(d => d.status === 'Lost').length;
    const total = wonCount + lostCount;
    const winRate = total > 0 ? (wonCount / total) * 100 : 0;

    if (isPlatformBrowser(this.platformId)) {
      this.ngZone.runOutsideAngular(() => {
        this.countUp(0, wonCount, 1200, 0, v => { this.kpi_won = v; this.cdr.detectChanges(); });
        this.countUp(0, lostCount, 1200, 0, v => { this.kpi_lost = v; this.cdr.detectChanges(); });
        this.countUp(0, winRate, 1200, 1, v => { this.kpi_winRate = v; this.cdr.detectChanges(); });
      });
    } else {
      this.kpi_won = wonCount;
      this.kpi_lost = lostCount;
      this.kpi_winRate = winRate;
    }

    this.chartData.datasets[0].data = [wonCount, lostCount];
    this.chartData = { ...this.chartData };
  }

  countUp(from: number, to: number, ms: number, decimals: number, cb: (v: number) => void) {
    if (!isPlatformBrowser(this.platformId)) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - startTime) / ms, 1);
      const eased = easeOutQuint(p);
      cb(+(from + (to - from) * eased).toFixed(decimals));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  get filteredDeals() {
    if (!this.searchTerm) return this.deals;
    return this.deals.filter(d =>
      d.client?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      d.reason?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      d.rep?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getStatusClass(status: string): string {
    return status === 'Won'
      ? 'badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-2'
      : 'badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle px-3 py-2';
  }
}

function easeOutQuint(t: number) { return 1 - Math.pow(1 - t, 5); }

