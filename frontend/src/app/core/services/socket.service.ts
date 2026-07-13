import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;

  connect(): void {
    if (this.socket?.connected) return;
    this.socket = io(environment.socketUrl, { transports: ['websocket', 'polling'] });
  }

  joinBusiness(businessId: number): void {
    this.socket?.emit('join_business', businessId);
  }

  on(event: string): Observable<any> {
    return new Observable(observer => {
      this.socket?.on(event, (data: any) => observer.next(data));
    });
  }

  emit(event: string, data: any): void {
    this.socket?.emit(event, data);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}
