import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamsManagementComponent } from './components/teams-management/teams-management.component';
import { BranchManagementComponent } from './components/branch-management/branch-management.component';
import { DepartmentManagementComponent } from './components/department-management/department-management.component';
import { StatusManagementComponent } from './components/status-management/status-management.component';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [
    CommonModule, 
    TeamsManagementComponent, 
    BranchManagementComponent, 
    DepartmentManagementComponent, 
    StatusManagementComponent
  ],
  templateUrl: './system-settings.component.html',
  styleUrls: ['./system-settings.component.css']
})
export class SystemSettingsComponent {
  activeTab: string = 'team';

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}
