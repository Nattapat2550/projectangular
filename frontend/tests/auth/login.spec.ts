// frontend/tests/auth/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('ล็อกอินสำเร็จ: เข้าสู่ระบบและพาไปยังหน้า Home', async ({ page }) => {
    // Mock API Response
    await page.route('**/auth/login', route => route.fulfill({
      status: 200,
      json: { token: 'mock-token', role: 'user', user: { email: 'test@example.com' } }
    }));

    await page.goto('http://localhost:4200/login'); // ปรับ URL ตาม Angular
    await page.fill('input[name="email"], input[formControlName="email"]', 'test@example.com');
    await page.fill('input[name="password"], input[formControlName="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // คาดหวังว่าจะเปลี่ยนหน้าไปที่ Home
    await expect(page).toHaveURL(/.*\/home/);
  });

  test('ล็อกอินล้มเหลว: รหัสผ่านผิด แจ้งเตือน Unauthorized', async ({ page }) => {
    // Mock API Error
    await page.route('**/auth/login', route => route.fulfill({
      status: 401,
      json: { message: 'Unauthorized' }
    }));

    await page.goto('http://localhost:4200/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'WrongPass!');
    await page.click('button[type="submit"]');

    // ตรวจสอบว่ามี Alert หรือข้อความแสดงข้อผิดพลาด (ปรับ Selector ให้ตรงกับ UI คุณ)
    const errorMsg = page.locator('.alert-danger, .error-message, text=Unauthorized, text=Invalid');
    await expect(errorMsg).toBeVisible();
    await expect(page).toHaveURL(/.*\/login/); // ยังอยู่ที่เดิม
  });
});