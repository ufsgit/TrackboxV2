import { Component, AfterViewInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-salesperson-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './salesperson-report.component.html',
  styleUrl: './salesperson-report.component.css'
})
export class SalespersonReportComponent implements AfterViewInit {
  searchTerm: string = '';

  kpi_winRate = 0;

  salespeople = [
    { name: 'Sarah Jenkins',  leads: 120, won: 45, lost: 15, winRate: '37.5%', revenue: 350000, revenueStr: '₹350K', status: 'Top Performer' },
    { name: 'Michael Wilson', leads: 105, won: 38, lost: 20, winRate: '36.1%', revenue: 280000, revenueStr: '₹280K', status: 'On Track' },
    { name: 'Jane Doe',       leads: 95,  won: 25, lost: 30, winRate: '26.3%', revenue: 195000, revenueStr: '₹195K', status: 'Needs Improvement' },
    { name: 'Robert Johnson', leads: 85,  won: 30, lost: 15, winRate: '35.2%', revenue: 185000, revenueStr: '₹185K', status: 'On Track' }
  ];

  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1200,
      easing: 'easeOutQuint',
      delay: (ctx: any) => ctx.dataIndex * 100
    } as any,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.92)',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(99,102,241,0.3)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 12, weight: 600 } }
      },
      y: {
        grid: { color: 'rgba(226,232,240,0.7)' },
        ticks: { color: '#94a3b8', font: { size: 11 }, callback: (val) => '₹' + (+val / 1000) + 'K' },
        beginAtZero: true
      }
    }
  };

  public chartLabels: string[] = this.salespeople.map(s => s.name);
  public chartData: ChartData<'bar'> = {
    labels: this.chartLabels,
    datasets: [{
      data: [],
      label: 'Revenue Gen.',
      backgroundColor: ['rgba(99,102,241,0.85)', 'rgba(34,197,94,0.85)', 'rgba(245,158,11,0.85)', 'rgba(236,72,153,0.85)'],
      hoverBackgroundColor: ['#4f46e5', '#16a34a', '#d97706', '#db2777'],
      borderRadius: 8,
      borderSkipped: false
    }]
  };
  public chartType: ChartType = 'bar';

  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      this.countUp(0, 33.7, 1200, 1, v => { this.kpi_winRate = v; this.cdr.detectChanges(); });
    });

    setTimeout(() => {
      this.chartData.datasets[0].data = this.salespeople.map(s => s.revenue);
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

  get filteredSalespeople() {
    if (!this.searchTerm) return this.salespeople;
    return this.salespeople.filter(s =>
      s.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      s.status.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getStatusClass(status: string): string {
    if (status === 'Top Performer') return 'badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-2';
    if (status === 'On Track') return 'badge rounded-pill bg-info-subtle text-info border border-info-subtle px-3 py-2';
    return 'badge rounded-pill bg-warning-subtle text-warning border border-warning-subtle px-3 py-2';
  }
}

function easeOutQuint(t: number) { return 1 - Math.pow(1 - t, 5); }

