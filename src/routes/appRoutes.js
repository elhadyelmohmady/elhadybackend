import express from 'express';
import { getAppStatus } from '../controllers/appController.js';

const router = express.Router();

/**
 * @swagger
 * /api/app/status:
 *   get:
 *     summary: Get app maintenance/update status
 *     tags: [App]
 *     responses:
 *       200:
 *         description: Maintenance mode and force/soft update info
 */
router.get('/status', getAppStatus);

export default router;
