import { test, expect } from '@playwright/test';

test.describe('Admin Route Access', () => {
  test('User ธรรมดาพยายามแอบเข้า Admin จะโดนเตะออก', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'user-token');
      localStorage.setItem('role', 'user');
    });

    await page.goto('http://localhost:4200/admin');
    await expect(page).not.toHaveURL(/.*\/admin/);
  });

  test('Admin ตัวจริงเข้าหน้า admin ได้และโหลดข้อมูลได้', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'admin-token');
      localStorage.setItem('role', 'admin');
    });

    // แก้ไข: ต้อง Mock ข้อมูลการเช็คสิทธิ์ (Auth Guard) ที่ Angular อาจจะยิงตอนโหลดหน้า
    await page.route('**/auth/me', route => route.fulfill({
      status: 200, json: { id: 1, email: 'admin@example.com', role: 'admin' }
    }));
    await page.route('**/auth/status', route => route.fulfill({
      status: 200, json: { valid: true, role: 'admin' }
    }));

    // Mock API สำหรับตาราง Admin
    await page.route('**/admin/users', route => route.fulfill({
      status: 200, json: [{ id: 1, email: 'admin@example.com', role: 'admin' }]
    }));

    await page.goto('http://localhost:4200/admin');
    
    await expect(page).toHaveURL(/.*\/admin/);
    await expect(page.getByText('admin@example.com').first()).toBeVisible();
  });
});