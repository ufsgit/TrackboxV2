import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { TeamsManagementComponent } from './components/teams-management/teams-management.component';
import { BranchManagementComponent } from './components/branch-management/branch-management.component';
import { DepartmentManagementComponent } from './components/department-management/department-management.component';
import { StatusManagementComponent } from './components/status-management/status-management.component';
import { IntakeManagementComponent } from './components/intake-management/intake-management.component';
import { YearManagementComponent } from './components/year-management/year-management.component';
import { AppStatusManagementComponent } from './components/app-status-management/app-status-management.component';
import { ChannelManagementComponent } from './components/channel-management/channel-management.component';

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
    AppStatusManagementComponent,
    ChannelManagementComponent
  ],

  templateUrl: './system-settings.component.html',
  styleUrls: ['./system-settings.component.css']
})
export class SystemSettingsComponent implements OnInit {
  activeTab: string = 'team';

  constructor(public authService: AuthService) {}

  ngOnInit() {
    // Find the first tab the user has access to and set it as active
    if (!this.authService.hasPermission('Teams', 'view')) {
       if (this.authService.hasPermission('Branch', 'view')) this.activeTab = 'branch';
       else if (this.authService.hasPermission('Department', 'view')) this.activeTab = 'department';
       else if (this.authService.hasPermission('Lead Status', 'view')) this.activeTab = 'status';
       else if (this.authService.hasPermission('Intake', 'view')) this.activeTab = 'intake';
       else if (this.authService.hasPermission('Year', 'view')) this.activeTab = 'year';
       else if (this.authService.hasPermission('Application Status', 'view')) this.activeTab = 'app-status';
       else if (this.authService.hasPermission('Channel', 'view')) this.activeTab = 'channel';
    }
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}

