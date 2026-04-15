import * as dotenv from 'dotenv';

// Load .env if present
dotenv.config();

import { env } from './env';

export const config = {
  // Server
  port: env.PORT,
  nodeEnv: env.NODE_ENV,

  // Database
  mongoUri: env.MONGO_URI,
  
  // JWT
  jwtSecret: env.JWT_SECRET,
  jwtRefreshSecret: env.JWT_REFRESH_SECRET,
  jwtAccessExpire: env.JWT_ACCESS_EXPIRE,
  jwtRefreshExpire: env.JWT_REFRESH_EXPIRE,

  // Cloudinary (if using)
  cloudinaryName: env.cloudinary_Config_Cloud_Name || '',
  cloudinaryApiKey: env.cloudinary_Config_api_key || '',
  cloudinaryApiSecret: env.cloudinary_Config_api_secret || '',

  // Contact / SMTP
  smtpHost: env.SMTP_HOST,
  smtpPort: env.SMTP_PORT,
  smtpSecure: env.SMTP_SECURE,
  smtpUser: env.SMTP_USER || '',
  smtpPass: env.SMTP_PASS || '',
  smtpFromName: env.SMTP_FROM_NAME,
  contactReceiverEmail: env.CONTACT_RECEIVER_EMAIL,
};

export default config;
