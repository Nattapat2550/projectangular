// backend/src/types/third-party.d.ts

declare module 'bcrypt';
declare module 'compression';
declare module 'cookie-parser';

// กำหนด type คร่าว ๆ ให้ nodemailer พอให้ TS พอใจ
declare module 'nodemailer' {
  export type Transporter = any;
  export function createTransport(options: any): Transporter;
}
