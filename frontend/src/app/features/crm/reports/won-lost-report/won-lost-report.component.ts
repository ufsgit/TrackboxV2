import { Component } from '@angular/core';
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
export class WonLostReportComponent {
  searchTerm: string = '';
  
  deals = [
    { id: 'DL-001', client: 'Acme Corp', amount: '₹45,000', status: 'Won', reason: 'Best Price & Value', rep: 'Jane Doe', date: '2023-10-25' },
    { id: 'DL-002', client: 'TechFlow Inc', amount: '₹25,000', status: 'Lost', reason: 'Competitor Feature', rep: 'Robert Johnson', date: '2023-10-22' },
    { id: 'DL-003', client: 'Global Industries', amount: '₹12,500', status: 'Won', reason: 'Relationship', rep: 'Michael Wilson', date: '2023-10-20' },
    { id: 'DL-004', client: 'StartupHub', amount: '₹18,000', status: 'Lost', reason: 'Budget Constraints', rep: 'Jane Doe', date: '2023-10-18' },
    { id: 'DL-005', client: 'Alpha Innovations', amount: '₹35,000', status: 'Won', reason: 'Fast Implementation', rep: 'Sarah Jenkins', date: '2023-10-15' }
  ];

  // Chart configuration
  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  };
  
  public chartLabels: string[] = ['Won', 'Lost'];
  public chartData: ChartData<'pie'> = {
    labels: this.chartLabels,
    datasets: [
      {
        data: [
          this.deals.filter(d => d.status === 'Won').length,
          this.deals.filter(d => d.status === 'Lost').length
        ],
        backgroundColor: ['#22c55e', '#ef4444'],
        hoverBackgroundColor: ['#16a34a', '#dc2626'],
        borderWidth: 0
      }
    ]
  };
  public chartType: ChartType = 'pie';

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
