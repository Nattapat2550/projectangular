export const envConfig = () => {
  // รองรับเคสพิมพ์ผิด/มีช่องว่างใน .env เช่น "EMAIL_DISABLE = true"
  const emailDisableRaw = (
    process.env.EMAIL_DISABLE ??
    (process.env as any)['EMAIL_DISABLE '] ??
    ''
  )
    .toString()
    .trim()
    .toLowerCase();

  return {
    PORT: parseInt(process.env.PORT || '5000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    SESSION_SECRET: process.env.SESSION_SECRET || 'dev-secret',
    JWT_SECRET: process.env.JWT_SECRET || 'dev-jwt',
    DATABASE_URL: process.env.DATABASE_URL,

    PURE_API_BASE_URL: process.env.PURE_API_BASE_URL,
    PURE_API_KEY: process.env.PURE_API_KEY,

    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URI: process.env.GOOGLE_CALLBACK_URI,

    // Gmail API (OAuth2)
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
    REFRESH_TOKEN: process.env.REFRESH_TOKEN,
    SENDER_EMAIL: process.env.SENDER_EMAIL,

    EMAIL_DISABLE: emailDisableRaw === 'true',

    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:4200',
  };
};
