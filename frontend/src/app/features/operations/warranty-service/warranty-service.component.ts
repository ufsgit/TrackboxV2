import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

interface Claim {
  id: string;
  customer: string;
  product: string;
  issue: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  amcStatus: 'Active' | 'Expired' | 'None';
  spareParts: string[];
}

@Component({
  selector: 'app-warranty-service',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './warranty-service.component.html',
  styleUrl: './warranty-service.component.css'
})
export class WarrantyServiceComponent implements OnInit {
  activeWarranties = 845;
  claimsThisMonth = 34;
  pendingService = 12;
  avgResolution = '48 Hrs';

  // View Toggle State
  activeView: 'table' | 'chart' = 'table';

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  };
  public lineChartType: ChartType = 'line';
  public lineChartData: ChartConfiguration['data'] = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      { data: [12, 19, 15, 25, 22, 30, 28], label: 'Claims Filed', borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', fill: true, tension: 0.4 },
      { data: [10, 15, 12, 20, 20, 25, 24], label: 'Claims Resolved', borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)', fill: true, tension: 0.4 }
    ]
  };

  claims: Claim[] = [
    { id: 'WR-101', customer: 'John Doe', product: 'Router AC1200', issue: 'No power', date: '2023-10-25', status: 'Pending', amcStatus: 'Active', spareParts: ['Power Adapter'] },
    { id: 'WR-102', customer: 'Jane Smith', product: 'Mesh WiFi Node', issue: 'Keeps disconnecting', date: '2023-10-24', status: 'Pending', amcStatus: 'Expired', spareParts: [] },
    { id: 'WR-103', customer: 'Acme Corp', product: 'Enterprise Switch', issue: 'Port 4 dead', date: '2023-10-22', status: 'Approved', amcStatus: 'Active', spareParts: ['Port Module'] },
    { id: 'WR-104', customer: 'Global Ind', product: 'Router AC1200', issue: 'Overheating', date: '2023-10-21', status: 'Rejected', amcStatus: 'None', spareParts: [] },
  ];

  searchTerm: string = '';

  get filteredClaims(): Claim[] {
    if (!this.searchTerm.trim()) {
      return this.claims;
    }
    const term = this.searchTerm.toLowerCase();
    return this.claims.filter(c => 
      c.id.toLowerCase().includes(term) ||
      c.customer.toLowerCase().includes(term) ||
      c.product.toLowerCase().includes(term) ||
      c.issue.toLowerCase().includes(term) ||
      c.status.toLowerCase().includes(term) ||
      c.amcStatus.toLowerCase().includes(term)
    );
  }

  toastMessage: string | null = null;
  toastTimeout: any;

  // Modal States
  isRegistrationModalOpen = false;
  isApprovalModalOpen = false;

  // Forms
  newRegistration: any = { customer: '', product: '', serialNumber: '', purchaseDate: '', amcIncluded: false };
  approvalForm: any = { claimId: '', status: '', notes: '', sparePartsRequired: '' };
  currentClaim: Claim | null = null;

  ngOnInit() {}

  showToast(message: string) {
    this.toastMessage = message;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => { this.toastMessage = null; }, 3000);
  }

  // Registration Modal
  openRegistrationModal() {
    this.isRegistrationModalOpen = true;
    this.newRegistration = { customer: '', product: '', serialNumber: '', purchaseDate: '', amcIncluded: false };
  }
  
  closeRegistrationModal() {
    this.isRegistrationModalOpen = false;
  }

  submitRegistration() {
    if (!this.newRegistration.customer || !this.newRegistration.product) {
      this.showToast('Please fill all required fields.');
      return;
    }
    this.activeWarranties++;
    this.showToast(`Warranty registered successfully for ${this.newRegistration.customer}.`);
    this.closeRegistrationModal();
  }

  // Approval Modal
  openApprovalModal(claim: Claim, status: 'Approved' | 'Rejected') {
    this.currentClaim = claim;
    this.approvalForm = { claimId: claim.id, status: status, notes: '', sparePartsRequired: '' };
    this.isApprovalModalOpen = true;
  }

  closeApprovalModal() {
    this.isApprovalModalOpen = false;
    this.currentClaim = null;
  }

  submitApproval() {
    if (this.currentClaim) {
      this.currentClaim.status = this.approvalForm.status;
      if (this.approvalForm.sparePartsRequired) {
        this.currentClaim.spareParts = this.approvalForm.sparePartsRequired.split(',').map((s: string) => s.trim());
      }
      this.showToast(`Claim ${this.currentClaim.id} has been ${this.approvalForm.status}.`);
    }
    this.closeApprovalModal();
  }

  getAmcClass(amc: string): string {
    switch(amc) {
      case 'Active': return 'badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2 py-1';
      case 'Expired': return 'badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill px-2 py-1';
      case 'None': return 'badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-2 py-1';
      default: return '';
    }
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'Approved': return 'badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-2';
      case 'Pending': return 'badge rounded-pill bg-warning-subtle text-warning border border-warning-subtle px-3 py-2';
      case 'Rejected': return 'badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle px-3 py-2';
      default: return 'badge rounded-pill bg-secondary-subtle text-secondary px-3 py-2';
    }
  }
}
