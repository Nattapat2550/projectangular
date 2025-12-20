import { Routes } from '@angular/router';
import { IndexPageComponent } from './pages/index-page/index-page.component';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { AboutComponent } from './pages/about/about.component';
import { ContactComponent } from './pages/contact/contact.component';
import { DownloadComponent } from './pages/download/download.component';
import { RegisterComponent } from './pages/register/register.component';
import { CheckComponent } from './pages/check/check.component';
import { FormComponent } from './pages/form/form.component';
import { ResetComponent } from './pages/reset/reset.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { AdminComponent } from './pages/admin/admin.component';

import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { guestOnlyGuard } from './guards/guest-only.guard';

export const routes: Routes = [
  // Guest-only (redirect away if already logged in)
  { path: '', component: IndexPageComponent, canActivate: [guestOnlyGuard] },
  { path: 'index.html', redirectTo: '', pathMatch: 'full' },

  { path: 'login', component: LoginComponent, canActivate: [guestOnlyGuard] },
  { path: 'login.html', redirectTo: 'login', pathMatch: 'full' },

  { path: 'register', component: RegisterComponent, canActivate: [guestOnlyGuard] },
  { path: 'register.html', redirectTo: 'register', pathMatch: 'full' },

  { path: 'check', component: CheckComponent, canActivate: [guestOnlyGuard] },
  { path: 'check.html', redirectTo: 'check', pathMatch: 'full' },

  { path: 'reset', component: ResetComponent, canActivate: [guestOnlyGuard] },
  { path: 'reset.html', redirectTo: 'reset', pathMatch: 'full' },

  // Shared pages (allowed for both guest + logged-in)
  { path: 'about', component: AboutComponent },
  { path: 'about.html', redirectTo: 'about', pathMatch: 'full' },

  { path: 'contact', component: ContactComponent },
  { path: 'contact.html', redirectTo: 'contact', pathMatch: 'full' },

  { path: 'download', component: DownloadComponent },
  { path: 'download.html', redirectTo: 'download', pathMatch: 'full' },

  // Profile completion page (keep accessible; backend decides)
  { path: 'form', component: FormComponent },
  { path: 'form.html', redirectTo: 'form', pathMatch: 'full' },

  // Auth-only
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'home.html', redirectTo: 'home', pathMatch: 'full' },

  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
  { path: 'settings.html', redirectTo: 'settings', pathMatch: 'full' },

  // Admin-only
  { path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
  { path: 'admin.html', redirectTo: 'admin', pathMatch: 'full' },

  { path: '**', redirectTo: '' },
];
