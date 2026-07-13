import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SystemSettingsService {
  private apiUrl = environment.apiUrl + '/system-settings';
  private settingsUrl = environment.apiUrl + '/settings'; // For team/users

  constructor(private http: HttpClient) {}

  // --- BRANCHES ---
  getBranches(): Observable<any> {
    return this.http.get(`${this.apiUrl}/branches`);
  }
  createBranch(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/branches`, data);
  }
  updateBranch(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/branches/${id}`, data);
  }
  deleteBranch(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/branches/${id}`);
  }

  // --- DEPARTMENTS ---
  getDepartments(): Observable<any> {
    return this.http.get(`${this.apiUrl}/departments`);
  }
  createDepartment(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/departments`, data);
  }
  updateDepartment(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/departments/${id}`, data);
  }
  deleteDepartment(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/departments/${id}`);
  }

  // --- STATUSES ---
  getStatuses(): Observable<any> {
    return this.http.get(`${this.apiUrl}/statuses`);
  }
  createStatus(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/statuses`, data);
  }
  updateStatus(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/statuses/${id}`, data);
  }
  deleteStatus(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/statuses/${id}`);
  }

  // --- TEAMS (Users) ---
  // Using the existing settings endpoint but wrapped here for convenience
  getTeams(): Observable<any> {
    return this.http.get(`${this.settingsUrl}/team`);
  }
  createTeamMember(data: any): Observable<any> {
    return this.http.post(`${this.settingsUrl}/team`, data);
  }
  updateTeamMember(id: number, data: any): Observable<any> {
    return this.http.put(`${this.settingsUrl}/team/${id}`, data);
  }
  deleteTeamMember(id: number): Observable<any> {
    return this.http.delete(`${this.settingsUrl}/team/${id}`);
  }
}
