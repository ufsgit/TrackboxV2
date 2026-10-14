import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { ApiService } from '../../../core/services/api.service';

Chart.register(...registerables);

export interface HourlyItem {
  hour: number;
  count: number;
  timeRange: string;
  label12: string;
  label24: string;
  dayPart: string;
  percentage: number;
  isPeak: boolean;
  statusLevel: 'peak' | 'high' | 'steady' | 'inactive';
}

@Component({
  selector: 'app-time-track-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './time-track-report.component.html',
  styleUrls: ['./time-track-report.component.css']
})
export class TimeTrackReportComponent implements OnInit {
  agents: any[] = [];
  selectedAgent: string = 'all';
  selectedDate: string = '';
  loading = false;
  chartData: any[] = [];
  chartInstance: any = null;

  // View & Filter states
  chartViewMode: 'bar' | 'line' | 'heatmap' = 'bar';
  tableFilter: 'active' | 'all' = 'active';
  rightTab: 'dayparts' | 'log' = 'dayparts';
  selectedHourDetail: HourlyItem | null = null;

  // KPIs
  totalFollowups: number = 0;
  busiestHour: string = '--:--';
  busiestHourCount: number = 0;
  averagePerHour: number = 0;
  activeHoursCount: number = 0;
  averagePerActiveHour: number = 0;
  dominantDayPart: string = 'N/A';
  dominantDayPartPct: number = 0;

  // Day parts breakdown
  dayParts = {
    morning: { count: 0, pct: 0, label: 'Morning (06:00 - 12:00)', icon: 'bi-sunrise' },
    afternoon: { count: 0, pct: 0, label: 'Afternoon (12:00 - 18:00)', icon: 'bi-sun' },
    evening: { count: 0, pct: 0, label: 'Evening (18:00 - 22:00)', icon: 'bi-sunset' },
    night: { count: 0, pct: 0, label: 'Night (22:00 - 06:00)', icon: 'bi-moon-stars' }
  };

