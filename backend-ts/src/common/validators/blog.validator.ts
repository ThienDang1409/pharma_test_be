import { z } from 'zod';
import { VALIDATION_RULES, BLOG_STATUS } from '../../common/constants';

/**
 * Blog Creation Schema
 */
export const CreateBlogSchema = z.object({
  title: z
    .string()
    .min(VALIDATION_RULES.TITLE_MIN_LENGTH, 'Title too short')
    .max(VALIDATION_RULES.TITLE_MAX_LENGTH, 'Title too long')
    .trim(),
  
  title_en: z
    .string()
    .trim()
    .optional(),
  
  author: z
    .string()
    .min(1, 'Author is required')
    .max(100, 'Author too long')
    .trim()
    .optional(),
  
  image: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform(val => val === '' ? null : val),
  
  excerpt: z
    .string()
    .max(VALIDATION_RULES.EXCERPT_MAX_LENGTH, 'Excerpt too long')
    .trim()
    .optional(),
  
  excerpt_en: z
    .string()
    .max(VALIDATION_RULES.EXCERPT_MAX_LENGTH, 'Excerpt too long')
    .trim()
    .optional(),
  
  informationId: z
    .string()
    .trim()
    .min(1, 'Information ID is required'),
  
  tags: z
    .array(z.string())
    .optional(),
  
  sections: z
    .array(
      z.object({
        title: z.string().min(1, 'Section title required'),
        title_en: z.string().optional(),
        slug: z.string().min(1, 'Section slug required'),
        type: z.string().min(1, 'Section type required'),
        content: z.string().min(1, 'Section content required'),
        content_en: z.string().optional(),
      })
    )
    .optional(),
  
  isProduct: z
    .boolean()
    .optional()
    .default(false),
  
  status: z
    .enum([BLOG_STATUS.DRAFT, BLOG_STATUS.PUBLISHED] as const)
    .optional()
    .default(BLOG_STATUS.DRAFT),
  slug: z
    .string()
    .min(VALIDATION_RULES.SLUG_MIN_LENGTH, 'Slug too short')
    .max(VALIDATION_RULES.SLUG_MAX_LENGTH, 'Slug too long')
    .trim(),
});

/**
 * Blog Update Schema (All fields optional)
 */
export const UpdateBlogSchema = CreateBlogSchema.partial();

/**
 * Blog Query Schema
 */
export const BlogQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a number')
    .transform(Number)
    .optional()
    .default(1),
  
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a number')
    .transform(Number)
    .optional()
    .default(10),
  
  status: z
    .enum([BLOG_STATUS.DRAFT, BLOG_STATUS.PUBLISHED] as const)
    .optional(),
  
  isProduct: z
    .enum(['true', 'false'])
    .transform(v => v === 'true')
    .optional(),
  
  search: z
    .string()
    .trim()
    .optional(),
  
  tags: z
    .string()
    .trim()
    .optional(),
});

// Type inference from schemas
export type CreateBlogInput = z.infer<typeof CreateBlogSchema>;
export type UpdateBlogInput = z.infer<typeof UpdateBlogSchema>;
export type BlogQueryInput = z.infer<typeof BlogQuerySchema>;
