import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-quotation-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quotation-report.component.html',
  styleUrl: './quotation-report.component.css'
})
export class QuotationReportComponent {
  searchTerm: string = '';
  
  quotations = [
    { id: 'QT-2023-001', client: 'Acme Corp', amount: '₹15,000', date: '2023-10-20', validUntil: '2023-11-20', status: 'Accepted' },
    { id: 'QT-2023-002', client: 'TechFlow Inc', amount: '₹25,000', date: '2023-10-21', validUntil: '2023-11-21', status: 'Pending' },
    { id: 'QT-2023-003', client: 'Global Industries', amount: '₹8,000', date: '2023-10-22', validUntil: '2023-11-22', status: 'Rejected' },
    { id: 'QT-2023-004', client: 'StartupHub', amount: '₹45,000', date: '2023-10-25', validUntil: '2023-11-25', status: 'Draft' }
  ];

  get filteredQuotations() {
    if (!this.searchTerm) return this.quotations;
    return this.quotations.filter(q => 
      q.client.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      q.id.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'Accepted': return 'badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-2';
      case 'Pending': return 'badge rounded-pill bg-warning-subtle text-warning border border-warning-subtle px-3 py-2';
      case 'Rejected': return 'badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle px-3 py-2';
      case 'Draft': return 'badge rounded-pill bg-secondary-subtle text-secondary border border-secondary-subtle px-3 py-2';
      default: return 'badge rounded-pill bg-light text-dark px-3 py-2';
    }
  }
}

