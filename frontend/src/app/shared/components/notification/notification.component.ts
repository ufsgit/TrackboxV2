import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Top Right Toasts Container -->
    <div class="toast-container">
      <div *ngFor="let toast of toasts" class="toast-card" [ngClass]="toast.type" (click)="dismissToast(toast.id)">
        <div class="toast-icon" [ngClass]="toast.type">
          <i class="bi" 
             [ngClass]="{
               'bi-check-circle-fill text-success': toast.type === 'success', 
               'bi-exclamation-circle-fill text-danger': toast.type === 'error',
               'bi-info-circle-fill text-info': toast.type === 'info'
             }"></i>
        </div>
        <div class="toast-content">
          <h5 class="toast-title" *ngIf="toast.title">{{ toast.title }}</h5>
          <h5 class="toast-title" *ngIf="!toast.title">
            {{ toast.type === 'success' ? 'Success' : (toast.type === 'error' ? 'Error' : 'Notification') }}
          </h5>
          <p class="toast-message">{{ toast.message }}</p>
        </div>
        <button class="toast-close" (click)="$event.stopPropagation(); dismissToast(toast.id)">&times;</button>
      </div>
    </div>

    <!-- Confirm Modal Backdrop -->
    <div class="notification-backdrop" *ngIf="confirmModal" (click)="onBackdropClick($event)">
      <div class="notification-dialog" [ngClass]="confirmModal.type" (click)="$event.stopPropagation()">
        <div class="notification-icon" [ngClass]="confirmModal.type">
          <i class="bi bi-question-circle-fill text-primary"></i>
        </div>
        <div class="notification-content">
          <h5 class="notification-title" *ngIf="confirmModal.title">{{ confirmModal.title }}</h5>
          <h5 class="notification-title" *ngIf="!confirmModal.title">Confirm</h5>
          <p class="notification-message">{{ confirmModal.message }}</p>
        </div>
        <div class="notification-actions">
          <button class="btn-cancel" (click)="cancelConfirm()">Cancel</button>
          <button #okBtn class="btn-ok confirm" (click)="confirmAction()">OK</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ── Toasts Container ── */
    @keyframes v2ToastIn {
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes v2IconDraw {
      0% { transform: scale(0.5); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }

    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 10500;
      display: flex;
      flex-direction: column;
      gap: 16px;
      pointer-events: none;
      align-items: flex-end;
    }

    .toast-card {
      pointer-events: auto;
      background: #17161B;
      padding: 12px 18px;
      border-radius: 999px;
      box-shadow: 0 20px 40px -18px rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      gap: 12px;
      border: 1px solid rgba(16, 185, 129, 0.35);
      border-left: 1px solid rgba(16, 185, 129, 0.35);
      animation: v2ToastIn 0.5s cubic-bezier(.2,.8,.2,1) forwards;
      cursor: pointer;
      position: relative;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      opacity: 0;
      transform: translateY(10px);
    }

    .toast-card.success { border-color: rgba(16, 185, 129, 0.4); }
    .toast-card.error { border-color: rgba(239, 68, 68, 0.4); }
    .toast-card.info { border-color: rgba(59, 130, 246, 0.4); }

    .toast-icon {
      margin: 0;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      flex: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toast-card.success .toast-icon { background: #10b981; }
    .toast-card.error .toast-icon { background: #ef4444; }
    .toast-card.info .toast-icon { background: #3b82f6; }

    .toast-icon i {
      font-size: 13px;
      color: #17161B;
      animation: v2IconDraw .4s ease forwards .2s;
      opacity: 0;
    }

    .toast-content {
      flex: 1;
    }

    .toast-title {
      margin: 0;
      font-family: 'Fraunces', serif;
      font-style: italic;
      font-size: 15px;
      font-weight: 500;
      color: #F3EFE7;
      letter-spacing: -0.01em;
      line-height: 1.2;
    }

    .toast-message {
      margin: 1px 0 0;
      font-size: 10.5px;
      color: #9C968E;
      letter-spacing: 0.02em;
    }

    .toast-close {
      background: transparent;
      border: none;
      font-size: 1rem;
      color: #9C968E;
      cursor: pointer;
      padding: 0;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .toast-close:hover { color: #F3EFE7; }

    /* ── Confirm Modal ── */
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
  toasts: Notification[] = [];
  confirmModal: Notification | null = null;
  
  private sub!: Subscription;
  private needsFocus = false;

  @ViewChild('okBtn') okBtn!: ElementRef;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.sub = this.notificationService.notification$.subscribe(notif => {
      if (notif.type === 'confirm') {
        this.confirmModal = notif;
        this.needsFocus = true;
      } else {
        this.toasts.push(notif);
        // Auto dismiss after 5 seconds
        setTimeout(() => {
          this.dismissToast(notif.id);
        }, 5000);
      }
    });
  }

  ngAfterViewChecked() {
    if (this.needsFocus && this.okBtn) {
      this.okBtn.nativeElement.focus();
      this.needsFocus = false;
    }
  }

  dismissToast(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  onBackdropClick(event: Event) {
    // For confirm, clicking backdrop does nothing.
  }

  confirmAction() {
    if (this.confirmModal?.onConfirm) {
      this.confirmModal.onConfirm();
    }
    this.closeConfirm();
  }

  cancelConfirm() {
    if (this.confirmModal?.onCancel) {
      this.confirmModal.onCancel();
    }
    this.closeConfirm();
  }

  closeConfirm() {
    this.confirmModal = null;
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }
}
