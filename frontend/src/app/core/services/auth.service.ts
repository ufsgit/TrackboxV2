import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const stored = localStorage.getItem('uc_user');
    if (stored) this.currentUserSubject.next(JSON.parse(stored));
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap((res: any) => {
        if (res.success) {
          localStorage.setItem('uc_token', res.data.token);
          localStorage.setItem('uc_user', JSON.stringify(res.data));
          this.currentUserSubject.next(res.data);
        }
      })
    );
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, data).pipe(
      tap((res: any) => {
        if (res.success) {
          localStorage.setItem('uc_token', res.data.token);
          localStorage.setItem('uc_user', JSON.stringify(res.data));
          this.currentUserSubject.next(res.data);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('uc_token');
    localStorage.removeItem('uc_user');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('uc_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(...roles: string[]): boolean {
    const user = this.currentUserSubject.value;
    return user && roles.includes(user.role);
  }

  hasPermission(menuName: string, action: 'view' | 'save' | 'edit' | 'delete'): boolean {
    const user = this.currentUserSubject.value;
    // Admins and Superadmins always have full access
    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
      return true;
    }
    // For agents, check specific permissions
    if (user && user.permissions && Array.isArray(user.permissions)) {
      const perm = user.permissions.find((p: any) => p.menuName === menuName);
      if (perm) {
        if (action === 'view') return perm.view;
        if (action === 'save') return perm.save;
        if (action === 'edit') return perm.edit;
        if (action === 'delete') return perm.delete;
      }
    }
    // If no permission defined, default to restricted
    return false;
  }

  getMe(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/me`).pipe(
      tap((res: any) => {
        if (res.success && res.data) {
          const user = res.data;
          const currentToken = localStorage.getItem('uc_token');
          if (currentToken) {
            user.token = currentToken;
            localStorage.setItem('uc_user', JSON.stringify(user));
            this.currentUserSubject.next(user);
          }
        }
      })
    );
  }
}
