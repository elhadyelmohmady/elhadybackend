import express from 'express';
import {
    getCategories,
    getCategoryProducts,
    getCategoryBrands,
    getCategorySubcategories
} from '../controllers/categoryController.js';

const router = express.Router();

router.get('/', getCategories);
router.get('/:id/products', getCategoryProducts);
router.get('/:id/brands', getCategoryBrands);
router.get('/:id/subcategories', getCategorySubcategories);

export default router;
