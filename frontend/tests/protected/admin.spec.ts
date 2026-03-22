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

    await page.route('**/auth/me', route => route.fulfill({
      status: 200, json: { id: 1, email: 'admin@example.com', role: 'admin' }
    }));
    
    await page.route('**/auth/status', route => route.fulfill({
      status: 200, json: { authenticated: true, role: 'admin' }
    }));

    await page.route('**/admin/users', route => route.fulfill({
      status: 200, json: [{ id: 1, email: 'admin@example.com', role: 'admin', username: 'SuperAdmin' }]
    }));

    // Mock Carousel กันเหนียว (ไม่ให้ API ติด pending)
    await page.route('**/admin/carousel', route => route.fulfill({
      status: 200, json: []
    }));

    await page.goto('http://localhost:4200/admin');
    
    await expect(page).toHaveURL(/.*\/admin/);
    
    // 🛠️ แก้ไข: หาตารางแถวแรก แล้วดึง <input> ตัวที่ 2 (index 1) ซึ่งก็คือช่อง Email
    const emailInput = page.locator('table#usersTable tbody tr').first().locator('input').nth(1);
    
    // ใช้ .toHaveValue() สำหรับเช็คข้อความใน <input>
    await expect(emailInput).toHaveValue('admin@example.com');
  });
});