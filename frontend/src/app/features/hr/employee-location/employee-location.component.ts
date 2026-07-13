import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface LocationRecord {
  id: string;
  employeeName: string;
  role: string;
  currentLocation: string;
  lastPing: string;
  status: 'Active' | 'Inactive' | 'On Route';
  distanceToday: string;
}

@Component({
  selector: 'app-employee-location',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-location.component.html',
  styleUrl: './employee-location.component.css'
})
export class EmployeeLocationComponent implements OnInit {
  activeTrackers = 24;
  totalDistance = '145 km';
  alerts = 2;
  
  searchTerm: string = '';

  locations: LocationRecord[] = [
    { id: 'LOC-001', employeeName: 'Alice Johnson', role: 'Field Technician', currentLocation: '123 Main St, Downtown', lastPing: '2 mins ago', status: 'Active', distanceToday: '12.4 km' },
    { id: 'LOC-002', employeeName: 'Bob Williams', role: 'Delivery Agent', currentLocation: '456 Oak Ave, Westside', lastPing: '15 mins ago', status: 'On Route', distanceToday: '34.1 km' },
    { id: 'LOC-003', employeeName: 'Charlie Brown', role: 'Sales Executive', currentLocation: '789 Pine Ln, North Park', lastPing: '1 hour ago', status: 'Inactive', distanceToday: '5.2 km' },
    { id: 'LOC-004', employeeName: 'David Lee', role: 'Field Technician', currentLocation: '321 Elm St, Eastside', lastPing: 'Just now', status: 'Active', distanceToday: '8.9 km' }
  ];

  isModalOpen = false;
  selectedEmployee: LocationRecord | null = null;
  mockRoutePoints = [
    { time: '09:00 AM', location: 'Office HQ' },
    { time: '10:15 AM', location: 'Customer A - 123 Main St' },
    { time: '12:30 PM', location: 'Lunch - Cafe Central' },
    { time: '02:00 PM', location: 'Customer B - 456 Oak Ave' }
  ];

  ngOnInit(): void {}

  get filteredLocations(): LocationRecord[] {
    if (!this.searchTerm.trim()) return this.locations;
    const term = this.searchTerm.toLowerCase();
    return this.locations.filter(l => 
      l.employeeName.toLowerCase().includes(term) ||
      l.role.toLowerCase().includes(term) ||
      l.currentLocation.toLowerCase().includes(term) ||
      l.status.toLowerCase().includes(term)
    );
  }

  viewRoute(loc: LocationRecord) {
    this.selectedEmployee = loc;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedEmployee = null;
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'Active': return 'badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-2';
      case 'On Route': return 'badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle px-3 py-2';
      case 'Inactive': return 'badge rounded-pill bg-secondary-subtle text-secondary px-3 py-2';
      default: return 'badge rounded-pill bg-light text-dark px-3 py-2';
    }
  }
}
