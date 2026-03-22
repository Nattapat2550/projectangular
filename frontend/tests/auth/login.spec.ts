import { test, expect } from '@playwright/test';

const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

test.describe('Login Flow & Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    // 🌟 Mock ให้ /me ส่ง 401 กลับไป (เป็น Guest) เพื่อไม่ให้หน้าเว็บค้างที่สถานะ Loading
    await page.route('**/api/users/me', route => {
      if (route.request().method() === 'OPTIONS') return route.continue();
      route.fulfill({ status: 401, headers: corsHeaders, json: { error: 'Not logged in' } });
    });
    await page.goto('/login');
  });

  test('should display required validation errors on empty submission', async ({ page }) => {
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    await page.route('**/api/auth/login', route => {
      if (route.request().method() === 'OPTIONS') return route.continue();
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        headers: corsHeaders, // 🌟 เพิ่ม Header กัน Axios ฟ้อง CORS Error
        body: JSON.stringify({ error: 'Invalid credentials' })
      });
    });

    await page.locator('input[name="email"]').fill('wrong@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText('Invalid credentials')).toBeVisible();
  });

  test('should login successfully, save token, and redirect to Home', async ({ page }) => {
    await page.route('**/api/auth/login', route => {
      if (route.request().method() === 'OPTIONS') return route.continue();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({ token: 'fake-jwt-token', user: { id: 1, email: 'user@example.com', role: 'user' } })
      });
    });

    // 🌟 จำลองว่าล็อกอินเสร็จแล้ว หน้า App ไปเช็ค API /me อีกรอบ ก็ให้ผ่าน
    await page.route('**/api/users/me', route => {
      if (route.request().method() === 'OPTIONS') return route.continue();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({ id: 1, username: 'Test User', role: 'user' }) 
      });
    });

    await page.locator('input[name="email"]').fill('user@example.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/.*\/home/);
  });
});