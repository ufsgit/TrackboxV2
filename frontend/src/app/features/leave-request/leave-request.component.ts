import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-leave-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leave-request.component.html',
  styleUrl: './leave-request.component.css'
})
export class LeaveRequestComponent implements OnInit {
  request = {
    fromDate: '',
    toDate: '',
    type: 'Full Day',
    reason: '',
    moduleId: ''
  };

  moduleName = '';
  submitted = false;

  constructor(private router: Router) {}

  ngOnInit() {
    const url = this.router.url;
    if (url.includes('/lead/')) {
      this.moduleName = 'Lead';
      this.request.moduleId = 'lead';
    } else if (url.includes('/crm/')) {
      this.moduleName = 'CRM';
      this.request.moduleId = 'crm';
    } else if (url.includes('/operation/')) {
      this.moduleName = 'Operation';
      this.request.moduleId = 'operation';
    } else if (url.includes('/hr/')) {
      this.moduleName = 'HR';
      this.request.moduleId = 'hr';
    } else {
      this.moduleName = 'General';
      this.request.moduleId = 'general';
    }
  }

  isValid(): boolean {
    return !!this.request.fromDate && !!this.request.toDate && !!this.request.type && !!this.request.reason.trim();
  }

  submitRequest(): void {
    if (this.isValid()) {
      console.log(`Submitting ${this.moduleName} Leave Request:`, this.request);
      this.submitted = true;
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        this.submitted = false;
        this.resetForm();
      }, 3000);
    }
  }

  resetForm(): void {
    this.request = {
      fromDate: '',
      toDate: '',
      type: 'Full Day',
      reason: '',
      moduleId: this.request.moduleId
    };
    this.submitted = false;
  }
}
