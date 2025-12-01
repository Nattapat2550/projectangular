// src/config/validation.ts
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(5000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  SESSION_SECRET: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  DATABASE_URL: Joi.string().uri().required(),

  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_URI: Joi.string().uri().required(),

  GOOGLE_REDIRECT_URI: Joi.string().uri().required(),
  REFRESH_TOKEN: Joi.string().required(),
  SENDER_EMAIL: Joi.string().email().required(),

  EMAIL_DISABLE: Joi.string().valid('true', 'false').default('true'),
  FRONTEND_URL: Joi.string().uri().required(),
});
