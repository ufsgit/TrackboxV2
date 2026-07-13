import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-underperformers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './underperformers.component.html',
  styleUrl: './underperformers.component.css'
})
export class UnderperformersComponent {
  searchTerm: string = '';

  underperformers = [
    { id: 'PIP-001', assignee: 'Robert Johnson', role: 'Sales Executive', currentAttainment: '37%', target: '₹40,000', shortfall: '₹25,000', status: 'On PIP' },
    { id: 'PIP-002', assignee: 'Michael Wilson', role: 'Sales Executive', currentAttainment: '22%', target: '₹45,000', shortfall: '₹35,000', status: 'Needs Coaching' }
  ];

  get filteredUnderperformers() {
    if (!this.searchTerm) return this.underperformers;
    return this.underperformers.filter(u => 
      u.assignee.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'On PIP': return 'badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle px-3 py-2';
      case 'Needs Coaching': return 'badge rounded-pill bg-warning-subtle text-warning border border-warning-subtle px-3 py-2';
      default: return 'badge rounded-pill bg-secondary-subtle text-secondary px-3 py-2';
    }
  }

  scheduleMeeting(assignee: string) {
    console.log(`Scheduling meeting with ${assignee}`);
  }
}

