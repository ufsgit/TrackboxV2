import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApplicationsService {
  private apiUrl = `${environment.apiUrl}/applications`;

  constructor(private http: HttpClient) {}

  getApplications(contactId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/contact/${contactId}`);
  }

  createApplication(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, data);
  }

  updateApplication(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteApplication(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getApplicationHistory(applicationId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${applicationId}/history`);
  }
}
