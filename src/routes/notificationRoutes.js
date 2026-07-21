import express from 'express';
import {
    getUserNotifications,
    getUserUnreadCount,
    markUserNotificationAsRead
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// User app notification routes (Protected for logged in users)
router.use(protect);

router.get('/', getUserNotifications);
router.get('/unread-count', getUserUnreadCount);
router.patch('/:id/read', markUserNotificationAsRead);

export default router;
