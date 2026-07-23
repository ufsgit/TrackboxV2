import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { ApiService } from '../../../core/services/api.service';

Chart.register(...registerables);

@Component({
  selector: 'app-source-conversion-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="report-container flex flex-col gap-20">
      <div class="flex justify-between items-center" style="flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 class="fw-bold mb-1">Source Category Conversion Report</h2>
          <p class="text-muted mb-0">Track conversion rates based on source categories</p>
        </div>
        
        <div class="flex items-center gap-16" style="flex-wrap: wrap;">
          <input type="date" class="form-control premium-input shadow-sm" [(ngModel)]="startDate" (change)="onFilterChange()" title="Start Date">
          <span class="text-muted">to</span>
          <input type="date" class="form-control premium-input shadow-sm" [(ngModel)]="endDate" (change)="onFilterChange()" title="End Date">
          <button class="btn btn-primary shadow-sm" (click)="onFilterChange()">
            <i class="bi bi-arrow-clockwise me-2"></i> Refresh
          </button>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="chart-card h-100">
          <div class="chart-header">
            <h5>Conversion Rate by Category (%)</h5>
          </div>
          <div class="chart-body" style="position: relative; height: 350px; width: 100%;">
            <canvas id="conversionChart"></canvas>
          </div>
        </div>
        
        <div class="chart-card h-100">
          <div class="chart-header border-bottom pb-3 mb-3">
            <h5>Data Breakdown</h5>
          </div>
          <div style="overflow: auto; max-height: 350px;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Total Leads</th>
                  <th>Converted</th>
                  <th>Conversion Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="loading">
                  <td colspan="4" class="text-center py-4">Loading data...</td>
                </tr>
                <tr *ngIf="!loading && reportData.length === 0">
                  <td colspan="4" class="text-center py-4 text-muted">No data found for the selected period.</td>
                </tr>
                <tr *ngFor="let item of reportData">
                  <td class="fw-semibold">{{ item.category_name }}</td>
                  <td>{{ item.total_leads }}</td>
                  <td>{{ item.converted_leads }}</td>
                  <td>
                    <span class="badge" [ngClass]="getRateClass(item.conversion_rate)">
                      {{ item.conversion_rate }}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .report-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
    .gap-20 { gap: 20px; }
    .gap-16 { gap: 16px; }
    .grid { display: grid; gap: 24px; }
    .grid-2 { grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); }
    .chart-card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.05); }
    .chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .chart-header h5 { margin: 0; font-weight: 700; color: #1e293b; font-size: 1.1rem; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .data-table th { text-align: left; padding: 12px 16px; background: #f8fafc; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; border-bottom: 2px solid #e2e8f0; }
    .data-table td { padding: 16px; border-bottom: 1px solid #e2e8f0; color: #334155; vertical-align: middle; }
    .data-table tbody tr:hover { background-color: #f8fafc; }
    .badge { padding: 6px 10px; border-radius: 6px; font-weight: 600; font-size: 0.8rem; }
    .bg-success-soft { background: #dcfce7; color: #166534; }
    .bg-warning-soft { background: #fef3c7; color: #92400e; }
    .bg-danger-soft { background: #fee2e2; color: #991b1b; }
    .premium-input { max-width: 150px; }
  `]
})
export class SourceConversionReportComponent implements OnInit {
  startDate: string = '';
  endDate: string = '';
  reportData: any[] = [];
  loading = false;
  chartInstance: any = null;

  constructor(private api: ApiService) {
    // Default to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    this.endDate = today.toISOString().split('T')[0];
    this.startDate = thirtyDaysAgo.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.loadData();
  }

  onFilterChange() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    let url = '/reports/leads/source-conversion';
    if (this.startDate && this.endDate) {
      url += `?startDate=${this.startDate}&endDate=${this.endDate}`;
    }
    
    this.api.get(url).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.reportData = res.data;
          this.renderChart();
        }
      },
      error: () => this.loading = false
    });
  }

  getRateClass(rate: number | string): string {
    const num = Number(rate);
    if (num >= 20) return 'bg-success-soft';
    if (num >= 5) return 'bg-warning-soft';
    return 'bg-danger-soft';
  }

  renderChart() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
    const ctx = document.getElementById('conversionChart') as HTMLCanvasElement;
    if (!ctx) return;

    const labels = this.reportData.map(d => d.category_name);
    const data = this.reportData.map(d => Number(d.conversion_rate));
    const bgColors = this.reportData.map((_, i) => `hsl(${(i * 360) / this.reportData.length}, 70%, 50%)`);

    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Conversion Rate (%)',
          data,
          backgroundColor: bgColors,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    });
  }
}

