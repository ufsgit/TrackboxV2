import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-enquiry-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="report-container flex flex-col gap-20">
      <div class="flex justify-between items-center" style="flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 class="fw-bold mb-1">Enquiry Report</h2>
          <p class="text-muted mb-0">Discover where leads originate and what they want</p>
        </div>
        
        <div class="flex items-center gap-16" style="flex-wrap: wrap;">
          <select class="form-select premium-select shadow-sm" [(ngModel)]="dateRange" (change)="onFilterChange()">
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
          </select>
          <button class="btn btn-primary shadow-sm" (click)="onFilterChange()">
            <i class="bi bi-arrow-clockwise me-2"></i> Refresh
          </button>
        </div>
      </div>

      <div class="grid grid-4">
        <div class="kpi-card" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-primary-soft text-primary"><i class="bi bi-box-arrow-in-right"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Total Enquiries</h6>
            <h3 class="kpi-value">{{ totalEnquiries | number }}</h3>
          </div>
        </div>
        <div class="kpi-card" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-warning-soft text-warning"><i class="bi bi-currency-dollar"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">High-Value Enquiries</h6>
            <h3 class="kpi-value">{{ highValue }}</h3>
          </div>
        </div>
        <div class="kpi-card" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-success-soft text-success"><i class="bi bi-facebook"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Top Source</h6>
            <h3 class="kpi-value" style="font-size: 1.25rem;">{{ topSource }}</h3>
          </div>
        </div>
        <div class="kpi-card" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-info-soft text-info"><i class="bi bi-lightning-fill"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Avg Lead Score</h6>
            <h3 class="kpi-value">{{ avgLeadScore }}/100</h3>
          </div>
        </div>
      </div>

      <div class="grid" style="grid-template-columns: 1fr 2fr;">
        <div class="chart-card h-100">
          <div class="chart-header">
            <h5>Enquiries by Source</h5>
          </div>
          <div class="chart-body" style="position: relative; height: 300px; width: 100%;">
            <canvas id="sourceChart"></canvas>
          </div>
        </div>
        <div class="chart-card h-100">
          <div class="chart-header">
            <h5>Product/Service Categories</h5>
          </div>
          <div class="chart-body" style="position: relative; height: 300px; width: 100%;">
            <canvas id="categoryChart"></canvas>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-header border-bottom pb-3 mb-3">
          <h5>Recent High-Value Enquiries</h5>
        </div>
        <div style="overflow: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Lead Name</th>
                <th>Source</th>
                <th>Product/Service</th>
                <th>Score</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let eq of recentEnquiries">
                <td class="fw-semibold">{{ eq.name }}</td>
                <td><span class="badge badge-info">{{ eq.source }}</span></td>
                <td>{{ eq.product }}</td>
                <td>
                  <div style="width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin-top: 4px;">
                    <div [style.width.%]="eq.score" [ngStyle]="{'background-color': eq.score > 80 ? '#10B981' : '#F59E0B'}" style="height: 100%;"></div>
                  </div>
                  <span class="small text-muted">{{ eq.score }}</span>
                </td>
                <td class="text-muted small">{{ eq.date | date:'mediumDate' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class EnquiryReportComponent implements OnInit {
  dateRange: string = 'this_month';

  totalEnquiries = 3240;
  highValue = 485;
  topSource = 'Facebook Ads';
  avgLeadScore = 72;

  sourceChart: any;
  categoryChart: any;

  recentEnquiries = [
    { name: 'Global Tech Corp', source: 'Website', product: 'Enterprise CRM Package', score: 95, date: new Date() },
    { name: 'Alpha Solutions', source: 'Referral', product: 'Marketing Automation', score: 88, date: new Date(Date.now() - 86400000) },
    { name: 'Omega Retail', source: 'Facebook Ads', product: 'Basic CRM', score: 82, date: new Date(Date.now() - 172800000) },
    { name: 'Nexus Logistics', source: 'LinkedIn', product: 'Custom Development', score: 91, date: new Date(Date.now() - 259200000) }
  ];

  ngOnInit() {
    setTimeout(() => {
      this.initSourceChart();
      this.initCategoryChart();
    }, 100);
  }

  onFilterChange() {
    this.totalEnquiries = Math.floor(Math.random() * 5000) + 1000;
    if (this.sourceChart) this.sourceChart.destroy();
    if (this.categoryChart) this.categoryChart.destroy();
    this.initSourceChart();
    this.initCategoryChart();
  }

  initSourceChart() {
    const ctx = document.getElementById('sourceChart') as HTMLCanvasElement;
    if (!ctx) return;
    this.sourceChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Facebook Ads', 'Website', 'Google Ads', 'Referral'],
        datasets: [{
          data: [45, 25, 20, 10],
          backgroundColor: ['#1877F2', '#10B981', '#EA4335', '#F59E0B']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  initCategoryChart() {
    const ctx = document.getElementById('categoryChart') as HTMLCanvasElement;
    if (!ctx) return;
    this.categoryChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['CRM Package', 'Marketing Automation', 'Custom Dev', 'Consulting', 'Other'],
        datasets: [{
          label: 'Enquiries',
          data: [850, 620, 410, 200, 150],
          backgroundColor: '#4F46E5',
          borderRadius: 4
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  }
}
