import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AttendanceService } from '../../core/services/attendance.service';
import Swal from 'sweetalert2';

export interface DashboardStats {
  total: number;
  pending: number;
  today: number;
  upcoming: number;
  won: number;
  lost: number;
}

interface Ring {
  total: number;
  segs: {
    color: string;
    dash: string;
    offset: number;
    label: string;
    lx: number;
    ly: number;
  }[];
}

@Component({
  selector: 'app-crm-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './crm-dashboard.component.html',
  styleUrls: ['./crm-dashboard.component.scss'],
})
export class CrmDashboardComponent implements OnInit, OnChanges, OnDestroy {
  /** Stats input or state */
  @Input() stats: DashboardStats = { total: 0, pending: 0, today: 0, upcoming: 0, won: 0, lost: 0 };
  @Input() userName = 'Admin';
  @Output() rangeChange = new EventEmitter<string>();
  @Output() sync = new EventEmitter<void>();

  userRole = 'Admin';
  userInitials = 'AU';
  unreadCount = 0;

  menu = [
    { label: 'Dashboard', icon: 'i-dash', link: '/crm-dashboard', active: true },
    { label: 'Leads', icon: 'i-users', link: '/contacts', active: false },
    { label: 'Follow-ups', icon: 'i-cal', link: '/pending-followup', active: false },
    { label: 'Reports', icon: 'i-chart', link: '/all-leads', active: false },
    { label: 'Team Management', icon: 'i-target', link: '/targets', active: false },
    { label: 'Settings', icon: 'i-gear', link: '/settings', active: false },
  ];

  ranges = [
    { label: 'All Time', value: 'all_time', desc: 'Complete historical data' },
    { label: 'Today', value: 'today', desc: 'Happening today' },
    { label: 'This Week', value: 'this_week', desc: 'Current calendar week' },
    { label: 'This Month', value: 'this_month', desc: 'Current calendar month' }
  ];
  range = 'all_time';
  rangeMenuOpen = false;

  get currentRangeLabel(): string {
    const f = this.ranges.find(r => r.value === this.range);
    return f ? f.label : 'All Time';
  }

  toggleRangeMenu(): void {
    this.rangeMenuOpen = !this.rangeMenuOpen;
  }

