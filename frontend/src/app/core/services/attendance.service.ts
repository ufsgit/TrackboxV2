import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';

export interface AttendanceRecord {
  id: string;
  date: string;
  employeeName: string;
  checkIn: string;
  checkOut: string;
  status: 'Present' | 'Late' | 'Absent' | 'On Leave' | 'Active' | 'Completed';
  totalHours: string;
  module: string;
  menu?: string;
  check_in_time?: string;
  check_out_time?: string;
  user_name?: string;
  total_hours?: string;
  is_late?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  constructor(private api: ApiService) {}

  // Check in to a specific menu
  addCheckIn(menu: string, late_reason?: string): Observable<any> {
    return this.api.post('/attendance/check-in', { menu, late_reason });
  }

  // Check out of the current active menu
  addCheckOut(menu: string): Observable<any> {
    return this.api.post('/attendance/check-out', { menu });
  }

  // Check if user is currently checked in to a specific menu
  getStatus(menu: string): Observable<any> {
    return this.api.get('/attendance/status', { menu });
  }

  // Get full attendance report
  getReport(params?: { start_date?: string; end_date?: string; user_id?: string }): Observable<any> {
    return this.api.get('/attendance/report', params);
  }
}
