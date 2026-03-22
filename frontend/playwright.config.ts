import { defineConfig, devices } from '@playwright/test';

/**
 * อ่านเพิ่มเติมเกี่ยวกับการตั้งค่า Playwright:
 * https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // โฟลเดอร์ที่เราเก็บไฟล์เทสเอาไว้ (ตามที่แยกไฟล์ไว้ให้ในโฟลเดอร์ tests)
  testDir: './tests',
  
  /* ให้รันเทสแบบขนาน (Parallel) เพื่อความรวดเร็ว */
  fullyParallel: true,
  
  /* สั่ง Fail ทันทีบน CI หากเผลอลืมใส่ test.only() ไว้ในโค้ด */
  forbidOnly: !!process.env.CI,
  
  /* บน CI ให้ลองรันใหม่ (Retry) 2 ครั้งถ้าเทสพัง (เผื่อจังหวะเว็บโหลดช้า) ส่วนบนเครื่อง local ไม่ต้อง retry */
  retries: process.env.CI ? 2 : 0,
  
  /* บน CI ให้ลดจำนวน worker ลงเพื่อป้องกันการกิน Resource เซิร์ฟเวอร์เยอะเกินไป */
  workers: process.env.CI ? 1 : undefined,
  
  /* รูปแบบ Report เมื่อรันเทสเสร็จ (ใช้ html report ดูง่ายที่สุด) */
  reporter: 'html',
  
  /* ตั้งค่าการทำงานกลางสำหรับทุกโปรเจกต์/เบราว์เซอร์ */
  use: {
    /* ตั้ง Base URL ไว้เลย เวลาเขียนเทสจะได้ใช้แค่ page.goto('/login') แทนที่จะเขียนเต็มๆ */
    baseURL: 'http://localhost:4200',

    /* บันทึก Trace (หน้าจอ+Network) ไว้ดูย้อนหลังเฉพาะตอนที่เทสรันใหม่ (Retry) */
    trace: 'on-first-retry',
    
    /* ถ่ายภาพ Screenshot ตอนที่เทสล้มเหลวเสมอ (มีประโยชน์มากเวลาหาบั๊กบน CI) */
    screenshot: 'only-on-failure',
  },

  /* ตั้งค่า Browser ที่ใช้ทดสอบ */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // สามารถเพิ่ม Mobile Safari / Mobile Chrome ได้ถ้าต้องการเทสบนมือถือ
  ],

  /* * Web Server Configuration (สำคัญมากสำหรับการรันบน GitHub Actions)
   * ตั้งค่าให้ Playwright สั่งรันโปรเจกต์ Angular ของเราขึ้นมาอัตโนมัติก่อนเริ่มเทส
   */
  webServer: {
    // คำสั่งสำหรับรันโปรเจกต์ (อิงตาม package.json ของคุณ ปกติจะเป็น ng serve หรือ npm start)
    command: 'npm start', 
    
    // Playwright จะรอจนกว่า URL นี้จะตอบกลับ 200 OK ถึงจะเริ่มรันเทส
    url: 'http://localhost:4200',
    
    // ถ้าเราเปิดเว็บทิ้งไว้อยู่แล้วบนเครื่อง Local ก็ให้ใช้ตัวเดิมเลย จะได้ไม่ซ้อนทับกัน
    reuseExistingServer: !process.env.CI,
    
    // ให้เวลา Angular ทำการ Build และ Start นานสุด 120 วินาที (บน CI บางทีอาจจะช้า)
    timeout: 120 * 1000, 
  },
});