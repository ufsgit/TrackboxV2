import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

export interface DashboardStats {
  total: number; pending: number; today: number; upcoming: number; won: number; lost: number;
}

interface Ring { total: number; segs: { color: string; dash: string; offset: number; label: string; lx: number; ly: number }[]; }

@Component({
  selector: 'app-crm-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './crm-dashboard.component.html',
  styleUrls: ['./crm-dashboard.component.scss'],
})
export class CrmDashboardComponent implements OnInit, OnChanges, OnDestroy {
  /** Bind your API response. Defaults match the numbers on the current screen. */
  @Input() stats: DashboardStats = { total: 137, pending: 136, today: 0, upcoming: 1, won: 1, lost: 0 };
  @Input() userName = 'Admin';
  @Output() rangeChange = new EventEmitter<string>();
  @Output() sync = new EventEmitter<void>();

  menu = [
    { label: 'Dashboard', icon: 'i-dash', link: '/crm-dashboard', active: true },
    { label: 'Leads', icon: 'i-users', link: '/leads', active: false },
    { label: 'Follow-ups', icon: 'i-cal', link: '/follow-ups', active: false },
    { label: 'Reports', icon: 'i-chart', link: '/reports', active: false },
    { label: 'Team Management', icon: 'i-target', link: '/team', active: false },
    { label: 'Settings', icon: 'i-gear', link: '/settings', active: false },
  ];
  ranges = ['All Time', 'Today', 'Last 7 days', 'Last 30 days', 'This year'];
  range = 'All Time';
  syncing = false;
  syncedLabel = 'Synced just now';
  greeting = '';

  checkedIn = false;
  elapsed = '00:00';
  private timer: any;
  private t0 = 0;

  kpis: any[] = [];
  funnel: any[] = [];
  funnelH = 0;

