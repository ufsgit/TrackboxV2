import { Component, HostListener, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { SocketService } from '../../core/services/socket.service';
import { AttendanceService } from '../../core/services/attendance.service';
import { Observable, filter } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {
  hideCRMItems = true;
  // hideCRMItems = false;
  user$: Observable<any>;
  currentUser: any;
  pageTitle = 'Dashboard';
  isCollapsed = false;
  isReportsOpen = false;
  isSalesPerformanceOpen = false;

  // Department State
  activeDepartment = 'Leads';
  isDepartmentDropdownOpen = false;
  departments = ['Leads', 'CRM', 'Operation', 'HR'];

  // Notification States
  showNotificationDropdown = false;

  notifications: any[] = [];

  // Check-In State
  isCheckedIn = false;
  currentEmployeeName = 'Current User';

  ngOnInit() {
    this.setupSocketNotifications();
    this.user$.subscribe(user => {
      this.currentUser = user;
      if (user?.name) {
        this.currentEmployeeName = user.name;
        this.updateCheckInStatus();
      }
    });
  }

  updateCheckInStatus() {
    if (!this.currentEmployeeName) return;
    this.attendanceService.getStatus(this.activeDepartment).subscribe({
      next: (res: any) => {
        if (res.success && res.isCheckedIn) {
          this.isCheckedIn = true;
        } else {
          this.isCheckedIn = false;
        }
      },
      error: () => this.isCheckedIn = false
    });
  }

  toggleCheckIn() {
    if (!this.isCheckedIn) {
      // Trying to check in
      this.attendanceService.addCheckIn(this.activeDepartment).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.isCheckedIn = true;
            Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: res.message });
          }
        },
        error: async (err: any) => {
          if (err.error?.is_late) {
            const { value: reason } = await Swal.fire({
              title: 'Late Check In',
              text: err.error.message,
              input: 'text',
              inputPlaceholder: 'Type your reason here...',
              showCancelButton: true,
              confirmButtonText: 'Check In',
              cancelButtonText: 'Cancel',
              customClass: {
                popup: 'modern-swal-popup',
                title: 'modern-swal-title',
                input: 'modern-swal-input',
                confirmButton: 'modern-swal-confirm',
                cancelButton: 'modern-swal-cancel',
                actions: 'modern-swal-actions'
              },
              buttonsStyling: false,
              backdrop: `rgba(0,0,0,0.4)`
            });
            if (reason) {
              this.attendanceService.addCheckIn(this.activeDepartment, reason).subscribe({
                 next: (res: any) => {
                   this.isCheckedIn = true;
                   Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: res.message });
                 }
              });
            }
          } else {
            Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'info', title: err.error?.message || 'Error checking in' });
            if (err.error?.message?.includes('already checked in')) this.isCheckedIn = true;
          }
        }
      });
    } else {
      // Trying to check out
      this.attendanceService.addCheckOut(this.activeDepartment).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.isCheckedIn = false;
            Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: res.message });
          }
        },
        error: (err: any) => {
          Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'warning', title: err.error?.message || 'Error checking out' });
          if (err.error?.message?.includes('No active')) this.isCheckedIn = false;
        }
      });
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-wrapper')) {
      this.showNotificationDropdown = false;
    }
    if (!target.closest('.department-switcher')) {
      this.isDepartmentDropdownOpen = false;
    }
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  toggleReports(event: Event) {
    event.preventDefault();
    this.isReportsOpen = !this.isReportsOpen;
  }

  toggleSalesPerformance(event: Event) {
    event.preventDefault();
    this.isSalesPerformanceOpen = !this.isSalesPerformanceOpen;
  }

  isOperationReportsOpen = false;

  toggleOperationReports(event: Event) {
    event.preventDefault();
    this.isOperationReportsOpen = !this.isOperationReportsOpen;
  }

  isHrReportsOpen = false;

  toggleHrReports(event: Event) {
    event.preventDefault();
    this.isHrReportsOpen = !this.isHrReportsOpen;
  }

  toggleDepartmentDropdown(event: Event) {
    event.stopPropagation();
    this.isDepartmentDropdownOpen = !this.isDepartmentDropdownOpen;
  }

  setDepartment(dept: string) {
    this.activeDepartment = dept;
    this.isDepartmentDropdownOpen = false;
    this.updateCheckInStatus();
    
    if (dept === 'CRM') {
      this.router.navigate(['/crm-dashboard']);
    } else if (dept === 'Leads') {
      this.router.navigate(['/lead-dashboard']);
    } else if (dept === 'Operation') {
      this.router.navigate(['/operation-dashboard']);
    } else if (dept === 'HR') {
      this.router.navigate(['/hr-dashboard']);
    }
  }

  toggleNotificationDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.showNotificationDropdown = !this.showNotificationDropdown;
  }

  get unreadNotificationsCount(): number {
    return this.notifications.filter(n => n.unread).length;
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.unread = false);
  }

  readNotification(n: any) {
    n.unread = false;
    if (n.convoId) {
      this.router.navigate(['/inbox'], { queryParams: { convoId: n.convoId } });
      this.showNotificationDropdown = false;
    }
  }

  clearAllNotifications() {
    this.notifications = [];
  }

  showSupportModal = false;

  toggleSupportModal() {
    this.showSupportModal = !this.showSupportModal;
  }

  openLiveChat() {
    // Implement live chat opening logic
    console.log('Opening live chat');
  }

  submitQuickSupport(event: Event) {
    event.preventDefault();
    // Implement quick support submission
    console.log('Submitting quick support');
    this.showSupportModal = false;
  }



  setupSocketNotifications() {
    if ('Notification' in window) {
      Notification.requestPermission();
    }

    // Ensure socket is initialized FIRST
    this.socket.connect();

    this.user$.subscribe(user => {
      this.currentUser = user;
      if (user?.businessId) {
        this.socket.joinBusiness(user.businessId);
      }
    });

    this.socket.on('new_message').subscribe((data: any) => {
      if (data && data.message && data.message.direction === 'inbound') {
        const contactName = data.contactName || data.contact?.name || data.conversation?.contact_name || 'Someone';
        const msgText = data.message.content || 'Sent an attachment';
        const convoId = data.conversationId || data.conversation?.id || data.message.conversation_id;

        // Add to dropdown
        this.notifications.unshift({
          id: Date.now(),
          type: 'message',
          icon: 'bi-chat-left-text',
          title: `New message from ${contactName}`,
          message: msgText.substring(0, 50) + (msgText.length > 50 ? '...' : ''),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: true,
          convoId: convoId
        });

        // Trigger change detection manually just in case
        this.cdr.detectChanges();

        this.playNotificationSound();

        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          const notification = new Notification(`New message from ${contactName}`, {
            body: msgText
          });
          
          notification.onclick = () => {
            window.focus();
            this.router.navigate(['/inbox'], { queryParams: { convoId: convoId } });
            notification.close();
          };
        }
      }
    });

    this.socket.on('contact_assigned').subscribe((data: any) => {
      if (data && data.assigned_to && this.currentUser) {
        const currentId = Number(this.currentUser.id || this.currentUser.userId);
        if (Number(data.assigned_to) === currentId) {
          const contactName = data.contact?.name || 'A contact';
        
        // Add to dropdown
        this.notifications.unshift({
          id: Date.now(),
          type: 'system',
          icon: 'bi-person-check',
          title: `New Assignment`,
          message: `${contactName} was assigned to you`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: true
        });

        // Trigger change detection
        this.cdr.detectChanges();
        this.playNotificationSound();

        // In-app Toast notification
        Swal.fire({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 5000,
          timerProgressBar: true,
          icon: 'info',
          title: 'New Assignment',
          text: `${contactName} was assigned to you`
        });

        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          const notification = new Notification('New Assignment', {
            body: `${contactName} was assigned to you`
          });
          notification.onclick = () => {
            window.focus();
            this.router.navigate(['/contacts']);
            notification.close();
          };
        }
        }
      }
    });
  }

  playNotificationSound() {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(1760, audioContext.currentTime + 0.1); // A6
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.error('Audio playback failed', e);
    }
  }

  constructor(
    private authService: AuthService, 
    private router: Router, 
    private socket: SocketService,
    private cdr: ChangeDetectorRef,
    private attendanceService: AttendanceService
  ) {
    this.user$ = this.authService.currentUser$;
    
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects;
      this.pageTitle = this.getTitle(url);
      this.syncDepartmentWithUrl(url);
    });

    // Sync on initial load
    this.syncDepartmentWithUrl(this.router.url);
  }

  private syncDepartmentWithUrl(url: string) {
    if (!url || url.includes('/sop')) return;
    
    const crmRoutes = ['crm-dashboard', 'contacts', 'quotations', 'purchase-orders', 'delivery-management', 'targets', 'achievements', 'leaderboard', 'incentives', 'underperformers', 'pending-followup', 'todays-leads', 'quotation-report', 'purchase-order-report', 'sales-funnel-report', 'lead-conversion-report', 'agent-performance-report', 'won-lost-report', 'salesperson-report', 'crm/leave-request', 'crm/attendance-report'];
    
    const operationRoutes = ['operation-dashboard', 'installation', 'customer-feedback', 'warranty-service', 'complaints', 'installation-report', 'complaint-report', 'warranty-report', 'technician-report', 'customer-feedback-report', 'operation/leave-request'];
    
    const hrRoutes = ['hr-dashboard', 'attendance', 'employee-location', 'employees', 'pending-approvals', 'attendance-report', 'leave-report', 'expense-report', 'gps-report', 'performance-report', 'employee-report', 'hr/leave-request'];

    const leadsReportRoutes = ['reports/work', 'reports/conversation', 'reports/employee', 'reports/enquiry', 'reports/status'];

    if (crmRoutes.some(route => url.includes(route))) {
      this.activeDepartment = 'CRM';
      
      const crmReports = ['pending-followup', 'todays-leads', 'quotation-report', 'purchase-order-report', 'sales-funnel-report', 'lead-conversion-report', 'agent-performance-report', 'won-lost-report', 'salesperson-report', 'crm/attendance-report'];
      if (crmReports.some(r => url.includes(r))) this.isReportsOpen = true;
      
      const salesPerf = ['targets', 'achievements', 'leaderboard', 'incentives', 'underperformers'];
      if (salesPerf.some(r => url.includes(r))) this.isSalesPerformanceOpen = true;
      
    } else if (operationRoutes.some(route => url.includes(route))) {
      this.activeDepartment = 'Operation';
      
      const opReports = ['installation-report', 'complaint-report', 'warranty-report', 'technician-report', 'customer-feedback-report'];
      if (opReports.some(r => url.includes(r))) this.isOperationReportsOpen = true;
      
    } else if (hrRoutes.some(route => url.includes(route))) {
      this.activeDepartment = 'HR';
      
      const hrReports = ['attendance-report', 'leave-report', 'expense-report', 'gps-report', 'performance-report', 'employee-report'];
      if (hrReports.some(r => url.includes(r))) this.isHrReportsOpen = true;
      
    } else {
      this.activeDepartment = 'Leads'; 
      if (leadsReportRoutes.some(r => url.includes(r))) this.isReportsOpen = true;
    }
    
    this.updateCheckInStatus();
  }

  private getTitle(url: string): string {
    const segments = url.split('/');
    const last = segments[segments.length - 1].split('?')[0]; // Remove query params
    if (!last || last === 'lead-dashboard') return 'Lead Dashboard';
    if (last === 'crm-dashboard') return 'CRM Dashboard';
    if (last === 'quotations') return 'Quotations';
    if (last === 'purchase-orders') return 'Purchase Orders';
    if (last === 'delivery-management') return 'Delivery Management';
    if (last === 'operation-dashboard') return 'Operations Dashboard';
    if (last === 'hr-dashboard') return 'HR Dashboard';
    if (last === 'agent-performance-report') return 'Individuals Reports';
    if (last === 'contacts') return 'Leads';
    if (last === 'sms') return 'SMS Campaigns';
    if (last === 'ivr') return 'IVR Flows';
    if (last === 'rcs') return 'RCS Business';
    if (last === 'ctwa') return 'Click to WhatsApp';
    
    // Operations
    if (last === 'installation') return 'Installation';
    if (last === 'customer-feedback') return 'Customer Feedback';
    if (last === 'warranty-service') return 'Warranty & Service';
    if (last === 'complaints') return 'Complaints';
    if (last === 'installation-report') return 'Installation Report';
    if (last === 'complaint-report') return 'Complaint Report';
    if (last === 'warranty-report') return 'Warranty Report';
    if (last === 'technician-report') return 'Technician Report';
    if (last === 'customer-feedback-report') return 'Customer Feedback Report';

    // HR
    if (last === 'attendance') return 'Attendance';
    if (last === 'employee-location') return 'Employee Location';
    if (last === 'employees') return 'Employees';
    if (last === 'pending-approvals') return 'Pending Approvals';
    if (last === 'attendance-report') return 'Attendance Report';
    if (last === 'leave-report') return 'Leave Report';
    if (last === 'expense-report') return 'Expense Report';
    if (last === 'gps-report') return 'GPS Report';
    if (last === 'performance-report') return 'Performance Report';
    if (last === 'employee-report') return 'Employee Report';

    return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
