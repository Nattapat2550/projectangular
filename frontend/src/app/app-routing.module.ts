import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { CheckComponent } from './check/check.component';
import { ProfileFormComponent } from './profile-form/profile-form.component';
import { HomeComponent } from './home/home.component';
import { SettingsComponent } from './settings/settings.component';
import { DownloadComponent } from './download/download.component';
import { AdminComponent } from './admin/admin.component';
import { ResetComponent } from './reset/reset.component';
import { AboutComponent } from './about/about.component';
import { ContactComponent } from './contact/contact.component';
import { AuthGuard } from './auth.guard';
import { AdminGuard } from './admin.guard';

const routes: Routes = [
  { path: '', redirectTo: 'index.html', pathMatch: 'full' },
  { path: 'index.html', component: LandingComponent },

  { path: 'login.html', component: LoginComponent },
  { path: 'register.html', component: RegisterComponent },
  { path: 'check.html', component: CheckComponent },
  { path: 'form.html', component: ProfileFormComponent },
  { path: 'reset.html', component: ResetComponent },

  { path: 'home.html', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'settings.html', component: SettingsComponent, canActivate: [AuthGuard] },
  { path: 'download.html', component: DownloadComponent, canActivate: [AuthGuard] },

  { path: 'admin.html', component: AdminComponent, canActivate: [AdminGuard] },

  { path: 'about.html', component: AboutComponent },
  { path: 'contact.html', component: ContactComponent },

  { path: '**', redirectTo: 'index.html' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
