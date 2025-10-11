
import { Routes } from '@angular/router';
import { IndexComponent } from './pages/index/index.component';
import { HomeComponent } from './pages/home/home.component';
import { AboutComponent } from './pages/about/about.component';
import { ContactComponent } from './pages/contact/contact.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { ResetComponent } from './pages/reset/reset.component';
import { FormComponent } from './pages/form/form.component';
import { CheckComponent } from './pages/check/check.component';
import { AdminComponent } from './pages/admin/admin.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const APP_ROUTES: Routes = [
  { path: '', component: IndexComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
  { path: 'reset', component: ResetComponent },
  { path: 'form', component: FormComponent, canActivate: [roleGuard], data: { allow: ['admin'] } },
  { path: 'check', component: CheckComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [roleGuard], data: { allow: ['admin'] } },
  { path: '**', redirectTo: '' }
];
