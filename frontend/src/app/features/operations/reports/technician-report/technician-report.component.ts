import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

interface ReportRow {
  technician: string;
  installations: number;
  complaintsResolved: number;
  avgRating: number;
  status: 'Active' | 'On Leave';
}

@Component({
  selector: 'app-technician-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './technician-report.component.html',
  styleUrl: './technician-report.component.css'
})
export class TechnicianReportComponent implements OnInit {
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
    labels: ['Tech A', 'Tech B', 'Tech C', 'Tech D'],
    datasets: [
      { data: [45, 38, 42, 30], label: 'Installations', backgroundColor: '#3b82f6' },
      { data: [15, 10, 12, 8], label: 'Complaints Resolved', backgroundColor: '#8b5cf6' }
    ]
  };

  reportData: ReportRow[] = [
    { technician: 'Tech A', installations: 45, complaintsResolved: 15, avgRating: 4.8, status: 'Active' },
    { technician: 'Tech B', installations: 38, complaintsResolved: 10, avgRating: 4.5, status: 'On Leave' },
    { technician: 'Tech C', installations: 42, complaintsResolved: 12, avgRating: 4.6, status: 'Active' },
    { technician: 'Tech D', installations: 30, complaintsResolved: 8, avgRating: 4.2, status: 'Active' },
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
    const newData1 = [Math.floor(Math.random() * 30) + 20, Math.floor(Math.random() * 30) + 20, Math.floor(Math.random() * 30) + 20, Math.floor(Math.random() * 30) + 20];
    const newData2 = [Math.floor(Math.random() * 15) + 5, Math.floor(Math.random() * 15) + 5, Math.floor(Math.random() * 15) + 5, Math.floor(Math.random() * 15) + 5];
    
    this.barChartData = {
      ...this.barChartData,
      datasets: [
        { ...this.barChartData.datasets[0], data: newData1 },
        { ...this.barChartData.datasets[1], data: newData2 }
      ]
    };

    // Randomize table data
    this.reportData = this.reportData.map(row => {
      return {
        ...row,
        installations: Math.floor(Math.random() * 30) + 20,
        complaintsResolved: Math.floor(Math.random() * 15) + 5,
        avgRating: Number((Math.random() * 1 + 4).toFixed(1)) // 4.0 to 5.0
      };
    });
  }

  exportReport(format: string) {
    this.showToast(`Exporting report as ${format}...`);
  }
}
