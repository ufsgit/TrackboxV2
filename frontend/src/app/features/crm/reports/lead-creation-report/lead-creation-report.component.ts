import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-lead-creation-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lead-creation-report.component.html',
  styleUrl: './lead-creation-report.component.css'
})
export class LeadCreationReportComponent implements OnInit {
  loading: boolean = true;
  refreshing: boolean = false;

  dateRange: string = 'ytd';
  customStartDate: string = '';
  customEndDate: string = '';
  isDateDropdownOpen: boolean = false;

  totalLeads: number = 0;
  rangeLeads: number = 0;
  todayLeads: number = 0;
  weekLeads: number = 0;
  breakdown: any[] = [];

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.fetchData();
  }

  fetchData(isRefresh = false) {
    if (isRefresh) {
      this.refreshing = true;
    } else {
      this.loading = true;
    }

    let endpoint = `/reports/leads/creation?dateRange=${this.dateRange}`;
    if (this.dateRange === 'custom') {
      if (!this.customStartDate || !this.customEndDate) {
        this.loading = false;
        this.refreshing = false;
        return;
      }
      endpoint += `&startDate=${this.customStartDate}&endDate=${this.customEndDate}`;
    }

    this.api.get(endpoint).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.totalLeads = res.data.totalLeads || 0;
          this.rangeLeads = res.data.rangeLeads || 0;
          this.todayLeads = res.data.todayLeads || 0;
          this.weekLeads = res.data.weekLeads || 0;
          this.breakdown = res.data.breakdown || [];
        }
        setTimeout(() => {
          this.loading = false;
          this.refreshing = false;
          this.cdr.detectChanges();
        }, 150);
      },
      error: (err: any) => {
        console.error('Failed to load lead creation report', err);
        this.loading = false;
        this.refreshing = false;
      }
    });
  }

  toggleDateDropdown() {
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
    return labels[this.dateRange] || 'Year to Date';
  }

  getContributionPercent(leads: number): number {
    if (!this.rangeLeads || this.rangeLeads === 0) return 0;
    return Math.round((leads / this.rangeLeads) * 100);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getAvatarColor(index: number): string {
    const colors = ['#6366f1', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#14b8a6'];
    return colors[index % colors.length];
  }
}
