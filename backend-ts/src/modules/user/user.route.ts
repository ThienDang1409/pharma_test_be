import { Router } from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser } from './user.controller';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';
import { validateWithZod } from '../../common/middleware/zod-validate.middleware';
import { updateUserSchema, userQuerySchema } from '../../common/validators/user.validator';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate, authorize('admin'));

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Retrieve a list of users
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of users.
 */
router.get('/', validateWithZod(userQuerySchema, 'query'), getAllUsers);
/**
 * @swagger
 * /api/user/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [User]
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
 *         description: A single user.
 */
router.get('/:id', getUserById);
/**
 * @swagger
 * /api/user/{id}:
 *   put:
 *     summary: Update an existing user
 *     tags: [User]
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
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated
 */
router.put('/:id', validateWithZod(updateUserSchema), updateUser);
/**
 * @swagger
 * /api/user/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [User]
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
router.delete('/:id', deleteUser);

export default router;
