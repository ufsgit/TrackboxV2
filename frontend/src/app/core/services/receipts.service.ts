import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReceiptsService {
  private apiUrl = `${environment.apiUrl}/receipts`;

  constructor(private http: HttpClient) {}

  getReceiptTypes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/types`);
  }

  createReceiptType(name: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/types`, { name });
  }

  updateReceiptType(id: number, name: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/types/${id}`, { name });
  }

  deleteReceiptType(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/types/${id}`);
  }

  getContactReceipts(contactId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/contact/${contactId}`);
  }

  createReceipt(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, data);
  }

  updateReceipt(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteReceipt(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
