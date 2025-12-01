// frontend/src/app/auth/auth.module.ts
import { NgModule } from '@angular/core';
import { AuthRoutingModule } from './auth-routing.module';
import { LoginPageComponent } from '../pages/login-page/login-page.component';
import { RegisterPageComponent } from '../pages/register-page/register-page.component';

@NgModule({
  imports: [
    AuthRoutingModule,
    LoginPageComponent,
    RegisterPageComponent,
  ],
})
export class AuthModule {}
