import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';


export const RoleGuard: CanActivateFn = async () => {
const auth = inject(AuthService);
const router = inject(Router);
const me = await auth.fetchMe();
if (me?.role === 'admin') return true;
router.navigateByUrl('home');
return false;
};