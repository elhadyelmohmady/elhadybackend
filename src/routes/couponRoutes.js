import express from 'express';
import { validateCoupon, getAvailableCoupons } from '../controllers/couponController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/validate', validateCoupon);
router.get('/available', getAvailableCoupons);

export default router;
