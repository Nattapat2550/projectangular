// ประกาศตัวแปร global จาก Node ที่เราใช้ (process, __dirname)
declare var process: any;
declare var __dirname: string;

// ให้ TypeScript รู้ว่ามี module พวกนี้ (ไม่ต้องใช้ type ละเอียด)
declare module 'crypto';
declare module 'path';
