import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../auth.service';

export const adminGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const me = await auth.loadStatus();
  if (!me) return router.createUrlTree(['/']);
  if (me.role === 'admin') return true;
  return router.createUrlTree(['/home']);
};
