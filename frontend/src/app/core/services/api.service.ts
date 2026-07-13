import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  public apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  get(path: string, params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k] !== undefined && params[k] !== null) httpParams = httpParams.set(k, params[k]); });
    return this.http.get(`${this.apiUrl}${path}`, { params: httpParams });
  }

  post(path: string, body?: any): Observable<any> {
    return this.http.post(`${this.apiUrl}${path}`, body);
  }

  put(path: string, body?: any): Observable<any> {
    return this.http.put(`${this.apiUrl}${path}`, body);
  }

  patch(path: string, body?: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}${path}`, body);
  }

  delete(path: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}${path}`);
  }

  upload(path: string, formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}${path}`, formData);
  }

  getBlob(path: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}${path}`, { responseType: 'blob' });
  }
}
