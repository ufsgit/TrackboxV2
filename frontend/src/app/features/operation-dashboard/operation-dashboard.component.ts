import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-operation-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="report-container" style="display: flex; flex-direction: column; gap: 32px;">
      
      <!-- Header -->
      <div class="flex justify-between items-center" style="flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 class="fw-bold mb-2">Operations Dashboard</h2>
          <p class="text-muted mb-0">Overview of field services, installations, and support health</p>
        </div>
        
        <div class="flex items-center" style="gap: 16px; flex-wrap: wrap;">
          <div style="position: relative;">
            <select class="form-select" style="appearance: none; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 40px 10px 16px; font-weight: 600; color: #475569; font-size: 0.95rem; cursor: pointer; outline: none; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all 0.2s;" onmouseover="this.style.borderColor='#cbd5e1'; this.style.backgroundColor='#f1f5f9';" onmouseout="this.style.borderColor='#e2e8f0'; this.style.backgroundColor='#f8fafc';" [(ngModel)]="dateRange" (change)="onFilterChange()">
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
            </select>
            <i class="bi bi-chevron-down" style="position: absolute; right: 14px; top: 50%; transform: translateY(-50%); color: #64748b; pointer-events: none; font-size: 0.85rem; font-weight: bold;"></i>
          </div>
          <button class="btn btn-primary" style="padding: 10px 20px; border-radius: 12px; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); border: none; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);" (click)="onFilterChange()">
            <i class="bi bi-arrow-clockwise me-2"></i> Sync Data
          </button>
        </div>
      </div>

      <!-- KPI Cards (5 Cards) -->
      <div class="stats-grid">
        
        <div class="stat-card">
          <div class="stat-icon icon-blue"><i class="bi bi-tools"></i></div>
          <div class="stat-info">
            <label>Pending Installations</label>
            <h3>{{ pendingInstallations | number }}</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-purple"><i class="bi bi-exclamation-triangle-fill"></i></div>
          <div class="stat-info">
            <label>Pending Complaints</label>
            <h3>{{ pendingComplaints | number }}</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-green"><i class="bi bi-shield-check"></i></div>
          <div class="stat-info">
            <label>Warranty Claims</label>
            <h3>{{ warrantyClaims | number }}</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-orange"><i class="bi bi-person-badge"></i></div>
          <div class="stat-info">
            <label>Technicians Active</label>
            <h3>{{ techniciansActive | number }}</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-red"><i class="bi bi-wrench-adjustable"></i></div>
          <div class="stat-info">
            <label>Today's Installations</label>
            <h3>{{ todaysInstallations | number }}</h3>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid" style="grid-template-columns: 2fr 1fr; gap: 24px;">
        
        <!-- Trend Chart -->
        <div style="background: white; border-radius: 24px; box-shadow: 0 4px 12px -4px rgba(17, 24, 39, 0.05); border: 1px solid rgba(229, 231, 235, 0.8); overflow: hidden; display: flex; flex-direction: column;">
          <div style="padding: 24px 32px; border-bottom: 1px solid #f1f5f9;">
            <h5 class="fw-bold mb-0" style="color: #1e293b; font-size: 1.15rem;">Installations vs Complaints (Last 7 Days)</h5>
          </div>
          <div style="padding: 24px; position: relative; height: 350px; width: 100%; flex-grow: 1;">
            <canvas #trendCanvas id="trendChart" style="width: 100%; height: 100%;"></canvas>
          </div>
        </div>
        
        <!-- Status Doughnut Chart -->
        <div style="background: white; border-radius: 24px; box-shadow: 0 4px 12px -4px rgba(17, 24, 39, 0.05); border: 1px solid rgba(229, 231, 235, 0.8); overflow: hidden; display: flex; flex-direction: column;">
          <div style="padding: 24px 32px; border-bottom: 1px solid #f1f5f9;">
            <h5 class="fw-bold mb-0" style="color: #1e293b; font-size: 1.15rem;">Complaint Status</h5>
          </div>
          <div style="padding: 24px; position: relative; height: 350px; width: 100%; display: flex; align-items: center; justify-content: center; flex-grow: 1;">
            <canvas #statusCanvas id="statusChart" style="width: 100%; height: 100%;"></canvas>
          </div>
        </div>
      </div>
      
      <!-- Actionable Table Row -->
      <div class="chart-card" style="background: white; border-radius: 24px; box-shadow: 0 4px 12px -4px rgba(17, 24, 39, 0.05); border: 1px solid rgba(229, 231, 235, 0.8); overflow: hidden;">
        <div class="flex justify-between items-center" style="padding: 24px 32px; border-bottom: 1px solid #f1f5f9;">
          <h5 class="fw-bold mb-0" style="color: #1e293b; font-size: 1.15rem;">Urgent Pending Operations</h5>
          <button class="btn btn-sm" style="background: #eff6ff; color: #3b82f6; font-weight: 600; border: none; padding: 8px 16px; border-radius: 8px;">View All</button>
        </div>
        <div class="p-0">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <th style="padding: 16px 32px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; width: 15%;">Ticket ID</th>
                <th style="padding: 16px 20px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; width: 30%;">Customer</th>
                <th style="padding: 16px 20px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; width: 15%;">Type</th>
                <th style="padding: 16px 20px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; width: 15%;">Status</th>
                <th style="padding: 16px 20px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; width: 10%;">Priority</th>
                <th style="padding: 16px 32px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; width: 15%; text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let op of recentOperations; let last = last" [ngStyle]="{'border-bottom': last ? 'none' : '1px solid #f1f5f9'}" style="transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                <td style="padding: 20px 32px; font-weight: 600; color: #1e293b;">{{ op.ticketId }}</td>
                <td style="padding: 20px 20px;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div class="avatar-circle" style="background: #eff6ff; color: #3b82f6;">{{ op.customer.charAt(0) }}</div>
                    <span style="font-weight: 600; color: #334155;">{{ op.customer }}</span>
                  </div>
                </td>
                <td style="padding: 20px 20px;">
                  <span style="padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; background: {{ op.type === 'Installation' ? '#e0f2fe' : '#fee2e2' }}; color: {{ op.type === 'Installation' ? '#0369a1' : '#be123c' }};">
                    {{ op.type }}
                  </span>
                </td>
                <td style="padding: 20px 20px;">
                  <div style="display: flex; align-items: center; gap: 8px; font-weight: 500; color: #475569;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: {{ op.status === 'Open' ? '#f59e0b' : (op.status === 'Pending' ? '#3b82f6' : '#8b5cf6') }};"></span>
                    {{ op.status }}
                  </div>
                </td>
                <td style="padding: 20px 20px;">
                  <span style="padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; background: {{ op.priority === 'High' ? '#fee2e2' : '#f1f5f9' }}; color: {{ op.priority === 'High' ? '#ef4444' : '#64748b' }};">
                    {{ op.priority }}
                  </span>
                </td>
                <td style="padding: 20px 32px; text-align: right;">
                  <button style="background: white; border: 1px solid #e2e8f0; color: #1e293b; font-weight: 600; padding: 8px 16px; border-radius: 8px; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);" onmouseover="this.style.background='#f8fafc'; this.style.borderColor='#cbd5e1'" onmouseout="this.style.background='white'; this.style.borderColor='#e2e8f0'">
                    Assign Tech
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .avatar-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.85rem;
    }
    .custom-table th {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6c757d;
      font-weight: 600;
      padding-top: 1rem;
      padding-bottom: 1rem;
    }
    .custom-table td {
      padding-top: 1rem;
      padding-bottom: 1rem;
    }

    /* 3D Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 24px;
      perspective: 1200px;
    }
    .stat-card {
      background: #fff;
      border: 1px solid rgba(229, 231, 235, 0.8);
      border-radius: 24px;
      padding: 32px 28px;
      display: flex;
      align-items: center;
      gap: 20px;
      transition: all 0.45s cubic-bezier(0.25, 0.8, 0.25, 1);
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 12px -4px rgba(17, 24, 39, 0.05);
      transform-style: preserve-3d;
      transform: perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px);
    }
    .stat-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 6px;
      background: transparent;
      transition: all 0.4s ease;
    }
    .stat-card::after {
      content: '';
      position: absolute;
      top: 0; left: -100%; width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
      transition: all 0.65s cubic-bezier(0.25, 0.8, 0.25, 1);
      pointer-events: none;
      transform: skewX(-20deg) translateZ(5px);
    }
    .stat-card:hover {
      transform: perspective(1000px) translateY(-8px) rotateX(6deg) rotateY(-6deg) translateZ(12px);
      box-shadow: 0 24px 38px -8px rgba(17, 24, 39, 0.12), 0 10px 18px -10px rgba(17, 24, 39, 0.08);
      border-color: transparent;
    }
    .stat-card:hover::after {
      left: 200%;
    }
    
    .stat-card:nth-child(1) { background: linear-gradient(145deg, #eff6ff 0%, #ffffff 100%); border-color: #dbeafe; }
    .stat-card:nth-child(2) { background: linear-gradient(145deg, #faf5ff 0%, #ffffff 100%); border-color: #f3e8ff; }
    .stat-card:nth-child(3) { background: linear-gradient(145deg, #f0fdf4 0%, #ffffff 100%); border-color: #dcfce7; }
    .stat-card:nth-child(4) { background: linear-gradient(145deg, #fffbeb 0%, #ffffff 100%); border-color: #fef3c7; }
    .stat-card:nth-child(5) { background: linear-gradient(145deg, #fff1f2 0%, #ffffff 100%); border-color: #ffe4e6; }
    
    .stat-card:nth-child(1):hover { box-shadow: 0 20px 32px -10px rgba(59, 130, 246, 0.28); border-color: #bfdbfe; }
    .stat-card:nth-child(2):hover { box-shadow: 0 20px 32px -10px rgba(168, 85, 247, 0.28); border-color: #e9d5ff; }
    .stat-card:nth-child(3):hover { box-shadow: 0 20px 32px -10px rgba(16, 185, 129, 0.28); border-color: #bbf7d0; }
    .stat-card:nth-child(4):hover { box-shadow: 0 20px 32px -10px rgba(245, 158, 11, 0.28); border-color: #fde68a; }
    .stat-card:nth-child(5):hover { box-shadow: 0 20px 32px -10px rgba(225, 29, 72, 0.28); border-color: #fecdd3; }

    .stat-icon {
      width: 50px;
      height: 50px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      box-shadow: inset 0 2px 4px rgba(255,255,255,0.1);
      transition: transform 0.45s cubic-bezier(0.25, 0.8, 0.25, 1);
      transform: translateZ(0px);
      flex-shrink: 0;
    }
    .stat-card:hover .stat-icon {
      transform: translateZ(42px) scale(1.08);
      box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.2);
    }
    .icon-blue { background: linear-gradient(135deg, #74B9FF 0%, #0984E3 100%); color: #fff; }
    .icon-purple { background: linear-gradient(135deg, #A29BFE 0%, #6C5CE7 100%); color: #fff; }
    .icon-green { background: linear-gradient(135deg, #55EFC4 0%, #00B894 100%); color: #fff; }
    .icon-orange { background: linear-gradient(135deg, #FFEAA7 0%, #FDCB6E 100%); color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.1); }
    .icon-red { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%); color: #e11d48; text-shadow: 0 1px 2px rgba(255,255,255,0.5); }

    .stat-info {
      transition: transform 0.45s cubic-bezier(0.25, 0.8, 0.25, 1);
      transform: translateZ(0px);
    }
    .stat-card:hover .stat-info {
      transform: translateZ(28px);
    }
    .stat-info label {
      display: block;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 4px;
    }
    .stat-info h3 {
      font-size: 1.8rem;
      font-weight: 800;
      color: #1e293b;
      line-height: 1.1;
      margin: 0;
      font-family: 'Inter', sans-serif;
    }
  `]
})
export class OperationDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('trendCanvas') trendCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusCanvas') statusCanvas!: ElementRef<HTMLCanvasElement>;
  
  dateRange: string = 'this_month';

  // KPI Data
  pendingInstallations = 24;
  pendingComplaints = 18;
  warrantyClaims = 7;
  techniciansActive = 42;
  todaysInstallations = 35;

  trendChart: any;
  statusChart: any;

  recentOperations = [
    { ticketId: 'INS-4921', customer: 'Global Tech Corp', type: 'Installation', status: 'Pending', priority: 'High' },
    { ticketId: 'CMP-8910', customer: 'Sarah Jenkins', type: 'Complaint', status: 'Open', priority: 'High' },
    { ticketId: 'INS-4922', customer: 'Nexus Designs', type: 'Installation', status: 'Pending', priority: 'Medium' },
    { ticketId: 'CMP-8912', customer: 'Robert Chen', type: 'Complaint', status: 'Open', priority: 'High' },
    { ticketId: 'WAR-1102', customer: 'Emma Watson', type: 'Warranty', status: 'Pending Approval', priority: 'Medium' },
  ];

  ngOnInit() {
    this.animateValue('pendingInstallations', 0, 24, 1200);
    this.animateValue('pendingComplaints', 0, 18, 1200);
    this.animateValue('warrantyClaims', 0, 7, 1200);
    this.animateValue('techniciansActive', 0, 42, 1200);
    this.animateValue('todaysInstallations', 0, 35, 1200);
  }

  animateValue(propName: any, start: number, end: number, duration: number) {
    if (start === 0 && end > 50) {
      start = Math.floor(end * 0.6);
    }
    
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 2);
      (this as any)[propName] = Math.floor(easeProgress * (end - start) + start);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        (this as any)[propName] = end;
      }
    };
    window.requestAnimationFrame(step);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initTrendChart();
      this.initStatusChart();
    }, 150);
  }

  onFilterChange() {
    this.animateValue('pendingInstallations', this.pendingInstallations, Math.floor(Math.random() * 50), 1000);
    this.animateValue('pendingComplaints', this.pendingComplaints, Math.floor(Math.random() * 40), 1000);
    this.animateValue('warrantyClaims', this.warrantyClaims, Math.floor(Math.random() * 20), 1000);
    this.animateValue('techniciansActive', this.techniciansActive, Math.floor(Math.random() * 60) + 20, 1000);
    this.animateValue('todaysInstallations', this.todaysInstallations, Math.floor(Math.random() * 50) + 10, 1000);

    if (this.trendChart) this.trendChart.destroy();
    if (this.statusChart) this.statusChart.destroy();
    
    this.initTrendChart();
    this.initStatusChart();
  }

  initTrendChart() {
    if (!this.trendCanvas) return;
    const ctx = this.trendCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Create smooth gradient fill for the blue line
    const gradient = ctx.createLinearGradient(0, 0, 0, 350);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
    
    this.trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Installations Completed',
            data: Array.from({length: 7}, () => Math.floor(Math.random() * 40) + 10),
            borderColor: '#3b82f6',
            backgroundColor: gradient,
            borderWidth: 3,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#3b82f6',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.4,
            fill: true
          },
          {
            label: 'Complaints Received',
            data: Array.from({length: 7}, () => Math.floor(Math.random() * 20) + 5),
            borderColor: '#ef4444',
            backgroundColor: 'transparent',
            borderWidth: 3,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#ef4444',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderDash: [5, 5],
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: 10
        },
        plugins: {
          legend: { 
            position: 'top', 
            align: 'end',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: { family: 'Inter', size: 12 }
            }
          },
          tooltip: {
            backgroundColor: '#1e293b',
            padding: 12,
            titleFont: { size: 13 },
            bodyFont: { size: 14, weight: 'bold' },
            cornerRadius: 8
          }
        },
        scales: {
          x: { 
            grid: { display: false },
            ticks: { color: '#64748b' },
            border: { display: false }
          },
          y: { 
            beginAtZero: true, 
            grid: { color: '#f1f5f9' },
            ticks: { color: '#94a3b8', padding: 10 },
            border: { display: false }
          }
        }
      }
    });
  }

  initStatusChart() {
    if (!this.statusCanvas) return;
    const ctx = this.statusCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    this.statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Open', 'In Progress', 'Resolved', 'Escalated'],
        datasets: [{
          data: [15, 25, 45, 5],
          backgroundColor: [
            '#ef4444', // Red
            '#f59e0b', // Yellow
            '#10b981', // Green
            '#6366f1'  // Indigo
          ],
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        layout: {
          padding: 20
        },
        plugins: {
          legend: { 
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: { family: 'Inter', size: 12 }
            }
          },
          tooltip: {
            backgroundColor: '#1e293b',
            padding: 12,
            bodyFont: { size: 14, weight: 'bold' },
            cornerRadius: 8
          }
        }
      }
    });
  }
}
