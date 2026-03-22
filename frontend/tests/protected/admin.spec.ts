import { test, expect } from '@playwright/test';

test.describe('Admin Route Access', () => {
  test('User ธรรมดาพยายามแอบเข้า Admin จะโดนเตะออก', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'user-token');
      localStorage.setItem('role', 'user');
    });

    await page.route('**/api/auth/status', route => route.fulfill({
      status: 200, json: { authenticated: true, role: 'user' }
    }));
    await page.route('**/api/users/me', route => route.fulfill({
      status: 200, json: { id: 2, email: 'user@example.com', role: 'user' }
    }));

    await page.goto('http://localhost:4200/admin');
    await expect(page).not.toHaveURL(/.*\/admin/);
  });

  test('Admin ตัวจริงเข้าหน้า admin ได้และโหลดข้อมูลได้', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'admin-token');
      localStorage.setItem('role', 'admin');
    });

    // 🛠️ แก้ไข: เปลี่ยนเป็น **/api/users/me ให้ตรงกับที่โค้ดเรียกใช้เป๊ะๆ
    await page.route('**/api/users/me', route => route.fulfill({
      status: 200, json: { id: 1, email: 'admin@example.com', role: 'admin' }
    }));
    
    await page.route('**/api/auth/status', route => route.fulfill({
      status: 200, json: { authenticated: true, role: 'admin' }
    }));

    await page.route('**/api/admin/users', route => route.fulfill({
      status: 200, json: [{ id: 1, email: 'admin@example.com', role: 'admin', username: 'SuperAdmin' }]
    }));

    await page.route('**/api/admin/carousel', route => route.fulfill({
      status: 200, json: []
    }));

    await page.goto('http://localhost:4200/admin');
    
    await expect(page).toHaveURL(/.*\/admin/);
    
    // รอให้ตารางแถวแรกปรากฏขึ้นมาก่อน (กันการเช็คค่าก่อนที่ตารางจะเรนเดอร์เสร็จ)
    const row = page.locator('table#usersTable tbody tr').first();
    await expect(row).toBeVisible({ timeout: 5000 });
    
    // ดึง <input> ช่องอีเมล (index 1) แล้วตรวจเช็คค่า
    const emailInput = row.locator('input').nth(1);
    await expect(emailInput).toHaveValue('admin@example.com');
  });
});