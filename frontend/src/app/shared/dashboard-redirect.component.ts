import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-redirect',
  standalone: true,
  template: ''
})
export class DashboardRedirectComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    const dept = localStorage.getItem('activeDepartment') || 'Leads';
    if (dept === 'CRM') {
      this.router.navigate(['/crm-dashboard']);
    } else if (dept === 'Operation') {
      this.router.navigate(['/operation-dashboard']);
    } else if (dept === 'HR') {
      this.router.navigate(['/hr-dashboard']);
    } else {
      this.router.navigate(['/lead-dashboard']);
    }
  }
}
