export default () => ({
  port: parseInt(process.env.PORT ?? '5000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  sessionSecret: process.env.SESSION_SECRET,
  jwtSecret: process.env.JWT_SECRET,
  databaseUrl: process.env.DATABASE_URL,
  frontendUrl: process.env.FRONTEND_URL,
  emailDisable: process.env.EMAIL_DISABLE === 'true',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUri: process.env.GOOGLE_CALLBACK_URI,
  },
  gmail: {
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
    refreshToken: process.env.REFRESH_TOKEN,
    senderEmail: process.env.SENDER_EMAIL,
  },
});
