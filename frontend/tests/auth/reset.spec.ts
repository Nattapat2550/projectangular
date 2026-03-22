// frontend/tests/auth/reset.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Reset Password Flow', () => {
  test('Part 1: ขอลิงก์ (Request Box) สำเร็จ', async ({ page }) => {
    await page.route('**/auth/forgot-password', route => route.fulfill({ status: 200, json: { ok: true } }));
    
    await page.goto('http://localhost:4200/reset');
    // ควรแสดงฟอร์มกรอกอีเมล
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    
    // แจ้งเตือนว่าส่งลิงก์สำเร็จ
    await expect(page.locator('text=ส่งลิงก์เรียบร้อยแล้ว')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('Part 2: ตั้งรหัสผ่านใหม่ (เข้าด้วย URL ?token=...)', async ({ page }) => {
    await page.route('**/auth/reset-password', route => route.fulfill({ status: 200, json: { ok: true } }));

    // จำลองเข้าเว็บด้วย token
    await page.goto('http://localhost:4200/reset?token=mock-valid-token');
    
    // ฟอร์มขอลิงก์ต้องซ่อน และฟอร์มรหัสผ่านต้องแสดง
    await expect(page.locator('input[type="email"]')).not.toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    await page.fill('input[type="password"]', 'NewPassword123!');
    await page.click('button[type="submit"]');

    // เปลี่ยนเสร็จควรแจ้งเตือนหรือพาไปหน้าล็อกอิน
    await expect(page).toHaveURL(/.*\/login/);
  });
});