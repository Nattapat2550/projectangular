import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('ล็อกอินสำเร็จ: เข้าสู่ระบบและพาไปยังหน้า Home', async ({ page }) => {
    // Mock API Response ให้ครอบคลุม Auth Guard
    await page.route('**/auth/login', route => route.fulfill({
      status: 200, json: { token: 'mock-token', role: 'user', user: { email: 'test@example.com' } }
    }));
    await page.route('**/auth/status', route => route.fulfill({ status: 200, json: { valid: true, role: 'user' } }));
    await page.route('**/auth/me', route => route.fulfill({ status: 200, json: { id: 1, role: 'user', email: 'test@example.com' } }));

    await page.goto('http://localhost:4200/login');
    await page.fill('input[type="email"], input[name="email"], input[formControlName="email"]', 'test@example.com');
    await page.fill('input[type="password"], input[name="password"], input[formControlName="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // แก้ไข: คาดหวังว่ามันอาจจะไปที่หน้า / หรือ /home ก็ได้
    await expect(page).toHaveURL(/.*\/(home)?$/);
  });

  test('ล็อกอินล้มเหลว: รหัสผ่านผิด แจ้งเตือน Unauthorized', async ({ page }) => {
    await page.route('**/auth/login', route => route.fulfill({
      status: 401, json: { message: 'Unauthorized' }
    }));

    await page.goto('http://localhost:4200/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'WrongPass!');
    await page.click('button[type="submit"]');

    // แก้ไข: วิธีเขียน Selector สำหรับดักแจ้งเตือนแบบถูกต้อง
    const errorMsg = page.locator('.alert-danger, .error-message').or(page.getByText(/Unauthorized|Invalid/i)).first();
    await expect(errorMsg).toBeVisible();
    await expect(page).toHaveURL(/.*\/login/); 
  });
});