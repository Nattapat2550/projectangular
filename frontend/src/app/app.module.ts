import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

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

@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    LoginComponent,
    RegisterComponent,
    CheckComponent,
    ProfileFormComponent,
    HomeComponent,
    SettingsComponent,
    DownloadComponent,
    AdminComponent,
    ResetComponent,
    AboutComponent,
    ContactComponent,
  ],
  imports: [BrowserModule, HttpClientModule, FormsModule, AppRoutingModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
