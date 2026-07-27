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
    const dept = localStorage.getItem('activeDepartment') || 'CRM';
    if (dept === 'Operation') {
      this.router.navigate(['/operation-dashboard']);
    } else if (dept === 'HR') {
      this.router.navigate(['/hr-dashboard']);
    } else if (dept === 'Leads') {
      this.router.navigate(['/lead-dashboard']);
    } else {
      this.router.navigate(['/crm-dashboard']);
    }
  }
}
