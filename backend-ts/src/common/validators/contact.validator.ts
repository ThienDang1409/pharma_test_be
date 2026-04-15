import { z } from 'zod';

const optionalTrimmed = () =>
  z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined));

/**
 * Contact form schema
 */
export const submitContactSchema = z.object({
  fullName: z
    .string({ message: 'Full name is required' })
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(120, 'Full name must not exceed 120 characters'),
  email: z
    .string({ message: 'Email is required' })
    .trim()
    .email('Invalid email format'),
  phone: optionalTrimmed().transform((value) => value?.slice(0, 30)),
  company: optionalTrimmed().transform((value) => value?.slice(0, 120)),
  subject: optionalTrimmed().transform((value) => value?.slice(0, 160)),
  message: z
    .string({ message: 'Message is required' })
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(4000, 'Message must not exceed 4000 characters'),
  sourcePage: z
    .string()
    .trim()
    .max(400)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  language: z.enum(['vi', 'en']).optional().default('vi'),
});

export type SubmitContactInput = z.infer<typeof submitContactSchema>;
