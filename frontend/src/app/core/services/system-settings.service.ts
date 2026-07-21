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

  // --- DESIGNATIONS ---
  getDesignations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/designations`);
  }
  createDesignation(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/designations`, data);
  }
  updateDesignation(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/designations/${id}`, data);
  }
  deleteDesignation(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/designations/${id}`);
  }

  // --- INTAKES ---
  getIntakes(): Observable<any> { return this.http.get(`${this.apiUrl}/intakes`); }
  createIntake(data: any): Observable<any> { return this.http.post(`${this.apiUrl}/intakes`, data); }
  updateIntake(id: number, data: any): Observable<any> { return this.http.put(`${this.apiUrl}/intakes/${id}`, data); }
  deleteIntake(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/intakes/${id}`); }

  // --- YEARS ---
  getYears(): Observable<any> { return this.http.get(`${this.apiUrl}/years`); }
  createYear(data: any): Observable<any> { return this.http.post(`${this.apiUrl}/years`, data); }
  updateYear(id: number, data: any): Observable<any> { return this.http.put(`${this.apiUrl}/years/${id}`, data); }
  deleteYear(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/years/${id}`); }

  // --- APPLICATION STATUSES ---
  getAppStatuses(): Observable<any> { return this.http.get(`${this.apiUrl}/app-statuses`); }
  createAppStatus(data: any): Observable<any> { return this.http.post(`${this.apiUrl}/app-statuses`, data); }
  updateAppStatus(id: number, data: any): Observable<any> { return this.http.put(`${this.apiUrl}/app-statuses/${id}`, data); }
  deleteAppStatus(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/app-statuses/${id}`); }

  // --- ENQUIRY FORS ---
  getEnquiryFors(): Observable<any> { return this.http.get(`${this.apiUrl}/enquiry-fors`); }
  createEnquiryFor(data: any): Observable<any> { return this.http.post(`${this.apiUrl}/enquiry-fors`, data); }
  updateEnquiryFor(id: number, data: any): Observable<any> { return this.http.put(`${this.apiUrl}/enquiry-fors/${id}`, data); }
  deleteEnquiryFor(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/enquiry-fors/${id}`); }

  // --- DOCUMENT TYPES ---
  getDocumentTypes(): Observable<any> { return this.http.get(`${this.apiUrl}/document-types`); }
  createDocumentType(data: any): Observable<any> { return this.http.post(`${this.apiUrl}/document-types`, data); }
  updateDocumentType(id: number, data: any): Observable<any> { return this.http.put(`${this.apiUrl}/document-types/${id}`, data); }
  deleteDocumentType(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/document-types/${id}`); }

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
  updateTeamPermissions(id: number, permissions: any[]): Observable<any> {
    return this.http.put(`${this.settingsUrl}/team/${id}/permissions`, { permissions });
  }
  deleteTeamMember(id: number): Observable<any> {
    return this.http.delete(`${this.settingsUrl}/team/${id}`);
  }

  // --- TEAM GROUPS (Actual Teams) ---
  getTeamGroups(): Observable<any> {
    return this.http.get(`${this.apiUrl}/teams`);
  }
  createTeamGroup(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/teams`, data);
  }
  updateTeamGroup(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/teams/${id}`, data);
  }
  deleteTeamGroup(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/teams/${id}`);
  }
}
