// frontend/tests/protected/routing.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Protected Routing', () => {
  test('เข้าหน้า Home โดยไม่มี Token จะโดนเตะกลับไป Index/Login', async ({ page }) => {
    await page.goto('http://localhost:4200/home');
    // เช็คว่าเด้งกลับหน้า Login หรือหน้าแรก (Index)
    await expect(page).not.toHaveURL(/.*\/home/);
  });

  test('เข้าหน้า Settings โดยไม่มี Token จะโดนเตะออก', async ({ page }) => {
    await page.goto('http://localhost:4200/settings');
    await expect(page).not.toHaveURL(/.*\/settings/);
  });
});