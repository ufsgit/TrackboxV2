import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-conversation-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
      <div class="grid grid-4">
        <div class="kpi-card" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-primary-soft text-primary"><i class="bi bi-send-fill"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Messages Sent</h6>
            <h3 class="kpi-value">{{ messagesSent | number }}</h3>
            <span class="kpi-trend text-success"><i class="bi bi-arrow-up-right"></i> 18%</span>
          </div>
        </div>
        <div class="kpi-card" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-success-soft text-success"><i class="bi bi-chat-left-dots-fill"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Messages Received</h6>
            <h3 class="kpi-value">{{ messagesReceived | number }}</h3>
            <span class="kpi-trend text-success"><i class="bi bi-arrow-up-right"></i> 22%</span>
          </div>
        </div>
        <div class="kpi-card" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-warning-soft text-warning"><i class="bi bi-stopwatch-fill"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Avg Response Time</h6>
            <h3 class="kpi-value">{{ avgResponseTime }}m</h3>
            <span class="kpi-trend text-success"><i class="bi bi-arrow-down-right"></i> -1.2m</span>
          </div>
        </div>
        <div class="kpi-card" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
          <div class="kpi-icon bg-info-soft text-info"><i class="bi bi-robot"></i></div>
          <div class="kpi-info">
            <h6 class="kpi-title">Bot vs Human</h6>
            <h3 class="kpi-value">{{ botHandoff }}%</h3>
            <span class="kpi-trend text-muted">Handoffs</span>
          </div>
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
              <tr *ngFor="let msg of recentMessages">
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

  volumeChart: any;
  channelChart: any;

  recentMessages = [
    { contact: '+1 234-567-8900', channel: 'WhatsApp', message: 'I need help with my quotation.', handledBy: 'Alice Smith', time: new Date(Date.now() - 600000) },
    { contact: 'john@example.com', channel: 'Email', message: 'Thank you for the update.', handledBy: 'Bot', time: new Date(Date.now() - 3600000) },
    { contact: '+44 7700 900077', channel: 'SMS', message: 'Yes, please confirm the meeting.', handledBy: 'Charlie Brown', time: new Date(Date.now() - 7200000) },
    { contact: '+1 987-654-3210', channel: 'WhatsApp', message: 'What are your pricing plans?', handledBy: 'Bot', time: new Date(Date.now() - 14400000) }
  ];

  ngOnInit() {
    setTimeout(() => {
      this.initVolumeChart();
      this.initChannelChart();
    }, 100);
  }

  onFilterChange() {
    this.messagesSent = Math.floor(Math.random() * 20000) + 5000;
    this.messagesReceived = Math.floor(this.messagesSent * 0.9);
    
    if (this.volumeChart) this.volumeChart.destroy();
    if (this.channelChart) this.channelChart.destroy();
    this.initVolumeChart();
    this.initChannelChart();
  }

  initVolumeChart() {
    const ctx = document.getElementById('volumeChart') as HTMLCanvasElement;
    if (!ctx) return;
    this.volumeChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Messages',
          data: Array.from({length: 7}, () => Math.floor(Math.random() * 2000) + 500),
          borderColor: '#4F46E5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  initChannelChart() {
    const ctx = document.getElementById('channelChart') as HTMLCanvasElement;
    if (!ctx) return;
    this.channelChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['WhatsApp', 'SMS', 'Email', 'Web Chat'],
        datasets: [{
          data: [65, 15, 10, 10],
          backgroundColor: ['#25D366', '#3B82F6', '#F59E0B', '#10B981']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
}
