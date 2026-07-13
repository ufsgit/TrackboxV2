import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

interface ReportRow {
  month: string;
  totalReviews: number;
  averageRating: number;
  positive: number;
  negative: number;
}

@Component({
  selector: 'app-customer-feedback-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './customer-feedback-report.component.html',
  styleUrl: './customer-feedback-report.component.css'
})
export class CustomerFeedbackReportComponent implements OnInit {
  startDate: string = '2023-01-01';
  endDate: string = '2023-12-31';

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  };
  public lineChartType: ChartType = 'line';
  public lineChartData: ChartConfiguration['data'] = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      { data: [4.1, 4.3, 4.2, 4.5, 4.6, 4.4], label: 'Average Rating', borderColor: '#eab308', backgroundColor: 'rgba(234, 179, 8, 0.1)', fill: true, tension: 0.4 }
    ]
  };

  reportData: ReportRow[] = [
    { month: 'June 2023', totalReviews: 120, averageRating: 4.4, positive: 98, negative: 22 },
    { month: 'May 2023', totalReviews: 145, averageRating: 4.6, positive: 130, negative: 15 },
    { month: 'April 2023', totalReviews: 110, averageRating: 4.5, positive: 95, negative: 15 },
    { month: 'March 2023', totalReviews: 135, averageRating: 4.2, positive: 105, negative: 30 },
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
    const newData1 = [
      Number((Math.random() * 1 + 3.8).toFixed(1)),
      Number((Math.random() * 1 + 3.8).toFixed(1)),
      Number((Math.random() * 1 + 3.8).toFixed(1)),
      Number((Math.random() * 1 + 3.8).toFixed(1)),
      Number((Math.random() * 1 + 3.8).toFixed(1)),
      Number((Math.random() * 1 + 3.8).toFixed(1))
    ];
    
    this.lineChartData = {
      ...this.lineChartData,
      datasets: [
        { ...this.lineChartData.datasets[0], data: newData1 }
      ]
    };

    // Randomize table data
    this.reportData = this.reportData.map(row => {
      const total = Math.floor(Math.random() * 50) + 100;
      const positive = Math.floor(total * (Math.random() * 0.2 + 0.7)); // 70-90% positive
      return {
        ...row,
        totalReviews: total,
        positive: positive,
        negative: total - positive,
        averageRating: Number((Math.random() * 1 + 3.8).toFixed(1))
      };
    });
  }

  exportReport(format: string) {
    this.showToast(`Exporting report as ${format}...`);
  }
}
