import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../auth.service';

export const guestOnlyGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const me = await auth.loadStatus();
  if (!me) return true;
  return router.createUrlTree([me.role === 'admin' ? '/admin' : '/home']);
};
