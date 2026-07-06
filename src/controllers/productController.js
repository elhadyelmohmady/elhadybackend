import Product from '../models/Product.js';

/**
 * Get products with search, category/brand filter, and pagination
 * GET /api/products
 */
export const getProducts = async (req, res) => {
    try {
        const { q, category, brand, sort, page = 1, limit = 10 } = req.query;

        const query = {};

        if (q) {
            query.$or = [
                { name: { $regex: q, $options: 'i' } },
                { keywords: { $regex: q, $options: 'i' } },
                { 'metadata.description': { $regex: q, $options: 'i' } }
            ];
        }

        if (category) {
            query.categories = category;
        }

        if (brand) {
            query.brand = brand;
        }

        const sortOptions = {
            price_asc: { price: 1 },
            price_desc: { price: -1 },
            most_ordered: { totalOrdered: -1 },
            name_asc: { name: 1 },
            name_desc: { name: -1 }
        };
        const sortBy = sortOptions[sort] || { createdAt: -1 };

        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            Product.find(query)
                .populate('categories', 'name slug image')
                .populate('brand', 'name logo')
                .skip(skip)
                .limit(Number(limit))
                .sort(sortBy),
            Product.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
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
 * Get single product details
 * GET /api/products/:id
 */
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('categories', 'name slug image')
            .populate('brand', 'name logo');

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.status(200).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
