/**
 * Application Constants
 */

// Blog Status
export const BLOG_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
} as const;

export type BlogStatusType = typeof BLOG_STATUS[keyof typeof BLOG_STATUS];

// Default values
export const DEFAULTS = {
  PAGINATION_LIMIT: 10,
  PAGINATION_PAGE: 1,
  BLOG_AUTHOR: 'Admin',
  BLOG_IMAGE: '/default-image.jpg',
  JSON_LIMIT: '10mb',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  BLOG_NOT_FOUND: 'Blog not found',
  TITLE_REQUIRED: 'Title and informationId are required',
  ROUTE_NOT_FOUND: 'Không tìm thấy route.',
  SERVER_ERROR: 'Internal Server Error',
} as const;

// API Routes
export const API_ROUTES = {
  HEALTH: '/',
  BLOGS: '/api/blog',
  BLOGS_BY_ID: '/api/blog/:id',
  BLOGS_BY_SLUG: '/api/blog/slug/:slug',
  AUTH: '/api/auth',
  USERS: '/api/users',
  INFORMATION: '/api/informations',
  IMAGES: '/api/images',
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  SLUG_MIN_LENGTH: 3,
  SLUG_MAX_LENGTH: 200,
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 200,
  EXCERPT_MAX_LENGTH: 500,
} as const;
