import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

interface ReportRow {
  date: string;
  total: number;
  completed: number;
  pending: number;
  avgTime: string;
}

@Component({
  selector: 'app-installation-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './installation-report.component.html',
  styleUrl: './installation-report.component.css'
})
export class InstallationReportComponent implements OnInit {
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
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      { data: [65, 59, 80, 81], label: 'Completed', backgroundColor: '#22c55e' },
      { data: [28, 48, 40, 19], label: 'Pending', backgroundColor: '#f59e0b' }
    ]
  };

  reportData: ReportRow[] = [
    { date: '2023-10-21 to 2023-10-27', total: 145, completed: 120, pending: 25, avgTime: '2.5 hrs' },
    { date: '2023-10-14 to 2023-10-20', total: 130, completed: 110, pending: 20, avgTime: '2.4 hrs' },
    { date: '2023-10-07 to 2023-10-13', total: 155, completed: 140, pending: 15, avgTime: '2.1 hrs' },
    { date: '2023-10-01 to 2023-10-06', total: 110, completed: 100, pending: 10, avgTime: '2.3 hrs' },
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
    const newData1 = [Math.floor(Math.random() * 50) + 40, Math.floor(Math.random() * 50) + 40, Math.floor(Math.random() * 50) + 40, Math.floor(Math.random() * 50) + 40];
    const newData2 = [Math.floor(Math.random() * 30) + 10, Math.floor(Math.random() * 30) + 10, Math.floor(Math.random() * 30) + 10, Math.floor(Math.random() * 30) + 10];
    
    this.barChartData = {
      ...this.barChartData,
      datasets: [
        { ...this.barChartData.datasets[0], data: newData1 },
        { ...this.barChartData.datasets[1], data: newData2 }
      ]
    };

    // Randomize table data
    this.reportData = this.reportData.map(row => {
      const completed = Math.floor(Math.random() * 80) + 40;
      const pending = Math.floor(Math.random() * 20) + 5;
      return {
        ...row,
        total: completed + pending,
        completed: completed,
        pending: pending
      };
    });
  }

  exportReport(format: string) {
    this.showToast(`Exporting report as ${format}...`);
  }
}
