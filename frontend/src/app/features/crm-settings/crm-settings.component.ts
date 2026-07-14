import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../core/services/api.service";

import { TeamsManagementComponent } from "../system-settings/components/teams-management/teams-management.component";

@Component({
  selector: "app-crm-settings",
  standalone: true,
  imports: [CommonModule, FormsModule, TeamsManagementComponent],
  templateUrl: "./crm-settings.component.html",
  styleUrls: ["../settings/settings.component.css"]
})
export class CrmSettingsComponent implements OnInit {
  activeTab = "team";
  
  team: any[] = [];
  showInvite = false;
  newAgent = { name: "", email: "", role: "agent" };
  saving = false;
  saveSuccess = "";
  saveError = "";

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadTeam();
  }

  loadTeam() {
    this.api.get("/settings/team").subscribe({
      next: (res: any) => {
        if (res.success) this.team = res.data;
      }
    });
  }

  inviteAgent() {
    if (!this.newAgent.name || !this.newAgent.email) {
      this.saveError = "Please enter name and email.";
      return;
    }
    this.saving = true;
    this.api.post("/settings/team", this.newAgent).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.saveSuccess = "Team member invited successfully.";
          this.showInvite = false;
          this.newAgent = { name: "", email: "", role: "agent" };
          this.loadTeam();
        }
        this.saving = false;
      },
      error: (err: any) => {
        this.saveError = err.error?.message || "Failed to invite.";
        this.saving = false;
      }
    });
  }

  deleteTeamMember(id: number) {
    if (confirm("Are you sure you want to remove this team member?")) {
      this.api.delete(`/settings/team/${id}`).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.saveSuccess = "Team member removed.";
            this.loadTeam();
          }
        },
        error: (err: any) => {
          this.saveError = err.error?.message || "Failed to remove.";
        }
      });
    }
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}
