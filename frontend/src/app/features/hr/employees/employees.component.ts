import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: string;
  joinDate: string;
}

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.css'
})
export class EmployeesComponent implements OnInit {
  searchTerm: string = '';
  
  employees: Employee[] = [
    { id: 'EMP-001', name: 'John Doe', email: 'john.d@company.com', department: 'IT Support', role: 'System Admin', status: 'Active', joinDate: '2021-03-15' },
    { id: 'EMP-002', name: 'Jane Smith', email: 'jane.s@company.com', department: 'Sales', role: 'Sales Executive', status: 'Active', joinDate: '2022-01-10' },
    { id: 'EMP-003', name: 'Mike Johnson', email: 'mike.j@company.com', department: 'Operations', role: 'Field Technician', status: 'On Leave', joinDate: '2020-11-05' },
    { id: 'EMP-004', name: 'Emily Davis', email: 'emily.d@company.com', department: 'HR', role: 'HR Manager', status: 'Active', joinDate: '2019-08-22' },
    { id: 'EMP-005', name: 'Robert Brown', email: 'robert.b@company.com', department: 'Finance', role: 'Accountant', status: 'Inactive', joinDate: '2023-02-01' },
    { id: 'EMP-006', name: 'Sarah Wilson', email: 'sarah.w@company.com', department: 'Operations', role: 'Logistics Coordinator', status: 'Active', joinDate: '2021-07-19' },
    { id: 'EMP-007', name: 'David Lee', email: 'david.l@company.com', department: 'IT Support', role: 'Network Engineer', status: 'Active', joinDate: '2022-09-12' },
  ];

  filteredEmployees: Employee[] = [];
  toastMessage: string | null = null;
  toastTimeout: any;

  // Modal State
  showEmployeeModal = false;
  showDeleteModal = false;
  isEditing = false;
  
  employeeForm: Employee = this.getEmptyEmployee();
  employeeToDelete: string | null = null;

  // Summary Metrics
  get totalEmployees(): number { return this.employees.length; }
  get activeEmployees(): number { return this.employees.filter(e => e.status === 'Active').length; }
  get onLeaveEmployees(): number { return this.employees.filter(e => e.status === 'On Leave').length; }
  get inactiveEmployees(): number { return this.employees.filter(e => e.status === 'Inactive').length; }

  ngOnInit() {
    this.filteredEmployees = [...this.employees];
  }

  getEmptyEmployee(): Employee {
    return { id: '', name: '', email: '', department: '', role: '', status: 'Active', joinDate: '' };
  }

  showToast(message: string) {
    this.toastMessage = message;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => { this.toastMessage = null; }, 3000);
  }

  filterEmployees() {
    if (!this.searchTerm.trim()) {
      this.filteredEmployees = [...this.employees];
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredEmployees = this.employees.filter(emp => 
      emp.name.toLowerCase().includes(term) || 
      emp.department.toLowerCase().includes(term) ||
      emp.id.toLowerCase().includes(term)
    );
  }

  // --- DELETE MODAL LOGIC ---
  confirmDelete(id: string) {
    this.employeeToDelete = id;
    this.showDeleteModal = true;
  }

  executeDelete() {
    if (this.employeeToDelete) {
      this.employees = this.employees.filter(emp => emp.id !== this.employeeToDelete);
      this.filterEmployees();
      this.showToast('Employee deleted successfully.');
    }
    this.showDeleteModal = false;
    this.employeeToDelete = null;
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.employeeToDelete = null;
  }

  // --- ADD/EDIT MODAL LOGIC ---
  addEmployee() {
    this.isEditing = false;
    this.employeeForm = this.getEmptyEmployee();
    this.employeeForm.id = 'EMP-00' + (this.employees.length + 1);
    this.employeeForm.joinDate = new Date().toISOString().split('T')[0];
    this.showEmployeeModal = true;
  }

  editEmployee(emp: Employee) {
    this.isEditing = true;
    this.employeeForm = { ...emp };
    this.showEmployeeModal = true;
  }

  saveEmployee() {
    if (this.isEditing) {
      const index = this.employees.findIndex(e => e.id === this.employeeForm.id);
      if (index !== -1) {
        this.employees[index] = { ...this.employeeForm };
      }
      this.showToast('Employee updated successfully.');
    } else {
      this.employees.unshift({ ...this.employeeForm });
      this.showToast('New employee added successfully.');
    }
    this.filterEmployees();
    this.showEmployeeModal = false;
  }

  closeEmployeeModal() {
    this.showEmployeeModal = false;
  }

  toggleStatus(emp: Employee) {
    if (emp.status === 'Active') emp.status = 'Inactive';
    else if (emp.status === 'Inactive') emp.status = 'On Leave';
    else emp.status = 'Active';
    
    this.showToast(`${emp.name}'s status changed to ${emp.status}.`);
  }
}
