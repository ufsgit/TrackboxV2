import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

@Component({
  selector: 'app-team-productivity-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './team-productivity-report.component.html',
  styleUrl: './team-productivity-report.component.css'
})
export class TeamProductivityReportComponent implements OnInit {
  loading: boolean = true;
  refreshing: boolean = false;
  
  selectedDate: string = new Date().toISOString().split('T')[0];
  selectedEmployee: string = 'All';
  
  users: any[] = [];
  
  teamProductivity: any[] = [];
  todaysActivity: any[] = [];
  activityTimeline: any[] = [];
  
  totalActivityCount: number = 0;

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800, easing: 'easeOutQuart' } as any,
    scales: {
      x: { 
        title: { display: true, text: 'Time' },
        grid: { color: 'rgba(0,0,0,0.05)' }
      },
      y: { 
        beginAtZero: true,
        title: { display: true, text: 'Activity Count' },
        ticks: { stepSize: 1 }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', padding: 12, cornerRadius: 8 }
    }
  };

  public lineChartData: ChartData<'line'> = { labels: [], datasets: [] };
  
  isBrowser = false;

  constructor(
    private cdr: ChangeDetectorRef, 
    private api: ApiService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.fetchDropdowns();
    this.fetchData();
  }

  fetchDropdowns() {
    this.api.get('/settings/team').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.users = res.data.filter((u: any) => u.role === 'agent');
        }
      },
      error: (err: any) => console.error('Failed to load users', err)
    });
  }

  fetchData(isRefresh = false) {
    if (isRefresh) {
      this.refreshing = true;
    } else {
      this.loading = true;
    }
    
    let endpoint = `/reports/leads/team-productivity?date=${this.selectedDate}`;

    if (this.selectedEmployee && this.selectedEmployee !== 'All') {
      endpoint += `&employee=${encodeURIComponent(this.selectedEmployee)}`;
    }

    this.api.get(endpoint).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.teamProductivity = res.data.teamProductivity;
          this.todaysActivity = res.data.todaysActivity;
          this.activityTimeline = res.data.activityTimeline;
          
          this.totalActivityCount = this.todaysActivity.reduce((acc, curr) => acc + curr.count, 0);
          
          this.updateTimelineChart();
        }
        setTimeout(() => {
          this.loading = false;
          this.refreshing = false;
          this.cdr.detectChanges();
        }, 150);
      },
      error: (err: any) => {
        console.error('Failed to load team productivity report', err);
        this.loading = false;
        this.refreshing = false;
      }
    });
  }

  updateTimelineChart() {
    // Generate hours 9 AM to 6 PM mapping to labels
    const businessHours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    const labels = businessHours.map(h => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayHour = h > 12 ? h - 12 : h;
      return `${displayHour} ${ampm}`;
    });
    
    const dataPoints = businessHours.map(h => {
      const match = this.activityTimeline.find(t => t.hour === h);
      return match ? match.count : 0;
    });

    this.lineChartData = {
      labels: labels,
      datasets: [
        { 
          data: dataPoints, 
          label: 'Activity Count', 
          borderColor: '#8b5cf6', // A purple tone
          backgroundColor: 'rgba(139, 92, 246, 0.2)', 
          pointBackgroundColor: '#8b5cf6',
          tension: 0.4,
          fill: true
        }
      ]
    };
  }

  getInitials(name: string): string {
    if (!name || name === 'Unassigned') return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getStatusColor(index: number): string {
    const colors = [
      '#8b5cf6', // purple
      '#0ea5e9', // light blue
      '#10b981', // emerald
      '#f59e0b', // amber
      '#f43f5e', // rose
      '#6366f1', // indigo
      '#14b8a6'  // teal
    ];
    return colors[index % colors.length];
  }
}
