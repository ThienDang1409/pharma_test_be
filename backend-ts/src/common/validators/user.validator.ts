import { z } from 'zod';

// Register Schema
export const registerSchema = z.object({
  email: z
    .string({ message: 'Email is required' })
    .email('Invalid email format'),
  password: z
    .string({ message: 'Password is required' })
    .min(6, 'Password must be at least 6 characters'),
  name: z
    .string({ message: 'Full name is required' })
    .min(2, 'Full name must be at least 2 characters'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// Login Schema
export const loginSchema = z.object({
  email: z
    .string({ message: 'Email is required' })
    .email('Invalid email format'),
  password: z.string({ message: 'Password is required' }),
});

// Update Profile Schema
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// Change Password Schema
export const changePasswordSchema = z.object({
  currentPassword: z.string({ message: 'Current password is required' }),
  newPassword: z
    .string({ message: 'New password is required' })
    .min(6, 'New password must be at least 6 characters'),
});

// Update User Schema (Admin)
export const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  name: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(['user', 'admin']).optional(),
  isActive: z.boolean().optional(),
});

// User Query Schema
export const userQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .default(1),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .default(10),
  search: z.string().optional(),
  role: z.enum(['user', 'admin']).optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
});
