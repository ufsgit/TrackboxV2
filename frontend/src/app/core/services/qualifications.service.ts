import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface QualificationItem {
  id?: number | null;
  qualification: string;
  institution: string;
  completion_year?: string | null;
  percentage_cgpa?: string | null;
  backlogs?: string | null;
  study_gap?: string | null;
  is_highest?: number | boolean;
  sort_order?: number;
}

@Injectable({
  providedIn: 'root'
})
export class QualificationsService {
  private apiUrl = `${environment.apiUrl}/qualifications`;

  constructor(private http: HttpClient) { }

  getQualifications(contactId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/contact/${contactId}`);
  }

  getAcademicCounts(contactId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/contact/${contactId}/academic-counts`);
  }

  saveQualifications(contactId: number, items: QualificationItem[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/contact/${contactId}`, items);
  }
}

