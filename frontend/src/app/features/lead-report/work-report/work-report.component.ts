import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-work-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './work-report.component.html',
  styleUrls: ['./work-report.component.css']
})
export class WorkReportComponent implements OnInit {
  dateRange: string = 'this_month';
  selectedAgent: string = 'all';

  // Dummy KPIs
  totalLeads = 1240;
  followUpsCompleted = 845;
  totalConversions = 120;
  conversionRate = 9.6;

  activityChart: any;
  funnelChart: any;
  agentChart: any;

  // Dummy Table Data
  recentActivities = [
    { agent: 'Alice Smith', lead: 'John Doe', action: 'Follow-up Call', time: new Date(Date.now() - 3600000 * 2), status: 'Completed' },
    { agent: 'Bob Johnson', lead: 'TechCorp Ltd', action: 'Quotation Sent', time: new Date(Date.now() - 3600000 * 5), status: 'Completed' },
    { agent: 'Charlie Brown', lead: 'Sarah Jenkins', action: 'Status Changed to Interested', time: new Date(Date.now() - 3600000 * 24), status: 'Completed' },
    { agent: 'Alice Smith', lead: 'Acme Corp', action: 'Meeting Scheduled', time: new Date(Date.now() - 3600000 * 26), status: 'Pending' },
    { agent: 'Eva Green', lead: 'Michael Chang', action: 'Lead Converted', time: new Date(Date.now() - 3600000 * 48), status: 'Completed' }
  ];

  ngOnInit() {
    setTimeout(() => {
      this.initActivityChart();
      this.initFunnelChart();
      this.initAgentChart();
    }, 100);
  }

  onFilterChange() {
    // In a real app, you would fetch new data here.
    // For now, we'll just re-render charts to show reactivity.
    this.totalLeads = Math.floor(Math.random() * 2000) + 500;
    this.followUpsCompleted = Math.floor(this.totalLeads * 0.7);
    this.totalConversions = Math.floor(this.totalLeads * 0.1);
    this.conversionRate = parseFloat(((this.totalConversions / this.totalLeads) * 100).toFixed(1));

    if (this.activityChart) this.activityChart.destroy();
    if (this.funnelChart) this.funnelChart.destroy();
    if (this.agentChart) this.agentChart.destroy();
    
    this.initActivityChart();
    this.initFunnelChart();
    this.initAgentChart();
  }

  initActivityChart() {
    const ctx = document.getElementById('activityChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    const randomData = () => Array.from({length: 7}, () => Math.floor(Math.random() * 50) + 10);
    
    this.activityChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Calls Made',
            data: randomData(),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Emails Sent',
            data: randomData(),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  initFunnelChart() {
    const ctx = document.getElementById('funnelChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Using a horizontal bar chart to simulate a funnel
    this.funnelChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['New Leads', 'Contacted', 'Interested', 'Converted'],
        datasets: [{
          label: 'Count',
          data: [this.totalLeads, Math.floor(this.totalLeads * 0.75), Math.floor(this.totalLeads * 0.4), this.totalConversions],
          backgroundColor: [
            '#94a3b8',
            '#60a5fa',
            '#f59e0b',
            '#10b981'
          ],
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y', // horizontal bar
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Lead Conversion Funnel' }
        },
        scales: {
          x: { beginAtZero: true }
        }
      }
    });
  }

  initAgentChart() {
    const ctx = document.getElementById('agentChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.agentChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Alice S.', 'Bob J.', 'Charlie B.', 'David L.', 'Eva G.'],
        datasets: [
          {
            label: 'Leads Handled',
            data: [150, 120, 180, 90, 210],
            backgroundColor: '#818cf8',
            borderRadius: 4
          },
          {
            label: 'Conversions',
            data: [15, 10, 22, 5, 30],
            backgroundColor: '#10b981',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
}
