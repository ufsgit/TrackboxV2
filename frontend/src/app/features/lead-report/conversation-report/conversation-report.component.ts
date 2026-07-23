import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';


Chart.register(...registerables);

function easeOutQuint(t: number) { return 1 - Math.pow(1 - t, 5); }

@Component({
  selector: 'app-conversation-report',
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
      <!-- Header -->
      <div class="flex justify-between items-center" style="flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 class="fw-bold mb-1">Conversation Report</h2>
          <p class="text-muted mb-0">Analysis of messaging metrics and response times</p>
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

      <!-- KPI Cards -->
      <div class="grid grid-4 kpi-row">
        <div class="kpi-card kpi-blue" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-primary-soft text-primary"><i class="bi bi-send-fill"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Messages Sent</h6>
            <h3 class="kpi-value">{{ kpi_messagesSent | number }}</h3>
            <span class="kpi-trend text-success"><i class="bi bi-arrow-up-right"></i> 18%</span>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
        </div>
        <div class="kpi-card kpi-green" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-success-soft text-success"><i class="bi bi-chat-left-dots-fill"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Messages Received</h6>
            <h3 class="kpi-value">{{ kpi_messagesReceived | number }}</h3>
            <span class="kpi-trend text-success"><i class="bi bi-arrow-up-right"></i> 22%</span>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
        </div>
        <div class="kpi-card kpi-orange" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-warning-soft text-warning"><i class="bi bi-stopwatch-fill"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Avg Response Time</h6>
            <h3 class="kpi-value">{{ kpi_avgResponseTime }}m</h3>
            <span class="kpi-trend text-success"><i class="bi bi-arrow-down-right"></i> -1.2m</span>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
        </div>
        <div class="kpi-card kpi-purple" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-info-soft text-info"><i class="bi bi-robot"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Bot vs Human</h6>
            <h3 class="kpi-value">{{ kpi_botHandoff }}%</h3>
            <span class="kpi-trend text-muted">Handoffs</span>
          </div>
          <div class="kpi-glow"></div><div class="kpi-shimmer"></div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid" style="grid-template-columns: 2fr 1fr;">
        <div class="chart-card h-100">
          <div class="chart-header">
            <h5>Message Volume Trend</h5>
          </div>
          <div class="chart-body" style="position: relative; height: 300px; width: 100%;">
            <canvas id="volumeChart"></canvas>
          </div>
        </div>
        <div class="chart-card h-100">
          <div class="chart-header">
            <h5>Messages by Channel</h5>
          </div>
          <div class="chart-body" style="position: relative; height: 300px; width: 100%;">
            <canvas id="channelChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="chart-card">
        <div class="chart-header border-bottom pb-3 mb-3">
          <h5>Recent Conversations</h5>
        </div>
        <div style="overflow: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Channel</th>
                <th>Last Message</th>
                <th>Handled By</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let msg of recentMessages; let i = index" class="table-row" [style.--row-i]="i">
                <td class="fw-semibold">{{ msg.contact }}</td>
                <td><span class="badge" [ngClass]="msg.channel === 'WhatsApp' ? 'badge-whatsapp' : 'badge-primary'">{{ msg.channel }}</span></td>
                <td class="text-muted" style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ msg.message }}</td>
                <td>{{ msg.handledBy }}</td>
                <td class="text-muted small">{{ msg.time | date:'MMM d, h:mm a' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class ConversationReportComponent implements OnInit {
  dateRange: string = 'this_month';

  messagesSent = 15200;
  messagesReceived = 14300;
  avgResponseTime = 4.5;
  botHandoff = 68;

  kpi_messagesSent = 0;
  kpi_messagesReceived = 0;
  kpi_avgResponseTime = 0;
  kpi_botHandoff = 0;

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  volumeChart: any;
  channelChart: any;

  recentMessages = [
    { contact: '+1 234-567-8900', channel: 'WhatsApp', message: 'I need help with my quotation.', handledBy: 'Alice Smith', time: new Date(Date.now() - 600000) },
    { contact: 'john@example.com', channel: 'Email', message: 'Thank you for the update.', handledBy: 'Bot', time: new Date(Date.now() - 3600000) },
    { contact: '+44 7700 900077', channel: 'SMS', message: 'Yes, please confirm the meeting.', handledBy: 'Charlie Brown', time: new Date(Date.now() - 7200000) },
    { contact: '+1 987-654-3210', channel: 'WhatsApp', message: 'What are your pricing plans?', handledBy: 'Bot', time: new Date(Date.now() - 14400000) }
  ];

  ngOnInit() {
    this.animateKPIs();
    setTimeout(() => {
      this.initVolumeChart();
      this.initChannelChart();
    }, 100);
  }

  onFilterChange() {
    this.messagesSent = Math.floor(Math.random() * 20000) + 5000;
    this.messagesReceived = Math.floor(this.messagesSent * 0.9);
    
    this.animateKPIs();

    if (this.volumeChart) this.volumeChart.destroy();
    if (this.channelChart) this.channelChart.destroy();
    this.initVolumeChart();
    this.initChannelChart();
  }

  initVolumeChart() {
    const ctx = document.getElementById('volumeChart') as HTMLCanvasElement;
    if (!ctx) return;
    const realData = Array.from({length: 7}, () => Math.floor(Math.random() * 2000) + 500);
    this.volumeChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Messages',
          data: [0, 0, 0, 0, 0, 0, 0],
          borderColor: '#4F46E5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          fill: true,
          tension: 0.4
        }]
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
      this.volumeChart.data.datasets[0].data = realData;
      this.volumeChart.update();
    }, 600);
  }

  initChannelChart() {
    const ctx = document.getElementById('channelChart') as HTMLCanvasElement;
    if (!ctx) return;
    this.channelChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['WhatsApp', 'SMS', 'Email', 'Web Chat'],
        datasets: [{
          data: [0, 0, 0, 0],
          backgroundColor: ['#25D366', '#3B82F6', '#F59E0B', '#10B981']
        }]
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
      this.channelChart.data.datasets[0].data = [65, 15, 10, 10];
      this.channelChart.update();
    }, 600);
  }

  animateKPIs() {
    this.ngZone.runOutsideAngular(() => {
      this.countUp(0, this.messagesSent, 1200, 0, v => { this.kpi_messagesSent = v; this.cdr.detectChanges(); });
      this.countUp(0, this.messagesReceived, 1200, 0, v => { this.kpi_messagesReceived = v; this.cdr.detectChanges(); });
      this.countUp(0, this.avgResponseTime, 1200, 1, v => { this.kpi_avgResponseTime = v; this.cdr.detectChanges(); });
      this.countUp(0, this.botHandoff, 1200, 0, v => { this.kpi_botHandoff = v; this.cdr.detectChanges(); });
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


