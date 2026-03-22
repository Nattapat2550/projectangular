// frontend/tests/protected/admin.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Admin Route Access', () => {
  test('User ธรรมดาพยายามแอบเข้า Admin จะโดนเตะออก', async ({ page }) => {
    // จำลองว่า LocalStorage มี Token แต่ Role เป็น user
    await page.addInitScript(() => {
      localStorage.setItem('token', 'user-token');
      localStorage.setItem('role', 'user');
    });

    await page.goto('http://localhost:4200/admin');
    
    // คาดหวังว่าจะโดนเตะออกไปหน้า Home หรือ Index
    await expect(page).not.toHaveURL(/.*\/admin/);
  });

  test('Admin ตัวจริงเข้าหน้า admin ได้และโหลดข้อมูลได้', async ({ page }) => {
    // จำลอง Role แอดมิน
    await page.addInitScript(() => {
      localStorage.setItem('token', 'admin-token');
      localStorage.setItem('role', 'admin');
    });

    // Mock API ดึงข้อมูล User สำหรับตารางแอดมิน
    await page.route('**/admin/users', route => route.fulfill({
      status: 200,
      json: [{ id: 1, email: 'admin@example.com', role: 'admin' }]
    }));

    await page.goto('http://localhost:4200/admin');
    
    // คาดหวังว่าจะยังอยู่ในหน้า Admin และแสดงตาราง (หรือข้อความอีเมล)
    await expect(page).toHaveURL(/.*\/admin/);
    await expect(page.locator('text=admin@example.com')).toBeVisible();
  });
});