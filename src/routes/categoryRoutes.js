import express from 'express';
import { getCategories, getCategoryProducts } from '../controllers/categoryController.js';

const router = express.Router();

router.get('/', getCategories);
router.get('/:id/products', getCategoryProducts);

export default router;
