import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SystemSettingsService } from '../../../../core/services/system-settings.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-team-groups-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 1.5rem;">
      <h3 style="margin: 0; font-size: 1.5rem; font-weight: 600;">Team Groups</h3>
      <button class="btn btn-primary" (click)="openModal()" style="display: flex; align-items: center; gap: 8px;">
        <i class="bi bi-plus-lg"></i> Create Team
      </button>
    </div>

    <!-- Filters Section -->
    <div class="card border-0 shadow-sm mb-4" style="border-radius: 12px;">
      <div class="card-body p-3">
        <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 16px; align-items: center;">
          <div style="flex: 1; max-width: 400px; min-width: 250px; position: relative;">
            <i class="bi bi-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b;"></i>
            <input type="text" class="form-control" placeholder="Search team..." [(ngModel)]="searchTerm" style="padding-left: 40px; height: 42px; width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; color: #334155; outline: none;">
          </div>
        </div>
      </div>
    </div>

    <div class="table-card mt-0">
      <table class="table">
        <thead>
          <tr>
            <th>TEAM NAME</th>
            <th>DESCRIPTION</th>
            <th>MEMBERS</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let team of filteredTeams">
            <td>
              <div class="fw-bold text-dark">{{ team.name }}</div>
            </td>
            <td>
              <span class="text-muted" style="font-size: 0.9rem;">{{ team.description || 'No description provided.' }}</span>
            </td>
            <td>
              <div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
                <div *ngIf="!team.members || team.members.length === 0" class="text-muted small">No members</div>
                <div *ngFor="let member of team.members" class="badge text-dark border p-1 px-2 d-flex align-items-center gap-2" style="background: #f8fafc; font-weight: 500; font-size: 0.8rem; border-radius: 6px; border-color: #e2e8f0 !important;">
                  <div style="width: 20px; height: 20px; border-radius: 50%; background: #e0e7ff; color: #4f46e5; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.7rem;">
                    {{ $any(member).name[0] | uppercase }}
                  </div>
                  <span>{{ $any(member).name }}</span>
                </div>
              </div>
            </td>
            <td>
              <div style="display: flex; align-items: center; justify-content: flex-start; gap: 8px;">
                <button class="btn btn-icon text-primary" (click)="editModal(team)" title="Edit"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-icon text-danger" (click)="deleteTeam(team.id)" title="Delete"><i class="bi bi-trash"></i></button>
              </div>
            </td>
          </tr>
          <tr *ngIf="filteredTeams.length === 0">
            <td colspan="4" class="text-center text-muted py-4">No teams found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Team Modal -->
    <div class="modal-backdrop" *ngIf="showModal">
      <div class="modal-content" style="max-width: 500px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h4 style="margin: 0; font-weight: 600;">{{ currentTeam.id ? 'Edit Team' : 'Create Team' }}</h4>
          <button class="btn-close" (click)="closeModal()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;"><i class="bi bi-x-lg"></i></button>
        </div>
        
        <div class="mb-3">
          <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Team Name</label>
          <input type="text" class="form-control" [(ngModel)]="currentTeam.name" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc;">
        </div>
        
        <div class="mb-4">
          <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Description</label>
          <textarea class="form-control" [(ngModel)]="currentTeam.description" rows="2" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; resize: none;"></textarea>
        </div>

        <div class="mb-4">
          <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem;">Select Members</label>
          <div style="background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; max-height: 200px; overflow-y: auto; padding: 4px;">
            <label *ngFor="let agent of agents" class="member-checkbox-item">
              <input type="checkbox" [checked]="isAgentSelected(agent.id)" (change)="toggleAgent(agent.id, $event)" style="width:16px; height:16px; accent-color:#4f46e5;">
              <span style="flex: 1; display: flex; justify-content: space-between;">
                <span>{{ agent.name }}</span>
                <small style="color: #94a3b8;">{{ agent.role | titlecase }}</small>
              </span>
            </label>
            <div *ngIf="agents.length === 0" class="text-muted small p-2">No agents available.</div>
          </div>
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
          <button class="btn btn-light" (click)="closeModal()" style="padding: 10px 24px; border-radius: 8px; background: #f1f5f9; border: none; font-weight: 500;">Cancel</button>
          <button class="btn btn-primary" (click)="saveTeam()" style="padding: 10px 24px; border-radius: 8px; font-weight: 500;">Save</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-card { background: #fff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); padding: 24px; }
    .table { width: 100%; margin-bottom: 0; color: #1e293b; border-collapse: collapse; }
    .table th { color: #64748b; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; text-align: left; }
    .table td { padding: 16px 12px; vertical-align: middle; border-bottom: 1px solid #f8fafc; }
    .avatar-sm { width: 32px; height: 32px; border-radius: 50%; background: #e0e7ff; color: #4f46e5; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.8rem; margin-right: -8px; border: 2px solid #fff; z-index: 1; }
    .avatar-sm:last-child { margin-right: 0; }
    .btn-icon { padding: 6px; border-radius: 6px; border: none; background: transparent; transition: all 0.2s; }
    .btn-icon:hover { background: #f1f5f9; }
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); z-index: 1050; display: flex; align-items: center; justify-content: center; }
    .modal-content { background: #fff; border-radius: 16px; padding: 32px; width: 100%; max-width: 500px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border: none; }
    .member-checkbox-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 8px; cursor: pointer; transition: background 0.15s; margin: 0; font-size: 0.9rem; color: #334155; border: 1px solid transparent; }
    .member-checkbox-item:hover { background: #f8fafc; border-color: #e2e8f0; }
  `]
})
export class TeamGroupsManagementComponent implements OnInit {
  teams: any[] = [];
  agents: any[] = [];
  currentTeam: any = { name: '', description: '', member_ids: [] };
  showModal: boolean = false;

  searchTerm: string = '';

  constructor(private settingsService: SystemSettingsService) {}

  ngOnInit() {
    this.loadTeams();
    this.loadAgents();
  }

  get filteredTeams() {
    if (!this.searchTerm) return this.teams;
    return this.teams.filter(t => t.name.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
                                  (t.description && t.description.toLowerCase().includes(this.searchTerm.toLowerCase())));
  }

  loadTeams() {
    this.settingsService.getTeamGroups().subscribe({
      next: (res: any) => { if(res.success) this.teams = res.data; }
    });
  }

  loadAgents() {
    this.settingsService.getTeams().subscribe({
      next: (res: any) => { if(res.success) this.agents = res.data; }
    });
  }

  openModal() {
    this.currentTeam = { name: '', description: '', member_ids: [] };
    this.showModal = true;
  }

  editModal(team: any) {
    this.currentTeam = { 
      ...team, 
      member_ids: team.members ? team.members.map((m: any) => m.id) : [] 
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  isAgentSelected(agentId: number): boolean {
    return this.currentTeam.member_ids.includes(agentId);
  }

  toggleAgent(agentId: number, event: any) {
    if (event.target.checked) {
      if (!this.currentTeam.member_ids.includes(agentId)) {
        this.currentTeam.member_ids.push(agentId);
      }
    } else {
      this.currentTeam.member_ids = this.currentTeam.member_ids.filter((id: number) => id !== agentId);
    }
  }

  saveTeam() {
    if (!this.currentTeam.name) {
      Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'warning', title: 'Team name is required' });
      return;
    }

    if (this.currentTeam.id) {
      this.settingsService.updateTeamGroup(this.currentTeam.id, this.currentTeam).subscribe({
        next: (res: any) => {
          if (res.success) {
            Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Team updated' });
            this.loadTeams();
            this.closeModal();
          }
        },
        error: (err: any) => Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'error', title: err.error?.message || 'Error updating team' })
      });
    } else {
      this.settingsService.createTeamGroup(this.currentTeam).subscribe({
        next: (res: any) => {
          if (res.success) {
            Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Team created' });
            this.loadTeams();
            this.closeModal();
          }
        },
        error: (err: any) => Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'error', title: err.error?.message || 'Error creating team' })
      });
    }
  }

  deleteTeam(id: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this team!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.settingsService.deleteTeamGroup(id).subscribe({
          next: (res: any) => {
            if (res.success) {
              Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Team deleted' });
              this.loadTeams();
            }
          }
        });
      }
    });
  }
}
