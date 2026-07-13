import { Component } from '@angular/core';
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
export class SalesFunnelReportComponent {
  searchTerm: string = '';
  
  funnelStages = [
    { stage: 'Leads Generated', count: 1250, value: '₹1.5M', conversionRate: '100%', avgTime: '0 days' },
    { stage: 'Qualified Leads', count: 850, value: '₹1.1M', conversionRate: '68%', avgTime: '2 days' },
    { stage: 'Proposal Sent', count: 420, value: '₹550K', conversionRate: '49%', avgTime: '5 days' },
    { stage: 'Negotiation', count: 210, value: '₹280K', conversionRate: '50%', avgTime: '12 days' },
    { stage: 'Closed Won', count: 85, value: '₹110K', conversionRate: '40%', avgTime: '21 days' }
  ];

  // Chart configuration
  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' }
    }
  };
  
  public chartLabels: string[] = this.funnelStages.map(s => s.stage);
  public chartData: ChartData<'doughnut'> = {
    labels: this.chartLabels,
    datasets: [
      {
        data: this.funnelStages.map(s => s.count),
        backgroundColor: ['#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981'],
        hoverBackgroundColor: ['#2563eb', '#7c3aed', '#d97706', '#db2777', '#059669'],
        borderWidth: 0
      }
    ]
  };
  public chartType: ChartType = 'doughnut';

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

