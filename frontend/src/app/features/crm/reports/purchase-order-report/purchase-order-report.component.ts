import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-purchase-order-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './purchase-order-report.component.html',
  styleUrl: './purchase-order-report.component.css'
})
export class PurchaseOrderReportComponent {
  searchTerm: string = '';
  
  pos = [
    { id: 'PO-9001', vendor: 'Office Supplies Co.', amount: '₹1,200', date: '2023-10-15', deliveryDate: '2023-10-25', status: 'Delivered' },
    { id: 'PO-9002', vendor: 'Tech Hardware Inc.', amount: '₹5,500', date: '2023-10-18', deliveryDate: '2023-10-28', status: 'In Transit' },
    { id: 'PO-9003', vendor: 'Marketing Agency', amount: '₹3,000', date: '2023-10-20', deliveryDate: '2023-11-05', status: 'Pending Approval' },
    { id: 'PO-9004', vendor: 'Software Services', amount: '₹12,000', date: '2023-10-25', deliveryDate: '2023-10-25', status: 'Processing' }
  ];

  get filteredPOs() {
    if (!this.searchTerm) return this.pos;
    return this.pos.filter(p => 
      p.vendor.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'Delivered': return 'badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-2';
      case 'In Transit': return 'badge rounded-pill bg-info-subtle text-info border border-info-subtle px-3 py-2';
      case 'Processing': return 'badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle px-3 py-2';
      case 'Pending Approval': return 'badge rounded-pill bg-warning-subtle text-warning border border-warning-subtle px-3 py-2';
      default: return 'badge rounded-pill bg-light text-dark px-3 py-2';
    }
  }
}

