import express from 'express';
import { syncProducts } from '../controllers/syncController.js';
import { getProducts, getProductById } from '../controllers/productController.js';
import { authSync } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { productSyncSchema, productQuerySchema } from '../utils/validationSchemas.js';

const router = express.Router();

/**
 * @swagger
 * /api/sync/products:
 *   post:
 *     summary: Bulk upsert products
 *     tags: [Products]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 local_id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 price:
 *                   type: number
 *                 stock:
 *                   type: number
 *                 category:
 *                   type: string
 *                 metadata:
 *                   type: object
 *     responses:
 *       200:
 *         description: Products synced successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/sync/products', authSync, validate(productSyncSchema), syncProducts);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products with search, filtering, and pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category ID filter
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Brand ID filter
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, most_ordered, name_asc, name_desc]
 *         description: Sort order
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/products', validate(productQuerySchema), getProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product details by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get('/products/:id', getProductById);

export default router;
