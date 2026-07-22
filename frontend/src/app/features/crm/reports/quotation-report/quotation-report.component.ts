import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-quotation-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quotation-report.component.html',
  styleUrl: './quotation-report.component.css'
})
export class QuotationReportComponent implements OnInit {
  searchTerm: string = '';
  
  stats = { total: 156, accepted: 89, pendingVal: 312 };
  displayStats = { total: 0, accepted: 0, pendingVal: 0 };

  ngOnInit() {
    this.animateCount('total', this.stats.total);
    this.animateCount('accepted', this.stats.accepted);
    this.animateCount('pendingVal', this.stats.pendingVal);
  }

  animateCount(key: 'total' | 'accepted' | 'pendingVal', target: number) {
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

