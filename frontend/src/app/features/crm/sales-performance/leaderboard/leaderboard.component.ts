import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.css'
})
export class LeaderboardComponent {
  searchTerm: string = '';

  leaderboard = [
    { rank: 1, assignee: 'Jane Smith', role: 'Sales Manager', target: '₹120,000', achieved: '₹130,000', attainment: 108, winRate: '68%' },
    { rank: 2, assignee: 'Emily Davis', role: 'Sales Executive', target: '₹60,000', achieved: '₹58,000', attainment: 96, winRate: '62%' },
    { rank: 3, assignee: 'John Doe', role: 'Sales Executive', target: '₹50,000', achieved: '₹35,000', attainment: 70, winRate: '55%' },
    { rank: 4, assignee: 'Robert Johnson', role: 'Sales Executive', target: '₹40,000', achieved: '₹15,000', attainment: 37, winRate: '42%' },
    { rank: 5, assignee: 'Michael Wilson', role: 'Sales Executive', target: '₹45,000', achieved: '₹10,000', attainment: 22, winRate: '35%' }
  ];

  get filteredLeaderboard() {
    if (!this.searchTerm) return this.leaderboard;
    return this.leaderboard.filter(l => 
      l.assignee.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getRankBadge(rank: number): string {
    if (rank === 1) return 'bi bi-trophy-fill text-warning fs-5'; // Gold
    if (rank === 2) return 'bi bi-award-fill text-secondary fs-5'; // Silver
    if (rank === 3) return 'bi bi-award-fill text-danger fs-5'; // Bronze (using danger roughly as bronze/copper)
    return 'fw-bold text-muted';
  }

  getAttainmentColor(attainment: number): string {
    if (attainment >= 100) return '#22c55e'; // Green
    if (attainment >= 70) return '#3b82f6'; // Blue
    if (attainment >= 50) return '#f97316'; // Orange
    return '#ef4444'; // Red
  }
}

