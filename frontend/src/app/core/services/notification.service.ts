import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Notification {
  message: string;
  type: 'success' | 'error' | 'confirm';
  title?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationSubject = new Subject<Notification>();
  notification$ = this.notificationSubject.asObservable();

  showSuccess(message: string, title?: string) {
    this.notificationSubject.next({ message, title, type: 'success' });
  }

  showError(message: string, title?: string) {
    this.notificationSubject.next({ message, title, type: 'error' });
  }

  showConfirm(message: string, title: string = 'Confirm'): Promise<boolean> {
    return new Promise((resolve) => {
      this.notificationSubject.next({
        message,
        title,
        type: 'confirm',
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      });
    });
  }
}
