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
    .toast-container {
      position: fixed;
      top: 40px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10500;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
      align-items: center;
    }

    .toast-card {
      pointer-events: auto;
      background: white;
      border-radius: 12px;
      padding: 16px;
      width: 320px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
      display: flex;
      align-items: flex-start;
      gap: 12px;
      animation: slideInDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      border-left: 4px solid #cbd5e1;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .toast-card.success { border-left-color: #10b981; }
    .toast-card.error { border-left-color: #ef4444; }
    .toast-card.info { border-left-color: #3b82f6; }

    .toast-icon i {
      font-size: 1.5rem;
      line-height: 1;
    }

    .toast-content {
      flex: 1;
    }

    .toast-title {
      margin: 0 0 4px;
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
    }

    .toast-message {
      margin: 0;
      font-size: 0.85rem;
      color: #475569;
      line-height: 1.4;
    }

    .toast-close {
      background: transparent;
      border: none;
      font-size: 1.25rem;
      color: #94a3b8;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }
    
    .toast-close:hover { color: #475569; }

    @keyframes slideInDown {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

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
