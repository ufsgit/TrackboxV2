import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WorkExperienceItem {
  id?: number | null;
  employer: string;
  position: string;
  experience?: string | null;
  from_date?: string | null;
  to_date?: string | null;
  is_current?: number | boolean;
  sort_order?: number;
}

@Injectable({
  providedIn: 'root'
})
export class WorkExperiencesService {
  private apiUrl = `${environment.apiUrl}/work-experiences`;

  constructor(private http: HttpClient) {}

  getWorkExperiences(contactId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/contact/${contactId}`);
  }

  saveWorkExperiences(contactId: number, items: WorkExperienceItem[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/contact/${contactId}`, items);
  }
}

