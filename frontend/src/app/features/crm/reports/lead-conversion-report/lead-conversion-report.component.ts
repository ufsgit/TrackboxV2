import { Component, AfterViewInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-lead-conversion-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './lead-conversion-report.component.html',
  styleUrl: './lead-conversion-report.component.css'
})
export class LeadConversionReportComponent implements AfterViewInit {
  searchTerm: string = '';

  // Animated KPI values (count-up from 0)
  kpi_convRate = 0;
  kpi_costLead = 0;

  sources = [
    { source: 'Organic Search',   leads: 450, converted: 55,  rate: '12.2%', costPerLead: '₹12', roi: '145%' },
    { source: 'Paid Ads (Google)',leads: 820, converted: 110, rate: '13.4%', costPerLead: '₹45', roi: '85%'  },
    { source: 'LinkedIn Social',  leads: 210, converted: 45,  rate: '21.4%', costPerLead: '₹85', roi: '110%' },
    { source: 'Referral',         leads: 85,  converted: 38,  rate: '44.7%', costPerLead: '₹0',  roi: 'Infinite' },
    { source: 'Direct Traffic',   leads: 320, converted: 25,  rate: '7.8%',  costPerLead: '₹0',  roi: 'N/A'  }
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
      legend: {
        position: 'top',
        labels: { padding: 20, usePointStyle: true, font: { size: 13, weight: 'bold' } }
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
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 12, weight: 600 } }
      },
      y: {
        grid: { color: 'rgba(226,232,240,0.7)' },
        ticks: { color: '#94a3b8', font: { size: 11 } },
        beginAtZero: true
      }
    }
  };

  public chartLabels: string[] = this.sources.map(s => s.source);
  public chartData: ChartData<'bar'> = {
    labels: this.chartLabels,
    datasets: [
      {
        data: [],
        label: 'Total Leads',
        backgroundColor: 'rgba(59,130,246,0.82)',
        hoverBackgroundColor: '#2563eb',
        borderRadius: 8,
        borderSkipped: false
      },
      {
        data: [],
        label: 'Converted',
        backgroundColor: 'rgba(34,197,94,0.85)',
        hoverBackgroundColor: '#16a34a',
        borderRadius: 8,
        borderSkipped: false
      }
    ]
  };
  public chartType: ChartType = 'bar';

  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  ngAfterViewInit() {
    // Run numeric animations outside zone, explicitly trigger CD each frame
    this.ngZone.runOutsideAngular(() => {
      this.countUp(0, 44.7, 1200, 1, v => { this.kpi_convRate = v; this.cdr.detectChanges(); });
      this.countUp(0, 32,   1200, 0, v => { this.kpi_costLead = v; this.cdr.detectChanges(); });
    });

    // Populate chart data after CSS slide-up animation to force Chart.js growth animation
    setTimeout(() => {
      this.chartData.datasets[0].data = this.sources.map(s => s.leads);
      this.chartData.datasets[1].data = this.sources.map(s => s.converted);
      this.chartData = { ...this.chartData }; // Trigger ng2-charts update
      this.cdr.detectChanges();
    }, 850);
  }

  /** Animate a number from `from` to `to` over `ms` milliseconds. `decimals` = decimal places. */
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

  get filteredSources() {
    if (!this.searchTerm) return this.sources;
    return this.sources.filter(s =>
      s.source.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getRateClass(rateStr: string): string {
    const rate = parseFloat(rateStr);
    if (rate >= 20) return 'badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-2';
    if (rate >= 10) return 'badge rounded-pill bg-info-subtle text-info border border-info-subtle px-3 py-2';
    return 'badge rounded-pill bg-warning-subtle text-warning border border-warning-subtle px-3 py-2';
  }
}

function easeOutQuint(t: number) { return 1 - Math.pow(1 - t, 5); }
