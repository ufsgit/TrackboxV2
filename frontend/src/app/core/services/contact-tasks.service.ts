import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ContactTaskItem {
  id?: number | null;
  contact_id: number;
  contact_name?: string;
  contact_phone?: string;
  branch_id?: number | null;
  branch_name?: string | null;
  dept_id?: number | null;
  dept_name?: string | null;
  title: string;
  description?: string | null;
  assigned_to: number;
  assigned_to_name: string;
  created_by?: number | null;
  created_by_name?: string;
  status?: number; // 0: Pending, 1: Completed
  is_task_date: number | boolean;
  task_date?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TaskQueryParams {
  search?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ContactTasksService {
  private apiUrl = `${environment.apiUrl}/contact-tasks`;

  constructor(private http: HttpClient) {}

  getTasksByContact(contactId: number, params?: TaskQueryParams): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.start_date) httpParams = httpParams.set('start_date', params.start_date);
      if (params.end_date) httpParams = httpParams.set('end_date', params.end_date);
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    }
    return this.http.get(`${this.apiUrl}/contact/${contactId}`, { params: httpParams });
  }

  getAllTasks(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get(this.apiUrl, { params: httpParams });
  }

  createTask(task: ContactTaskItem): Observable<any> {
    return this.http.post(this.apiUrl, task);
  }

  updateTask(taskId: number, task: ContactTaskItem): Observable<any> {
    return this.http.put(`${this.apiUrl}/${taskId}`, task);
  }

  updateTaskStatus(taskId: number, status: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${taskId}/status`, { status });
  }

  getTasksKpi(): Observable<any> {
    return this.http.get(`${this.apiUrl}/kpi`);
  }

  deleteTask(taskId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${taskId}`);
  }

  getTeamUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/team`);
  }
}

