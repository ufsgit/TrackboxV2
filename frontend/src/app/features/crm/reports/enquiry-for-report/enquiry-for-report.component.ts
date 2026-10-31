import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { ApiService } from '../../../../core/services/api.service';

Chart.register(...registerables);

export interface EnquiryItem {
  id?: number;
  name: string;
  count: number;
}

@Component({
  selector: 'app-enquiry-for-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './enquiry-for-report.component.html',
  styleUrls: ['./enquiry-for-report.component.css']
})
export class EnquiryForReportComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  chart: Chart | null = null;

  // Loading & State
  loading: boolean = false;
  refreshing: boolean = false;
  showAll: boolean = false;

  // Date Filter State
  isDateDropdownOpen: boolean = false;
  dateRange: string = 'ytd'; // default Year to Date
  customStartDate: string = '';
  customEndDate: string = '';

  // Peak statistic for the chart header
  chartPeakLabel: string = 'Peak: 0';

  // API Data
  totalLeadsCount: number = 0;
  enquiryList: EnquiryItem[] = [];

  // Modern vibrant palette for bars
  private palette: string[] = [
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#6366f1', // Indigo
    '#14b8a6', // Teal
    '#f97316', // Orange
    '#64748b'  // Slate
  ];

  constructor(
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  // Top 4 items (descending)
  get topEnquiries(): EnquiryItem[] {
    return [...this.enquiryList]
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }

  // The rest of the items beyond top 4
  get remainingEnquiries(): EnquiryItem[] {
    return [...this.enquiryList]
      .sort((a, b) => b.count - a.count)
      .slice(4);
  }

  ngOnInit(): void {
    this.fetchData();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  toggleShowAll(): void {
    this.showAll = !this.showAll;
  }

  toggleDateDropdown(): void {
    this.isDateDropdownOpen = !this.isDateDropdownOpen;
  }

  selectDateRange(range: string): void {
    this.dateRange = range;
    if (range !== 'custom') {
      this.isDateDropdownOpen = false;
      this.fetchData();
    }
  }

  applyCustomDate(): void {
    if (this.customStartDate && this.customEndDate) {
      this.isDateDropdownOpen = false;
      this.fetchData();
    }
  }

  resetToDefault(): void {
    this.dateRange = 'ytd';
    this.customStartDate = '';
    this.customEndDate = '';
    this.isDateDropdownOpen = false;
    this.refreshing = true;
    this.fetchData(() => {
      this.refreshing = false;
    });
  }

  getDateRangeLabel(): string {
    switch (this.dateRange) {
      case 'today': return 'Today';
      case 'this_week': return 'This Week';
      case 'this_month': return 'This Month';
      case 'last_month': return 'Last Month';
      case 'ytd': return 'Year to Date';
      case 'custom': return 'Custom Range';
      default: return 'Year to Date';
    }
  }

  getCalculatedDates(): { startDate: string; endDate: string } {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (this.dateRange === 'today') {
      const todayStr = toDateStr(now);
      return { startDate: todayStr, endDate: todayStr };
    }

    if (this.dateRange === 'this_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      return { startDate: toDateStr(monday), endDate: toDateStr(new Date()) };
    }

    if (this.dateRange === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: toDateStr(start), endDate: toDateStr(now) };
    }

    if (this.dateRange === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: toDateStr(start), endDate: toDateStr(end) };
    }

    if (this.dateRange === 'custom' && this.customStartDate && this.customEndDate) {
      return { startDate: this.customStartDate, endDate: this.customEndDate };
    }

    const startOfYear = new Date(now.getFullYear(), 0, 1);
    return { startDate: toDateStr(startOfYear), endDate: toDateStr(now) };
  }

  fetchData(callback?: () => void): void {
    this.loading = true;
    const { startDate, endDate } = this.getCalculatedDates();

    const url = `/reports/leads/enquiry-for?startDate=${startDate}&endDate=${endDate}`;

    this.api.get(url).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res && res.success && res.data) {
          this.totalLeadsCount = res.data.totalCount || 0;
          this.enquiryList = res.data.categories || [];
        } else {
          this.totalLeadsCount = 0;
          this.enquiryList = [];
        }
        this.cdr.detectChanges();
        this.renderChart();
        if (callback) callback();
      },
      error: (err) => {
        console.error('Error fetching enquiry for report:', err);
        this.loading = false;
        this.totalLeadsCount = 0;
        this.enquiryList = [];
        this.cdr.detectChanges();
        this.renderChart();
        if (callback) callback();
      }
    });
  }

  viewLeads(item?: EnquiryItem): void {
    const queryParams: any = {};
    if (item && item.id) {
      queryParams.enquiry_for = item.id;
    }
    this.router.navigate(['/contacts'], { queryParams });
  }

  renderChart(): void {
    if (!this.chartCanvas) return;
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
    }

    // Sort categories descending for clean comparative visualization
    const sorted = [...this.enquiryList].sort((a, b) => b.count - a.count);

    const labels = sorted.map(c => c.name);
    const values = sorted.map(c => Number(c.count || 0));
    const colors = sorted.map((_, i) => this.palette[i % this.palette.length]);

    // Peak / Top Category Label (handles ties gracefully)
    const maxVal = values.length > 0 ? Math.max(...values) : 0;
    if (maxVal > 0) {
      const topItems = sorted.filter(c => Number(c.count || 0) === maxVal);
      if (topItems.length > 1) {
        // Tie between multiple categories
        this.chartPeakLabel = `Top: Tied (${maxVal} leads each)`;
      } else {
        this.chartPeakLabel = `Top: ${topItems[0].name} (${maxVal})`;
      }
    } else {
      this.chartPeakLabel = 'Top: 0';
    }
    const calculatedMax = maxVal > 0 ? Math.ceil(maxVal * 1.3) : 5;

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.length > 0 ? labels : ['No Enquiries'],
        datasets: [
          {
            label: 'Total Leads',
            data: values.length > 0 ? values : [0],
            backgroundColor: colors.length > 0 ? colors : ['#3b82f6'],
            borderRadius: 8,
            borderSkipped: false,
            maxBarThickness: 46
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#ffffff',
            bodyColor: '#e2e8f0',
            padding: 10,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: (context) => ` Total Leads: ${context.parsed.y}`
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#475569',
              font: {
                size: 11.5,
                weight: 'bold',
                family: "'Inter', sans-serif"
              },
              maxRotation: 0,
              autoSkip: false
            }
          },
          y: {
            beginAtZero: true,
            min: 0,
            suggestedMax: calculatedMax,
            grid: {
              color: '#f1f5f9'
            },
            ticks: {
              stepSize: calculatedMax <= 5 ? 1 : undefined,
              precision: 0,
              color: '#94a3b8',
              font: {
                size: 11.5,
                family: "'Inter', sans-serif"
              }
            }
          }
        }
      }
    });
  }
}
