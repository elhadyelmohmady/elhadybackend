import Brand from '../models/Brand.js';
import Product from '../models/Product.js';

/**
 * Get all brands
 * GET /api/brands
 */
export const getBrands = async (req, res) => {
    try {
        const { search } = req.query;

        const filter = {};
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }

        const brands = await Brand.find(filter);
        res.status(200).json({
            success: true,
            count: brands.length,
            data: brands
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Get products by brand
 * GET /api/brands/:id/products
 */
export const getBrandProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const brand = await Brand.findById(req.params.id);
        if (!brand) {
            return res.status(404).json({ success: false, message: 'Brand not found' });
        }

        const query = { brand: req.params.id };

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
            brand: { _id: brand._id, name: brand.name, logo: brand.logo },
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
