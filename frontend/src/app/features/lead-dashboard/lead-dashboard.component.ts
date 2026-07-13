import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-lead-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './lead-dashboard.component.html',
  styleUrls: ['./lead-dashboard.component.css']
})
export class LeadDashboardComponent implements OnInit {
  stats: any = {
    totalContacts: 0,
    openConversations: 0,
    messagesToday: 0,
    broadcastReadRate: 0,
    recentConversations: []
  };
  loading = false;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.loading = true;
    this.api.get('/analytics/dashboard').subscribe({
      next: (res: any) => {
        const targetStats = res.data;
        this.animateValue('totalContacts', 0, targetStats.totalContacts, 1200);
        this.animateValue('openConversations', 0, targetStats.openConversations, 1200);
        this.animateValue('messagesToday', 0, targetStats.messagesToday, 1200);
        this.animateValue('broadcastReadRate', 0, targetStats.broadcastReadRate, 1200);
        this.stats.recentConversations = targetStats.recentConversations;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  animateValue(propName: string, start: number, end: number, duration: number) {
    if (start === 0 && end > 50) {
      start = Math.floor(end * 0.6);
    }
    
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 2);
      this.stats[propName] = Math.floor(easeProgress * (end - start) + start);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        this.stats[propName] = end;
      }
    };
    window.requestAnimationFrame(step);
  }
}
