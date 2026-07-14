import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamsManagementComponent } from './components/teams-management/teams-management.component';
import { BranchManagementComponent } from './components/branch-management/branch-management.component';
import { DepartmentManagementComponent } from './components/department-management/department-management.component';
import { StatusManagementComponent } from './components/status-management/status-management.component';
import { IntakeManagementComponent } from './components/intake-management/intake-management.component';
import { YearManagementComponent } from './components/year-management/year-management.component';
import { AppStatusManagementComponent } from './components/app-status-management/app-status-management.component';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [
    CommonModule, 
    TeamsManagementComponent, 
    BranchManagementComponent, 
    DepartmentManagementComponent, 
    StatusManagementComponent,
    IntakeManagementComponent,
    YearManagementComponent,
    AppStatusManagementComponent
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