  // Hourly table list
  hourlyTableData: HourlyItem[] = [];

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.selectedDate = `${year}-${month}-${day}`;
  }

  ngOnInit(): void {
    this.loadAgents();
    this.loadData();
  }

  loadAgents() {
    this.api.get('/settings/team').subscribe({
      next: (res: any) => {
        if (res.success && Array.isArray(res.data)) {
          this.agents = res.data.filter((u: any) => u.is_active !== 0 && u.is_active !== false);
        }
      },
      error: (err) => console.error('Failed to load agents', err)
    });
  }

  loadData() {
    this.loading = true;
    this.selectedHourDetail = null;
    this.api.get(`/reports/time-track?agent=${this.selectedAgent}&date=${this.selectedDate}`).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.chartData = res.data || [];
          this.calculateKPIs();
          if (this.chartViewMode !== 'heatmap') {
            this.renderChart();
          }
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Failed to load time track data', err);
        this.chartData = Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          count: 0
        }));
        this.calculateKPIs();
        if (this.chartViewMode !== 'heatmap') {
          this.renderChart();
        }
      }
    });
  }

  calculateKPIs() {
    this.totalFollowups = this.chartData.reduce((sum, d) => sum + (d.count || 0), 0);
    
    let max = 0;
    let maxHour = 0;
    let activeHours = 0;
    let morningCount = 0;
    let afternoonCount = 0;
    let eveningCount = 0;
    let nightCount = 0;

    this.chartData.forEach(d => {
      const c = d.count || 0;
      if (c > max) {
        max = c;
        maxHour = d.hour;
      }
      if (c > 0) {
        activeHours++;
      }

      // Day parts aggregation
      if (d.hour >= 6 && d.hour < 12) {
        morningCount += c;
      } else if (d.hour >= 12 && d.hour < 18) {
        afternoonCount += c;
      } else if (d.hour >= 18 && d.hour < 22) {
        eveningCount += c;
      } else {
        nightCount += c;
      }
    });
    
    this.busiestHourCount = max;
    this.busiestHour = this.totalFollowups > 0 ? this.formatHourRange(maxHour) : '--:--';
    this.activeHoursCount = activeHours;
    this.averagePerHour = this.totalFollowups > 0 ? Math.round(this.totalFollowups / 24) : 0;
    this.averagePerActiveHour = activeHours > 0 ? +(this.totalFollowups / activeHours).toFixed(1) : 0;

    // Day parts calculation
    const total = this.totalFollowups || 1;
    this.dayParts.morning.count = morningCount;
    this.dayParts.morning.pct = Math.round((morningCount / total) * 100);

    this.dayParts.afternoon.count = afternoonCount;
    this.dayParts.afternoon.pct = Math.round((afternoonCount / total) * 100);

    this.dayParts.evening.count = eveningCount;
    this.dayParts.evening.pct = Math.round((eveningCount / total) * 100);

    this.dayParts.night.count = nightCount;
    this.dayParts.night.pct = Math.round((nightCount / total) * 100);

    // Dominant day part
    const parts = [
      { name: 'Morning', count: morningCount, pct: this.dayParts.morning.pct },
      { name: 'Afternoon', count: afternoonCount, pct: this.dayParts.afternoon.pct },
      { name: 'Evening', count: eveningCount, pct: this.dayParts.evening.pct },
      { name: 'Night', count: nightCount, pct: this.dayParts.night.pct }
    ];
    parts.sort((a, b) => b.count - a.count);
    if (this.totalFollowups > 0 && parts[0].count > 0) {
      this.dominantDayPart = parts[0].name;
      this.dominantDayPartPct = parts[0].pct;
    } else {
      this.dominantDayPart = 'None';
      this.dominantDayPartPct = 0;
    }

    // Build hourly table data
    this.hourlyTableData = this.chartData.map(d => {
      const c = d.count || 0;
      const pct = this.totalFollowups > 0 ? +((c / this.totalFollowups) * 100).toFixed(1) : 0;
      let dayPart = 'Night';
      if (d.hour >= 6 && d.hour < 12) dayPart = 'Morning';
      else if (d.hour >= 12 && d.hour < 18) dayPart = 'Afternoon';
      else if (d.hour >= 18 && d.hour < 22) dayPart = 'Evening';

      let statusLevel: 'peak' | 'high' | 'steady' | 'inactive' = 'inactive';
      if (c === this.busiestHourCount && c > 0) {
        statusLevel = 'peak';
      } else if (c >= Math.max(10, this.busiestHourCount * 0.4)) {
        statusLevel = 'high';
      } else if (c > 0) {
        statusLevel = 'steady';
      }

      return {
        hour: d.hour,
        count: c,
        timeRange: this.formatHourRange(d.hour),
        label12: this.formatHour12(d.hour),
        label24: `${String(d.hour).padStart(2, '0')}:00 - ${String(d.hour + 1).padStart(2, '0')}:00`,
        dayPart,
        percentage: pct,
        isPeak: c === this.busiestHourCount && c > 0,
        statusLevel
      };
    });
  }

  get filteredTableData(): HourlyItem[] {
    if (this.tableFilter === 'active') {
      return this.hourlyTableData.filter(item => item.count > 0);
    }
    return this.hourlyTableData;
  }

  formatHour12(hour: number): string {
    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
  }

  formatHourRange(hour: number): string {
    const start = this.formatHour12(hour);
    const end = this.formatHour12((hour + 1) % 24);
    return `${start} - ${end}`;
  }

  setChartView(mode: 'bar' | 'line' | 'heatmap') {
    this.chartViewMode = mode;
    this.cdr.detectChanges();
    if (mode !== 'heatmap') {
      setTimeout(() => this.renderChart(), 50);
    }
  }

  selectHour(item: HourlyItem) {
    if (this.selectedHourDetail && this.selectedHourDetail.hour === item.hour) {
      this.selectedHourDetail = null;
    } else {
      this.selectedHourDetail = item;
    }
  }

  setPresetDate(preset: 'today' | 'yesterday') {
    const d = new Date();
    if (preset === 'yesterday') {
      d.setDate(d.getDate() - 1);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    this.selectedDate = `${year}-${month}-${day}`;
    this.loadData();
  }

  getSelectedAgentName(): string {
    if (this.selectedAgent === 'all') return 'All Staff Members';
    const found = this.agents.find(a => String(a.id) === String(this.selectedAgent));
    return found ? found.name : 'Selected Staff';
  }

  getHeatmapColor(count: number): string {
    if (count === 0) return '#f1f5f9';
    if (!this.busiestHourCount) return '#e0e7ff';
    const ratio = count / this.busiestHourCount;
    if (ratio >= 0.75) return '#4f46e5';
    if (ratio >= 0.45) return '#6366f1';
    if (ratio >= 0.2) return '#818cf8';
    return '#c7d2fe';
  }

  getHeatmapTextColor(count: number): string {
    if (count === 0) return '#94a3b8';
    if (!this.busiestHourCount) return '#312e81';
    const ratio = count / this.busiestHourCount;
    return ratio >= 0.45 ? '#ffffff' : '#312e81';
  }

  exportCSV() {
    if (!this.hourlyTableData || !this.hourlyTableData.length) return;

    const headers = ['Hour (24h)', 'Time Range (12h)', 'Day Part', 'Follow-up Count', 'Share of Total (%)', 'Status'];
    const rows = this.hourlyTableData.map(item => [
      `"${item.label24}"`,
      `"${item.timeRange}"`,
      `"${item.dayPart}"`,
      item.count,
      `${item.percentage}%`,
      `"${item.statusLevel.toUpperCase()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Trackbox_Hourly_Report_${this.selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  renderChart() {
    this.cdr.detectChanges();
    const canvas = document.getElementById('timeTrackChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    const labels = this.chartData.map(d => this.formatHour12(d.hour));
    const dataPoints = this.chartData.map(d => d.count || 0);

    const ctx = canvas.getContext('2d');
    let gradient: any = 'rgba(79, 70, 229, 0.2)';
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, 360);
      grad.addColorStop(0, 'rgba(79, 70, 229, 0.85)');
      grad.addColorStop(0.65, 'rgba(99, 102, 241, 0.4)');
      grad.addColorStop(1, 'rgba(99, 102, 241, 0.02)');
      gradient = grad;
    }

    const isLine = this.chartViewMode === 'line';

    this.chartInstance = new Chart(canvas, {
      type: isLine ? 'line' : 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Follow-ups',
          data: dataPoints,
          backgroundColor: isLine ? gradient : dataPoints.map(c => c === this.busiestHourCount && c > 0 ? '#4338CA' : '#6366F1'),
          borderColor: '#4F46E5',
          borderWidth: isLine ? 3 : 0,
          borderRadius: isLine ? 0 : 8,
          borderSkipped: false,
          fill: isLine,
          tension: 0.4,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#4F46E5',
          pointBorderWidth: 2,
          pointRadius: isLine ? 4 : 0,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: '#4F46E5',
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 3,
          hoverBackgroundColor: '#4338CA'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1200,
          easing: 'easeOutQuart'
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#f8fafc',
            bodyColor: '#38bdf8',
            titleFont: { size: 13, family: 'Plus Jakarta Sans', weight: 'bold' },
            bodyFont: { size: 14, family: 'Plus Jakarta Sans', weight: 'bold' },
            padding: 14,
            cornerRadius: 10,
            displayColors: false,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            callbacks: {
              title: (items: any) => `Time: ${items[0].label}`,
              label: (item: any) => `Follow-ups: ${item.raw} action${Number(item.raw) === 1 ? '' : 's'}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              color: '#94a3b8',
              font: { family: 'Plus Jakarta Sans', size: 11 }
            },
            grid: {
              color: 'rgba(226, 232, 240, 0.6)'
            },
            border: { display: false }
          },
          x: {
            grid: { display: false },
            ticks: {
              color: '#94a3b8',
              font: { family: 'Plus Jakarta Sans', size: 11 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 12
            },
            border: { display: false }
          }
        },
        interaction: { intersect: false, mode: 'index' }
      }
    } as any);
  }
}
