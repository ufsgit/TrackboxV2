import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { ApiService } from '../../../core/services/api.service';

Chart.register(...registerables);

function easeOutQuint(t: number) { return 1 - Math.pow(1 - t, 5); }

@Component({
  selector: 'app-employee-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes cardIn { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes shimmerSweep { from { background-position: 250% 0; } to { background-position: -250% 0; } }
    @keyframes pulseGlow { 0%, 100% { transform: scale(1); opacity: .1; } 50% { transform: scale(1.4); opacity: .2; } }
    @keyframes rowIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
    .kpi-row .kpi-card { position: relative; overflow: hidden; animation: cardIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .kpi-row .kpi-card:nth-child(1) { animation-delay: 0.08s; }
    .kpi-row .kpi-card:nth-child(2) { animation-delay: 0.18s; }
    .kpi-row .kpi-card:nth-child(3) { animation-delay: 0.28s; }
    .kpi-row .kpi-card:nth-child(4) { animation-delay: 0.38s; }
    .kpi-glow { position: absolute; right: -22px; top: -22px; width: 110px; height: 110px; border-radius: 50%; pointer-events: none; animation: pulseGlow 3.2s ease-in-out infinite; }
    .kpi-blue .kpi-glow { background: #3b82f6; }
    .kpi-green .kpi-glow { background: #22c55e; }
    .kpi-orange .kpi-glow { background: #f97316; }
    .kpi-purple .kpi-glow { background: #a855f7; }
    .kpi-shimmer { position: absolute; inset: 0; background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,.55) 50%, transparent 70%); background-size: 250% 100%; animation: shimmerSweep 1.8s ease-out 0.2s both; pointer-events: none; }
    .chart-card { animation: fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .grid:nth-of-type(2) .chart-card:nth-child(1) { animation-delay: 0.2s; }
    .grid:nth-of-type(2) .chart-card:nth-child(2) { animation-delay: 0.3s; }
    .table-row { animation: rowIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: calc(0.4s + var(--row-i, 0) * 0.07s); }
  `],
  template: `
    <div class="report-container flex flex-col gap-20">
      <div class="flex justify-between items-center" style="flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 class="fw-bold mb-1">Employee Report</h2>
          <p class="text-muted mb-0">Monitor agent performance and activity levels</p>
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

      <div class="grid grid-4 kpi-row">
        <div class="kpi-card kpi-blue" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-primary-soft text-primary"><i class="bi bi-person-badge-fill"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Active Agents</h6>
            <h3 class="kpi-value">{{ kpi_activeAgents }}</h3>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
        </div>
        <div class="kpi-card kpi-orange" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-warning-soft text-warning"><i class="bi bi-list-task"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Total Tasks Completed</h6>
            <h3 class="kpi-value">{{ kpi_totalTasks }}</h3>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
        </div>
        <div class="kpi-card kpi-green" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-success-soft text-success"><i class="bi bi-star-fill"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Top Performer</h6>
            <h3 class="kpi-value" style="font-size: 1.25rem;">{{ topPerformer }}</h3>
            <span class="kpi-trend text-muted">Most conversions</span>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
        </div>
        <div class="kpi-card kpi-purple" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-info-soft text-info"><i class="bi bi-speedometer2"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Avg Leads per Agent</h6>
            <h3 class="kpi-value">{{ kpi_avgLeads }}</h3>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
        </div>
      </div>

      <div class="grid" style="grid-template-columns: 2fr 1fr;">
        <div class="chart-card h-100">
          <div class="chart-header">
            <h5>Agent Performance Comparison</h5>
          </div>
          <div class="chart-body" style="position: relative; height: 300px; width: 100%;">
            <canvas id="performanceChart"></canvas>
          </div>
        </div>
        <div class="chart-card h-100">
          <div class="chart-header">
            <h5>Activity Breakdown</h5>
          </div>
          <div class="chart-body" style="position: relative; height: 300px; width: 100%;">
            <canvas id="activityRadarChart"></canvas>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-header border-bottom pb-3 mb-3">
          <h5>Agent Detail Logs</h5>
        </div>
        <div style="overflow: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Agent Name</th>
                <th>Leads Assigned</th>
                <th>Follow-ups</th>
                <th>Conversions</th>
                <th>Win Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let agent of agentDetails; let i = index" class="table-row" [style.--row-i]="i">
                <td>
                  <div class="flex items-center gap-8">
                    <div class="avatar-sm bg-primary-soft text-primary" style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                      {{ agent.name.charAt(0) }}
                    </div>
                    <span class="fw-semibold">{{ agent.name }}</span>
                  </div>
                </td>
                <td>{{ agent.assigned }}</td>
                <td>{{ agent.followups }}</td>
                <td>{{ agent.conversions }}</td>
                <td>
                  <span class="badge badge-success">{{ agent.winRate }}%</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class EmployeeReportComponent implements OnInit {
  dateRange: string = 'this_month';

  activeAgents = 0;
  totalTasks = 0;
  topPerformer = 'N/A';
  avgLeads = 0;

  kpi_activeAgents = 0;
  kpi_totalTasks = 0;
  kpi_avgLeads = 0;

  performanceChart: any;
  activityRadarChart: any;

  agentDetails: any[] = [];

  constructor(
    private api: ApiService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.api.get(`/reports/employee?dateRange=${this.dateRange}`).subscribe({
      next: (res: any) => {
        if (res.success) {
          const data = res.data;
          this.activeAgents = data.activeAgents;
          this.totalTasks = data.totalTasks;
          this.topPerformer = data.topPerformer;
          this.avgLeads = data.avgLeads;
          this.agentDetails = data.agentDetails;

          this.animateKPIs();
          this.updateCharts(data);
        }
      },
      error: (err: any) => console.error(err)
    });
  }

  onFilterChange() {
    this.fetchData();
  }

  updateCharts(data: any) {
    if (this.performanceChart) this.performanceChart.destroy();
    if (this.activityRadarChart) this.activityRadarChart.destroy();
    this.initPerformanceChart();
    this.initRadarChart();
  }

  initPerformanceChart() {
    const ctx = document.getElementById('performanceChart') as HTMLCanvasElement;
    if (!ctx) return;
    const realAssigned = this.agentDetails.map((a: any) => a.assigned);
    const realConversions = this.agentDetails.map((a: any) => a.conversions);
    this.performanceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.agentDetails.map((a: any) => a.name),
        datasets: [
          {
            label: 'Leads Assigned',
            data: realAssigned.map(() => 0),
            backgroundColor: '#818CF8',
            borderRadius: 4
          },
          {
            label: 'Conversions',
            data: realConversions.map(() => 0),
            backgroundColor: '#10B981',
            borderRadius: 4
          }
        ]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        animation: {
          duration: 1200,
          easing: 'easeOutQuart'
        }
      }
    });
    setTimeout(() => {
      this.performanceChart.data.datasets[0].data = realAssigned;
      this.performanceChart.data.datasets[1].data = realConversions;
      this.performanceChart.update();
    }, 600);
  }

  initRadarChart() {
    const ctx = document.getElementById('activityRadarChart') as HTMLCanvasElement;
    if (!ctx) return;
    this.activityRadarChart = new Chart(ctx, {
      type: 'polarArea',
      data: {
        labels: ['Calls', 'Emails', 'Meetings', 'Chats'],
        datasets: [{
          data: [0, 0, 0, 0],
          backgroundColor: [
            'rgba(79, 70, 229, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(59, 130, 246, 0.7)'
          ]
        }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        plugins: { legend: { position: 'bottom' } },
        animation: {
          duration: 1200,
          easing: 'easeOutQuart'
        }
      }
    });
    setTimeout(() => {
      this.activityRadarChart.data.datasets[0].data = [120, 80, 45, 200];
      this.activityRadarChart.update();
    }, 600);
  }

  animateKPIs() {
    this.ngZone.runOutsideAngular(() => {
      this.countUp(0, this.activeAgents, 1200, 0, v => { this.kpi_activeAgents = v; this.cdr.detectChanges(); });
      this.countUp(0, this.totalTasks, 1200, 0, v => { this.kpi_totalTasks = v; this.cdr.detectChanges(); });
      this.countUp(0, this.avgLeads, 1200, 1, v => { this.kpi_avgLeads = v; this.cdr.detectChanges(); });
    });
  }

  countUp(from: number, to: number, ms: number, decimals: number, cb: (v: number) => void) {
    const startTime = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - startTime) / ms, 1);
      const eased = easeOutQuint(p);
      cb(+(from + (to - from) * eased).toFixed(decimals));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

