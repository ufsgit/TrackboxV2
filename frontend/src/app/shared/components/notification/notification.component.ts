import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-backdrop" *ngIf="notification" (click)="onBackdropClick($event)">
      <div class="notification-dialog" [ngClass]="notification.type" (click)="$event.stopPropagation()">
        
        <div class="notification-icon" [ngClass]="notification.type">
          <i class="bi" 
             [ngClass]="{
               'bi-check-circle-fill text-success': notification.type === 'success', 
               'bi-exclamation-circle-fill text-danger': notification.type === 'error',
               'bi-question-circle-fill text-primary': notification.type === 'confirm'
             }"></i>
        </div>

        <div class="notification-content">
          <h5 class="notification-title" *ngIf="notification.title">{{ notification.title }}</h5>
          <h5 class="notification-title" *ngIf="!notification.title">
            {{ notification.type === 'success' ? 'Success' : (notification.type === 'error' ? 'Error' : 'Confirm') }}
          </h5>
          <p class="notification-message">{{ notification.message }}</p>
        </div>

        <div class="notification-actions">
          <button *ngIf="notification.type === 'confirm'" class="btn-cancel" (click)="cancel()">Cancel</button>
          <button #okBtn class="btn-ok" [ngClass]="notification.type" (click)="confirm()">OK</button>
        </div>
        
      </div>
    </div>
  `,
  styles: [`
    .notification-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease-out;
    }
    .notification-dialog {
      background: white;
      border-radius: 20px;
      padding: 32px 32px 24px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      transform: scale(0.95);
      animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .notification-icon i {
      font-size: 3.5rem;
      line-height: 1;
    }
    .notification-icon {
      margin-bottom: 20px;
    }
    .notification-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 12px;
      margin-top: 0;
    }
    .notification-message {
      font-size: 1rem;
      color: #475569;
      margin-bottom: 32px;
      line-height: 1.5;
    }
    .notification-actions {
      display: flex;
      gap: 12px;
      width: 100%;
      justify-content: center;
    }
    .btn-ok, .btn-cancel {
      padding: 12px 24px;
      border-radius: 99px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      min-width: 120px;
    }
    .btn-cancel {
      background: #f1f5f9;
      color: #475569;
    }
    .btn-cancel:hover { background: #e2e8f0; }
    
    .btn-ok.success { background: #10b981; color: white; }
    .btn-ok.success:hover { background: #059669; }
    .btn-ok.error { background: #ef4444; color: white; }
    .btn-ok.error:hover { background: #dc2626; }
    .btn-ok.confirm { background: #4f46e5; color: white; }
    .btn-ok.confirm:hover { background: #4338ca; }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleUp {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class NotificationComponent implements OnInit, OnDestroy, AfterViewChecked {
  notification: Notification | null = null;
  private sub!: Subscription;
  private needsFocus = false;

  @ViewChild('okBtn') okBtn!: ElementRef;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.sub = this.notificationService.notification$.subscribe(notif => {
      this.notification = notif;
      this.needsFocus = true;
    });
  }

  ngAfterViewChecked() {
    if (this.needsFocus && this.okBtn) {
      this.okBtn.nativeElement.focus();
      this.needsFocus = false;
    }
  }

  onBackdropClick(event: Event) {
    if (this.notification?.type === 'success') {
      this.cancel();
    }
    // For error and confirm, clicking backdrop does nothing.
  }

  confirm() {
    if (this.notification?.onConfirm) {
      this.notification.onConfirm();
    }
    this.close();
  }

  cancel() {
    if (this.notification?.onCancel) {
      this.notification.onCancel();
    }
    this.close();
  }

  close() {
    this.notification = null;
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }
}
