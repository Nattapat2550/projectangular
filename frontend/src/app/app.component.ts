// frontend/src/app/app.component.ts
import { Component, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements AfterViewInit {

  ngAfterViewInit(): void {
    // ให้รันเฉพาะใน browser (กันเผื่ออนาคตไปใช้ SSR)
    if (typeof document === 'undefined') return;

    const menu = document.getElementById('userMenu');
    if (!menu) {
      // ถ้าหน้าไหนไม่มี userMenu ก็ไม่ต้องทำอะไร
      return;
    }

    // logic เหมือน main.js เดิม
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
