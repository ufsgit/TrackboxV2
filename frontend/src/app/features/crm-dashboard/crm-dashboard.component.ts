import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-crm-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="report-container" style="display: flex; flex-direction: column; gap: 32px;">
      
      <!-- Header -->
      <div class="flex justify-between items-center" style="flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 class="fw-bold mb-2" style="color: #1e293b;">CRM Dashboard</h2>
          <p class="text-muted mb-0" style="font-size: 0.95rem;">Overview of leads, deals, and pipeline health</p>
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

      <!-- KPI Cards (8 Cards) -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon icon-blue"><i class="bi bi-people-fill"></i></div>
          <div class="stat-info">
            <label>Total Leads</label>
            <h3>{{ totalLeads | number }}</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-red"><i class="bi bi-exclamation-circle-fill"></i></div>
          <div class="stat-info">
            <label>Pending Followups</label>
            <h3>{{ pendingFollowUps | number }}</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-orange"><i class="bi bi-calendar-day-fill"></i></div>
          <div class="stat-info">
            <label>Today's Followups</label>
            <h3>{{ todaysFollowUps | number }}</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-green"><i class="bi bi-calendar-week-fill"></i></div>
          <div class="stat-info">
            <label>Upcoming Followups</label>
            <h3>{{ upcomingFollowUps | number }}</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-green2"><i class="bi bi-trophy-fill"></i></div>
          <div class="stat-info">
            <label>Won Deals</label>
            <h3>{{ wonDeals | number }}</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-slate"><i class="bi bi-x-circle-fill"></i></div>
          <div class="stat-info">
            <label>Lost Deals</label>
            <h3>{{ lostDeals | number }}</h3>
          </div>
        </div>

        <div class="stat-card" *ngIf="!hideMarkedItems">
          <div class="stat-icon icon-purple"><i class="bi bi-file-earmark-text-fill"></i></div>
          <div class="stat-info">
            <label>Quotations</label>
            <h3>{{ quotations | number }}</h3>
          </div>
        </div>

        <div class="stat-card" *ngIf="!hideMarkedItems">
          <div class="stat-icon icon-pink"><i class="bi bi-receipt"></i></div>
          <div class="stat-info">
            <label>Purchase Orders</label>
            <h3>{{ purchaseOrders | number }}</h3>
          </div>
        </div>
      </div>

      <!-- Charts & Visuals Row -->
      <div class="grid" style="grid-template-columns: 1.2fr 2fr; gap: 24px;">
        
        <!-- Elegant Lead Funnel -->
        <div class="chart-card h-100 shadow-sm" style="border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; background: white;">
          <div class="chart-header" style="padding: 20px 24px; border-bottom: 1px solid #f1f5f9;">
            <h5 class="fw-bold m-0" style="color: #1e293b; font-size: 1.15rem;">Status Wise Count</h5>
            <span style="font-size: 0.85rem; color: #64748b;">Count of leads by current status</span>
          </div>
          
          <div class="chart-body flex flex-col items-center py-5 px-4" style="background-color: #fafaf9; min-height: 480px;">

            <div *ngIf="!isLoading" style="width: 100%; max-width: 380px; display: flex; flex-direction: column; align-items: center;">
              <ng-container *ngFor="let stage of funnelStages; let i = index">
                <div class="funnel-stage build-up" [ngStyle]="{'background': stage.gradient, 'width': (100 - i * 5) + '%', 'animation-delay': (i * 0.18) + 's'}">
                  <span class="stage-name">{{ stage.name }}</span>
                  <span class="stage-count">{{ stage.count | number }}</span>
                </div>
                <div class="funnel-arrow build-up" *ngIf="i < funnelStages.length - 1" [style.animation-delay]="(i * 0.18 + 0.09) + 's'">
                  <i class="bi bi-chevron-down"></i>
                </div>
              </ng-container>
            </div>

          </div>
        </div>
        
        <!-- Area Chart -->
        <div class="chart-card h-100 shadow-sm" style="border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; background: white; display: flex; flex-direction: column;">
          <div class="chart-header" style="padding: 20px 24px; border-bottom: 1px solid #f1f5f9;">
            <h5 class="fw-bold m-0" style="color: #1e293b; font-size: 1.15rem;">Upcoming Follow-up Distribution</h5>
            <span style="font-size: 0.85rem; color: #64748b;">Scheduled activities over the next 7 days</span>
          </div>
          <div class="chart-body" style="position: relative; flex-grow: 1; padding: 20px; min-height: 450px; overflow: hidden;">
            <div [class.chart-grow-up]="!isLoading" [class.chart-hidden]="isLoading">
              <canvas #followUpCanvas id="followUpChart" style="display: block; width: 100%; height: 100%;"></canvas>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* ── Build-Up Entrance Animation ── */
    .build-up {
      animation: growUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    @keyframes growUp {
      0% {
        opacity: 0;
        transform: scaleY(0) translateY(20px);
        max-height: 0;
      }
      100% {
        opacity: 1;
        transform: scaleY(1) translateY(0);
        max-height: 200px;
      }
    }

    /* ── Chart Grow Up ── */
    .chart-hidden {
      opacity: 0;
      transform: scaleY(0);
      transform-origin: bottom center;
      height: 100%;
    }
    .chart-grow-up {
      height: 100%;
      animation: chartReveal 0.8s cubic-bezier(0.34, 1.3, 0.64, 1) 0.3s both;
    }
    @keyframes chartReveal {
      0% {
        opacity: 0;
        transform: scaleY(0);
        transform-origin: bottom center;
      }
      100% {
        opacity: 1;
        transform: scaleY(1);
        transform-origin: bottom center;
      }
    }
    /* 3D Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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
    .stat-card:nth-child(2) { background: linear-gradient(145deg, #fff1f2 0%, #ffffff 100%); border-color: #ffe4e6; }
    .stat-card:nth-child(3) { background: linear-gradient(145deg, #fffbeb 0%, #ffffff 100%); border-color: #fef3c7; }
    .stat-card:nth-child(4) { background: linear-gradient(145deg, #f0fdf4 0%, #ffffff 100%); border-color: #dcfce7; }
    .stat-card:nth-child(5) { background: linear-gradient(145deg, #f0fdf4 0%, #ffffff 100%); border-color: #dcfce7; }
    .stat-card:nth-child(6) { background: linear-gradient(145deg, #f8fafc 0%, #ffffff 100%); border-color: #f1f5f9; }
    .stat-card:nth-child(7) { background: linear-gradient(145deg, #faf5ff 0%, #ffffff 100%); border-color: #f3e8ff; }
    .stat-card:nth-child(8) { background: linear-gradient(145deg, #fdf2f8 0%, #ffffff 100%); border-color: #fce7f3; }
    
    .stat-card:nth-child(1):hover { box-shadow: 0 20px 32px -10px rgba(59, 130, 246, 0.28); border-color: #bfdbfe; }
    .stat-card:nth-child(2):hover { box-shadow: 0 20px 32px -10px rgba(225, 29, 72, 0.28); border-color: #fecdd3; }
    .stat-card:nth-child(3):hover { box-shadow: 0 20px 32px -10px rgba(245, 158, 11, 0.28); border-color: #fde68a; }
    .stat-card:nth-child(4):hover { box-shadow: 0 20px 32px -10px rgba(16, 185, 129, 0.28); border-color: #bbf7d0; }
    .stat-card:nth-child(5):hover { box-shadow: 0 20px 32px -10px rgba(16, 185, 129, 0.28); border-color: #bbf7d0; }
    .stat-card:nth-child(6):hover { box-shadow: 0 20px 32px -10px rgba(100, 116, 139, 0.28); border-color: #cbd5e1; }
    .stat-card:nth-child(7):hover { box-shadow: 0 20px 32px -10px rgba(168, 85, 247, 0.28); border-color: #e9d5ff; }
    .stat-card:nth-child(8):hover { box-shadow: 0 20px 32px -10px rgba(236, 72, 153, 0.28); border-color: #fbcfe8; }

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
    
    /* Icon Gradients */
    .icon-blue { background: linear-gradient(135deg, #74B9FF 0%, #0984E3 100%); color: #fff; }
    .icon-red { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%); color: #e11d48; }
    .icon-orange { background: linear-gradient(135deg, #FFEAA7 0%, #FDCB6E 100%); color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.1); }
    .icon-green { background: linear-gradient(135deg, #55EFC4 0%, #00B894 100%); color: #fff; }
    .icon-green2 { background: linear-gradient(135deg, #86efac 0%, #22c55e 100%); color: #fff; }
    .icon-slate { background: linear-gradient(135deg, #cbd5e1 0%, #64748b 100%); color: #fff; }
    .icon-purple { background: linear-gradient(135deg, #A29BFE 0%, #6C5CE7 100%); color: #fff; }
    .icon-pink { background: linear-gradient(135deg, #fbcfe8 0%, #ec4899 100%); color: #fff; }

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

    /* Funnel specific styling */
    .funnel-stage {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 24px;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      cursor: default;
      position: relative;
      overflow: hidden;
    }
    
    .funnel-stage::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 50%;
      background: linear-gradient(to bottom, rgba(255,255,255,0.15), rgba(255,255,255,0));
      pointer-events: none;
    }

    .funnel-stage:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 15px rgba(0,0,0,0.15);
    }

    .stage-name {
      font-size: 1.1rem;
      font-weight: 700;
      color: #ffffff;
      text-shadow: 0 1px 2px rgba(0,0,0,0.2);
      letter-spacing: 0.5px;
    }

    .stage-count {
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 1rem;
      font-weight: 700;
      background-color: #ffffff;
      color: #1e293b;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .funnel-arrow {
      color: #cbd5e1;
      font-size: 1.8rem;
      line-height: 1;
      margin: 6px 0;
      animation: pulse-down 2s infinite;
    }

    @keyframes pulse-down {
      0%, 100% { transform: translateY(0); opacity: 0.5; }
      50% { transform: translateY(6px); opacity: 1; }
    }
  `]
})
export class CrmDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('followUpCanvas') followUpCanvas!: ElementRef<HTMLCanvasElement>;
  
  hideMarkedItems = true; // Added variable to hide marked items
  // hideMarkedItems = false; 
  dateRange: string = 'this_month';
  isLoading = true;

  // KPI Data
  totalLeads = 1250;
  pendingFollowUps = 45;
  todaysFollowUps = 120;
  upcomingFollowUps = 340;
  wonDeals = 10;
  lostDeals = 7;
  quotations = 25;
  purchaseOrders = 12;

  // Funnel Data with premium gradients
  funnelStages = [
    { name: 'Contacted', count: 120, gradient: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)' },
    { name: 'Interested', count: 85, gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)' },
    { name: 'Not Interested', count: 68, gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' },
    { name: 'Converted', count: 25, gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)' },
    { name: 'Assign to Branch', count: 18, gradient: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)' },
    { name: 'Sales Loss', count: 10, gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)' }
  ];

  followUpChart: any;

  ngOnInit() {
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
    this.onFilterChange(true);
  }

  onFilterChange(isInitial = false) {
    this.isLoading = true;
    if (this.followUpChart) {
      this.followUpChart.destroy();
      this.followUpChart = null;
    }

    setTimeout(() => {
      this.isLoading = false;

      if (isInitial) {
        this.animateValue('totalLeads', 0, 1250, 1200);
        this.animateValue('pendingFollowUps', 0, 45, 1200);
        this.animateValue('todaysFollowUps', 0, 120, 1200);
        this.animateValue('upcomingFollowUps', 0, 340, 1200);
        this.animateValue('wonDeals', 0, 10, 1200);
        this.animateValue('lostDeals', 0, 7, 1200);
        this.animateValue('quotations', 0, 25, 1200);
        this.animateValue('purchaseOrders', 0, 12, 1200);
      } else {
        this.animateValue('totalLeads', this.totalLeads, Math.floor(Math.random() * 2000) + 500, 1000);
        this.animateValue('pendingFollowUps', this.pendingFollowUps, Math.floor(Math.random() * 80), 1000);
        this.animateValue('todaysFollowUps', this.todaysFollowUps, Math.floor(Math.random() * 150), 1000);
        this.animateValue('upcomingFollowUps', this.upcomingFollowUps, Math.floor(Math.random() * 400), 1000);
        this.animateValue('wonDeals', this.wonDeals, Math.floor(Math.random() * 50), 1000);
        this.animateValue('lostDeals', this.lostDeals, Math.floor(Math.random() * 20), 1000);
        this.animateValue('quotations', this.quotations, Math.floor(Math.random() * 80), 1000);
        this.animateValue('purchaseOrders', this.purchaseOrders, Math.floor(Math.random() * 30), 1000);
      }

      let current = Math.floor(Math.random() * 400) + 100;
      this.funnelStages.forEach((stage, i) => {
        stage.count = current;
        if (i < this.funnelStages.length - 2) {
          current = Math.floor(current * (Math.random() * 0.2 + 0.7)); // smooth dropoff
        }
      });

      setTimeout(() => this.initFollowUpChart(), 50);
    }, 1500);
  }

  initFollowUpChart() {
    if (!this.followUpCanvas) return;
    const ctx = this.followUpCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 450);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

    this.followUpChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Tomorrow', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
        datasets: [{
          label: 'Scheduled Follow-ups',
          data: Array.from({length: 7}, () => Math.floor(Math.random() * 60) + 15),
          borderColor: '#6366f1',
          backgroundColor: gradient,
          borderWidth: 3,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#6366f1',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: 10
        },
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#64748b',
            },
            border: { display: false }
          },
          y: {
            beginAtZero: true,
            suggestedMax: 100,
            grid: {
              color: '#f1f5f9', // subtle grid
            },
            ticks: {
              color: '#94a3b8',
              padding: 10
            },
            border: { display: false }
          }
        }
      }
    });
  }
}
