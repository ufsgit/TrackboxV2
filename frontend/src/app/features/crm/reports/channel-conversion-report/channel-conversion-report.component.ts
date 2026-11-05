import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-channel-conversion-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './channel-conversion-report.component.html',
  styleUrl: './channel-conversion-report.component.css'
})
export class ChannelConversionReportComponent implements OnInit, AfterViewInit, OnDestroy {
  loading: boolean = true;
  refreshing: boolean = false;
  dateRange: string = 'ytd';
  customStartDate: string = '';
  customEndDate: string = '';

  selectedSource: string = 'All';
  isSourceDropdownOpen: boolean = false;
  sourceSearchQuery: string = '';
  allSourcesData: any[] = [];
  availableSources: Array<{ name: string; total_leads: number; color?: string }> = [];
  
  data: any[] = [];
  topChannels4: any[] = [];
  topChannels3: any[] = [];

  totals: any = { leads: 0, won: 0, lost: 0, conversion: 0, loss: 0 };
  animatedTotals: any = { leads: 0, won: 0, lost: 0, conversion: 0 };

  private countTimer: any = null;
  private apiSub: Subscription | null = null;

  // Common Colors for consistency
  colorMap: any = {
    whatsapp: '#25D366',
    'whats app': '#25D366',
    instagram: '#E1306C',
    facebook: '#1877F2',
    messenger: '#0084FF',
    linkedin: '#0A66C2',
    linkdin: '#0A66C2',
    website: '#0DCAF0',
    rcs: '#198754',
    sms: '#6F42C1',
    referral: '#FFC107',
    referrals: '#FFC107',
    'google ads': '#4285F4',
    google: '#4285F4',
    twiter: '#1DA1F2',
    twitter: '#1DA1F2',
    others: '#64748B',
    other: '#6C757D'
  };

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: 'easeOutQuart' } as any,
    scales: {
      y: { 
        beginAtZero: true, 
        suggestedMax: 5,
        grid: { color: 'rgba(0,0,0,0.03)' },
        ticks: { precision: 0, stepSize: 1, font: { size: 10 } }
      },
      x: { 
        grid: { display: false },
        ticks: { font: { size: 11, weight: 'bold' } }
      }
    },
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 7, font: { size: 11, weight: 'bold' } } },
      tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', padding: 10, cornerRadius: 8 }
    }
  };

  public pieChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { animateRotate: true, animateScale: true, duration: 600, easing: 'easeInOutQuart' } as any,
    plugins: {
      legend: { 
        display: false 
      },
      tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', padding: 10, cornerRadius: 8 }
    },
    cutout: '72%'
  };

  public barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public pieChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  
  isBrowser = false;

  // Custom Dropdown State
  isDateDropdownOpen: boolean = false;
  activeViewTab: 'charts' | 'table' | 'split' = 'charts';

  constructor(
    private cdr: ChangeDetectorRef, 
    private ngZone: NgZone,
    private api: ApiService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.fetchChannelsTable();
    this.fetchData();
  }

  fetchChannelsTable() {
    this.api.get('/system-settings/channels').subscribe({
      next: (res: any) => {
        if (res && res.success && Array.isArray(res.data)) {
          if (this.availableSources.length === 0) {
            this.availableSources = res.data.map((ch: any) => ({
              id: ch.id,
              name: ch.name,
              total_leads: 0,
              color: this.getChannelColor(ch.name)
            }));
          } else {
            this.mergeChannels(res.data);
          }
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        console.error('Error fetching trackboxv2.channels:', err);
      }
    });
  }

  private mergeChannels(dbChannels: any[]) {
    const countsMap = new Map<string, number>();
    for (const s of this.availableSources) {
      const k = (s.name || '').toLowerCase().replace(/\s+/g, '');
      countsMap.set(k, s.total_leads || 0);
    }

    this.availableSources = dbChannels.map((ch: any) => {
      const k = (ch.name || '').toLowerCase().replace(/\s+/g, '');
      return {
        id: ch.id,
        name: ch.name,
        total_leads: countsMap.get(k) || 0,
        color: this.getChannelColor(ch.name)
      };
    }).sort((a, b) => b.total_leads - a.total_leads);
  }

  ngAfterViewInit() {
    // any post-init if needed
  }

  ngOnDestroy() {
    if (this.countTimer) {
      clearInterval(this.countTimer);
      this.countTimer = null;
    }
    if (this.apiSub) {
      this.apiSub.unsubscribe();
      this.apiSub = null;
    }
  }

  onDocumentClick() {
    this.isDateDropdownOpen = false;
    this.isSourceDropdownOpen = false;
  }

  get filteredSources(): Array<{ name: string; total_leads: number; color?: string }> {
    const q = (this.sourceSearchQuery || '').trim().toLowerCase();
    if (!q) return this.availableSources;
    return this.availableSources.filter(s => s.name.toLowerCase().includes(q));
  }

  getSelectedSourceName(): string {
    if (!this.selectedSource || this.selectedSource === 'All') {
      return 'All Sources';
    }
    return this.selectedSource.toUpperCase();
  }

  toggleSourceDropdown(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.isDateDropdownOpen = false;
    this.isSourceDropdownOpen = !this.isSourceDropdownOpen;
  }

  selectSource(sourceName: string) {
    this.selectedSource = sourceName;
    this.isSourceDropdownOpen = false;

    // Instant local filter if we already have the baseline all-sources data
    if (sourceName !== 'All' && this.allSourcesData && this.allSourcesData.length > 0) {
      const key = sourceName.toLowerCase().replace(/\s+/g, '');
      const matched = this.allSourcesData.filter(d => (d.channel || '').toLowerCase().replace(/\s+/g, '') === key);
      if (matched.length > 0) {
        this.data = matched.map(row => ({ ...row, color: this.getChannelColor(row.channel) }));
      } else {
        this.data = [{
          channel: sourceName,
          total_leads: 0,
          sale_won: 0,
          sale_lost: 0,
          conversion_rate: '0.0',
          loss_rate: '0.0',
          color: this.getChannelColor(sourceName)
        }];
      }
      this.calculateTotals();
      this.prepareTopChannels();
      this.updateCharts();
      if (this.isBrowser) {
        this.animateCountUp();
      } else {
        this.animatedTotals = { ...this.totals };
      }
    } else if (sourceName === 'All' && this.allSourcesData && this.allSourcesData.length > 0) {
      this.data = this.allSourcesData.map(row => ({ ...row, color: this.getChannelColor(row.channel) }));
      this.calculateTotals();
      this.prepareTopChannels();
      this.updateCharts();
      if (this.isBrowser) {
        this.animateCountUp();
      } else {
        this.animatedTotals = { ...this.totals };
      }
    }

    this.fetchData();
  }

  setActiveTab(tab: 'charts' | 'table' | 'split') {
    this.activeViewTab = tab;
    this.cdr.detectChanges();
  }

  toggleDateDropdown(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.isSourceDropdownOpen = false;
    this.isDateDropdownOpen = !this.isDateDropdownOpen;
  }

  selectDateRange(range: string) {
    this.dateRange = range;
    if (range !== 'custom') {
      this.isDateDropdownOpen = false;
      this.fetchData();
    }
  }

  applyCustomDate() {
    if (this.customStartDate && this.customEndDate) {
      this.isDateDropdownOpen = false;
      this.fetchData();
    }
  }

  getDateRangeLabel(): string {
    const labels: any = {
      'today': 'Today',
      'this_week': 'This Week',
      'this_month': 'This Month',
      'last_month': 'Last Month',
      'ytd': 'Year to Date',
      'prev_year': 'Previous Year',
      'custom': 'Custom Range'
    };
    return labels[this.dateRange] || 'Date Range';
  }

  getChannelColor(channel: string): string {
    const c = (channel || '').toLowerCase();
    return this.colorMap[c] || this.colorMap['other'];
  }

  fetchData(isRefresh = false) {
    if (this.countTimer) {
      clearInterval(this.countTimer);
      this.countTimer = null;
    }

    if (this.apiSub) {
      this.apiSub.unsubscribe();
      this.apiSub = null;
    }

    if (isRefresh) {
      this.refreshing = true;
    } else {
      this.loading = true;
    }
    
    let endpoint = `/reports/leads/channel-conversion?dateRange=${this.dateRange}`;
    if (this.selectedSource && this.selectedSource !== 'All') {
      endpoint += `&source=${encodeURIComponent(this.selectedSource)}`;
    }
    if (this.dateRange === 'custom') {
      if (!this.customStartDate || !this.customEndDate) {
        this.loading = false;
        this.refreshing = false;
        return;
      }
      endpoint += `&startDate=${this.customStartDate}&endDate=${this.customEndDate}`;
    }

    this.apiSub = this.api.get(endpoint).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          if (res.availableSources && Array.isArray(res.availableSources)) {
            this.availableSources = res.availableSources.map((s: any) => ({
              name: s.name,
              total_leads: Number(s.total_leads) || 0,
              color: this.getChannelColor(s.name)
            }));
          }
          const rawData: any[] = Array.isArray(res.data) ? res.data : [];
          if (!this.selectedSource || this.selectedSource === 'All') {
            this.allSourcesData = rawData;
            // Also sync available sources if not provided by backend
            if (this.availableSources.length === 0) {
              this.availableSources = rawData.map((s: any) => ({
                name: s.channel,
                total_leads: Number(s.total_leads) || 0,
                color: this.getChannelColor(s.channel)
              }));
            }
          }
          this.data = rawData.map((row: any) => ({
            ...row,
            color: this.getChannelColor(row.channel)
          }));
          this.calculateTotals();
          this.prepareTopChannels();
          this.updateCharts();
          if (this.isBrowser) {
            this.animateCountUp();
          } else {
            this.animatedTotals = { ...this.totals };
          }
        } else {
          this.data = [];
          this.calculateTotals();
          this.prepareTopChannels();
          this.updateCharts();
          this.animatedTotals = { ...this.totals };
        }
        this.loading = false;
        this.refreshing = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to load channel conversion report', err);
        this.data = [];
        this.calculateTotals();
        this.prepareTopChannels();
        this.updateCharts();
        this.animatedTotals = { ...this.totals };
        this.loading = false;
        this.refreshing = false;
        this.cdr.detectChanges();
      }
    });
  }

  private prepareTopChannels() {
    if (!this.data || this.data.length === 0) {
      this.topChannels4 = [];
      this.topChannels3 = [];
      return;
    }
    const sorted = [...this.data]
      .sort((a, b) => (Number(b.total_leads) || 0) - (Number(a.total_leads) || 0))
      .map(ch => ({
        ...ch,
        share_percentage: this.totals.leads > 0 ? (((Number(ch.total_leads) || 0) / this.totals.leads) * 100).toFixed(1) : '0'
      }));

    this.topChannels4 = sorted.slice(0, 4);
    this.topChannels3 = sorted.slice(0, 3);
  }

  animateCountUp() {
    if (this.countTimer) {
      clearInterval(this.countTimer);
      this.countTimer = null;
    }

    const duration = 600; // ms
    const steps = 20;
    const interval = duration / steps;
    let currentStep = 0;

    const targets = { ...this.totals };
    this.animatedTotals = { leads: 0, won: 0, lost: 0, conversion: 0 };

    this.ngZone.runOutsideAngular(() => {
      this.countTimer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

        const currentLeads = Math.floor(targets.leads * ease);
        const currentWon = Math.floor(targets.won * ease);
        const currentLost = Math.floor(targets.lost * ease);
        const currentConversion = (targets.conversion * ease).toFixed(1);

        this.ngZone.run(() => {
          this.animatedTotals.leads = currentLeads;
          this.animatedTotals.won = currentWon;
          this.animatedTotals.lost = currentLost;
          this.animatedTotals.conversion = currentConversion;
          this.cdr.detectChanges();
        });

        if (currentStep >= steps) {
          clearInterval(this.countTimer);
          this.countTimer = null;
          this.ngZone.run(() => {
            this.animatedTotals = { ...targets };
            this.cdr.detectChanges();
          });
        }
      }, interval);
    });
  }

  updateCharts() {
    // BAR CHART
    this.barChartData = {
      labels: this.data.map(d => d.channel.toUpperCase()),
      datasets: [
        { 
          data: this.data.map(d => d.sale_won), 
          label: 'Sale Won', 
          backgroundColor: '#10b981', 
          borderRadius: 6, 
          barPercentage: 0.4,
          categoryPercentage: 0.4,
          maxBarThickness: 28
        },
        { 
          data: this.data.map(d => d.sale_lost), 
          label: 'Sale Lost', 
          backgroundColor: '#ef4444', 
          borderRadius: 6, 
          barPercentage: 0.4,
          categoryPercentage: 0.4,
          maxBarThickness: 28
        }
      ]
    };

    // PIE CHART
    let pieLabels: string[] = [];
    let pieData: number[] = [];
    let pieColors: string[] = [];

    const totalLeads = this.totals.leads;
    let otherLeads = 0;

    this.data.forEach(d => {
      if (d.total_leads === 0) return;
      const share = (d.total_leads / totalLeads) * 100;
      if (share < 2) {
        otherLeads += d.total_leads;
      } else {
        pieLabels.push(d.channel.toUpperCase());
        pieData.push(d.total_leads);
        pieColors.push(this.getChannelColor(d.channel));
      }
    });

    if (otherLeads > 0) {
      pieLabels.push('OTHER');
      pieData.push(otherLeads);
      pieColors.push(this.colorMap['other']);
    }

    if (pieData.length === 0) {
      pieLabels = [this.selectedSource !== 'All' ? this.selectedSource.toUpperCase() : 'No Leads'];
      pieData = [1];
      pieColors = ['#e2e8f0'];
    }

    this.pieChartData = {
      labels: pieLabels,
      datasets: [{
        data: pieData,
        backgroundColor: pieColors,
        borderWidth: 0,
        hoverOffset: 4
      }]
    };
  }

  calculateTotals() {
    this.totals = { leads: 0, won: 0, lost: 0, conversion: 0, loss: 0 };
    for (let row of this.data) {
      this.totals.leads += row.total_leads;
      this.totals.won += row.sale_won;
      this.totals.lost += row.sale_lost;
    }
    if (this.totals.leads > 0) {
      this.totals.conversion = ((this.totals.won / this.totals.leads) * 100).toFixed(1);
      this.totals.loss = ((this.totals.lost / this.totals.leads) * 100).toFixed(1);
    }
  }

  getChannelIcon(channel: string): string {
    const c = (channel || '').toLowerCase().replace(/\s+/g, '');
    if (c.includes('facebook') || c.includes('meta')) return 'bi-facebook text-primary';
    if (c.includes('instagram')) return 'bi-instagram text-danger';
    if (c.includes('whatsapp')) return 'bi-whatsapp text-success';
    if (c.includes('link')) return 'bi-linkedin text-primary';
    if (c.includes('twit') || c.includes('x')) return 'bi-twitter-x text-info';
    if (c.includes('google')) return 'bi-google text-primary';
    if (c.includes('web') || c.includes('site')) return 'bi-globe text-info';
    if (c.includes('refer')) return 'bi-people text-warning';
    if (c.includes('messenger')) return 'bi-messenger text-primary';
    if (c.includes('sms')) return 'bi-chat-dots text-purple';
    if (c.includes('rcs')) return 'bi-chat-square-text text-success';
    if (c.includes('other')) return 'bi-three-dots text-secondary';
    return 'bi-funnel-fill text-secondary';
  }

  getTopChannels(limit: number = 3): any[] {
    return limit === 4 ? this.topChannels4 : this.topChannels3;
  }
}
