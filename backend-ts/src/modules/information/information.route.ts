import { Router } from 'express';
import {
  getAllInformation,
  getInformationTree,
  getInformationById,
  getInformationBySlug,
  getChildren,
  createInformation,
  updateInformation,
  deleteInformation,
  reorderInformation,
} from './information.controller';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';
import { validateWithZod } from '../../common/middleware/zod-validate.middleware';
import {
  createInformationSchema,
  updateInformationSchema,
  informationQuerySchema,
  reorderInformationSchema,
} from '../../common/validators/information.validator';

const router = Router();

// Public routes
/**
 * @swagger
 * /api/informations:
 *   get:
 *     summary: Retrieve a list of information
 *     tags: [Information]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of information items.
 */
router.get('/', validateWithZod(informationQuerySchema, 'query'), getAllInformation);
/**
 * @swagger
 * /api/information/tree:
 *   get:
 *     summary: Get information tree structure
 *     tags: [Information]
 *     responses:
 *       200:
 *         description: Information tree.
 */
router.get('/tree', getInformationTree);
/**
 * @swagger
 * /api/information/slug/{slug}:
 *   get:
 *     summary: Get information by slug
 *     tags: [Information]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A single info item.
 */
router.get('/slug/:slug', getInformationBySlug);
/**
 * @swagger
 * /api/information/{id}:
 *   get:
 *     summary: Get information by ID
 *     tags: [Information]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A single info item.
 */
router.get('/:id', getInformationById);
/**
 * @swagger
 * /api/information/{id}/children:
 *   get:
 *     summary: Get children of an information item
 *     tags: [Information]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of child items.
 */
router.get('/:id/children', getChildren);

// Protected routes (Admin only)
/**
 * @swagger
 * /api/information:
 *   post:
 *     summary: Create information
 *     tags: [Information]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created.
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validateWithZod(createInformationSchema),
  createInformation
);

/**
 * @swagger
 * /api/information/reorder:
 *   put:
 *     summary: Reorder information items
 *     tags: [Information]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Reordered.
 */
router.put(
  '/reorder',
  authenticate,
  authorize('admin'),
  validateWithZod(reorderInformationSchema),
  reorderInformation
);

/**
 * @swagger
 * /api/information/{id}:
 *   put:
 *     summary: Update information item
 *     tags: [Information]
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
 *     responses:
 *       200:
 *         description: Updated.
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  validateWithZod(updateInformationSchema),
  updateInformation
);

/**
 * @swagger
 * /api/information/{id}:
 *   delete:
 *     summary: Delete information item
 *     tags: [Information]
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
router.delete('/:id', authenticate, authorize('admin'), deleteInformation);

export default router;
