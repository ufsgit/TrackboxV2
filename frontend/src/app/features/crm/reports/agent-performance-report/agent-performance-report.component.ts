import { Component, AfterViewInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

function easeOutQuint(t: number) { return 1 - Math.pow(1 - t, 5); }

@Component({
  selector: 'app-agent-performance-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './agent-performance-report.component.html',
  styleUrl: './agent-performance-report.component.css'
})
export class AgentPerformanceReportComponent implements AfterViewInit {
  searchTerm = '';

  kpi_convRate = 0;
  kpi_respTime = 0;
  kpi_lowestConvRate = 0;

  agents = [
    { agent: 'Alice S.',   leadsHandled: 150, converted: 15, rate: '10.0%', avgResponseTime: '12m', rating: '4.8' },
    { agent: 'Bob J.',     leadsHandled: 120, converted: 10, rate: '8.3%',  avgResponseTime: '25m', rating: '4.2' },
    { agent: 'Charlie T.', leadsHandled: 200, converted: 30, rate: '15.0%', avgResponseTime: '8m',  rating: '4.9' },
    { agent: 'David W.',   leadsHandled: 90,  converted: 5,  rate: '5.5%',  avgResponseTime: '45m', rating: '3.5' },
    { agent: 'Eva G.',     leadsHandled: 310, converted: 65, rate: '21.0%', avgResponseTime: '5m',  rating: '5.0' },
  ];

  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1200,
      easing: 'easeOutQuart'
    },
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
      x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 12, weight: 600 } } },
      y: { grid: { color: 'rgba(226,232,240,0.7)' }, ticks: { color: '#94a3b8', font: { size: 11 } }, beginAtZero: true }
    }
  };

  public chartLabels: string[] = this.agents.map(a => a.agent);
  public chartData: ChartData<'bar'> = {
    labels: this.chartLabels,
    datasets: [
      {
        data: [] as number[],
        label: 'Leads Handled',
        backgroundColor: 'rgba(59,130,246,0.85)',
        hoverBackgroundColor: '#2563eb',
        borderRadius: 8,
        borderSkipped: false
      },
      {
        data: [] as number[],
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
    this.ngZone.runOutsideAngular(() => {
      this.countUp(0, 21.0, 1200, 1, (v: number) => { this.kpi_convRate = v; this.cdr.detectChanges(); });
      this.countUp(0, 5,    1200, 0, (v: number) => { this.kpi_respTime = v; this.cdr.detectChanges(); });
      this.countUp(0, 5.5,  1200, 1, (v: number) => { this.kpi_lowestConvRate = v; this.cdr.detectChanges(); });
    });

    setTimeout(() => {
      this.chartData.datasets[0].data = this.agents.map(a => a.leadsHandled) as number[];
      this.chartData.datasets[1].data = this.agents.map(a => a.converted) as number[];
      this.chartData = { ...this.chartData };
      this.cdr.detectChanges();
    }, 600);
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

  get filteredAgents() {
    if (!this.searchTerm) return this.agents;
    return this.agents.filter(a =>
      a.agent.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getRatingClass(rating: string) {
    const num = parseFloat(rating);
    if (num >= 4.5) return 'badge rounded-pill bg-success-subtle text-success border border-success-subtle px-2 py-1';
    if (num >= 4.0) return 'badge rounded-pill bg-info-subtle text-info border border-info-subtle px-2 py-1';
    return 'badge rounded-pill bg-warning-subtle text-warning border border-warning-subtle px-2 py-1';
  }
}

