import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-incentives',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incentives.component.html',
  styleUrl: './incentives.component.css'
})
export class IncentivesComponent {
  searchTerm: string = '';

  incentives = [
    { id: 'INC-001', assignee: 'Jane Smith', period: 'Q3 2023', baseline: '₹100,000', achieved: '₹130,000', payoutRate: '5%', payoutAmount: '₹1,500', status: 'Approved' },
    { id: 'INC-002', assignee: 'Emily Davis', period: 'Q3 2023', baseline: '₹50,000', achieved: '₹58,000', payoutRate: '5%', payoutAmount: '₹400', status: 'Pending Review' },
    { id: 'INC-003', assignee: 'John Doe', period: 'Q3 2023', baseline: '₹40,000', achieved: '₹35,000', payoutRate: '0%', payoutAmount: '₹0', status: 'Not Eligible' }
  ];

  get filteredIncentives() {
    if (!this.searchTerm) return this.incentives;
    return this.incentives.filter(i => 
      i.assignee.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'Approved': return 'badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-2';
      case 'Pending Review': return 'badge rounded-pill bg-warning-subtle text-warning border border-warning-subtle px-3 py-2';
      case 'Not Eligible': return 'badge rounded-pill bg-secondary-subtle text-secondary border border-secondary-subtle px-3 py-2';
      default: return 'badge rounded-pill bg-light text-dark px-3 py-2';
    }
  }

  exportIncentives() {
    console.log('Exporting incentives...');
  }
}

