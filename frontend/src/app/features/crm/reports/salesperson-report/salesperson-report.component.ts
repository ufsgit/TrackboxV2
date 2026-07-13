import { Component } from '@angular/core';
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
export class SalespersonReportComponent {
  searchTerm: string = '';
  
  salespeople = [
    { name: 'Jane Doe', leads: 145, won: 42, lost: 18, revenue: 250000, revenueStr: '₹250,000', winRate: '70%', status: 'Excellent' },
    { name: 'Robert Johnson', leads: 120, won: 28, lost: 35, revenue: 180000, revenueStr: '₹180,000', winRate: '44%', status: 'Average' },
    { name: 'Michael Wilson', leads: 180, won: 35, lost: 45, revenue: 210000, revenueStr: '₹210,000', winRate: '43%', status: 'Average' },
    { name: 'Sarah Jenkins', leads: 95, won: 38, lost: 12, revenue: 285000, revenueStr: '₹285,000', winRate: '76%', status: 'Excellent' },
    { name: 'Emily Clark', leads: 80, won: 15, lost: 40, revenue: 85000, revenueStr: '₹85,000', winRate: '27%', status: 'Needs Improvement' }
  ];

  // Chart configuration
  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' }
    }
  };
  
  public chartLabels: string[] = this.salespeople.map(s => s.name);
  public chartData: ChartData<'bar'> = {
    labels: this.chartLabels,
    datasets: [
      {
        data: this.salespeople.map(s => s.revenue),
        label: 'Revenue Generated (₹)',
        backgroundColor: '#a855f7',
        borderRadius: 4
      }
    ]
  };
  public chartType: ChartType = 'bar';

  get filteredSalespeople() {
    if (!this.searchTerm) return this.salespeople;
    return this.salespeople.filter(s => 
      s.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'Excellent': return 'badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-2';
      case 'Average': return 'badge rounded-pill bg-warning-subtle text-warning border border-warning-subtle px-3 py-2';
      case 'Needs Improvement': return 'badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle px-3 py-2';
      default: return 'badge rounded-pill bg-light text-dark px-3 py-2';
    }
  }
}
