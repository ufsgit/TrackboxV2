import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

interface ReportRow {
  product: string;
  totalClaims: number;
  approved: number;
  rejected: number;
  cost: number;
}

@Component({
  selector: 'app-warranty-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './warranty-report.component.html',
  styleUrl: './warranty-report.component.css'
})
export class WarrantyReportComponent implements OnInit {
  startDate: string = '2023-10-01';
  endDate: string = '2023-10-31';

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  };
  public lineChartType: ChartType = 'line';
  public lineChartData: ChartConfiguration['data'] = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      { data: [12, 18, 14, 25], label: 'Claims Filed', borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', fill: true, tension: 0.4 },
      { data: [8, 15, 10, 20], label: 'Claims Approved', borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)', fill: true, tension: 0.4 }
    ]
  };

  reportData: ReportRow[] = [
    { product: 'Router AC1200', totalClaims: 145, approved: 120, rejected: 25, cost: 4500 },
    { product: 'Mesh WiFi Node', totalClaims: 130, approved: 110, rejected: 20, cost: 6200 },
    { product: 'Enterprise Switch', totalClaims: 55, approved: 40, rejected: 15, cost: 12500 },
    { product: 'Fiber Modem', totalClaims: 110, approved: 100, rejected: 10, cost: 3100 },
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
    const newData1 = [Math.floor(Math.random() * 20) + 10, Math.floor(Math.random() * 20) + 10, Math.floor(Math.random() * 20) + 10, Math.floor(Math.random() * 20) + 10];
    const newData2 = [Math.floor(Math.random() * 15) + 5, Math.floor(Math.random() * 15) + 5, Math.floor(Math.random() * 15) + 5, Math.floor(Math.random() * 15) + 5];
    
    this.lineChartData = {
      ...this.lineChartData,
      datasets: [
        { ...this.lineChartData.datasets[0], data: newData1 },
        { ...this.lineChartData.datasets[1], data: newData2 }
      ]
    };

    // Randomize table data
    this.reportData = this.reportData.map(row => {
      const claims = Math.floor(Math.random() * 100) + 50;
      const approved = Math.floor(claims * 0.8);
      const rejected = claims - approved;
      return {
        ...row,
        totalClaims: claims,
        approved: approved,
        rejected: rejected,
        cost: approved * (Math.floor(Math.random() * 50) + 20)
      };
    });
  }

  exportReport(format: string) {
    this.showToast(`Exporting report as ${format}...`);
  }
}