  selectRange(val: string): void {
    this.rangeMenuOpen = false;
    this.onRange(val);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-range-picker')) {
      this.rangeMenuOpen = false;
    }
  }

  syncing = false;
  syncedLabel = 'Synced just now';
  greeting = 'Good Morning';

  checkedIn = false;
  elapsed = '00:00';
  private timer: any;
  private t0 = 0;

  kpis: any[] = [];
  funnel: any[] = [];
  funnelH = 0;
  hoveredStage: number | null = null;

  // Monthly Performance Graph Data (Sample with realistic trends)
  months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  series = [
    { name: 'Leads', color: '#2F7BF5', values: [12, 18, 22, 25, 30, 30] },
    { name: 'Contacted', color: '#1FB874', values: [10, 15, 19, 22, 27, 28] },
    { name: 'Follow-ups Done', color: '#F59B2B', values: [9, 14, 18, 21, 24, 26] },
    { name: 'Won', color: '#8B5CF6', values: [0, 0, 0, 0, 0, 1] },
  ];
  chartMax = 40;
  ticks = [0, 10, 20, 30, 40];

  sources = [
    { name: 'Website', value: 38, color: '#2F7BF5' },
    { name: 'Instagram / Meta', value: 32, color: '#F0568C' },
    { name: 'Google Ads', value: 24, color: '#1FB874' },
    { name: 'WhatsApp', value: 18, color: '#F2C230' },
    { name: 'Referral', value: 15, color: '#8B5CF6' },
    { name: 'Walk-in', value: 10, color: '#9AA7BD' },
  ];

  team = [
    ['Rohan Sharma', 38, 38, 0, 0],
    ['Aisha Patel', 32, 31, 0, 1],
    ['Mohit Kumar', 28, 28, 0, 0],
    ['Sneha Nair', 22, 22, 0, 0],
    ['David Thomas', 17, 17, 0, 0],
  ].map(([name, leads, pending, today, won], i) => ({
    name: name as string,
    leads: leads as number,
    pending: pending as number,
    today: today as number,
    won: won as number,
    initials: (name as string).split(' ').map(w => w[0]).join(''),
    color: ['#2F7BF5', '#1FB874', '#F59B2B', '#8B5CF6', '#F0568C'][i % 5],
    conversion: (leads as number) ? ((won as number) / (leads as number)) * 100 : 0,
  }));

  showTeamModal = false;

  get topTeam() {
    return (this.team || []).slice(0, 5);
  }

  openTeamModal(): void {
    this.showTeamModal = true;
  }

  closeTeamModal(): void {
    this.showTeamModal = false;
  }

  recent = [
    { date: '19 Oct 2026', name: 'Priya Menon', source: 'Instagram', interest: 'Enterprise plan', next: '22 Oct 2026', status: 'Pending', color: 'var(--orange)', owner: 'Rohan Sharma' },
    { date: '19 Oct 2026', name: 'Arjun Verma', source: 'Google Ads', interest: 'Starter plan', next: 'Not scheduled', status: 'Pending', color: 'var(--orange)', owner: 'Aisha Patel' },
    { date: '18 Oct 2026', name: 'Neha Singh', source: 'Website', interest: 'Team plan', next: 'Not scheduled', status: 'Pending', color: 'var(--orange)', owner: 'Mohit Kumar' },
    { date: '17 Oct 2026', name: 'Karan Patel', source: 'WhatsApp', interest: 'Enterprise plan', next: 'Not scheduled', status: 'Pending', color: 'var(--orange)', owner: 'Sneha Nair' },
    { date: '16 Oct 2026', name: 'Simran Kaur', source: 'Referral', interest: 'Team plan', next: 'Closed', status: 'Won', color: 'var(--green)', owner: 'Aisha Patel' },
  ];

  sourceRing: Ring = { total: 0, segs: [] };
  statusRing: Ring = { total: 0, segs: [] };
  statusLegend: any[] = [];

  constructor(
    private api: ApiService,
    private authService: AuthService,
    private attendanceService: AttendanceService,
    private router: Router
  ) {
    this.build();
  }

  navigateToFunnel(f: any): void {
    if (!f) return;
    if (f.label === 'Total Leads') {
      this.router.navigate(['/contacts']);
    } else if (f.label === 'Pending') {
      this.router.navigate(['/contacts'], { queryParams: { status: 'Pending' } });
    } else if (f.label === 'Won') {
      this.router.navigate(['/contacts'], { queryParams: { status: 'Won' } });
    } else if (f.label === 'Lost') {
      this.router.navigate(['/contacts'], { queryParams: { status: 'Lost' } });
    } else {
      this.router.navigate(['/contacts']);
    }
  }

  ngOnInit(): void {
    this.build();
    this.initUserProfile();
    this.loadDashboardData();
  }

  ngOnChanges(c: SimpleChanges): void {
    if (c['stats'] && !c['stats'].firstChange) {
      this.build();
      this.countUp();
    }
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private initUserProfile(): void {
    this.authService.currentUser$.subscribe((u: any) => {
      if (u) {
        this.userName = u.name || 'Admin User';
        this.userRole = u.role ? (u.role.charAt(0).toUpperCase() + u.role.slice(1)) : 'Admin';
        const parts = this.userName.trim().split(' ');
        this.userInitials = parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
      }
    });
  }

  private checkAttendanceStatus(): void {
    this.attendanceService.getStatus('CRM').subscribe({
      next: (res: any) => {
        if (res.success && res.isCheckedIn) {
          this.checkedIn = true;
          this.t0 = Date.now() - (res.elapsedSeconds ? res.elapsedSeconds * 1000 : 0);
          this.startElapsedTimer();
        } else {
          this.checkedIn = false;
        }
      },
      error: () => {
        this.checkedIn = false;
      }
    });
  }

  rawPipelineStages: any[] = [];

  public loadDashboardData(): void {
    this.syncing = true;
    this.api.get('/analytics/crm-dashboard', { range: this.range }).subscribe({
      next: (res: any) => {
        this.syncing = false;
        if (res.success && res.data) {
          this.stats = {
            total: res.data.totalLeads || 0,
            pending: res.data.pendingFollowUps || 0,
            today: res.data.todaysFollowUps || 0,
            upcoming: res.data.upcomingFollowUps || 0,
            won: res.data.wonDeals || 0,
            lost: res.data.lostDeals || 0,
            edu: {
              applications: res.data.totalApplications !== undefined ? Number(res.data.totalApplications) : 0,
              offerLetters: res.data.offerLetters !== undefined ? Number(res.data.offerLetters) : 0,
              feesPaid: res.data.feesPaid !== undefined ? Number(res.data.feesPaid) : 0,
              visaSubmitted: res.data.visaSubmitted !== undefined ? Number(res.data.visaSubmitted) : 0,
              visaApproved: res.data.visaApproved !== undefined ? Number(res.data.visaApproved) : 0,
              enrolled: res.data.enrolled !== undefined ? Number(res.data.enrolled) : 0
            }
          } as any;

          if (res.data.pipelineStages) {
            this.rawPipelineStages = res.data.pipelineStages;
          }

          if (res.data.monthlyPerformance) {
            if (res.data.monthlyPerformance.months) {
              this.months = res.data.monthlyPerformance.months;
            }
            if (res.data.monthlyPerformance.series) {
              this.series = res.data.monthlyPerformance.series;
            }
            if (res.data.monthlyPerformance.chartMax) {
              this.chartMax = res.data.monthlyPerformance.chartMax;
            }
            if (res.data.monthlyPerformance.ticks) {
              this.ticks = res.data.monthlyPerformance.ticks;
            }
          }

          if (res.data.sources && Array.isArray(res.data.sources)) {
            this.sources = res.data.sources;
          }

          if (res.data.team && Array.isArray(res.data.team)) {
            this.team = res.data.team;
          }

          if (res.data.recent && Array.isArray(res.data.recent)) {
            this.recent = res.data.recent;
          }

          if (res.data.deltaTotal !== undefined) {
            this.deltas = {
              total: res.data.deltaTotal,
              pending: res.data.deltaPending,
              today: res.data.deltaToday,
              upcoming: res.data.deltaUpcoming,
              won: res.data.deltaWon,
              lost: res.data.deltaLost,
              conversion: res.data.deltaConversion
            };
          }

          this.build();
          this.countUp();
          this.syncedLabel = 'Synced at ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        } else {
          this.build();
          this.countUp();
        }
      },
      error: (err) => {
        console.error('Error fetching CRM dashboard stats', err);
        this.syncing = false;
        this.build();
        this.countUp();
      }
    });
  }

  private pct(v: number, t: number): string {
    return (t ? Math.round((v / t) * 1000) / 10 : 0) + '%';
  }

  private ring(items: { value: number; color: string }[], total: number, r: number): Ring {
    const C = 2 * Math.PI * r;
    let cum = 0;
    const segs: Ring['segs'] = [];
    for (const it of items) {
      const f = total ? it.value / total : 0;
      if (!f) continue;
      const len = Math.max(0, f * C - (items.length > 1 ? 2 : 0));
      const a = (cum + f / 2) * 2 * Math.PI - Math.PI / 2;
      segs.push({
        color: it.color,
        dash: `${len} ${C - len}`,
        offset: -cum * C,
        label: f >= 0.07 ? Math.round(f * 100) + '%' : '',
        lx: +(100 + r * Math.cos(a)).toFixed(1),
        ly: +(100 + r * Math.sin(a)).toFixed(1),
      });
      cum += f;
    }
    return { total, segs };
  }

  deltas: any = {
    total: '12%',
    pending: '18%',
    today: '0%',
    upcoming: '0%',
    won: '100%',
    lost: '0%',
    conversion: '0.7%'
  };

  private build(): void {
    const s = this.stats;
    const h = new Date().getHours();
    this.greeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
    const rate = s.total ? Math.round((s.won / s.total) * 1000) / 10 : 0;

    // KPI Data from Image 1: Applications, Offer Letters, Fees Paid, Visa Submitted, Visa Approved, Enrolled / Travelled
    const eduStats: any = (s as any).edu || {
      applications: 0,
      offerLetters: 245,
      feesPaid: 180,
      visaSubmitted: 180,
      visaApproved: 154,
      enrolled: 148
    };

    this.kpis = [
      { 
        label: 'Total Leads', 
        value: s.total, 
        icon: 'i-users', 
        color: 'var(--blue)', 
        tint: 'var(--t-blue)', 
        delta: this.deltas.total, 
        spark: [.4, .5, .55, .8, 1], 
        link: '/all-leads' 
      },
      { 
        label: 'Applications', 
        value: eduStats.applications ?? 0, 
        icon: 'i-doc', 
        color: '#10B981', 
        tint: 'rgba(16, 185, 129, 0.08)', 
        delta: '18%', 
        spark: [.4, .5, .6, .8, 1], 
        link: '/reports/applications'
      },
      { 
        label: 'Offer Letters', 
        value: eduStats.offerLetters ?? 0, 
        icon: 'i-letter', 
        color: '#8B5CF6', 
        tint: 'rgba(139, 92, 246, 0.08)', 
        delta: '15%', 
        spark: [.3, .4, .65, .75, 1], 
        link: '/reports/offer-letters'
      },
      { 
        label: 'Fees Paid', 
        value: eduStats.feesPaid ?? 0, 
        icon: 'i-coin', 
        color: '#F59E0B', 
        tint: 'rgba(245, 158, 11, 0.08)', 
        delta: '20%', 
        spark: [.35, .5, .6, .7, 1], 
        link: '/reports/fees-paid'
      },
      { 
        label: 'Visa Submitted', 
        value: eduStats.visaSubmitted ?? 0, 
        icon: 'i-plane', 
        color: '#0EA5E9', 
        tint: 'rgba(14, 165, 233, 0.08)', 
        delta: '22%', 
        spark: [.4, .55, .65, .8, 1], 
        link: '/reports/visa-submitted'
      },
      { 
        label: 'Visa Approved', 
        value: eduStats.visaApproved ?? 0, 
        icon: 'i-check-circle', 
        color: '#10B981', 
        tint: 'rgba(16, 185, 129, 0.08)', 
        delta: '19%', 
        spark: [.45, .5, .6, .75, 1], 
        link: '/reports/visa-approved'
      },
      { 
        label: 'Enrolled / Travelled', 
        value: eduStats.enrolled ?? 0, 
        icon: 'i-grad', 
        color: '#6366F1', 
        tint: 'rgba(99, 102, 241, 0.08)', 
        delta: '17%', 
        spark: [.3, .45, .55, .7, 1], 
        link: '/reports/enrolled'
      },
    ].map(k => ({ ...k, display: String(k.value) }));

    // Build Lead Status Pipeline Funnel from backend SP stages (or fallback)
    const stages = (this.rawPipelineStages && this.rawPipelineStages.length > 0)
      ? this.rawPipelineStages.map((ps: any) => ({
          value: Number(ps.value) || 0,
          label: ps.label,
          pct: ps.pct,
          a: ps.colorA || '#3B82F6',
          b: ps.colorB || '#2563EB'
        }))
      : [
          { value: s.total, label: 'Total Leads', pct: '100%', a: '#3B82F6', b: '#2563EB' },
          { value: s.pending, label: 'Pending', pct: this.pct(s.pending, s.total), a: '#22B8CF', b: '#0E9FB5' },
          { value: s.upcoming, label: 'Upcoming', pct: this.pct(s.upcoming, s.total), a: '#3DD598', b: '#1FB874' },
          { value: s.won, label: 'Won', pct: this.pct(s.won, s.total), a: '#F8B84E', b: '#F59B2B' },
          { value: s.lost, label: 'Lost', pct: this.pct(s.lost, s.total), a: '#F472A0', b: '#E8508A' },
        ];

    const rowH = 44, gap = 3, W = 200, step = 26;
    this.funnelH = rowH * stages.length;
    this.funnel = stages.map((st: any, i: number) => {
      const tw = W - i * step, bw = W - (i + 1) * step, y = i * rowH + gap / 2, y2 = y + rowH - gap;
      const tx = (W - tw) / 2, bx = (W - bw) / 2;
      return {
        ...st,
        shown: st.value,
        pct: st.pct || this.pct(st.value, s.total),
        points: `${tx},${y} ${tx + tw},${y} ${bx + bw},${y2} ${bx},${y2}`
      };
    });

    const srcTotal = this.sources.reduce((a, x) => a + x.value, 0);
    this.sourceRing = this.ring(this.sources, srcTotal, 70);

    const status = [
      { name: 'Won', value: s.won, color: '#1FB874' },
      { name: 'Lost', value: s.lost, color: '#EF4B5B' },
      { name: 'Pending', value: s.pending, color: '#F59B2B' },
    ];
    this.statusRing = this.ring(status, s.total || 0, 68);
    this.statusLegend = [...status].reverse().map(x => ({ ...x, pct: this.pct(x.value, s.total) }));
  }

  /** Count-up for KPI and funnel numbers */
  private countUp(): void {
    if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const nums = [...this.kpis.filter(k => !k.suffix), ...this.funnel];
    const t0 = performance.now(), dur = 1100;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      nums.forEach(n => {
        const v = Math.round((n.value) * e);
        if (n.display !== undefined) n.display = String(v);
        else n.shown = v;
      });
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  onRange(r: string): void {
    this.range = r;
    this.rangeChange.emit(r);
    this.loadDashboardData();
  }

  syncData(): void {
    this.sync.emit();
    this.loadDashboardData();
  }

  triggerNotifications(): void {
    Swal.fire({
      title: 'Notifications',
      text: this.unreadCount > 0 ? `You have ${this.unreadCount} unread notification(s).` : 'No new notifications.',
      icon: 'info',
      confirmButtonText: 'OK',
      customClass: { confirmButton: 'btn blue' },
      buttonsStyling: false
    });
  }

  private startElapsedTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      const s = Math.floor((Date.now() - this.t0) / 1000);
      this.elapsed = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    }, 1000);
  }

  toggleCheckIn(): void {
    if (this.checkedIn) {
      this.attendanceService.addCheckOut('CRM').subscribe({
        next: (res: any) => {
          clearInterval(this.timer);
          this.checkedIn = false;
          Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, icon: 'success', title: res.message || 'Checked out successfully' });
        },
        error: (err: any) => {
          Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, icon: 'warning', title: err.error?.message || 'Error checking out' });
        }
      });
      return;
    }

    this.attendanceService.addCheckIn('CRM').subscribe({
      next: (res: any) => {
        this.checkedIn = true;
        this.t0 = Date.now();
        this.elapsed = '00:00';
        this.startElapsedTimer();
        Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, icon: 'success', title: res.message || 'Checked in successfully' });
      },
      error: async (err: any) => {
        if (err.error?.is_late) {
          const { value: reason } = await Swal.fire({
            title: 'Late Check In',
            text: err.error.message,
            input: 'text',
            inputPlaceholder: 'Type your reason here...',
            showCancelButton: true,
            confirmButtonText: 'Check In',
            cancelButtonText: 'Cancel'
          });
          if (reason) {
            this.attendanceService.addCheckIn('CRM', reason).subscribe({
              next: (res: any) => {
                this.checkedIn = true;
                this.t0 = Date.now();
                this.elapsed = '00:00';
                this.startElapsedTimer();
                Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, icon: 'success', title: res.message });
              }
            });
          }
        } else {
          Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, icon: 'info', title: err.error?.message || 'Check in' });
        }
      }
    });
  }
}
