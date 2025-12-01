// frontend/src/app/layout/layout.module.ts
import { NgModule } from '@angular/core';
import { NavbarComponent } from './navbar/navbar.component';

@NgModule({
  imports: [NavbarComponent],
  exports: [NavbarComponent],
})
export class LayoutModule {}
