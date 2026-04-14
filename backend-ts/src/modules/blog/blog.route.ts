import { Router } from 'express';
import * as blogController from './blog.controller';
import { CreateBlogSchema, UpdateBlogSchema, BlogQuerySchema } from '../../common/validators/blog.validator';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';
import { validateWithZod } from '../../common/middleware/zod-validate.middleware';

const router = Router();

// Public routes
/**
 * @swagger
 * /api/blog:
 *   get:
 *     summary: Retrieve a list of blogs
 *     tags: [Blog]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of blogs.
 */
router.get('/', validateWithZod(BlogQuerySchema, 'query'), blogController.getAllBlogs);

/**
 * @swagger
 * /api/blog/exact-category:
 *   get:
 *     summary: Get blogs for exact category only (no descendant categories)
 *     tags: [Blog]
 *     parameters:
 *       - in: query
 *         name: informationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of blogs for exact category.
 */
router.get('/exact-category', validateWithZod(BlogQuerySchema, 'query'), blogController.getAllBlogsExactCategory);

/**
 * @swagger
 * /api/blog/slug/{slug}:
 *   get:
 *     summary: Get a blog by slug
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A single blog.
 */
router.get('/slug/:slug', blogController.getBlogBySlug);
/**
 * @swagger
 * /api/blog/{id}:
 *   get:
 *     summary: Get a blog by ID
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A single blog.
 */
router.get('/:id', blogController.getBlogById);

// Protected routes (Admin only)
/**
 * @swagger
 * /api/blog:
 *   post:
 *     summary: Create a new blog
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               informationId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 */
router.post(
    '/',
    authenticate,
    authorize('admin'),
    validateWithZod(CreateBlogSchema),
    blogController.createBlog
);

/**
 * @swagger
 * /api/blog/{id}:
 *   put:
 *     summary: Update an existing blog
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated
 */
router.put(
    '/:id',
    authenticate,
    authorize('admin'),
    validateWithZod(UpdateBlogSchema),
    blogController.updateBlog
);

/**
 * @swagger
 * /api/blog/{id}:
 *   delete:
 *     summary: Delete a blog
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete(
    '/:id',
    authenticate,
    authorize('admin'),
    blogController.deleteBlog
);

export default router;
