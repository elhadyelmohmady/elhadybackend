import express from 'express';
import { getBrands, getBrandProducts } from '../controllers/brandController.js';

const router = express.Router();

router.get('/', getBrands);
router.get('/:id/products', getBrandProducts);

export default router;
