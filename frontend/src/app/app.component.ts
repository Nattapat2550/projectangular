// frontend/src/app/app.component.ts
import { Component, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <router-outlet></router-outlet>
  `,
  styleUrl: './app.component.css',
})
export class AppComponent implements AfterViewInit {

  ngAfterViewInit(): void {
    if (typeof document === 'undefined') return;

    // ❌ เวอร์ชันเก่า: หา menu ตอนนี้ ถ้าไม่เจอ = return เลย → ไม่ทำงาน  
    // const menu = document.getElementById('userMenu');
    // if (!menu) return;

    // ✅ เวอร์ชันใหม่: ผูก event ไว้ครั้งเดียว แล้วค่อยหา menu ตอนคลิกจริง
    document.addEventListener('click', (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      // หา element ทุกครั้งที่คลิก เผื่อมันถูกสร้างทีหลัง
      const menu =
        (document.getElementById('userMenu') as HTMLElement | null) ||
        (document.querySelector('.user-menu') as HTMLElement | null);

      if (!menu) {
        // ถ้ายังไม่มี userMenu บนหน้านี้ ก็ไม่ต้องทำอะไร
        return;
      }

      const inside = menu.contains(target);

      if (inside) {
        // คลิกในกล่อง userMenu → toggle open
        menu.classList.toggle('open');
      } else {
        // คลิกนอก → ปิดเมนู
        menu.classList.remove('open');
      }
    });
  }
}
