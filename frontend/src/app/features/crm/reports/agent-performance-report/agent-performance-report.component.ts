import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-agent-performance-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-performance-report.component.html',
  styleUrl: './agent-performance-report.component.css',
  changeDetection: ChangeDetectionStrategy.Default
})
export class AgentPerformanceReportComponent implements OnInit, AfterViewInit {
  searchTerm = '';

  agents = [
    { agent: 'Alice S.',   leadsHandled: 150, converted: 15, rate: '10.0%', avgResponseTime: '12m', rating: '4.8' },
    { agent: 'Bob J.',     leadsHandled: 120, converted: 10, rate: '8.3%',  avgResponseTime: '25m', rating: '4.2' },
    { agent: 'Charlie B.', leadsHandled: 180, converted: 22, rate: '12.2%', avgResponseTime: '8m',  rating: '4.9' },
    { agent: 'David L.',   leadsHandled: 90,  converted: 5,  rate: '5.5%',  avgResponseTime: '45m', rating: '3.9' },
    { agent: 'Eva G.',     leadsHandled: 210, converted: 30, rate: '14.2%', avgResponseTime: '5m',  rating: '5.0' }
  ];

  /* ── KPI rolling counters ─────────────────────────────────────── */
  kpi_convRate       = 0;
  kpi_lowestConvRate = 0;

  /* ── Chart ────────────────────────────────────────────────────── */
  chartH    = 260;   // px – drawing area height
  barW      = 28;    // px – each bar column width
  depthX    = 10;    // px – 3d skew offset X
  depthY    = 6;     // px – 3d skew offset Y
  gap       = 12;    // px – gap between lead/conv bars inside a group
  groupGap  = 36;    // px – gap between agent groups

  maxLeads  = 210;
  maxConv   = 30;

  // animated heights (0 → real) driven by component
  animLeads:   number[] = [];
  animConv:    number[]  = [];

  svgWidth   = 0;
  svgHeight  = 0;

  get totalSvgWidth() {
    return this.agents.length * (this.barW * 2 + this.gap + this.groupGap) + 60;
  }

  ngOnInit() {
    this.animLeads = this.agents.map(() => 0);
    this.animConv  = this.agents.map(() => 0);
    this.svgWidth  = this.totalSvgWidth;
    this.svgHeight = this.chartH + 36;  // + x-axis label space
  }

  ngAfterViewInit() {
    // tiny delay so Angular renders the 0-height bars first
    setTimeout(() => this.runAnimations(), 50);
  }

  runAnimations() {
    const dur   = 1200;  // ms
    const start = performance.now();

    // Rolling KPI counters
    this.animateValue(0, 14.2, dur + 200, (v) => this.kpi_convRate  = +v.toFixed(1));
    this.animateValue(0, 5.5,  dur,       (v) => this.kpi_lowestConvRate = +v.toFixed(1));

    // Bar heights
    const step = (now: number) => {
      const progress = Math.min((now - start) / dur, 1);
      const eased    = easeOutElastic(progress);

      this.agents.forEach((a, i) => {
        this.animLeads[i] = (a.leadsHandled / this.maxLeads) * this.chartH * eased;
        this.animConv[i]  = (a.converted    / this.maxConv)  * this.chartH * eased;
      });

      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  animateValue(from: number, to: number, ms: number, fn: (v: number) => void) {
    const start = performance.now();
    const run   = (now: number) => {
      const p = Math.min((now - start) / ms, 1);
      fn(from + (to - from) * easeOutCubic(p));
      if (p < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  }

  /* ── Bar geometry helpers ─────────────────────────────────────── */
  groupX(i: number) {
    return 48 + i * (this.barW * 2 + this.gap + this.groupGap);
  }

  leadsX(i: number) { return this.groupX(i); }
  convX(i: number)  { return this.groupX(i) + this.barW + this.gap; }

  barBaseY() { return this.chartH; }

  // 3D top face polygon (parallelogram above bar top)
  topPoly(x: number, h: number): string {
    const y  = this.chartH - h;
    const dx = this.depthX, dy = this.depthY;
    const w  = this.barW;
    return `${x},${y} ${x + w},${y} ${x + w + dx},${y - dy} ${x + dx},${y - dy}`;
  }

  // 3D right face polygon (side of bar)
  rightPoly(x: number, h: number): string {
    const y  = this.chartH - h;
    const dx = this.depthX, dy = this.depthY;
    const w  = this.barW;
    return `${x + w},${y} ${x + w + dx},${y - dy} ${x + w + dx},${this.chartH - dy} ${x + w},${this.chartH}`;
  }

  // Y-grid values
  gridLines = [0, 50, 100, 150, 200, 250];

  gridY(val: number) { return this.chartH - (val / this.maxLeads) * this.chartH; }

  /* ── Table ──────────────────────────────────────────────────────── */
  get filteredAgents() {
    if (!this.searchTerm) return this.agents;
    return this.agents.filter(a =>
      a.agent.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getRateClass(rateStr: string) {
    const r = parseFloat(rateStr);
    if (r >= 12) return 'badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-2';
    if (r >= 8)  return 'badge rounded-pill bg-info-subtle text-info border border-info-subtle px-3 py-2';
    return 'badge rounded-pill bg-warning-subtle text-warning border border-warning-subtle px-3 py-2';
  }
}

/* ── Easing functions ─────────────────────────────────────────────── */
function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }

function easeOutElastic(t: number) {
  if (t === 0 || t === 1) return t;
  const c4 = (2 * Math.PI) / 3;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}
