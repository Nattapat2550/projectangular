// frontend/tests/auth/register.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Register Flow', () => {
  test('สมัครสำเร็จ: กรอกอีเมลแล้วเปลี่ยนหน้าไปแจ้งให้ตรวจสอบ (Check)', async ({ page }) => {
    // Mock API Response
    await page.route('**/auth/register', route => route.fulfill({
      status: 201,
      json: { ok: true, emailSent: true }
    }));

    await page.goto('http://localhost:4200/register');
    await page.fill('input[type="email"]', 'newuser@example.com');
    await page.click('button[type="submit"], button:has-text("Register")');

    // เปลี่ยนไปหน้า check.html หรือ /check
    await expect(page).toHaveURL(/.*\/check/);
  });
});