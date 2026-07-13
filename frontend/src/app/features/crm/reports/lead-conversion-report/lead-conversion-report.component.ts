import { Component } from '@angular/core';
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
export class LeadConversionReportComponent {
  searchTerm: string = '';
  
  sources = [
    { source: 'Organic Search', leads: 450, converted: 55, rate: '12.2%', costPerLead: '₹12', roi: '145%' },
    { source: 'Paid Ads (Google)', leads: 820, converted: 110, rate: '13.4%', costPerLead: '₹45', roi: '85%' },
    { source: 'LinkedIn Social', leads: 210, converted: 45, rate: '21.4%', costPerLead: '₹85', roi: '110%' },
    { source: 'Referral', leads: 85, converted: 38, rate: '44.7%', costPerLead: '₹0', roi: 'Infinite' },
    { source: 'Direct Traffic', leads: 320, converted: 25, rate: '7.8%', costPerLead: '₹0', roi: 'N/A' }
  ];

  // Chart configuration
  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' }
    }
  };
  
  public chartLabels: string[] = this.sources.map(s => s.source);
  public chartData: ChartData<'bar'> = {
    labels: this.chartLabels,
    datasets: [
      {
        data: this.sources.map(s => s.leads),
        label: 'Total Leads',
        backgroundColor: '#3b82f6',
        borderRadius: 4
      },
      {
        data: this.sources.map(s => s.converted),
        label: 'Converted',
        backgroundColor: '#22c55e',
        borderRadius: 4
      }
    ]
  };
  public chartType: ChartType = 'bar';

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
