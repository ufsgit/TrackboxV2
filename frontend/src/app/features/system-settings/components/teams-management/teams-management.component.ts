import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SystemSettingsService } from '../../../../core/services/system-settings.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-teams-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 1.5rem;">
      <h3 style="margin: 0; font-size: 1.5rem; font-weight: 600;">Agent Management</h3>
      <button class="btn btn-primary" (click)="openTeamModal()" style="display: flex; align-items: center; gap: 8px;">
        <i class="bi bi-plus-lg"></i> Add Agent
      </button>
    </div>

    <!-- Filters Section -->
    <div class="card border-0 shadow-sm mb-4" style="border-radius: 12px;">
      <div class="card-body p-3">
        <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 16px; align-items: center;">
          
          <!-- Search (Left side) -->
          <div style="flex: 1; max-width: 400px; min-width: 250px; position: relative;">
            <i class="bi bi-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b;"></i>
            <input type="text" class="form-control" placeholder="Search agent..." [(ngModel)]="searchTerm" style="padding-left: 40px; height: 42px; width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; color: #334155; outline: none;">
          </div>
          
          <!-- Filters (Right side) -->
          <div style="display: flex; gap: 16px;">
            <!-- Branch Filter -->
            <div style="width: 200px;">
              <select class="form-select" [(ngModel)]="filterBranchId" style="height: 42px; width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; color: #334155; padding: 0 12px; outline: none;">
                <option value="">All Branches</option>
                <option *ngFor="let b of branches" [value]="b.id">{{b.name}}</option>
              </select>
            </div>
            
            <!-- Department Filter -->
            <div style="width: 200px;">
              <select class="form-select" [(ngModel)]="filterDeptId" [disabled]="!filterBranchId" style="height: 42px; width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; color: #334155; padding: 0 12px; outline: none;">
                <option value="">All Departments</option>
                <option *ngFor="let d of departments" [value]="d.id" [hidden]="d.branch_id != filterBranchId">{{d.name}}</option>
              </select>
            </div>
          </div>

        </div>
      </div>
    </div>

    <div class="table-card mt-0">
      <table class="table">
        <thead>
          <tr>
            <th>AGENT</th>
            <th>BRANCH & DEPT</th>
            <th>EMAIL/USERNAME</th>
            <th>ROLE</th>
            <th>STATUS</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let member of filteredTeams">
            <td>
              <div class="d-flex align-items-center">
                <div class="avatar me-3">{{ member.name[0] | uppercase }}</div>
                <div>
                  <div class="fw-bold">{{ member.name }}</div>
                </div>
              </div>
            </td>
            <td>
              <div>{{ getBranchName(member.branch_id) }}</div>
              <small class="text-muted">{{ getDeptName(member.department_id) }}</small>
            </td>
            <td>{{ member.email }}</td>
            <td><span class="role-badge">{{ member.role | uppercase }}</span></td>
            <td>
              <span class="status-badge" [ngClass]="member.is_active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
                {{ member.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <div style="display: flex; align-items: center; gap: 8px;">
                <button class="btn btn-icon text-primary" (click)="editTeamModal(member)" title="Edit"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-icon text-danger" (click)="deleteTeam(member.id)" title="Delete"><i class="bi bi-trash"></i></button>
                <button class="perm-btn" (click)="openPermissionsModal(member)" title="Set Permissions">
                  <i class="bi bi-shield-lock"></i> Permissions
                </button>
              </div>
            </td>
          </tr>
          <tr *ngIf="filteredTeams.length === 0">
            <td colspan="6" class="text-center text-muted py-4">No agents found matching the filters.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Team Modal -->
    <div class="modal-backdrop" *ngIf="showTeamModal">
      <div class="modal-content" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
        <h4 style="margin-top: 0; margin-bottom: 24px; font-weight: 600;">{{ currentTeam.id ? 'Edit Agent' : 'Add Agent' }}</h4>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Branch</label>
            <select class="form-control" [(ngModel)]="currentTeam.branch_id" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
              <option value="">Select Branch</option>
              <option *ngFor="let b of branches" [value]="b.id">{{b.name}}</option>
            </select>
          </div>
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Department</label>
            <select class="form-control" [(ngModel)]="currentTeam.department_id" [disabled]="!currentTeam.branch_id" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
              <option value="">Select Department</option>
              <option *ngFor="let d of departments" [value]="d.id" [hidden]="d.branch_id != currentTeam.branch_id">{{d.name}}</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Agent Name</label>
            <input type="text" class="form-control" [(ngModel)]="currentTeam.name" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Username</label>
            <input type="text" class="form-control" [(ngModel)]="currentTeam.username" autocomplete="off" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Email</label>
            <input type="email" class="form-control" [(ngModel)]="currentTeam.email" [disabled]="currentTeam.id" autocomplete="off" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Password</label>
            <input type="password" class="form-control" [(ngModel)]="currentTeam.password" autocomplete="new-password" [placeholder]="currentTeam.id ? 'Leave blank to keep current' : ''" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Employee Code</label>
            <input type="text" class="form-control" [(ngModel)]="currentTeam.employee_code" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Designation</label>
            <select class="form-control" [(ngModel)]="currentTeam.designation_id" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
              <option value="">Select Designation</option>
              <option *ngFor="let des of designations" [value]="des.id">{{des.name}}</option>
            </select>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Date of Joining</label>
              <input type="date" class="form-control" [(ngModel)]="currentTeam.date_of_joining" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Role</label>
              <select class="form-control" [(ngModel)]="currentTeam.role" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="agent">Agent</option>
              </select>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; padding-top: 4px;">
              <input type="checkbox" id="isActiveSwitch" [(ngModel)]="currentTeam.is_active" style="width: 18px; height: 18px;">
              <label for="isActiveSwitch" style="font-weight: 500; font-size: 0.9rem; cursor: pointer;">Is Active</label>
            </div>
          </div>
          
          <div style="display: flex; flex-direction: column;">
            <label style="font-weight: 500; font-size: 0.9rem; margin-bottom: 8px;">Team Members</label>
            <div style="background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; max-height: 160px; overflow-y: auto; padding: 4px;">
              <div *ngIf="otherAgents.length === 0" style="color:#94a3b8; font-size:0.85rem; padding:12px;">No other agents available.</div>
              <label *ngFor="let agent of otherAgents" class="member-checkbox-item">
                <input type="checkbox" [checked]="isMemberSelected(agent.id)" (change)="toggleMember(agent.id, $event)" style="width:16px; height:16px; accent-color:#4f46e5;">
                <span style="flex:1; display:flex; justify-content:space-between;">
                  <span>{{ agent.name }}</span>
                  <small style="color:#94a3b8;">{{ agent.role | titlecase }}</small>
                </span>
              </label>
            </div>
          </div>
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
          <button class="btn btn-light" (click)="closeTeamModal()" style="padding: 10px 20px; border-radius: 8px; background: #f1f5f9; border: none; font-weight: 500;">Cancel</button>
          <button class="btn btn-primary" (click)="saveTeam()" style="padding: 10px 20px; border-radius: 8px; font-weight: 500;">Save Agent</button>
        </div>
      </div>
    </div>

    <!-- Permissions Modal -->
    <div class="modal-backdrop" *ngIf="showPermissionsModal">
      <div class="modal-content" style="max-width: 700px; max-height: 90vh; overflow-y: auto; padding: 0; border-radius: 16px;">
        <!-- Modal Header -->
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 24px 28px; border-radius: 16px 16px 0 0; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
              <i class="bi bi-shield-lock" style="color: #fff; font-size: 1.2rem;"></i>
            </div>
            <div>
              <h4 style="margin: 0; color: #fff; font-weight: 700; font-size: 1.1rem;">Access Permissions</h4>
              <p style="margin: 0; color: rgba(255,255,255,0.75); font-size: 0.82rem;">{{ currentTeam.name }}</p>
            </div>
          </div>
          <button (click)="closePermissionsModal()" style="background: rgba(255,255,255,0.15); border: none; color: #fff; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <!-- Table -->
        <div style="padding: 24px;">
          <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
            <table class="table perm-modal-table" style="margin-bottom: 0;">
              <thead>
                <tr>
                  <th>Menu / Feature</th>
                  <th class="text-center">View</th>
                  <th class="text-center">Save</th>
                  <th class="text-center">Edit</th>
                  <th class="text-center">Delete</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let menu of permissionsList">
                  <td style="font-weight: 500; color: #1e293b; font-size: 0.9rem;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <i class="bi bi-grid" style="color: #94a3b8; font-size: 0.8rem;"></i>
                      {{ menu.menuName }}
                    </div>
                  </td>
                  <td class="text-center">
                    <input type="checkbox" [(ngModel)]="menu.view" style="width: 18px; height: 18px; accent-color: #4f46e5; cursor: pointer;">
                  </td>
                  <td class="text-center">
                    <input type="checkbox" [(ngModel)]="menu.save" style="width: 18px; height: 18px; accent-color: #4f46e5; cursor: pointer;">
                  </td>
                  <td class="text-center">
                    <input type="checkbox" [(ngModel)]="menu.edit" style="width: 18px; height: 18px; accent-color: #4f46e5; cursor: pointer;">
                  </td>
                  <td class="text-center">
                    <input type="checkbox" [(ngModel)]="menu.delete" style="width: 18px; height: 18px; accent-color: #4f46e5; cursor: pointer;">
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center;">
            <button type="button" (click)="grantAll()" style="background: none; border: 1px solid #e2e8f0; padding: 8px 16px; border-radius: 8px; font-size: 0.82rem; cursor: pointer; color: #475569; font-weight: 500;">
              <i class="bi bi-check2-all"></i> Grant All
            </button>
            <div style="display: flex; gap: 10px;">
              <button class="btn btn-light" (click)="closePermissionsModal()" style="padding: 10px 20px; border-radius: 8px; background: #f1f5f9; font-weight: 500; border: none;">Cancel</button>
              <button class="perm-btn" (click)="savePermissions()" style="padding: 10px 22px; border-radius: 8px; font-size: 0.9rem;">
                <i class="bi bi-check-lg"></i> Save Permissions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-card { background: #fff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); padding: 24px; }
    .table { width: 100%; margin-bottom: 0; color: #1e293b; border-collapse: collapse; }
    .table th { color: #64748b; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; text-align: left; }
    .table td { padding: 16px 12px; vertical-align: middle; border-bottom: 1px solid #f8fafc; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; background: #e0e7ff; color: #4f46e5; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 1.1rem; }
    .role-badge, .status-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
    .role-badge { background: #f1f5f9; color: #475569; }
    .btn-icon { padding: 6px; border-radius: 6px; border: none; background: transparent; transition: all 0.2s; }
    .btn-icon:hover { background: #f1f5f9; }
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); z-index: 1050; display: flex; align-items: center; justify-content: center; }
    .modal-content { background: #fff; border-radius: 16px; padding: 32px; width: 100%; max-width: 500px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border: none; }
    .team-checkbox-list { display: flex; flex-direction: column; gap: 8px; max-height: 160px; overflow-y: auto; padding: 4px 2px; }
    .team-checkbox-card { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 10px; cursor: pointer; transition: all 0.15s; background: #f8fafc; margin: 0; }
    .team-checkbox-card:hover { border-color: #a5b4fc; background: #f0f0ff; }
    .team-checkbox-card.selected { border-color: #4f46e5; background: #eef2ff; }
    .team-card-left { padding-top: 2px; }
    .team-card-right { display: flex; flex-direction: column; gap: 2px; }
    .team-card-name { font-weight: 600; font-size: 0.88rem; color: #1e293b; }
    .team-card-members { font-size: 0.75rem; color: #64748b; display: flex; align-items: center; gap: 4px; }
    .btn-new-team { background: none; border: 1px solid #cbd5e1; color: #475569; font-size: 0.78rem; font-weight: 600; padding: 4px 10px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.15s; background-color: #fff; }
    .btn-new-team:hover { background: #f8fafc; border-color: #94a3b8; color: #1e293b; }
    .inline-team-form { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 0; box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.02); }
    .member-checkbox-item { display: flex; align-items: center; gap: 10px; padding: 6px 10px; border-radius: 6px; cursor: pointer; transition: background 0.15s; margin: 0; font-size: 0.85rem; color: #334155; }
    .member-checkbox-item:hover { background: #f1f5f9; }
    .perm-btn { display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; border: none; border-radius: 20px; font-size: 0.78rem; font-weight: 600; padding: 5px 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 6px rgba(79,70,229,0.3); }
    .perm-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(79,70,229,0.4); }
    .perm-modal-table th { background: #f8fafc; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; padding: 12px 16px; }
    .perm-modal-table td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; }
    .perm-modal-table tr:last-child td { border-bottom: none; }
    .perm-modal-table tr:hover td { background: #f8fafc; }
  `]
})
export class TeamsManagementComponent implements OnInit {
  teams: any[] = [];
  branches: any[] = [];
  departments: any[] = [];
  designations: any[] = [];
  currentTeam: any = { branch_id: '', department_id: '', name: '', username: '', email: '', password: '', role: 'agent', is_active: true, employee_code: '', designation_id: '', date_of_joining: '', member_ids: [] };
  showTeamModal: boolean = false;
  
  showPermissionsModal: boolean = false;
  permissionsList: any[] = [];
  defaultMenus = [
    'Dashboard',
    'Inbox',
    'Broadcasts',
    'Chatbots',
    'Templates',
    'Reports',
    'Settings',
    'CRM',
    'Operation',
    'HR',
    'Leave Request'
  ];
  
  searchTerm: string = '';
  filterBranchId: string | number = '';
  filterDeptId: string | number = '';

  constructor(private settingsService: SystemSettingsService) {}

  ngOnInit() {
    this.loadBranches();
    this.loadDepartments();
    this.loadDesignations();
    this.loadTeams();
  }

  loadDesignations() {
    this.settingsService.getDesignations().subscribe({
      next: (res: any) => { if(res.success) this.designations = res.data; }
    });
  }

  loadBranches() {
    this.settingsService.getBranches().subscribe({
      next: (res: any) => { if(res.success) this.branches = res.data; }
    });
  }

  loadDepartments() {
    this.settingsService.getDepartments().subscribe({
      next: (res: any) => { if(res.success) this.departments = res.data; }
    });
  }

  loadTeams() {
    this.settingsService.getTeams().subscribe({
      next: (res: any) => { if(res.success) this.teams = res.data; }
    });
  }

  get filteredTeams() {
    return this.teams.filter(t => {
      let match = true;
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        match = t.name.toLowerCase().includes(term) || t.email.toLowerCase().includes(term);
      }
      if (match && this.filterBranchId) {
        match = t.branch_id == this.filterBranchId;
      }
      if (match && this.filterDeptId) {
        match = t.department_id == this.filterDeptId;
      }
      return match;
    });
  }

  getBranchName(id: number) { return this.branches.find(b => b.id == id)?.name || 'N/A'; }
  getDeptName(id: number) { return this.departments.find(d => d.id == id)?.name || 'N/A'; }

  get otherAgents() {
    return this.teams.filter(t => t.id !== this.currentTeam.id);
  }

  isMemberSelected(agentId: number): boolean {
    return (this.currentTeam.member_ids || []).includes(agentId);
  }

  toggleMember(agentId: number, event: any) {
    const ids = [...(this.currentTeam.member_ids || [])];
    if (event.target.checked) {
      if (!ids.includes(agentId)) ids.push(agentId);
    } else {
      const idx = ids.indexOf(agentId);
      if (idx > -1) ids.splice(idx, 1);
    }
    this.currentTeam.member_ids = ids;
  }

  openTeamModal() { 
    this.currentTeam = { branch_id: '', department_id: '', name: '', username: '', email: '', password: '', role: 'agent', is_active: true, employee_code: '', designation_id: '', date_of_joining: '', member_ids: [] }; 
    this.showTeamModal = true; 
  }

  editTeamModal(team: any) {
    this.currentTeam = { 
      ...team, 
      password: '', 
      date_of_joining: team.date_of_joining ? new Date(team.date_of_joining).toISOString().split('T')[0] : '',
      member_ids: team.member_ids || []
    };
    this.showTeamModal = true;
  }

  openPermissionsModal(member: any) {
    this.currentTeam = member;
    this.permissionsList = [];
    
    // Parse existing permissions if any
    let existingPerms = [];
    if (member.permissions) {
      existingPerms = typeof member.permissions === 'string' ? JSON.parse(member.permissions) : member.permissions;
    }
    
    this.defaultMenus.forEach(menu => {
      const existing = existingPerms.find((p: any) => p.menuName === menu);
      this.permissionsList.push({
        menuName: menu,
        view: existing ? existing.view : false,
        save: existing ? existing.save : false,
        edit: existing ? existing.edit : false,
        delete: existing ? existing.delete : false
      });
    });
    
    this.showPermissionsModal = true;
  }

  closePermissionsModal() {
    this.showPermissionsModal = false;
  }

  savePermissions() {
    this.settingsService.updateTeamPermissions(this.currentTeam.id, this.permissionsList).subscribe({
      next: (res: any) => {
        if (res.success) {
          Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Permissions updated' });
          this.loadTeams(); // reload to get updated permissions string
          this.closePermissionsModal();
        }
      },
      error: (err: any) => Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'error', title: err.error?.message || 'Error updating permissions' })
    });
  }

  grantAll() {
    this.permissionsList.forEach(p => {
      p.view = true;
      p.save = true;
      p.edit = true;
      p.delete = true;
    });
  }

  closeTeamModal() { this.showTeamModal = false; }

  saveTeam() { 
    if (this.currentTeam.id) {
      this.settingsService.updateTeamMember(this.currentTeam.id, this.currentTeam).subscribe({
        next: (res: any) => {
          if (res.success) {
            Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Employee updated' });
            this.loadTeams();
            this.closeTeamModal();
          }
        },
        error: (err: any) => Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'error', title: err.error?.message || 'Error updating employee' })
      });
    } else {
      this.settingsService.createTeamMember(this.currentTeam).subscribe({
        next: (res: any) => {
          if (res.success) {
            Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Employee added' });
            this.loadTeams();
            this.closeTeamModal();
          }
        },
        error: (err: any) => Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'error', title: err.error?.message || 'Error adding employee' })
      });
    }
  }

  deleteTeam(id: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this employee!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.settingsService.deleteTeamMember(id).subscribe({
          next: (res: any) => {
            if (res.success) {
              Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Employee deleted' });
              this.loadTeams();
            }
          }
        });
      }
    });
  }
}
