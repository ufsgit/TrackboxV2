import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { SocketService } from '../../core/services/socket.service';
import { ApiService } from '../../core/services/api.service';
import Swal from 'sweetalert2';

export interface VerifiedStaffUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  employeeCode?: string;
}

@Component({
  selector: 'app-whatsapp-qr',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './whatsapp-qr.component.html',
  styleUrls: ['./whatsapp-qr.component.css']
})
export class WhatsappQrComponent implements OnInit, OnDestroy {
  sessionId: string = 'sess_' + Math.random().toString(36).substring(2, 10);
  
  // Connection states: 'loading' | 'qr_ready' | 'user_found' | 'user_not_found' | 'assigned' | 'error'
  state: 'loading' | 'qr_ready' | 'user_found' | 'user_not_found' | 'assigned' | 'error' = 'loading';

  qrImage: string | null = null;
  errorMessage: string = '';
  scannedPhone: string = '';
  verifiedUser: VerifiedStaffUser | null = null;
  isConfirming: boolean = false;

  private subs: Subscription[] = [];

  constructor(
    private socketService: SocketService,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initSocketConnection();
  }

  initSocketConnection(): void {
    this.state = 'loading';
    this.errorMessage = '';
    this.qrImage = null;
    this.verifiedUser = null;

    this.socketService.connect();
    this.socketService.emit('join_whatsapp_qr', { sessionId: this.sessionId });

    // Listen for QR code updates
    this.subs.push(
      this.socketService.on('whatsapp_qr_code').subscribe((data: any) => {
        if (data?.sessionId === this.sessionId && data?.qrImage) {
          this.qrImage = data.qrImage;
          this.state = 'qr_ready';
          this.cdr.detectChanges();
        }
      })
    );

    // Listen for Phone scan & verification result
    this.subs.push(
      this.socketService.on('whatsapp_verify_result').subscribe((res: any) => {
        if (res?.success) {
          this.verifiedUser = res.user;
          this.scannedPhone = res.phoneNumber;
          this.state = 'user_found';
        } else {
          this.errorMessage = res?.message || 'User with this number does not exist';
          this.scannedPhone = res?.phoneNumber || '';
          this.state = 'user_not_found';
        }
        this.cdr.detectChanges();
      })
    );

    // Listen for assignment success
    this.subs.push(
      this.socketService.on('whatsapp_assigned_success').subscribe((res: any) => {
        this.state = 'assigned';
        this.cdr.detectChanges();
        Swal.fire({
          icon: 'success',
          title: 'WhatsApp Connected & Assigned!',
          text: res?.message || `Messages for ${this.verifiedUser?.name || 'this number'} are now assigned to this staff user.`,
          timer: 3500,
          showConfirmButton: false
        });
      })
    );

    // Listen for errors
    this.subs.push(
      this.socketService.on('whatsapp_error').subscribe((err: any) => {
        this.errorMessage = err?.message || 'An unexpected error occurred';
        this.state = 'error';
        this.cdr.detectChanges();
      })
    );
  }

  refreshQr(): void {
    this.state = 'loading';
    this.qrImage = null;
    this.errorMessage = '';
    this.verifiedUser = null;
    
    // Generate a fresh unique session ID for a new QR pairing
    this.sessionId = 'sess_' + Math.random().toString(36).substring(2, 10);
    this.socketService.emit('join_whatsapp_qr', { sessionId: this.sessionId });
  }

  confirmAssignment(): void {
    if (!this.verifiedUser) return;
    this.isConfirming = true;

    this.api.post('/whatsapp-qr/confirm', {
      sessionId: this.sessionId,
      userId: this.verifiedUser.id
    }).subscribe({
      next: (res: any) => {
        this.isConfirming = false;
        this.state = 'assigned';
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isConfirming = false;
        Swal.fire({
          icon: 'error',
          title: 'Assignment Failed',
          text: err?.error?.message || 'Failed to assign WhatsApp session.'
        });
      }
    });
  }

  disconnect(): void {
    Swal.fire({
      title: 'Disconnect WhatsApp?',
      text: 'This will unlink this device session from Trackbox.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Disconnect'
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.post('/whatsapp-qr/disconnect', { sessionId: this.sessionId }).subscribe({
          next: () => {
            this.state = 'loading';
            this.refreshQr();
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}
