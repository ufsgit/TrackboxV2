import { Component, AfterViewInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-won-lost-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './won-lost-report.component.html',
  styleUrl: './won-lost-report.component.css'
})
export class WonLostReportComponent implements AfterViewInit {
  searchTerm: string = '';

  // Animated KPI values
  kpi_won      = 0;
  kpi_lost     = 0;
  kpi_winRate  = 0;

  deals = [
    { id: 'DL-001', client: 'Acme Corp',         amount: '₹45,000', status: 'Won',  reason: 'Best Price & Value',    rep: 'Jane Doe',        date: '2023-10-25' },
    { id: 'DL-002', client: 'TechFlow Inc',       amount: '₹25,000', status: 'Lost', reason: 'Competitor Feature',    rep: 'Robert Johnson',  date: '2023-10-22' },
    { id: 'DL-003', client: 'Global Industries',  amount: '₹12,500', status: 'Won',  reason: 'Relationship',          rep: 'Michael Wilson',  date: '2023-10-20' },
    { id: 'DL-004', client: 'StartupHub',         amount: '₹18,000', status: 'Lost', reason: 'Budget Constraints',    rep: 'Jane Doe',        date: '2023-10-18' },
    { id: 'DL-005', client: 'Alpha Innovations',  amount: '₹35,000', status: 'Won',  reason: 'Fast Implementation',   rep: 'Sarah Jenkins',   date: '2023-10-15' }
  ];

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
        labels: { padding: 24, usePointStyle: true, pointStyleWidth: 12, font: { size: 14, weight: 'bold' } }
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
      data: [],
      backgroundColor: ['#22c55e', '#ef4444'],
      hoverBackgroundColor: ['#16a34a', '#dc2626'],
      borderWidth: 3,
      borderColor: '#ffffff',
      hoverOffset: 10
    }]
  };
  public chartType: ChartType = 'pie';

  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      this.countUp(0, 24, 1200, 0, v => { this.kpi_won     = v; this.cdr.detectChanges(); });
      this.countUp(0, 16, 1200, 0, v => { this.kpi_lost    = v; this.cdr.detectChanges(); });
      this.countUp(0, 60, 1200, 0, v => { this.kpi_winRate = v; this.cdr.detectChanges(); });
    });

    setTimeout(() => {
      this.chartData.datasets[0].data = [
        this.deals.filter(d => d.status === 'Won').length,
        this.deals.filter(d => d.status === 'Lost').length
      ];
      this.chartData = { ...this.chartData };
      this.cdr.detectChanges();
    }, 850);
  }

  countUp(from: number, to: number, ms: number, decimals: number, cb: (v: number) => void) {
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
      d.client.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      d.reason.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      d.rep.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getStatusClass(status: string): string {
    return status === 'Won'
      ? 'badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-2'
      : 'badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle px-3 py-2';
  }
}

function easeOutQuint(t: number) { return 1 - Math.pow(1 - t, 5); }