  // ---- Sample data: replace with API data ----
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
    { name: 'Website', value: 38, color: '#2F7BF5' }, { name: 'Instagram / Meta', value: 32, color: '#F0568C' },
    { name: 'Google Ads', value: 24, color: '#1FB874' }, { name: 'WhatsApp', value: 18, color: '#F2C230' },
    { name: 'Referral', value: 15, color: '#8B5CF6' }, { name: 'Walk-in', value: 10, color: '#9AA7BD' },
  ];
  team = [
    ['Rohan Sharma', 38, 38, 0, 0], ['Aisha Patel', 32, 31, 0, 1], ['Mohit Kumar', 28, 28, 0, 0],
    ['Sneha Nair', 22, 22, 0, 0], ['David Thomas', 17, 17, 0, 0],
  ].map(([name, leads, pending, today, won], i) => ({
    name: name as string, leads: leads as number, pending: pending as number, today: today as number, won: won as number,
    initials: (name as string).split(' ').map(w => w[0]).join(''),
    color: ['#2F7BF5', '#1FB874', '#F59B2B', '#8B5CF6', '#F0568C'][i],
    conversion: (leads as number) ? ((won as number) / (leads as number)) * 100 : 0,
  }));
  recent = [
    { date: '19 Oct 2026', name: 'Priya Menon', source: 'Instagram', interest: 'Enterprise plan', next: '22 Oct 2026', status: 'Pending', color: 'var(--orange)', owner: 'Rohan Sharma' },
    { date: '19 Oct 2026', name: 'Arjun Verma', source: 'Google Ads', interest: 'Starter plan', next: 'Not scheduled', status: 'Pending', color: 'var(--orange)', owner: 'Aisha Patel' },
    { date: '18 Oct 2026', name: 'Neha Singh', source: 'Website', interest: 'Team plan', next: 'Not scheduled', status: 'Pending', color: 'var(--orange)', owner: 'Mohit Kumar' },
    { date: '17 Oct 2026', name: 'Karan Patel', source: 'WhatsApp', interest: 'Enterprise plan', next: 'Not scheduled', status: 'Pending', color: 'var(--orange)', owner: 'Sneha Nair' },
    { date: '16 Oct 2026', name: 'Simran Kaur', source: 'Referral', interest: 'Team plan', next: 'Closed', status: 'Won', color: 'var(--green)', owner: 'Aisha Patel' },
  ];

  sourceRing!: Ring;
  statusRing!: Ring;
  statusLegend: any[] = [];

  ngOnInit(): void { this.build(); this.countUp(); }
  ngOnChanges(c: SimpleChanges): void { if (c['stats'] && !c['stats'].firstChange) { this.build(); this.countUp(); } }
  ngOnDestroy(): void { clearInterval(this.timer); }

  private pct(v: number, t: number): string { return (t ? Math.round((v / t) * 1000) / 10 : 0) + '%'; }

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
        color: it.color, dash: `${len} ${C - len}`, offset: -cum * C,
        label: f >= 0.07 ? Math.round(f * 100) + '%' : '', lx: +(100 + r * Math.cos(a)).toFixed(1), ly: +(100 + r * Math.sin(a)).toFixed(1),
      });
      cum += f;
    }
    return { total, segs };
  }

  private build(): void {
    const s = this.stats;
    const h = new Date().getHours();
    this.greeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
    const rate = s.total ? Math.round((s.won / s.total) * 1000) / 10 : 0;

    this.kpis = [
      { label: 'Total Leads', value: s.total, icon: 'i-users', color: 'var(--blue)', tint: 'var(--t-blue)', delta: '12%', spark: [.4, .5, .55, .8, 1] },
      { label: 'Pending Follow-ups', value: s.pending, icon: 'i-alert', color: 'var(--orange)', tint: 'var(--t-orange)', delta: '18%', spark: [.5, .45, .7, .85, 1] },
      { label: "Today's Follow-ups", value: s.today, icon: 'i-clock', color: 'var(--purple)', tint: 'var(--t-purple)', delta: '', spark: [.3, .3, .3, .3, .3] },
      { label: 'Upcoming Follow-ups', value: s.upcoming, icon: 'i-cal', color: 'var(--teal)', tint: 'var(--t-sky)', delta: '0%', spark: [.5, .5, .5, .5, .5] },
      { label: 'Won', value: s.won, icon: 'i-trophy', color: 'var(--green)', tint: 'var(--t-green)', delta: '100%', spark: [.2, .2, .2, .3, 1] },
      { label: 'Lost', value: s.lost, icon: 'i-x', color: 'var(--red)', tint: 'var(--t-red)', delta: '', spark: [.3, .3, .3, .3, .3] },
      { label: 'Conversion Rate', value: rate, suffix: '%', icon: 'i-target', color: 'var(--purple)', tint: 'var(--t-lav)', delta: rate + '%', spark: [.2, .2, .2, .3, 1] },
    ].map(k => ({ ...k, display: String(k.value) + ((k as any).suffix ?? '') }));

    const stages = [
      { value: s.total, label: 'Total Leads', a: '#3B82F6', b: '#2563EB' },
      { value: s.pending, label: 'Pending', a: '#22B8CF', b: '#0E9FB5' },
      { value: s.upcoming, label: 'Upcoming', a: '#3DD598', b: '#1FB874' },
      { value: s.won, label: 'Won', a: '#F8B84E', b: '#F59B2B' },
      { value: s.lost, label: 'Lost', a: '#F472A0', b: '#E8508A' },
    ];
    const rowH = 44, gap = 3, W = 200, step = 26;
    this.funnelH = rowH * stages.length;
    this.funnel = stages.map((st, i) => {
      const tw = W - i * step, bw = W - (i + 1) * step, y = i * rowH + gap / 2, y2 = y + rowH - gap;
      const tx = (W - tw) / 2, bx = (W - bw) / 2;
      return { ...st, shown: st.value, pct: this.pct(st.value, s.total),
        points: `${tx},${y} ${tx + tw},${y} ${bx + bw},${y2} ${bx},${y2}` };
    });

    const srcTotal = this.sources.reduce((a, x) => a + x.value, 0);
    this.sourceRing = this.ring(this.sources, srcTotal, 70);
    const status = [
      { name: 'Won', value: s.won, color: '#1FB874' },
      { name: 'Lost', value: s.lost, color: '#EF4B5B' },
      { name: 'Pending', value: s.pending, color: '#F59B2B' },
    ];
    this.statusRing = this.ring(status, s.total, 68);
    this.statusLegend = [...status].reverse().map(x => ({ ...x, pct: this.pct(x.value, s.total) }));
  }

  /** Count-up for KPI and funnel numbers */
  private countUp(): void {
    if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const nums = [...this.kpis.filter(k => !k.suffix), ...this.funnel];
    const t0 = performance.now(), dur = 1100;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      nums.forEach(n => { const v = Math.round((n.value) * e); if (n.display !== undefined) n.display = String(v); else n.shown = v; });
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  onRange(r: string): void { this.range = r; this.rangeChange.emit(r); this.countUp(); }

  syncData(): void {
    this.syncing = true;
    this.sync.emit(); // call your existing sync service here, then clear the flag when it completes
    setTimeout(() => {
      this.syncing = false;
      this.syncedLabel = 'Synced at ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      this.countUp();
    }, 900);
  }

  toggleCheckIn(): void {
    if (this.checkedIn) { clearInterval(this.timer); this.checkedIn = false; return; }
    this.checkedIn = true; this.t0 = Date.now(); this.elapsed = '00:00';
    this.timer = setInterval(() => {
      const s = Math.floor((Date.now() - this.t0) / 1000);
      this.elapsed = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    }, 1000);
  }
}
