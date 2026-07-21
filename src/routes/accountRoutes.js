import express from 'express';
import {
    getMyAccount,
    getMyStatement,
    getFinancialOverview,
    getUserAccountSummary,
    getUserStatement,
    recordAccountPayment,
    recordAccountAdjustment,
    updateUserCreditLimit
} from '../controllers/accountController.js';
import { protect, protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/accounts/my-account:
 *   get:
 *     summary: Get current user financial account summary (balance, debt, credit limit, total paid)
 *     tags: [Accounts]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User account summary fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/my-account', protect, getMyAccount);

/**
 * @swagger
 * /api/accounts/my-statement:
 *   get:
 *     summary: Get current user statement of account / ledger (Kashf 7sab)
 *     tags: [Accounts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page (default 20)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions starting from date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions up to date (YYYY-MM-DD)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [order_debit, payment_credit, adjustment_debit, adjustment_credit]
 *         description: Filter by transaction type
 *     responses:
 *       200:
 *         description: User statement of account fetched successfully
 */
router.get('/my-statement', protect, getMyStatement);

/**
 * @swagger
 * /api/accounts/financial-overview:
 *   get:
 *     summary: Get total money and system-wide financial statistics (Admin only)
 *     tags: [Accounts]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: System financial overview (total sales, total collected, total debt, top debtors)
 *       401:
 *         description: Unauthorized
 */
router.get('/financial-overview', protectAdmin, getFinancialOverview);

/**
 * @swagger
 * /api/accounts/users/{userId}/summary:
 *   get:
 *     summary: Get account summary for a specific user (Admin only)
 *     tags: [Accounts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User account summary
 *       404:
 *         description: User not found
 */
router.get('/users/:userId/summary', protectAdmin, getUserAccountSummary);

/**
 * @swagger
 * /api/accounts/users/{userId}/statement:
 *   get:
 *     summary: Get statement of account for a specific user (Admin only)
 *     tags: [Accounts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [order_debit, payment_credit, adjustment_debit, adjustment_credit]
 *     responses:
 *       200:
 *         description: User statement of account
 */
router.get('/users/:userId/statement', protectAdmin, getUserStatement);

/**
 * @swagger
 * /api/accounts/payments:
 *   post:
 *     summary: Record a payment for a user account or order with custom date support (Admin only)
 *     tags: [Accounts]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - amount
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *               orderId:
 *                 type: string
 *                 description: Optional specific order ID
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, deferred, bank_transfer, online, check, other]
 *                 default: cash
 *               paymentDate:
 *                 type: string
 *                 format: date-time
 *                 description: Custom payment date (e.g. "2026-07-01T10:00:00Z" or "2026-07-01")
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment recorded successfully
 *       400:
 *         description: Validation error
 */
router.post('/payments', protectAdmin, recordAccountPayment);

/**
 * @swagger
 * /api/accounts/adjustments:
 *   post:
 *     summary: Record a manual credit or debit adjustment for a user account (Admin only)
 *     tags: [Accounts]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - type
 *               - amount
 *             properties:
 *               userId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [adjustment_debit, adjustment_credit]
 *                 description: adjustment_debit (increase debt), adjustment_credit (decrease debt / add credit)
 *               amount:
 *                 type: number
 *               transactionDate:
 *                 type: string
 *                 format: date-time
 *                 description: Custom transaction date
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Adjustment recorded successfully
 */
router.post('/adjustments', protectAdmin, recordAccountAdjustment);

/**
 * @swagger
 * /api/accounts/users/{userId}/credit-limit:
 *   put:
 *     summary: Update user credit limit and credit allowance (Admin only)
 *     tags: [Accounts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               creditLimit:
 *                 type: number
 *                 description: Maximum allowed credit limit
 *               isCreditAllowed:
 *                 type: boolean
 *                 description: Allow or disallow deferred payment
 *     responses:
 *       200:
 *         description: Credit limit updated successfully
 */
router.put('/users/:userId/credit-limit', protectAdmin, updateUserCreditLimit);

export default router;
