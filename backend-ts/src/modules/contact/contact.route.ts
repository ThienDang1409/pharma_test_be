import { Router } from 'express';
import { validateWithZod } from '../../common/middleware/zod-validate.middleware';
import { submitContactSchema } from '../../common/validators/contact.validator';
import { submitContact } from './contact.controller';

const router = Router();

/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Submit public contact form
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, message]
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               company:
 *                 type: string
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *               sourcePage:
 *                 type: string
 *               language:
 *                 type: string
 *                 enum: [vi, en]
 *     responses:
 *       200:
 *         description: Contact request submitted
 */
router.post('/', validateWithZod(submitContactSchema), submitContact);

export default router;
