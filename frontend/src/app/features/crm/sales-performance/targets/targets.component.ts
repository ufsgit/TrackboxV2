import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-targets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './targets.component.html',
  styleUrl: './targets.component.css'
})
export class TargetsComponent {
  searchTerm: string = '';
  isCreateModalOpen: boolean = false;
  isViewModalOpen: boolean = false;
  selectedTarget: any = null;
  selectedTargetType: 'Individual' | 'Branch' = 'Individual';

  targets = [
    { id: 'TGT-2023-001', assignee: 'John Doe', role: 'Sales Executive', period: 'Q3 2023', target: '₹50,000', achieved: '₹35,000', status: 'On Track' },
    { id: 'TGT-2023-002', assignee: 'Jane Smith', role: 'Sales Manager', period: 'Q3 2023', target: '₹120,000', achieved: '₹130,000', status: 'Overachieved' },
    { id: 'TGT-2023-003', assignee: 'Robert Johnson', role: 'Sales Executive', period: 'Q3 2023', target: '₹40,000', achieved: '₹15,000', status: 'Behind' },
    { id: 'TGT-2023-004', assignee: 'Emily Davis', role: 'Sales Executive', period: 'Q3 2023', target: '₹60,000', achieved: '₹58,000', status: 'On Track' },
    { id: 'TGT-2023-005', assignee: 'Michael Wilson', role: 'Sales Executive', period: 'Q3 2023', target: '₹45,000', achieved: '₹10,000', status: 'Behind' }
  ];

  branchTargets = [
    { id: 'B-TGT-001', branch: 'New York Branch', manager: 'Alice Smith', period: 'Q3 2023', target: '₹500,000', achieved: '₹450,000', status: 'On Track' },
    { id: 'B-TGT-002', branch: 'Los Angeles Branch', manager: 'Bob Johnson', period: 'Q3 2023', target: '₹750,000', achieved: '₹800,000', status: 'Overachieved' },
    { id: 'B-TGT-003', branch: 'Chicago Branch', manager: 'Charlie Brown', period: 'Q3 2023', target: '₹300,000', achieved: '₹200,000', status: 'Behind' },
  ];

  get filteredTargets() {
    if (!this.searchTerm) return this.targets;
    return this.targets.filter(t => 
      t.assignee.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
      t.id.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  get filteredBranchTargets() {
    if (!this.searchTerm) return this.branchTargets;
    return this.branchTargets.filter(t => 
      t.branch.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
      t.id.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  get summary() {
    if (this.selectedTargetType === 'Individual') {
      return { total: '₹315K', achieved: '₹248K', pending: '₹67K', completion: '78.7%' };
    } else {
      return { total: '₹1.5M', achieved: '₹1.45M', pending: '₹50K', completion: '96.6%' };
    }
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'On Track': return 'badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-2';
      case 'Overachieved': return 'badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle px-3 py-2';
      case 'Behind': return 'badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle px-3 py-2';
      default: return 'badge rounded-pill bg-secondary-subtle text-secondary px-3 py-2';
    }
  }

  openCreateModal() {
    this.isCreateModalOpen = true;
  }

  closeCreateModal() {
    this.isCreateModalOpen = false;
  }

  submitCreateTarget() {
    console.log('Target created');
    this.closeCreateModal();
  }

  openViewModal(target: any) {
    this.selectedTarget = target;
    this.isViewModalOpen = true;
  }

  closeViewModal() {
    this.isViewModalOpen = false;
    this.selectedTarget = null;
  }

  showAction(action: string) {
    console.log('Action triggered:', action);
  }
}

