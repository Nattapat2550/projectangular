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

export const routes: Routes = [
  { path: '', component: IndexPageComponent },
  { path: 'index.html', redirectTo: '', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },
  { path: 'login.html', redirectTo: 'login', pathMatch: 'full' },

  { path: 'home', component: HomeComponent },
  { path: 'home.html', redirectTo: 'home', pathMatch: 'full' },

  { path: 'about', component: AboutComponent },
  { path: 'about.html', redirectTo: 'about', pathMatch: 'full' },

  { path: 'contact', component: ContactComponent },
  { path: 'contact.html', redirectTo: 'contact', pathMatch: 'full' },

  { path: 'download', component: DownloadComponent },
  { path: 'download.html', redirectTo: 'download', pathMatch: 'full' },

  { path: 'register', component: RegisterComponent },
  { path: 'register.html', redirectTo: 'register', pathMatch: 'full' },

  { path: 'check', component: CheckComponent },
  { path: 'check.html', redirectTo: 'check', pathMatch: 'full' },

  { path: 'form', component: FormComponent },
  { path: 'form.html', redirectTo: 'form', pathMatch: 'full' },

  { path: 'reset', component: ResetComponent },
  { path: 'reset.html', redirectTo: 'reset', pathMatch: 'full' },

  { path: 'settings', component: SettingsComponent },
  { path: 'settings.html', redirectTo: 'settings', pathMatch: 'full' },

  { path: 'admin', component: AdminComponent },
  { path: 'admin.html', redirectTo: 'admin', pathMatch: 'full' },

  { path: '**', redirectTo: '' },
];
