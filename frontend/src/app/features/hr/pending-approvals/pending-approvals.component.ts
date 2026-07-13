import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ApprovalRequest {
  id: string;
  employeeName: string;
  type: 'Leave' | 'Expense' | 'Time-off';
  dateSubmitted: string;
  amountOrDays: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  attachment?: string;
}

@Component({
  selector: 'app-pending-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pending-approvals.component.html',
  styleUrl: './pending-approvals.component.css'
})
export class PendingApprovalsComponent implements OnInit {
  pendingLeave = 5;
  pendingExpense = 3;
  pendingTimeOff = 2;

  searchTerm: string = '';

  requests: ApprovalRequest[] = [
    { id: 'REQ-001', employeeName: 'Alice Johnson', type: 'Leave', dateSubmitted: '2023-10-24', amountOrDays: '3 Days', reason: 'Sick leave', status: 'Pending' },
    { id: 'REQ-002', employeeName: 'Bob Williams', type: 'Expense', dateSubmitted: '2023-10-25', amountOrDays: '₹120.00', reason: 'Client Lunch', status: 'Pending', attachment: 'receipt-lunch.pdf' },
    { id: 'REQ-003', employeeName: 'Charlie Brown', type: 'Time-off', dateSubmitted: '2023-10-26', amountOrDays: '4 Hours', reason: 'Dentist Appointment', status: 'Pending' },
    { id: 'REQ-004', employeeName: 'David Lee', type: 'Leave', dateSubmitted: '2023-10-23', amountOrDays: '5 Days', reason: 'Annual Vacation', status: 'Approved' },
    { id: 'REQ-005', employeeName: 'Eve Smith', type: 'Expense', dateSubmitted: '2023-10-21', amountOrDays: '₹45.50', reason: 'Office Supplies', status: 'Rejected' }
  ];

  selectedRequest: ApprovalRequest | null = null;
  isModalOpen = false;
  toastMessage: string | null = null;
  toastTimeout: any;

  ngOnInit(): void {}

  get filteredRequests(): ApprovalRequest[] {
    if (!this.searchTerm.trim()) return this.requests;
    const term = this.searchTerm.toLowerCase();
    return this.requests.filter(r => 
      r.employeeName.toLowerCase().includes(term) ||
      r.type.toLowerCase().includes(term) ||
      r.status.toLowerCase().includes(term) ||
      r.id.toLowerCase().includes(term)
    );
  }

  showToast(message: string) {
    this.toastMessage = message;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => { this.toastMessage = null; }, 3000);
  }

  viewDetails(req: ApprovalRequest) {
    this.selectedRequest = req;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedRequest = null;
  }

  approve(req: ApprovalRequest) {
    if (req.status === 'Pending') {
      req.status = 'Approved';
      this.decrementKpi(req.type);
      this.showToast(`Request ${req.id} Approved.`);
      if (this.selectedRequest?.id === req.id) this.closeModal();
    }
  }

  reject(req: ApprovalRequest) {
    if (req.status === 'Pending') {
      req.status = 'Rejected';
      this.decrementKpi(req.type);
      this.showToast(`Request ${req.id} Rejected.`);
      if (this.selectedRequest?.id === req.id) this.closeModal();
    }
  }

  decrementKpi(type: string) {
    if (type === 'Leave') this.pendingLeave--;
    if (type === 'Expense') this.pendingExpense--;
    if (type === 'Time-off') this.pendingTimeOff--;
  }

  getTypeClass(type: string): string {
    switch(type) {
      case 'Leave': return 'badge bg-purple-subtle text-purple border border-purple-subtle px-2 py-1';
      case 'Expense': return 'badge bg-teal-subtle text-teal border border-teal-subtle px-2 py-1';
      case 'Time-off': return 'badge bg-orange-subtle text-orange border border-orange-subtle px-2 py-1';
      default: return 'badge bg-secondary-subtle text-secondary px-2 py-1';
    }
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'Approved': return 'badge rounded-pill bg-success-subtle text-success px-3 py-2';
      case 'Rejected': return 'badge rounded-pill bg-danger-subtle text-danger px-3 py-2';
      case 'Pending': return 'badge rounded-pill bg-warning-subtle text-warning px-3 py-2';
      default: return 'badge rounded-pill bg-secondary-subtle text-secondary px-3 py-2';
    }
  }
}
