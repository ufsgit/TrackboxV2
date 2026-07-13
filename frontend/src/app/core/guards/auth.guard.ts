import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs';

export const authGuard = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const requiredRoles = route.data['roles'] as Array<string>;
  if (!requiredRoles) return true;

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      if (user && requiredRoles.includes(user.role)) {
        return true;
      }
      router.navigate(['/dashboard']);
      return false;
    })
  );
};
