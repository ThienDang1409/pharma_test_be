import { z } from 'zod';

// Create Information Schema
export const createInformationSchema = z.object({
  name: z
    .string({ message: 'Vietnamese name is required' })
    .min(2, 'Name must be at least 2 characters'),
  name_en: z
    .string({ message: 'English name is required' })
    .min(2, 'English name must be at least 2 characters'),
  description: z.string().optional(),
  description_en: z.string().optional(),
  image: z.string().optional(),
  parentId: z.string().nullable().optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// Update Information Schema
export const updateInformationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  name_en: z
    .string()
    .min(2, 'English name must be at least 2 characters')
    .optional(),
  description: z.string().optional(),
  description_en: z.string().optional(),
  image: z.string().optional(),
  parentId: z.string().nullable().optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// Information Query Schema
export const informationQuerySchema = z.object({
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
  parentId: z.string().nullable().optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) =>
      val === 'true' ? true : val === 'false' ? false : undefined
    ),
  lang: z.enum(['vi', 'en']).optional(),
});

// Reorder Schema
export const reorderInformationSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number().int().min(0),
    })
  ),
});
