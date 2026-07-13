import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-agent-performance-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './agent-performance-report.component.html',
  styleUrl: './agent-performance-report.component.css'
})
export class AgentPerformanceReportComponent {
  searchTerm: string = '';
  
  agents = [
    { agent: 'Alice S.', leadsHandled: 150, converted: 15, rate: '10.0%', avgResponseTime: '12m', rating: '4.8' },
    { agent: 'Bob J.', leadsHandled: 120, converted: 10, rate: '8.3%', avgResponseTime: '25m', rating: '4.2' },
    { agent: 'Charlie B.', leadsHandled: 180, converted: 22, rate: '12.2%', avgResponseTime: '8m', rating: '4.9' },
    { agent: 'David L.', leadsHandled: 90, converted: 5, rate: '5.5%', avgResponseTime: '45m', rating: '3.9' },
    { agent: 'Eva G.', leadsHandled: 210, converted: 30, rate: '14.2%', avgResponseTime: '5m', rating: '5.0' }
  ];

  // Chart configuration
  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  };
  
  public chartLabels: string[] = this.agents.map(a => a.agent);
  public chartData: ChartData<'bar'> = {
    labels: this.chartLabels,
    datasets: [
      {
        data: this.agents.map(a => a.leadsHandled),
        label: 'Leads Handled',
        backgroundColor: '#818cf8',
        borderRadius: 4
      },
      {
        data: this.agents.map(a => a.converted),
        label: 'Conversions',
        backgroundColor: '#10b981',
        borderRadius: 4
      }
    ]
  };
  public chartType: ChartType = 'bar';

  get filteredAgents() {
    if (!this.searchTerm) return this.agents;
    return this.agents.filter(a => 
      a.agent.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getRateClass(rateStr: string): string {
    const rate = parseFloat(rateStr);
    if (rate >= 12) return 'badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-2';
    if (rate >= 8) return 'badge rounded-pill bg-info-subtle text-info border border-info-subtle px-3 py-2';
    return 'badge rounded-pill bg-warning-subtle text-warning border border-warning-subtle px-3 py-2';
  }
}
