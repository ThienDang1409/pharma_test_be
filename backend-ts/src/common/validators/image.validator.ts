import { z } from 'zod';

// Upload Image Schema
export const uploadImageSchema = z.object({
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
  folder: z.string().optional(),
  entityType: z.enum(['blog', 'user', 'information', 'other']).optional(),
  entityId: z.string().optional(),
  field: z.string().optional(),
});

// Update Image Schema
export const updateImageSchema = z.object({
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
});

// Image Query Schema
export const imageQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .default(1),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .default(20),
  search: z.string().optional(),
  tags: z.string().optional(), // comma-separated tags
  folder: z.string().optional(),
  entityType: z.enum(['blog', 'user', 'information', 'other']).optional(),
  entityId: z.string().optional(),
  uploadedBy: z.string().optional(),
  unusedOnly: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

// Add Reference Schema
export const addReferenceSchema = z.object({
  entityType: z.enum(['blog', 'user', 'information', 'other'], {
    message: 'Entity type must be blog, user, information, or other',
  }),
  entityId: z.string({ message: 'Entity ID is required' }),
  field: z.string({ message: 'Field name is required' }),
});

// Remove Reference Schema
export const removeReferenceSchema = z.object({
  entityType: z.enum(['blog', 'user', 'information', 'other'], {
    message: 'Entity type must be blog, user, information, or other',
  }),
  entityId: z.string({ message: 'Entity ID is required' }),
  field: z.string().optional(),
});

// Transform Image Schema
export const transformImageSchema = z.object({
  name: z.string({ message: 'Transformation name is required' }),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  crop: z.enum(['fill', 'fit', 'scale', 'limit', 'pad', 'thumb']).optional(),
  quality: z.number().int().min(1).max(100).optional(),
  format: z.enum(['jpg', 'png', 'webp', 'avif']).optional(),
  gravity: z
    .enum(['auto', 'face', 'center', 'north', 'south', 'east', 'west'])
    .optional(),
});

// Bulk Upload Schema (for multiple files)
export const bulkUploadSchema = z.object({
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
  folder: z.string().optional(),
});
