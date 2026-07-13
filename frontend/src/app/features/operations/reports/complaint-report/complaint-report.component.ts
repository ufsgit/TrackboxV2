import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

interface ReportRow {
  category: string;
  total: number;
  open: number;
  resolved: number;
  escalated: number;
}

@Component({
  selector: 'app-complaint-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './complaint-report.component.html',
  styleUrl: './complaint-report.component.css'
})
export class ComplaintReportComponent implements OnInit {
  startDate: string = '2023-10-01';
  endDate: string = '2023-10-31';

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartConfiguration['data'] = {
    labels: ['Hardware', 'Software', 'Billing', 'Service'],
    datasets: [
      { data: [45, 25, 20, 10], label: 'Total Complaints', backgroundColor: '#3b82f6' },
      { data: [30, 20, 18, 8], label: 'Resolved', backgroundColor: '#22c55e' }
    ]
  };

  reportData: ReportRow[] = [
    { category: 'Hardware', total: 45, open: 10, resolved: 30, escalated: 5 },
    { category: 'Software', total: 25, open: 5, resolved: 20, escalated: 0 },
    { category: 'Billing', total: 20, open: 2, resolved: 18, escalated: 0 },
    { category: 'Service', total: 10, open: 1, resolved: 8, escalated: 1 },
  ];

  toastMessage: string | null = null;
  toastTimeout: any;

  ngOnInit() {}

  showToast(message: string) {
    this.toastMessage = message;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => { this.toastMessage = null; }, 3000);
  }

  generateReport() {
    this.showToast(`Generating report from ${this.startDate} to ${this.endDate}...`);
    
    // Randomize chart data
    const newData1 = [Math.floor(Math.random() * 40) + 20, Math.floor(Math.random() * 30) + 10, Math.floor(Math.random() * 20) + 10, Math.floor(Math.random() * 10) + 5];
    const newData2 = [Math.floor(Math.random() * 20) + 10, Math.floor(Math.random() * 15) + 5, Math.floor(Math.random() * 15) + 5, Math.floor(Math.random() * 5) + 1];
    
    this.barChartData = {
      ...this.barChartData,
      datasets: [
        { ...this.barChartData.datasets[0], data: newData1 },
        { ...this.barChartData.datasets[1], data: newData2 }
      ]
    };

    // Randomize table data
    this.reportData = this.reportData.map(row => {
      const total = Math.floor(Math.random() * 50) + 10;
      const resolved = Math.floor(total * 0.7);
      const open = total - resolved;
      return {
        ...row,
        total: total,
        resolved: resolved,
        open: open
      };
    });
  }

  exportReport(format: string) {
    this.showToast(`Exporting report as ${format}...`);
  }
}
