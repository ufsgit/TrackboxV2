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
  getStatuses(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/statuses`, { params });
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

  // --- FIELD CATEGORIES ---
  getFieldCategories(): Observable<any> {
    return this.http.get(`${this.settingsUrl}/field-categories`);
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

  // --- CHANNELS ---
  getChannels(): Observable<any> { return this.http.get(`${this.apiUrl}/channels`); }
  createChannel(data: any): Observable<any> { return this.http.post(`${this.apiUrl}/channels`, data); }
  updateChannel(id: number, data: any): Observable<any> { return this.http.put(`${this.apiUrl}/channels/${id}`, data); }
  deleteChannel(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/channels/${id}`); }

  // --- COURSES ---
  getCourses(): Observable<any> { return this.http.get(`${environment.apiUrl}/courses`); }
  createCourse(data: any): Observable<any> { return this.http.post(`${environment.apiUrl}/courses`, data); }
  updateCourse(id: number, data: any): Observable<any> { return this.http.put(`${environment.apiUrl}/courses/${id}`, data); }
  deleteCourse(id: number): Observable<any> { return this.http.delete(`${environment.apiUrl}/courses/${id}`); }

  // --- UNIVERSITIES ---
  getUniversities(): Observable<any> { return this.http.get(`${environment.apiUrl}/universities`); }
  createUniversity(data: any): Observable<any> { return this.http.post(`${environment.apiUrl}/universities`, data); }
  updateUniversity(id: number, data: any): Observable<any> { return this.http.put(`${environment.apiUrl}/universities/${id}`, data); }
  deleteUniversity(id: number): Observable<any> { return this.http.delete(`${environment.apiUrl}/universities/${id}`); }

  // --- COUNTRY CODES ---
  getCountryCodes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/country-codes`);
  }

  // --- VISA TYPES ---
  getVisaTypes(): Observable<any> { return this.http.get(`${this.apiUrl}/visa-types`); }
  createVisaType(data: any): Observable<any> { return this.http.post(`${this.apiUrl}/visa-types`, data); }
  updateVisaType(id: number, data: any): Observable<any> { return this.http.put(`${this.apiUrl}/visa-types/${id}`, data); }
  deleteVisaType(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/visa-types/${id}`); }

  // --- VISA STATUSES ---
  getVisaStatuses(): Observable<any> { return this.http.get(`${this.apiUrl}/visa-statuses`); }
  createVisaStatus(data: any): Observable<any> { return this.http.post(`${this.apiUrl}/visa-statuses`, data); }
  updateVisaStatus(id: number, data: any): Observable<any> { return this.http.put(`${this.apiUrl}/visa-statuses/${id}`, data); }
  deleteVisaStatus(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/visa-statuses/${id}`); }

  // --- VISA REASON CATEGORIES ---
  getVisaReasonCategories(): Observable<any> { return this.http.get(`${this.apiUrl}/visa-reason-categories`); }
  createVisaReasonCategory(data: any): Observable<any> { return this.http.post(`${this.apiUrl}/visa-reason-categories`, data); }
  updateVisaReasonCategory(id: number, data: any): Observable<any> { return this.http.put(`${this.apiUrl}/visa-reason-categories/${id}`, data); }
  deleteVisaReasonCategory(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/visa-reason-categories/${id}`); }

  // --- VISA PRE-DEPARTURE CHECKLISTS (VISA-003) ---
  getVisaChecklists(): Observable<any> { return this.http.get(`${this.apiUrl}/visa-checklists`); }
  createVisaChecklist(data: any): Observable<any> { return this.http.post(`${this.apiUrl}/visa-checklists`, data); }
  updateVisaChecklist(id: number, data: any): Observable<any> { return this.http.put(`${this.apiUrl}/visa-checklists/${id}`, data); }
  deleteVisaChecklist(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/visa-checklists/${id}`); }

  // --- VISA PRE-DEPARTURE CHECKLIST CATEGORIES (VISA-003) ---
  getVisaChecklistCategories(): Observable<any> { return this.http.get(`${this.apiUrl}/visa-checklist-categories`); }
  createVisaChecklistCategory(data: any): Observable<any> { return this.http.post(`${this.apiUrl}/visa-checklist-categories`, data); }
  updateVisaChecklistCategory(id: number, data: any): Observable<any> { return this.http.put(`${this.apiUrl}/visa-checklist-categories/${id}`, data); }
  deleteVisaChecklistCategory(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/visa-checklist-categories/${id}`); }

  // --- PTE STATUSES ---
  getPteStatuses(params?: any): Observable<any> { return this.http.get(`${environment.apiUrl}/pte/statuses`, { params }); }
  createPteStatus(data: any): Observable<any> { return this.http.post(`${environment.apiUrl}/pte/statuses`, data); }
  updatePteStatus(id: number, data: any): Observable<any> { return this.http.put(`${environment.apiUrl}/pte/statuses/${id}`, data); }
  deletePteStatus(id: number): Observable<any> { return this.http.delete(`${environment.apiUrl}/pte/statuses/${id}`); }

  // --- PTE PACKAGES ---
  getPtePackages(params?: any): Observable<any> { return this.http.get(`${environment.apiUrl}/pte/packages`, { params }); }
  createPtePackage(data: any): Observable<any> { return this.http.post(`${environment.apiUrl}/pte/packages`, data); }
  updatePtePackage(id: number, data: any): Observable<any> { return this.http.put(`${environment.apiUrl}/pte/packages/${id}`, data); }
  deletePtePackage(id: number): Observable<any> { return this.http.delete(`${environment.apiUrl}/pte/packages/${id}`); }

  // --- PTE BATCHES ---
  getPteBatches(params?: any): Observable<any> { return this.http.get(`${environment.apiUrl}/pte/batches`, { params }); }
  createPteBatch(data: any): Observable<any> { return this.http.post(`${environment.apiUrl}/pte/batches`, data); }
  updatePteBatch(id: number, data: any): Observable<any> { return this.http.put(`${environment.apiUrl}/pte/batches/${id}`, data); }
  deletePteBatch(id: number): Observable<any> { return this.http.delete(`${environment.apiUrl}/pte/batches/${id}`); }

  // --- PTE TRAINERS ---
  getPteTrainers(params?: any): Observable<any> { return this.http.get(`${environment.apiUrl}/pte/trainers`, { params }); }
  createPteTrainer(data: any): Observable<any> { return this.http.post(`${environment.apiUrl}/pte/trainers`, data); }
  updatePteTrainer(id: number, data: any): Observable<any> { return this.http.put(`${environment.apiUrl}/pte/trainers/${id}`, data); }
  deletePteTrainer(id: number): Observable<any> { return this.http.delete(`${environment.apiUrl}/pte/trainers/${id}`); }
}
