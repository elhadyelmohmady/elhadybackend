import express from 'express';
import {
    recordPayment,
    getOrderPayments,
    getAllPayments,
    getMyPayments
} from '../controllers/paymentController.js';
import { protect, protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Record a payment for an order (Admin only)
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - amount
 *             properties:
 *               orderId:
 *                 type: string
 *               amount:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment recorded successfully
 *       400:
 *         description: Invalid payment amount
 *       404:
 *         description: Order not found
 */
router.post('/', protectAdmin, recordPayment);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get all payments (Admin only)
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
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
 *         description: List of all payments
 */
router.get('/', protectAdmin, getAllPayments);

/**
 * @swagger
 * /api/payments/my-payments:
 *   get:
 *     summary: Get my payments across all orders
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
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
 *         description: List of user's payments
 */
router.get('/my-payments', protect, getMyPayments);

/**
 * @swagger
 * /api/payments/order/{orderId}:
 *   get:
 *     summary: Get payments for a specific order
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of payments for the order
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Order not found
 */
router.get('/order/:orderId', protect, getOrderPayments);

export default router;
