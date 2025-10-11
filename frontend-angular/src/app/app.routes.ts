import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';


export const routes: Routes = [
{ path: '', loadComponent: () => import('./pages/index/index.component').then(m => m.IndexComponent) },
{ path: 'home', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent), canActivate: [AuthGuard] },
{ path: 'about', loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent) },
{ path: 'contact', loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent) },
{ path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
{ path: 'register', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
{ path: 'settings', loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent), canActivate: [AuthGuard] },
{ path: 'reset', loadComponent: () => import('./pages/reset/reset.component').then(m => m.ResetComponent) },
{ path: 'form', loadComponent: () => import('./pages/form/form.component').then(m => m.FormComponent) },
{ path: 'check', loadComponent: () => import('./pages/check/check.component').then(m => m.CheckComponent) },
{ path: 'admin', loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent), canActivate: [AuthGuard, RoleGuard] },
{ path: '**', redirectTo: '' }
];