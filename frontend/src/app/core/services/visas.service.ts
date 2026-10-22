import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VisasService {
  private apiUrl = `${environment.apiUrl}/visas`;

  constructor(private http: HttpClient) {}

  getContactVisa(contactId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/contact/${contactId}`);
  }

  saveVisa(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, data);
  }

  getVisaHistory(contactId: number, status?: string): Observable<any> {
    const url = status 
      ? `${this.apiUrl}/contact/${contactId}/history?status=${encodeURIComponent(status)}`
      : `${this.apiUrl}/contact/${contactId}/history`;
    return this.http.get(url);
  }
}
