import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

interface Installation {
  id: string;
  poNumber: string;
  customer: string;
  date: string;
  technician: string;
  status: 'Pending' | 'In Progress' | 'Completed';
}

@Component({
  selector: 'app-installation',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './installation.component.html',
  styleUrl: './installation.component.css'
})
export class InstallationComponent implements OnInit {
  // KPI Data
  totalInstallations = 42;
  pendingInstallations = 12;
  inProgressInstallations = 5;
  completedToday = 8;

  // Chart Data
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    }
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartConfiguration['data'] = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      { data: [5, 8, 6, 12, 10, 4, 2], label: 'Installations', backgroundColor: '#3b82f6', borderRadius: 6 }
    ]
  };

  // Table Data
  installations: Installation[] = [
    { id: 'INS-001', poNumber: 'PO-2023-8901', customer: 'John Doe', date: '2023-10-25', technician: 'Unassigned', status: 'Pending' },
    { id: 'INS-002', poNumber: 'PO-2023-8902', customer: 'Jane Smith', date: '2023-10-25', technician: 'Tech A', status: 'In Progress' },
    { id: 'INS-003', poNumber: 'PO-2023-8903', customer: 'Acme Corp', date: '2023-10-24', technician: 'Tech B', status: 'Completed' },
    { id: 'INS-004', poNumber: 'PO-2023-8904', customer: 'Global Industries', date: '2023-10-26', technician: 'Unassigned', status: 'Pending' },
    { id: 'INS-005', poNumber: 'PO-2023-8905', customer: 'Sarah Connor', date: '2023-10-25', technician: 'Tech C', status: 'In Progress' }
  ];

  searchTerm: string = '';

  get filteredInstallations(): Installation[] {
    if (!this.searchTerm.trim()) {
      return this.installations;
    }
    const term = this.searchTerm.toLowerCase();
    return this.installations.filter(inst => 
      inst.id.toLowerCase().includes(term) ||
      inst.poNumber.toLowerCase().includes(term) ||
      inst.customer.toLowerCase().includes(term) ||
      inst.technician.toLowerCase().includes(term) ||
      inst.status.toLowerCase().includes(term)
    );
  }

  toastMessage: string | null = null;
  toastTimeout: any;

  // View Toggle State
  activeView: 'table' | 'chart' = 'table';

  // Modal State
  isModalOpen = false;
  newInstallation: any = {
    customer: '',
    contact: '',
    address: '',
    package: '',
    date: '',
    notes: ''
  };

  ngOnInit(): void {
  }

  openModal() {
    this.isModalOpen = true;
    this.newInstallation = { 
      customer: '', 
      contact: '',
      address: '',
      package: '',
      date: '',
      notes: ''
    };
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveInstallation() {
    if (!this.newInstallation.customer || !this.newInstallation.date || !this.newInstallation.contact || !this.newInstallation.address) {
      this.showToast('Please fill all required fields (*)');
      return;
    }
    const newId = `INS-00${this.installations.length + 1}`;
    this.installations.unshift({
      id: newId,
      poNumber: `PO-2023-9${Math.floor(100 + Math.random() * 900)}`,
      customer: this.newInstallation.customer!,
      date: this.newInstallation.date!,
      technician: 'Unassigned',
      status: 'Pending'
    });
    this.totalInstallations++;
    this.pendingInstallations++;
    this.closeModal();
    this.showToast(`Installation ${newId} saved successfully!`);
  }

  showToast(message: string) {
    this.toastMessage = message;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = null;
    }, 3000);
  }

  assignTechnician(inst: Installation) {
    if (inst.status === 'Completed') {
      this.showToast(`Cannot assign technician to completed installation ${inst.id}.`);
      return;
    }
    inst.technician = 'Tech ' + String.fromCharCode(65 + Math.floor(Math.random() * 5)); // Random Tech A-E
    inst.status = 'In Progress';
    this.showToast(`Assigned ${inst.technician} to ${inst.id}`);
  }

  updateStatus(inst: Installation, newStatus: 'Pending' | 'In Progress' | 'Completed') {
    inst.status = newStatus;
    this.showToast(`Updated ${inst.id} status to ${newStatus}`);
  }

  reschedule(inst: Installation) {
    if (inst.status === 'Completed') {
      this.showToast(`Cannot reschedule completed installation ${inst.id}.`);
      return;
    }
    inst.date = '2023-10-30';
    this.showToast(`Rescheduled ${inst.id} to ${inst.date}`);
  }

  generateWorkOrder(inst: Installation) {
    this.showToast(`Work Order generated for PO ${inst.poNumber}. Email sent to ${inst.technician}.`);
  }

  uploadPhoto(inst: Installation) {
    this.showToast(`Installation photos uploaded successfully for ${inst.id}.`);
  }

  signOff(inst: Installation) {
    if (inst.status !== 'Completed') {
      inst.status = 'Completed';
    }
    this.showToast(`Customer has signed off on installation ${inst.id}.`);
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'Completed': return 'badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-2';
      case 'In Progress': return 'badge rounded-pill bg-warning-subtle text-warning border border-warning-subtle px-3 py-2';
      case 'Pending': return 'badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle px-3 py-2';
      default: return 'badge rounded-pill bg-secondary-subtle text-secondary px-3 py-2';
    }
  }
}
