import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-todays-leads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './todays-leads.component.html',
  styleUrl: './todays-leads.component.css'
})
export class TodaysLeadsComponent {
  searchTerm: string = '';
  
  leads: any[] = [];
  stats: any = { totalToday: 0, actioned: 0, unassignedLeads: 0 };

  constructor(private api: ApiService) {
    this.fetchData();
  }

  fetchData() {
    this.api.get('/reports/leads/today').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.leads = res.data.leads;
          this.stats = res.data;
        }
      },
      error: (err: any) => console.error(err)
    });
  }

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


