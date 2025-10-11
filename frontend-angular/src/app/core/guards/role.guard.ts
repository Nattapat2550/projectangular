
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allow = (route.data?.['allow'] as string[]) ?? [];

  if (!auth.isLoggedIn()) {
    router.navigateByUrl('/'); // not logged in -> index
    return false;
  }
  const role = auth.user()?.role || 'user';
  // If user role is 'user' and tries to access pages not allowed -> go to /home
  if (role === 'user' && allow.length && !allow.includes('user')) {
    router.navigateByUrl('/home');
    return false;
  }
  // Admin-only gate
  if (allow.length && !allow.includes(role)) {
    router.navigateByUrl('/home');
    return false;
  }
  return true;
};
