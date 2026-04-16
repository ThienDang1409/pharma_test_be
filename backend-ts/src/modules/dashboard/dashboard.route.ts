import { Router } from 'express';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';
import { getDashboardOverview } from './dashboard.controller';

const router = Router();

router.use(authenticate, authorize('admin'));

/**
 * @swagger
 * /api/dashboard/overview:
 *   get:
 *     summary: Get dashboard overview statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved.
 */
router.get('/overview', getDashboardOverview);

export default router;
