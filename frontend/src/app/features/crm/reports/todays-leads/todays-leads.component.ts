import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-todays-leads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './todays-leads.component.html',
  styleUrl: './todays-leads.component.css'
})
export class TodaysLeadsComponent {
  searchTerm: string = '';
  
  leads = [
    { id: 'LD-101', name: 'Alpha Innovations', source: 'Website Contact', value: '₹15,000', assignedTo: 'Unassigned', time: '09:15 AM' },
    { id: 'LD-102', name: 'Beta Solutions', source: 'Referral', value: '₹25,000', assignedTo: 'Jane Doe', time: '10:30 AM' },
    { id: 'LD-103', name: 'Gamma Dynamics', source: 'LinkedIn Campaign', value: '₹8,000', assignedTo: 'Robert Johnson', time: '11:45 AM' },
    { id: 'LD-104', name: 'Delta Logistics', source: 'Direct Call', value: '₹45,000', assignedTo: 'Unassigned', time: '01:20 PM' }
  ];

  get filteredLeads() {
    if (!this.searchTerm) return this.leads;
    return this.leads.filter(l => 
      l.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      l.source.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getAssigneeBadge(assignee: string): string {
    return assignee === 'Unassigned' 
      ? 'badge rounded-pill bg-secondary-subtle text-secondary border border-secondary-subtle px-3 py-2' 
      : 'badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-2';
  }
}

