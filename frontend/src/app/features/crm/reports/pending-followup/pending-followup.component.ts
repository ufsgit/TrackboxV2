import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-pending-followup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './pending-followup.component.html',
  styleUrl: './pending-followup.component.css'
})
export class PendingFollowupComponent implements OnInit {
  searchTerm: string = '';
  
  followups: any[] = [];
  stats = { overdue: 0, dueToday: 0, upcoming: 0 };
  displayStats = { overdue: 0, dueToday: 0, upcoming: 0 };
  filterParam: string | null = null;

  constructor(
    private apiService: ApiService, 
    private datePipe: DatePipe,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.filterParam = params['filter'] || null;
    });
    this.fetchData();
  }

  fetchData() {
    this.apiService.get('/reports/leads/pending-followups').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.stats = {
            overdue: res.data.overdue || 0,
            dueToday: res.data.dueToday || 0,
            upcoming: res.data.upcoming || 0
          };
          this.animateCount('overdue', this.stats.overdue);
          this.animateCount('dueToday', this.stats.dueToday);
          this.animateCount('upcoming', this.stats.upcoming);

          this.followups = res.data.list.map((f: any) => ({
            ...f,
            dueDate: this.datePipe.transform(f.dueDate, 'yyyy-MM-dd')
          }));
        }
      },
      error: (err) => {
        console.error('Error fetching pending followups:', err);
      }
    });
  }

  animateCount(key: 'overdue' | 'dueToday' | 'upcoming', target: number) {
    if (!target || target <= 0) {
      this.displayStats[key] = 0;
      return;
    }
    const duration = 1200;
    const startTime = performance.now();
    const startVal = 0;

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      this.displayStats[key] = Math.floor(startVal + (target - startVal) * easeProgress);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        this.displayStats[key] = target;
      }
    };
    requestAnimationFrame(step);
  }

  get pageTitle() {
    return this.filterParam === 'upcoming' ? 'Upcoming Follow-ups' : 'Pending Follow-ups';
  }
  
  get pageSubtitle() {
    return this.filterParam === 'upcoming' ? 'Track and manage leads scheduled for the future' : 'Track and manage leads that need attention';
  }

  get filteredFollowups() {
    let filtered = this.followups;
    if (this.filterParam === 'upcoming') {
      filtered = filtered.filter(f => f.status === 'Upcoming');
    }
    
    if (!this.searchTerm) return filtered;
    return filtered.filter(f => 
      f.leadName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      f.assignee?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'Overdue': return 'badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle px-3 py-2';
      case 'Due Today': return 'badge rounded-pill bg-warning-subtle text-warning border border-warning-subtle px-3 py-2';
      case 'Upcoming': return 'badge rounded-pill bg-info-subtle text-info border border-info-subtle px-3 py-2';
      default: return 'badge rounded-pill bg-light text-dark px-3 py-2';
    }
  }
}


