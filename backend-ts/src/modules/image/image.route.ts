import { Router } from 'express';
import {
  uploadImage,
  uploadMultiple,
  getAllImages,
  getImageById,
  updateImage,
  addReference,
  removeReference,
  transformImage,
  deleteImage,
  cleanupUnused,
  getImagesByEntity,
} from './image.controller';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';
import { validateWithZod } from '../../common/middleware/zod-validate.middleware';
import {
  uploadSingle,
  uploadMultiple as uploadMultipleMiddleware,
  handleMulterError,
} from '../../common/middleware/upload.middleware';
import {
  uploadImageSchema,
  updateImageSchema,
  imageQuerySchema,
  addReferenceSchema,
  removeReferenceSchema,
  transformImageSchema,
  bulkUploadSchema,
} from '../../common/validators/image.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Upload routes
/**
 * @swagger
 * /api/image/upload:
 *   post:
 *     summary: Upload a single image
 *     tags: [Image]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Image uploaded.
 */
router.post(
  '/upload',
  uploadSingle,
  handleMulterError,
  validateWithZod(uploadImageSchema),
  uploadImage
);

/**
 * @swagger
 * /api/image/upload-multiple:
 *   post:
 *     summary: Upload multiple images
 *     tags: [Image]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Images uploaded.
 */
router.post(
  '/upload-multiple',
  uploadMultipleMiddleware,
  handleMulterError,
  validateWithZod(bulkUploadSchema),
  uploadMultiple
);

// Query routes
/**
 * @swagger
 * /api/image:
 *   get:
 *     summary: Get all images
 *     tags: [Image]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of images.
 */
router.get('/', validateWithZod(imageQuerySchema), getAllImages);
/**
 * @swagger
 * /api/image/entity/{entityType}/{entityId}:
 *   get:
 *     summary: Get images by entity
 *     tags: [Image]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Images by entity.
 */
router.get('/entity/:entityType/:entityId', getImagesByEntity);
/**
 * @swagger
 * /api/image/{id}:
 *   get:
 *     summary: Get image by ID
 *     tags: [Image]
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
 *         description: A single image.
 */
router.get('/:id', getImageById);

// Update routes
/**
 * @swagger
 * /api/image/{id}:
 *   put:
 *     summary: Update an image
 *     tags: [Image]
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
 *         description: Updated image.
 */
router.put('/:id', validateWithZod(updateImageSchema), updateImage);

// Reference management
/**
 * @swagger
 * /api/image/{id}/reference:
 *   post:
 *     summary: Add reference to image
 *     tags: [Image]
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
 *         description: Reference added.
 */
router.post(
  '/:id/reference',
  validateWithZod(addReferenceSchema),
  addReference
);
/**
 * @swagger
 * /api/image/{id}/reference:
 *   delete:
 *     summary: Remove reference from image
 *     tags: [Image]
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
 *         description: Reference removed.
 */
router.delete(
  '/:id/reference',
  validateWithZod(removeReferenceSchema),
  removeReference
);

// Transformation
/**
 * @swagger
 * /api/image/{id}/transform:
 *   post:
 *     summary: Transform an image
 *     tags: [Image]
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
 *         description: Output transformed image URL.
 */
router.post(
  '/:id/transform',
  validateWithZod(transformImageSchema),
  transformImage
);

// Admin only routes
/**
 * @swagger
 * /api/image/{id}:
 *   delete:
 *     summary: Delete an image
 *     tags: [Image]
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
 *         description: Deleted.
 */
router.delete('/:id', authorize('admin'), deleteImage);
/**
 * @swagger
 * /api/image/cleanup:
 *   post:
 *     summary: Cleanup unused images
 *     tags: [Image]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unused images removed.
 */
router.post('/cleanup', authorize('admin'), cleanupUnused);

export default router;
