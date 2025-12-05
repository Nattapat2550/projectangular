// frontend/src/app/app.component.ts
import { Component, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  // ใช้ inline template แทน templateUrl
  template: `
    <router-outlet></router-outlet>
  `,
  styleUrl: './app.component.css',
})
export class AppComponent implements AfterViewInit {

  ngAfterViewInit(): void {
    // ป้องกันกรณีรันนอก browser (เผื่ออนาคตใช้ SSR)
    if (typeof document === 'undefined') return;

    const menu = document.getElementById('userMenu');
    if (!menu) {
      // ถ้าหน้าไหนยังไม่มี userMenu ก็ยังไม่ต้องทำอะไร
      return;
    }

    // logic dropdown แบบเดิม
    document.addEventListener('click', (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      const inside = menu.contains(target);

      if (inside) {
        // คลิกใน userMenu → toggle open
        menu.classList.toggle('open');
      } else {
        // คลิกนอก → ปิดเมนู
        menu.classList.remove('open');
      }
    });
  }
}
