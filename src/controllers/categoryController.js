import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Brand from '../models/Brand.js';

/**
 * Get all active categories with optional parent filtering
 * GET /api/categories
 */
export const getCategories = async (req, res) => {
    try {
        const { onlyParents = 'false', parentCategory } = req.query;
        const query = { isActive: true };

        if (parentCategory !== undefined) {
            query.parentCategory = parentCategory === 'null' || parentCategory === '' ? null : parentCategory;
        } else if (onlyParents === 'true') {
            query.parentCategory = null;
        }

        const categories = await Category.find(query)
            .populate('parentCategory', 'name slug image')
            .populate('subcategories', 'name slug image isActive')
            .sort({ name: 1 });

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
 * Get products by category (including products in its subcategories)
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

        // Include products belonging directly to this category OR to any of its subcategories
        const subCategoryIds = await Category.find({ parentCategory: req.params.id }).distinct('_id');
        const allCategoryIds = [category._id, ...subCategoryIds];

        const query = { categories: { $in: allCategoryIds } };

        const [products, total] = await Promise.all([
            Product.find(query)
                .collation({ locale: 'ar' })
                .populate('categories', 'name slug image')
                .populate('brand', 'name logo')
                .skip(skip)
                .limit(Number(limit))
                .sort({ name: 1, _id: 1 }),
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

/**
 * Get subcategories of a category
 * GET /api/categories/:id/subcategories
 */
export const getCategorySubcategories = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        const subcategories = await Category.find({ parentCategory: req.params.id, isActive: true })
            .populate('parentCategory', 'name slug image')
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            parentCategory: { _id: category._id, name: category.name, slug: category.slug },
            count: subcategories.length,
            data: subcategories
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get brands for a specific category
 * GET /api/categories/:id/brands
 */
export const getCategoryBrands = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        const subCategoryIds = await Category.find({ parentCategory: req.params.id }).distinct('_id');
        const allCategoryIds = [category._id, ...subCategoryIds];

        const productBrandIds = await Product.find({ categories: { $in: allCategoryIds }, brand: { $ne: null } }).distinct('brand');
        const brands = await Brand.find({
            $or: [
                { categories: { $in: allCategoryIds } },
                { _id: { $in: productBrandIds } }
            ]
        }).sort({ name: 1 });

        res.status(200).json({
            success: true,
            category: { _id: category._id, name: category.name, slug: category.slug },
            count: brands.length,
            data: brands
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
