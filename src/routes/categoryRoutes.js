import express from 'express';
import { getCategories, getCategoryProducts, getCategoryBrands } from '../controllers/categoryController.js';

const router = express.Router();

router.get('/', getCategories);
router.get('/:id/products', getCategoryProducts);
router.get('/:id/brands', getCategoryBrands);

export default router;
