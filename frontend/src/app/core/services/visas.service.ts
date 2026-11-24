import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type VisaStatus = 
  | 'Preparation' 
  | 'Ready' 
  | 'Submitted' 
  | 'Under Assessment' 
  | 'RFI-PPI' 
  | 'AIP' 
  | 'Approved' 
  | 'Declined' 
  | 'Withdrawn';

export interface PreDepartureItem {
  id: string;
  title: string;
  done: boolean;
  completed_at: string | null;
  notes: string;
}

export interface VisaRequestItem {
  id?: number;
  visa_id: number;
  contact_id: number;
  request_type: 'RFI' | 'PPI' | 'Additional Documents' | 'Biometrics / Medicals' | 'Interview Request' | 'Other';
  received_date: string;
  due_date: string;
  title: string;
  details?: string | null;
  status: 'Pending' | 'In Progress' | 'Submitted' | 'Closed';
  assigned_task_id?: number | null;
  document_name?: string | null;
  document_url?: string | null;
  created_by?: number | null;
  creator_name?: string | null;
  task_status?: number | null;
  task_due_date?: string | null;
  days_remaining?: number;
  created_at?: string;
  updated_at?: string;
}

export interface VisaCase {
  id: number;
  contact_id: number;
  business_id: number;
  contact_name?: string;
  contact_phone?: string;
  is_delete?: number;
  is_deleted?: number;
  contact_email?: string;
  contact_address?: string;
  branch_name?: string;
  department_name?: string;
  contact_status_name?: string;
  visa_type: string;
  application_no?: string | null;
  assigned_staff_id?: number | null;
  assigned_staff_name?: string | null;
  staff_name?: string | null;
  status: VisaStatus;
  submission_date?: string | null;
  officer_name?: string | null;
  officer_contact?: string | null;
  extension_requested_date?: string | null;
  extension_approved_date?: string | null;
  extension_notes?: string | null;
  outcome_date?: string | null;
  outcome_notes?: string | null;
  decline_category?: string | null;
  decline_detailed_notes?: string | null;
  visa_expiry_date?: string | null;
  travel_date?: string | null;
  intake_date?: string | null;
  pre_departure_triggered?: boolean | number;
  pre_departure_data?: PreDepartureItem[];
  description?: string | null;
  updated_by?: number | null;
  updated_by_name?: string | null;
  open_requests_count?: number;
  overdue_requests_count?: number;
  next_due_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface VisaMetrics {
  total: number;
  active_processing: number;
  preparation: number;
  ready: number;
  submitted: number;
  under_assessment: number;
  rfi_ppi: number;
  aip: number;
  approved: number;
  declined: number;
  withdrawn: number;
  deadlines: {
    overdue: number;
    due_today: number;
    due_7_days: number;
    travel_soon: number;
  };
  decline_categories: Array<{
    category: string;
    count: number;
  }>;
}

export interface VisaQueryParams {
  search?: string;
  status?: string;
  visa_type?: string;
  assigned_staff_id?: string | number;
  deadline_filter?: 'all' | 'overdue' | 'due_today' | 'due_7_days' | 'urgent_rfi' | 'travel_soon';
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class VisasService {
  private apiUrl = `${environment.apiUrl}/visas`;

  constructor(private http: HttpClient) {}

  // List visas with filters and pagination
  getVisas(params?: VisaQueryParams): Observable<{ success: boolean; data: VisaCase[]; pagination: any }> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.status && params.status !== 'all') httpParams = httpParams.set('status', params.status);
      if (params.visa_type && params.visa_type !== 'all') httpParams = httpParams.set('visa_type', params.visa_type);
      if (params.assigned_staff_id && params.assigned_staff_id !== 'all') {
        httpParams = httpParams.set('assigned_staff_id', params.assigned_staff_id.toString());
      }
      if (params.deadline_filter && params.deadline_filter !== 'all') {
        httpParams = httpParams.set('deadline_filter', params.deadline_filter);
      }
      if (params.start_date) httpParams = httpParams.set('start_date', params.start_date);
      if (params.end_date) httpParams = httpParams.set('end_date', params.end_date);
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    }
    return this.http.get<{ success: boolean; data: VisaCase[]; pagination: any }>(this.apiUrl, { params: httpParams });
  }

  // KPI Metrics
  getMetrics(params?: { assigned_staff_id?: string | number }): Observable<{ success: boolean; data: VisaMetrics }> {
    let httpParams = new HttpParams();
    if (params?.assigned_staff_id && params.assigned_staff_id !== 'all') {
      httpParams = httpParams.set('assigned_staff_id', params.assigned_staff_id.toString());
    }
    return this.http.get<{ success: boolean; data: VisaMetrics }>(`${this.apiUrl}/metrics`, { params: httpParams });
  }

  // Single Case Record
  getVisaById(id: number): Observable<{ success: boolean; data: VisaCase & { requests: VisaRequestItem[]; history: any[] } }> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // Save (Create or Update)
  saveVisa(payload: Partial<VisaCase>): Observable<{ success: boolean; data: VisaCase; message: string }> {
    return this.http.post<{ success: boolean; data: VisaCase; message: string }>(this.apiUrl, payload);
  }

  // Delete Visa Case Record
  deleteVisa(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  // VISA-001: Immigration Requests
  addVisaRequest(visaId: number, data: any): Observable<{ success: boolean; data: VisaRequestItem; message: string }> {
    return this.http.post<any>(`${this.apiUrl}/${visaId}/requests`, data);
  }

  updateVisaRequest(visaId: number, requestId: number, data: any): Observable<{ success: boolean; data: VisaRequestItem; message: string }> {
    return this.http.patch<any>(`${this.apiUrl}/${visaId}/requests/${requestId}`, data);
  }

  deleteVisaRequest(visaId: number, requestId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<any>(`${this.apiUrl}/${visaId}/requests/${requestId}`);
  }

  // VISA-003: Pre-Departure Checklist
  updatePreDeparture(visaId: number, checklist: PreDepartureItem[]): Observable<{ success: boolean; data: PreDepartureItem[]; message: string }> {
    return this.http.patch<any>(`${this.apiUrl}/${visaId}/pre-departure`, { pre_departure_data: checklist });
  }

  // VISA-002: Deadlines & Overdue Alerts
  getDeadlineAlerts(params?: { assigned_staff_id?: string | number }): Observable<{ success: boolean; data: { immigration_requests: any[]; upcoming_travels: any[] } }> {
    let httpParams = new HttpParams();
    if (params?.assigned_staff_id && params.assigned_staff_id !== 'all') {
      httpParams = httpParams.set('assigned_staff_id', params.assigned_staff_id.toString());
    }
    return this.http.get<any>(`${this.apiUrl}/deadline-alerts`, { params: httpParams });
  }

  // VISA-004: Decline Analytics
  getDeclineAnalytics(params?: { assigned_staff_id?: string | number }): Observable<{ success: boolean; data: { summary: any[]; cases: any[] } }> {
    let httpParams = new HttpParams();
    if (params?.assigned_staff_id && params.assigned_staff_id !== 'all') {
      httpParams = httpParams.set('assigned_staff_id', params.assigned_staff_id.toString());
    }
    return this.http.get<any>(`${this.apiUrl}/decline-analytics`, { params: httpParams });
  }

  // Helper Lookups
  getAvailableStudents(query?: string): Observable<{ success: boolean; data: any[] }> {
    let httpParams = new HttpParams();
    if (query) httpParams = httpParams.set('query', query);
    return this.http.get<any>(`${this.apiUrl}/students`, { params: httpParams });
  }

  getVisaStaffList(): Observable<{ success: boolean; data: any[] }> {
    return this.http.get<any>(`${this.apiUrl}/staff`);
  }

  // Document Upload
  uploadDocument(formData: FormData): Observable<any> {
    return this.http.post(`${environment.apiUrl}/upload`, formData);
  }

  // Backward compatibility methods
  getContactVisa(contactId: number, visaId?: number): Observable<any> {
    const params = visaId ? `?visa_id=${visaId}` : '';
    return this.http.get(`${this.apiUrl}/contact/${contactId}${params}`);
  }

  getVisaHistory(contactId: number, status?: string): Observable<any> {
    const url = status 
      ? `${this.apiUrl}/contact/${contactId}/history?status=${encodeURIComponent(status)}`
      : `${this.apiUrl}/contact/${contactId}/history`;
    return this.http.get(url);
  }
}
