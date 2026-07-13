import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './achievements.component.html',
  styleUrl: './achievements.component.css'
})
export class AchievementsComponent {
  searchTerm: string = '';
  isViewModalOpen: boolean = false;
  selectedAchievement: any = null;

  achievements = [
    { id: 'ACH-1001', date: '2023-09-15', assignee: 'Jane Smith', client: 'Acme Corp', dealName: 'Enterprise License', revenue: '₹45,000', status: 'Closed Won' },
    { id: 'ACH-1002', date: '2023-09-12', assignee: 'John Doe', client: 'TechFlow Inc', dealName: 'Annual Support Contract', revenue: '₹12,500', status: 'Closed Won' },
    { id: 'ACH-1003', date: '2023-09-10', assignee: 'Emily Davis', client: 'Global Industries', dealName: 'Q3 Product Supply', revenue: '₹58,000', status: 'Closed Won' },
    { id: 'ACH-1004', date: '2023-09-08', assignee: 'Jane Smith', client: 'StartupHub', dealName: 'Consulting Services', revenue: '₹8,000', status: 'Closed Won' },
    { id: 'ACH-1005', date: '2023-09-05', assignee: 'Robert Johnson', client: 'Retail Giant', dealName: 'Hardware Setup', revenue: '₹15,000', status: 'Closed Won' }
  ];

  get filteredAchievements() {
    if (!this.searchTerm) return this.achievements;
    return this.achievements.filter(a => 
      a.assignee.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
      a.client.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      a.dealName.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  openViewModal(achievement: any) {
    this.selectedAchievement = achievement;
    this.isViewModalOpen = true;
  }

  closeViewModal() {
    this.isViewModalOpen = false;
    this.selectedAchievement = null;
  }

  exportReport() {
    console.log('Exporting achievements report...');
  }
}

