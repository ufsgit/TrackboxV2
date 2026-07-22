import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-purchase-order-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './purchase-order-report.component.html',
  styleUrl: './purchase-order-report.component.css'
})
export class PurchaseOrderReportComponent implements OnInit {
  searchTerm: string = '';
  
  stats = { totalPOs: 245, pendingDelivery: 18, totalSpend: 1.2 };
  displayStats = { totalPOs: 0, pendingDelivery: 0, totalSpend: '0.0' };

  ngOnInit() {
    this.animateCount('totalPOs', this.stats.totalPOs);
    this.animateCount('pendingDelivery', this.stats.pendingDelivery);
    this.animateFloatCount('totalSpend', this.stats.totalSpend);
  }

  animateCount(key: 'totalPOs' | 'pendingDelivery', target: number) {
    if (!target || target <= 0) {
      this.displayStats[key] = 0;
      return;
    }
    const duration = 1200;
    const startTime = performance.now();
    const startVal = 0;

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      this.displayStats[key] = Math.floor(startVal + (target - startVal) * easeProgress);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        this.displayStats[key] = target;
      }
    };
    requestAnimationFrame(step);
  }

  animateFloatCount(key: 'totalSpend', target: number) {
    const duration = 1200;
    const startTime = performance.now();
    const startVal = 0;

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const val = (startVal + (target - startVal) * easeProgress).toFixed(1);
      this.displayStats[key] = val;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        this.displayStats[key] = target.toFixed(1);
      }
    };
    requestAnimationFrame(step);
  }
  
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

