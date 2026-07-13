import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

interface Complaint {
  id: string;
  customer: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'In Progress' | 'Escalated' | 'Resolved';
  technician: string;
}

@Component({
  selector: 'app-complaints',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './complaints.component.html',
  styleUrl: './complaints.component.css'
})
export class ComplaintsComponent implements OnInit {
  openComplaints = 18;
  resolvedToday = 5;
  highPriority = 4;
  escalated = 2;

  // View Toggle State
  activeView: 'table' | 'chart' = 'table';

  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' }
    }
  };
  public pieChartType: ChartType = 'doughnut';
  public pieChartData: ChartConfiguration['data'] = {
    labels: ['Billing', 'Technical', 'Service', 'Other'],
    datasets: [
      {
        data: [35, 45, 15, 5],
        backgroundColor: ['#3b82f6', '#ef4444', '#f59e0b', '#94a3b8'],
        borderWidth: 0
      }
    ]
  };

  complaints: Complaint[] = [
    { id: 'CMP-501', customer: 'Alice Johnson', category: 'Technical', priority: 'High', status: 'In Progress', technician: 'Tech A' },
    { id: 'CMP-502', customer: 'Bob Williams', category: 'Billing', priority: 'Medium', status: 'Pending', technician: 'Unassigned' },
    { id: 'CMP-503', customer: 'Charlie Brown', category: 'Service', priority: 'Critical', status: 'Escalated', technician: 'Manager B' },
    { id: 'CMP-504', customer: 'David Lee', category: 'Technical', priority: 'Low', status: 'Resolved', technician: 'Tech C' }
  ];

  searchTerm: string = '';

  get filteredComplaints(): Complaint[] {
    if (!this.searchTerm.trim()) {
      return this.complaints;
    }
    const term = this.searchTerm.toLowerCase();
    return this.complaints.filter(c => 
      c.id.toLowerCase().includes(term) ||
      c.customer.toLowerCase().includes(term) ||
      c.category.toLowerCase().includes(term) ||
      c.priority.toLowerCase().includes(term) ||
      c.status.toLowerCase().includes(term) ||
      c.technician.toLowerCase().includes(term)
    );
  }

  // Modal State
  isModalOpen = false;
  newComplaint: any = { customer: '', category: '', priority: 'Medium', issue: '' };
  toastMessage: string | null = null;
  toastTimeout: any;

  ngOnInit(): void {}

  showToast(message: string) {
    this.toastMessage = message;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => { this.toastMessage = null; }, 3000);
  }

  openModal() {
    this.newComplaint = { customer: '', category: '', priority: 'Medium', issue: '' };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  submitComplaint() {
    if (!this.newComplaint.customer || !this.newComplaint.category) {
      this.showToast('Please fill required fields.');
      return;
    }
    this.openComplaints++;
    this.showToast(`New complaint registered for ${this.newComplaint.customer}.`);
    this.closeModal();
  }

  getPriorityClass(priority: string): string {
    switch(priority) {
      case 'Critical': return 'badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill px-3 py-2';
      case 'High': return 'badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 rounded-pill px-3 py-2';
      case 'Medium': return 'badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 rounded-pill px-3 py-2';
      case 'Low': return 'badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-3 py-2';
      default: return 'badge bg-light text-dark rounded-pill px-3 py-2';
    }
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'Resolved': return 'badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2';
      case 'In Progress': return 'badge bg-warning bg-opacity-10 text-warning rounded-pill px-3 py-2';
      case 'Escalated': return 'badge bg-danger bg-opacity-10 text-danger rounded-pill px-3 py-2';
      default: return 'badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-3 py-2';
    }
  }

  acknowledge(cmp: Complaint) {
    if (cmp.status !== 'Resolved' && cmp.status !== 'In Progress') {
      cmp.status = 'In Progress';
      this.showToast(`Acknowledged ${cmp.id}`);
    }
  }

  resolve(cmp: Complaint) {
    cmp.status = 'Resolved';
    this.showToast(`Resolved ${cmp.id}`);
  }

  escalate(cmp: Complaint) {
    if (cmp.status !== 'Resolved') {
      cmp.status = 'Escalated';
      cmp.priority = 'Critical';
      this.showToast(`Escalated ${cmp.id}`);
    }
  }
}
