import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';


export const AuthGuard: CanActivateFn = async () => {
const auth = inject(AuthService);
const router = inject(Router);
const me = await auth.fetchMe();
if (me?.id) return true;
router.navigateByUrl('');
return false;
};