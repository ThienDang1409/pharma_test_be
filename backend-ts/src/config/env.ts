import { z } from 'zod';
import * as dotenv from 'dotenv';

// Load .env if present before validation
dotenv.config();

const envSchema = z.object({
  // Server
  PORT: z.string().transform(Number).default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  MONGO_URI: z.string().min(1, 'MONGO_URI is clearly required for the database to work'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long in production'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters long in production'),
  JWT_ACCESS_EXPIRE: z.string().transform(Number).default(3600),
  JWT_REFRESH_EXPIRE: z.string().transform(Number).default(604800),

  // Cloudinary (Optional, can be empty strings in dev)
  cloudinary_Config_Cloud_Name: z.string().optional(),
  cloudinary_Config_api_key: z.string().optional(),
  cloudinary_Config_api_secret: z.string().optional(),

  // SMTP / Contact (Optional)
  SMTP_HOST: z
    .string()
    .optional()
    .transform((value) => (value && value.trim() ? value.trim() : 'smtp.gmail.com')),
  SMTP_PORT: z
    .string()
    .optional()
    .transform((value) => Number(value || 587)),
  SMTP_SECURE: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  SMTP_USER: z
    .string()
    .optional()
    .transform((value) => (value && value.trim() ? value.trim() : '')),
  SMTP_PASS: z
    .string()
    .optional()
    .transform((value) => (value && value.trim() ? value.trim() : '')),
  SMTP_FROM_NAME: z
    .string()
    .optional()
    .transform((value) => (value && value.trim() ? value.trim() : 'Pharma Test Contact Form')),
  CONTACT_RECEIVER_EMAIL: z
    .string()
    .optional()
    .transform((value) => (value && value.trim() ? value.trim() : 'va@vietanh.vn')),
});

// Validate `process.env`
const envValidationPattern = envSchema.safeParse(process.env);

if (!envValidationPattern.success) {
  console.error(
    '❌ Invalid environment variables:',
    envValidationPattern.error.format()
  );
  process.exit(1);
}

export const env = envValidationPattern.data;
