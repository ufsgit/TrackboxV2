import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'confirm' | 'info';
  title?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationSubject = new Subject<Notification>();
  notification$ = this.notificationSubject.asObservable();

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  showSuccess(message: string, title?: string) {
    this.notificationSubject.next({ id: this.generateId(), message, title, type: 'success', timestamp: Date.now() });
  }

  showError(message: string, title?: string) {
    this.notificationSubject.next({ id: this.generateId(), message, title, type: 'error', timestamp: Date.now() });
  }
  
  showInfo(message: string, title?: string) {
    this.notificationSubject.next({ id: this.generateId(), message, title, type: 'info', timestamp: Date.now() });
  }

  showConfirm(message: string, title: string = 'Confirm'): Promise<boolean> {
    return new Promise((resolve) => {
      this.notificationSubject.next({
        id: this.generateId(),
        message,
        title,
        type: 'confirm',
        timestamp: Date.now(),
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      });
    });
  }
}
