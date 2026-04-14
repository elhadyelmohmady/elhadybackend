import Category from '../models/Category.js';
import Product from '../models/Product.js';

/**
 * Get all active categories
 * GET /api/categories
 */
export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true });
        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Get products by category
 * GET /api/categories/:id/products
 */
export const getCategoryProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        const query = { categories: req.params.id };

        const [products, total] = await Promise.all([
            Product.find(query)
                .populate('categories', 'name slug image')
                .populate('brand', 'name logo')
                .skip(skip)
                .limit(Number(limit))
                .sort({ createdAt: -1 }),
            Product.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            category: { _id: category._id, name: category.name, slug: category.slug },
            count: products.length,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / limit)
            },
            data: products
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
