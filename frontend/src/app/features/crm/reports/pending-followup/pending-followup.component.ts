import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pending-followup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pending-followup.component.html',
  styleUrl: './pending-followup.component.css'
})
export class PendingFollowupComponent {
  searchTerm: string = '';
  
  followups = [
    { id: 'FLW-001', leadName: 'Acme Corp', contact: 'John Smith', phone: '+1 555-0192', dueDate: '2023-10-25', status: 'Overdue', assignee: 'Jane Doe' },
    { id: 'FLW-002', leadName: 'TechFlow Inc', contact: 'Sarah Jenkins', phone: '+1 555-0193', dueDate: '2023-10-26', status: 'Due Today', assignee: 'Robert Johnson' },
    { id: 'FLW-003', leadName: 'Global Industries', contact: 'Mike Davis', phone: '+1 555-0194', dueDate: '2023-10-26', status: 'Due Today', assignee: 'Jane Doe' },
    { id: 'FLW-004', leadName: 'StartupHub', contact: 'Emily Clark', phone: '+1 555-0195', dueDate: '2023-10-27', status: 'Upcoming', assignee: 'Michael Wilson' }
  ];

  get filteredFollowups() {
    if (!this.searchTerm) return this.followups;
    return this.followups.filter(f => 
      f.leadName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      f.assignee.toLowerCase().includes(this.searchTerm.toLowerCase())
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

