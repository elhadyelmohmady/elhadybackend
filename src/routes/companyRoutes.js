import express from 'express';
import {
    getCompanies,
    getCompanyById,
    getCompanyBrands,
    getCompanyProducts,
    getCompanyCategories
} from '../controllers/companyController.js';

const router = express.Router();

/**
 * @swagger
 * /api/companies:
 *   get:
 *     summary: Get all active companies with search and filters
 *     tags: [Companies]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query for company name or description
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter companies by Category ID
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filter companies by Brand ID
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
 *         description: List of companies
 */
router.get('/', getCompanies);

/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     summary: Get company details by ID
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company details
 *       404:
 *         description: Company not found
 */
router.get('/:id', getCompanyById);

/**
 * @swagger
 * /api/companies/{id}/brands:
 *   get:
 *     summary: Get brands belonging to a company
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       200:
 *         description: List of brands for the company
 *       404:
 *         description: Company not found
 */
router.get('/:id/brands', getCompanyBrands);

/**
 * @swagger
 * /api/companies/{id}/products:
 *   get:
 *     summary: Get products belonging to a company
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter products by category ID
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
 *         description: Products per page
 *     responses:
 *       200:
 *         description: Paginated list of products for the company
 *       404:
 *         description: Company not found
 */
router.get('/:id/products', getCompanyProducts);

/**
 * @swagger
 * /api/companies/{id}/categories:
 *   get:
 *     summary: Get categories associated with a company
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       200:
 *         description: List of categories associated with the company
 *       404:
 *         description: Company not found
 */
router.get('/:id/categories', getCompanyCategories);

export default router;
