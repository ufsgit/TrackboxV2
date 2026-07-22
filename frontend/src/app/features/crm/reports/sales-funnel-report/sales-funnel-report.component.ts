import { Component, AfterViewInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-sales-funnel-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './sales-funnel-report.component.html',
  styleUrl: './sales-funnel-report.component.css'
})
export class SalesFunnelReportComponent implements AfterViewInit {
  searchTerm: string = '';

  kpi_convRate   = 0;
  kpi_salesCycle = 0;

  funnelStages = [
    { stage: 'Leads Generated', count: 1250, value: '₹1.5M',  conversionRate: '100%', avgTime: '0 days' },
    { stage: 'Qualified Leads', count: 850,  value: '₹1.1M',  conversionRate: '68%',  avgTime: '2 days' },
    { stage: 'Proposal Sent',   count: 420,  value: '₹550K',  conversionRate: '49%',  avgTime: '5 days' },
    { stage: 'Negotiation',     count: 210,  value: '₹280K',  conversionRate: '50%',  avgTime: '12 days' },
    { stage: 'Closed Won',      count: 85,   value: '₹110K',  conversionRate: '40%',  avgTime: '21 days' }
  ];

  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1200,
      easing: 'easeOutQuint',
      delay: (ctx: any) => ctx.dataIndex * 150
    } as any,
    plugins: {
      legend: {
        position: 'right',
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
    }
  };

  public chartLabels: string[] = this.funnelStages.map(s => s.stage);
  public chartData: ChartData<'doughnut'> = {
    labels: this.chartLabels,
    datasets: [{
      data: [],
      backgroundColor: ['#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981'],
      hoverBackgroundColor: ['#2563eb', '#7c3aed', '#d97706', '#db2777', '#059669'],
      borderWidth: 3,
      borderColor: '#ffffff',
      hoverOffset: 10
    }]
  };
  public chartType: ChartType = 'doughnut';

  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      this.countUp(0, 6.8, 1200, 1, v => { this.kpi_convRate   = v; this.cdr.detectChanges(); });
      this.countUp(0, 21,  1200, 0, v => { this.kpi_salesCycle = v; this.cdr.detectChanges(); });
    });

    setTimeout(() => {
      this.chartData.datasets[0].data = this.funnelStages.map(s => s.count);
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

  get filteredStages() {
    if (!this.searchTerm) return this.funnelStages;
    return this.funnelStages.filter(s =>
      s.stage.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getStageColor(index: number): string {
    const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981'];
    return colors[index % colors.length];
  }
}

function easeOutQuint(t: number) { return 1 - Math.pow(1 - t, 5); }
