import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, AttendanceRecord } from '../../../core/services/attendance.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.css'
})
export class AttendanceComponent implements OnInit, OnDestroy {
  // KPIs
  totalEmployees = 150;
  presentToday = 135;
  lateToday = 8;
  absentToday = 2;
  onLeaveToday = 5;

  searchTerm: string = '';

  attendanceRecords: AttendanceRecord[] = [];
  private sub?: Subscription;

  toastMessage: string | null = null;
  toastTimeout: any;

  get hasMarkedAttendanceToday(): boolean {
    const today = new Date().toISOString().split('T')[0];
    return this.attendanceRecords.some(r => r.employeeName === 'Current User' && r.date === today && (r.module === 'HR' || !r.module));
  }

  constructor(private attendanceService: AttendanceService) {}

  ngOnInit(): void {
    this.fetchAttendance();
  }

  fetchAttendance() {
    const today = new Date().toISOString().split('T')[0];
    this.sub = this.attendanceService.getReport({ start_date: today, end_date: today }).subscribe({
      next: (res: any) => {
        if (res.success) {
          // Map backend logs to frontend interface if necessary, or just use them
          this.attendanceRecords = res.data.map((log: any) => ({
            id: log.id,
            date: new Date(log.check_in_time).toISOString().split('T')[0],
            employeeName: log.user_name,
            checkIn: new Date(log.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            checkOut: log.check_out_time ? new Date(log.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
            status: log.is_late ? 'Late' : 'Present', // Or map from log.status
            totalHours: log.total_minutes ? `${log.total_minutes} min` : '-',
            module: log.menu
          }));
          this.calculateKPIs();
        }
      },
      error: (err) => console.error('Failed to fetch attendance', err)
    });
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }

  calculateKPIs() {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = this.attendanceRecords.filter(r => r.date === today);
    this.presentToday = todayRecords.filter(r => r.status === 'Present').length;
    this.lateToday = todayRecords.filter(r => r.status === 'Late').length;
    this.absentToday = this.totalEmployees - this.presentToday - this.lateToday - this.onLeaveToday;
  }

  get filteredRecords(): AttendanceRecord[] {
    if (!this.searchTerm.trim()) return this.attendanceRecords;
    const term = this.searchTerm.toLowerCase();
    return this.attendanceRecords.filter(r => 
      r.employeeName.toLowerCase().includes(term) ||
      r.status.toLowerCase().includes(term) ||
      r.date.includes(term)
    );
  }

  showToast(message: string) {
    this.toastMessage = message;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => { this.toastMessage = null; }, 3000);
  }

  markAttendance() {
    this.attendanceService.addCheckIn('HR').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.showToast(res.message);
          this.fetchAttendance();
        }
      },
      error: (err: any) => {
        this.showToast(err.error?.message || 'Error checking in');
      }
    });
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'Present': return 'badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-2';
      case 'Late': return 'badge rounded-pill bg-warning-subtle text-warning border border-warning-subtle px-3 py-2';
      case 'Absent': return 'badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle px-3 py-2';
      case 'On Leave': return 'badge rounded-pill bg-info-subtle text-info border border-info-subtle px-3 py-2';
      default: return 'badge rounded-pill bg-secondary-subtle text-secondary px-3 py-2';
    }
  }
}
