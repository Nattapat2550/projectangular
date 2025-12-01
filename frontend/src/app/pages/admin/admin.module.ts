// frontend/src/app/pages/admin/admin.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminPageComponent } from './admin-page.component';

@NgModule({
  declarations: [AdminPageComponent],
  imports: [CommonModule, AdminRoutingModule],
})
export class AdminModule {}
