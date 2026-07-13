import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-hr-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="report-container" style="display: flex; flex-direction: column; gap: 32px;">
      
      <!-- Header -->
      <div class="flex justify-between items-center" style="flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 class="fw-bold mb-2" style="color: #1e293b;">Executive HR Dashboard</h2>
          <p class="text-muted mb-0" style="font-size: 0.95rem;">Real-time overview of your workforce and operations</p>
        </div>
        
        <div class="flex items-center" style="gap: 16px; flex-wrap: wrap;">
          <div style="position: relative;">
            <select class="form-select" style="appearance: none; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 40px 10px 16px; font-weight: 600; color: #475569; font-size: 0.95rem; cursor: pointer; outline: none; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all 0.2s;" [(ngModel)]="dateRange" (change)="onFilterChange()">
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

      <!-- KPI Cards Row 1 -->
      <div class="stats-grid">
        
        <div class="stat-card" style="cursor: pointer;" (click)="showLeaveModal = true">
          <div class="stat-icon icon-orange"><i class="bi bi-calendar-event"></i></div>
          <div class="stat-info">
            <label>Leave Requests</label>
            <h3>{{ leaveRequests | number }}</h3>
            <span style="font-size: 0.75rem; color: #3b82f6; font-weight: 600;">View Details <i class="bi bi-arrow-right"></i></span>
          </div>
        </div>

        <div class="stat-card" style="cursor: pointer;" (click)="showExpenseModal = true">
          <div class="stat-icon icon-blue"><i class="bi bi-currency-dollar"></i></div>
          <div class="stat-info">
            <label>Expense Approvals</label>
            <h3>{{ expenseApprovals | number }}</h3>
            <span style="font-size: 0.75rem; color: #3b82f6; font-weight: 600;">View Details <i class="bi bi-arrow-right"></i></span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-green"><i class="bi bi-people-fill"></i></div>
          <div class="stat-info">
            <label>Total Employees</label>
            <h3>{{ totalEmployees | number }}</h3>
            <span style="font-size: 0.75rem; color: #10b981; font-weight: 600;"><i class="bi bi-arrow-up-short"></i> +2 this month</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-purple"><i class="bi bi-person-check-fill"></i></div>
          <div class="stat-info">
            <label>Present Today</label>
            <h3>{{ attendanceToday | number }}</h3>
            <span style="font-size: 0.75rem; color: #64748b; font-weight: 600;">85% of workforce</span>
          </div>
        </div>
      </div>

      <!-- Charts & Widgets Row -->
      <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px;">
        
        <!-- Attendance Donut Chart -->
        <div style="background: white; border-radius: 24px; box-shadow: 0 4px 12px -4px rgba(17, 24, 39, 0.05); border: 1px solid rgba(229, 231, 235, 0.8); overflow: hidden; display: flex; flex-direction: column;">
          <div style="padding: 24px 32px; border-bottom: 1px solid #f1f5f9;">
            <h5 class="fw-bold mb-0" style="color: #1e293b; font-size: 1.15rem;">Daily Attendance Status</h5>
          </div>
          <div style="padding: 24px; position: relative; height: 320px; width: 100%; display: flex; align-items: center; justify-content: center; flex-grow: 1;">
            <canvas #attendanceCanvas id="attendanceChart" style="width: 100%; height: 100%;"></canvas>
          </div>
        </div>
        
        <!-- Department Distribution Bar Chart -->
        <div style="background: white; border-radius: 24px; box-shadow: 0 4px 12px -4px rgba(17, 24, 39, 0.05); border: 1px solid rgba(229, 231, 235, 0.8); overflow: hidden; display: flex; flex-direction: column;">
          <div style="padding: 24px 32px; border-bottom: 1px solid #f1f5f9;">
            <h5 class="fw-bold mb-0" style="color: #1e293b; font-size: 1.15rem;">Workforce by Department</h5>
          </div>
          <div style="padding: 24px; position: relative; height: 320px; width: 100%; display: flex; align-items: center; justify-content: center; flex-grow: 1;">
            <canvas #departmentCanvas id="departmentChart" style="width: 100%; height: 100%;"></canvas>
          </div>
        </div>
      </div>

      <!-- Complex Widgets Row -->
      <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 24px;">
        
        <!-- Holiday Calendar Widget -->
        <div style="background: white; border-radius: 24px; box-shadow: 0 4px 12px -4px rgba(17, 24, 39, 0.05); border: 1px solid rgba(229, 231, 235, 0.8); overflow: hidden;">
          <div class="flex justify-between items-center" style="padding: 24px 32px; border-bottom: 1px solid #f1f5f9;">
            <h5 class="fw-bold mb-0" style="color: #1e293b; font-size: 1.15rem;">Upcoming Holidays</h5>
            <button class="btn btn-sm btn-light" style="border-radius: 8px; font-weight: 600;"><i class="bi bi-calendar3"></i> Full Calendar</button>
          </div>
          <div style="padding: 24px;">
            <div *ngFor="let hol of holidays; let last = last" [ngStyle]="{'margin-bottom': last ? '0' : '16px'}" style="display: flex; align-items: center; gap: 16px; padding: 16px; background: #f8fafc; border-radius: 12px; border-left: 4px solid #6366f1;">
              <div style="text-align: center; min-width: 60px;">
                <div style="color: #ef4444; font-weight: 700; font-size: 0.8rem; text-transform: uppercase;">{{ hol.month }}</div>
                <div style="color: #0f172a; font-weight: 800; font-size: 1.4rem; line-height: 1;">{{ hol.day }}</div>
              </div>
              <div>
                <h6 style="margin: 0; font-weight: 700; color: #1e293b; font-size: 1.05rem;">{{ hol.name }}</h6>
                <div style="font-size: 0.85rem; color: #64748b; margin-top: 4px;">{{ hol.type }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Performance Reviews Widget -->
        <div style="background: white; border-radius: 24px; box-shadow: 0 4px 12px -4px rgba(17, 24, 39, 0.05); border: 1px solid rgba(229, 231, 235, 0.8); overflow: hidden;">
          <div class="flex justify-between items-center" style="padding: 24px 32px; border-bottom: 1px solid #f1f5f9;">
            <h5 class="fw-bold mb-0" style="color: #1e293b; font-size: 1.15rem;">Performance Reviews</h5>
            <span class="badge bg-primary rounded-pill px-3 py-2">Cycle Active</span>
          </div>
          <div style="padding: 24px;">
            
            <div style="margin-bottom: 24px;">
              <div class="flex justify-between" style="font-size: 0.9rem; font-weight: 600; color: #475569; margin-bottom: 8px;">
                <span>Company Completion</span>
                <span>{{ performanceProgress }}%</span>
              </div>
              <div class="progress" style="height: 10px; border-radius: 10px; background-color: #e2e8f0;">
                <div class="progress-bar bg-success" role="progressbar" [style.width.%]="performanceProgress"></div>
              </div>
            </div>

            <h6 style="font-size: 0.85rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 16px;">Pending Reviews</h6>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div *ngFor="let rev of pendingReviews" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div class="avatar-circle" style="background: linear-gradient(135deg, #cbd5e1, #94a3b8); width: 36px; height: 36px; font-size: 0.85rem;">{{ rev.employee.charAt(0) }}</div>
                  <div>
                    <div style="font-weight: 600; color: #1e293b; font-size: 0.9rem;">{{ rev.employee }}</div>
                    <div style="font-size: 0.8rem; color: #64748b;">Reviewer: {{ rev.manager }}</div>
                  </div>
                </div>
                <button class="btn btn-sm btn-outline-primary" style="border-radius: 8px; font-size: 0.8rem; font-weight: 600;">Nudge</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Modals -->
    <!-- Leave Requests Modal -->
    <div *ngIf="showLeaveModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.6); z-index: 1060; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
      <div style="background: white; border-radius: 20px; width: 100%; max-width: 700px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden; animation: modalIn 0.3s ease-out forwards;">
        <div style="padding: 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc;">
          <h5 style="margin: 0; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 12px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: #fef3c7; color: #d97706; display: flex; align-items: center; justify-content: center;"><i class="bi bi-calendar-event"></i></div>
            Pending Leave Requests
          </h5>
          <button (click)="showLeaveModal = false" style="background: transparent; border: none; font-size: 1.5rem; color: #64748b; cursor: pointer;">&times;</button>
        </div>
        <div style="padding: 0; max-height: 60vh; overflow-y: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 10;">
                <th style="padding: 12px 24px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Employee</th>
                <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Dates</th>
                <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Reason</th>
                <th style="padding: 12px 24px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let req of leaveRequestsList" style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                <td style="padding: 16px 24px;">
                  <div style="font-weight: 600; color: #1e293b;">{{ req.name }}</div>
                  <div style="font-size: 0.8rem; color: #64748b;">{{ req.dept }}</div>
                </td>
                <td style="padding: 16px 16px; font-size: 0.9rem; font-weight: 500; color: #334155;">{{ req.dates }}</td>
                <td style="padding: 16px 16px; font-size: 0.9rem; color: #64748b;">{{ req.reason }}</td>
                <td style="padding: 16px 24px; text-align: right;">
                  <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button class="btn btn-sm btn-outline-danger" style="border-radius: 6px; padding: 4px 10px;"><i class="bi bi-x-lg"></i></button>
                    <button class="btn btn-sm btn-success" style="border-radius: 6px; padding: 4px 10px;"><i class="bi bi-check-lg"></i></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Expense Approvals Modal -->
    <div *ngIf="showExpenseModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.6); z-index: 1060; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
      <div style="background: white; border-radius: 20px; width: 100%; max-width: 700px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden; animation: modalIn 0.3s ease-out forwards;">
        <div style="padding: 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc;">
          <h5 style="margin: 0; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 12px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: #dbeafe; color: #2563eb; display: flex; align-items: center; justify-content: center;"><i class="bi bi-currency-dollar"></i></div>
            Pending Expense Claims
          </h5>
          <button (click)="showExpenseModal = false" style="background: transparent; border: none; font-size: 1.5rem; color: #64748b; cursor: pointer;">&times;</button>
        </div>
        <div style="padding: 0; max-height: 60vh; overflow-y: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 10;">
                <th style="padding: 12px 24px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Employee</th>
                <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Amount</th>
                <th style="padding: 12px 16px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Category</th>
                <th style="padding: 12px 24px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let req of expenseRequestsList" style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                <td style="padding: 16px 24px;">
                  <div style="font-weight: 600; color: #1e293b;">{{ req.name }}</div>
                  <div style="font-size: 0.8rem; color: #64748b;">{{ req.date }}</div>
                </td>
                <td style="padding: 16px 16px; font-size: 1.05rem; font-weight: 700; color: #0f172a;">{{ req.amount }}</td>
                <td style="padding: 16px 16px; font-size: 0.9rem; color: #64748b;">
                  <span style="background: #e2e8f0; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; color: #475569;">{{ req.category }}</span>
                </td>
                <td style="padding: 16px 24px; text-align: right;">
                  <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button class="btn btn-sm btn-outline-secondary" style="border-radius: 6px; padding: 4px 10px;"><i class="bi bi-eye"></i></button>
                    <button class="btn btn-sm btn-success" style="border-radius: 6px; padding: 4px 10px;"><i class="bi bi-check-lg"></i></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes modalIn {
      from { transform: scale(0.95) translateY(10px); opacity: 0; }
      to { transform: scale(1) translateY(0); opacity: 1; }
    }
    .avatar-circle {
      border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: white;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 24px;
    }
    .stat-card {
      background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px;
      display: flex; align-items: center; gap: 20px; transition: all 0.3s ease; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .stat-card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-color: #cbd5e1; }
    
    .stat-icon { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; }
    
    .icon-orange { background: #fffbeb; color: #d97706; }
    .icon-blue { background: #eff6ff; color: #2563eb; }
    .icon-green { background: #f0fdf4; color: #16a34a; }
    .icon-purple { background: #faf5ff; color: #9333ea; }

    .stat-info label { display: block; font-size: 0.85rem; font-weight: 600; color: #64748b; margin-bottom: 4px; }
    .stat-info h3 { font-size: 2rem; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; line-height: 1; }
  `]
})
export class HrDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('attendanceCanvas') attendanceCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('departmentCanvas') departmentCanvas!: ElementRef<HTMLCanvasElement>;
  
  dateRange: string = 'this_month';

  // KPI Data
  leaveRequests = 12;
  expenseApprovals = 8;
  totalEmployees = 142;
  attendanceToday = 128;
  performanceProgress = 74;

  attendanceChart: any;
  departmentChart: any;

  // Modals
  showLeaveModal = false;
  showExpenseModal = false;

  leaveRequestsList = [
    { name: 'Michael Scott', dept: 'Management', dates: 'Oct 15 - Oct 20', reason: 'Vacation' },
    { name: 'Jim Halpert', dept: 'Sales', dates: 'Oct 12 (Half Day)', reason: 'Personal Appointment' },
    { name: 'Stanley Hudson', dept: 'Sales', dates: 'Oct 22 - Oct 23', reason: 'Medical' },
    { name: 'Toby Flenderson', dept: 'HR', dates: 'Oct 25', reason: 'Personal' }
  ];

  expenseRequestsList = [
    { name: 'Pam Beesly', date: 'Oct 05, 2023', amount: '₹125.00', category: 'Office Supplies' },
    { name: 'Dwight Schrute', date: 'Oct 06, 2023', amount: '₹450.00', category: 'Travel' },
    { name: 'Ryan Howard', date: 'Oct 07, 2023', amount: '₹85.50', category: 'Meals' }
  ];

  holidays = [
    { month: 'NOV', day: '11', name: 'Veterans Day', type: 'Public Holiday' },
    { month: 'NOV', day: '28', name: 'Thanksgiving', type: 'Public Holiday' },
    { month: 'DEC', day: '25', name: 'Christmas Day', type: 'Public Holiday' }
  ];

  pendingReviews = [
    { employee: 'Kevin Malone', manager: 'Angela Martin' },
    { employee: 'Kelly Kapoor', manager: 'Michael Scott' },
    { employee: 'Creed Bratton', manager: 'Dwight Schrute' }
  ];

  ngOnInit() {
    this.animateValue('leaveRequests', 0, 12, 1200);
    this.animateValue('expenseApprovals', 0, 8, 1200);
    this.animateValue('totalEmployees', 0, 142, 1200);
    this.animateValue('attendanceToday', 0, 128, 1200);
    this.animateValue('performanceProgress', 0, 74, 1200);
  }

  animateValue(propName: any, start: number, end: number, duration: number) {
    // If starting from 0 for a large number, jump to 60% of the value so it doesn't blur
    if (start === 0 && end > 50) {
      start = Math.floor(end * 0.6); 
    }
    
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // easeOutQuad: Shorter tail so the last numbers don't drag
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
      this.initAttendanceChart();
      this.initDepartmentChart();
    }, 200);
  }

  onFilterChange() {
    this.animateValue('leaveRequests', this.leaveRequests, Math.floor(Math.random() * 20), 1000);
    this.animateValue('expenseApprovals', this.expenseApprovals, Math.floor(Math.random() * 15), 1000);
    this.animateValue('attendanceToday', this.attendanceToday, Math.floor(Math.random() * 20) + 110, 1000);
    this.animateValue('performanceProgress', this.performanceProgress, Math.floor(Math.random() * 40) + 50, 1000);

    if (this.attendanceChart) {
      this.attendanceChart.data.datasets[0].data = [
        this.attendanceToday, 
        10, 
        this.totalEmployees - this.attendanceToday - 10
      ];
      this.attendanceChart.update();
    }
  }

  initAttendanceChart() {
    if (!this.attendanceCanvas) return;
    const ctx = this.attendanceCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.attendanceChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Present (On Time)', 'Late', 'Absent / Leave'],
        datasets: [{
          data: [128, 10, 4],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  initDepartmentChart() {
    if (!this.departmentCanvas) return;
    const ctx = this.departmentCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.departmentChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Sales', 'IT', 'HR', 'Finance', 'Ops', 'Marketing'],
        datasets: [{
          label: 'Employees',
          data: [35, 20, 8, 15, 45, 19],
          backgroundColor: '#6366f1',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, grid: { display: true, color: '#f1f5f9' }, border: { display: false } },
          x: { grid: { display: false }, border: { display: false } }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}
