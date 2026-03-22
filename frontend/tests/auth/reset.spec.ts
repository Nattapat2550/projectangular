import { test, expect } from '@playwright/test';

const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

test.describe('Forgot & Reset Password Flow', () => {
  
  test.describe('Part 1: Request Reset Link', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/users/me', route => {
        if (route.request().method() === 'OPTIONS') return route.continue();
        route.fulfill({ status: 401, headers: corsHeaders, json: { error: 'Not logged in' } });
      });
      await page.goto('/reset');
    });

    test('should show error on API failure', async ({ page }) => {
      await page.route('**/api/auth/forgot-password', route => {
        if (route.request().method() === 'OPTIONS') return route.continue();
        route.fulfill({ status: 500, headers: corsHeaders, json: { error: 'Server Error' } });
      });

      // 🌟 ใช้ locator ตาม type แทน name เพื่อให้ตรงกับ ResetPasswordPage.jsx
      await page.locator('input[type="email"]').fill('user@example.com');
      await page.locator('button[type="submit"]').click();
      
      // อ้างอิงข้อความ Error ตามที่คุณรับค่ามาใส่ {msg}
      await expect(page.getByText('Server Error')).toBeVisible();
    });
  });

  test.describe('Part 2: Set New Password', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/users/me', route => {
        if (route.request().method() === 'OPTIONS') return route.continue();
        route.fulfill({ status: 401, headers: corsHeaders, json: { error: 'Not logged in' } });
      });
      await page.goto('/reset?token=mock_valid_token');
    });

    test('should reset password successfully', async ({ page }) => {
      await page.route('**/api/auth/reset-password', route => {
        if (route.request().method() === 'OPTIONS') return route.continue();
        route.fulfill({ status: 200, headers: corsHeaders, json: { ok: true } });
      });

      const pwInput = page.locator('input[type="password"]').first();
      await pwInput.waitFor({ state: 'visible' });
      await pwInput.fill('NewStrongPass1!');
      await page.locator('button[type="submit"]').click();

      // อ้างอิงข้อความสำเร็จเป๊ะๆ ตามโค้ดในหน้า Reset
      await expect(page.getByText('Password set. You can login now.')).toBeVisible();
    });
  });
});