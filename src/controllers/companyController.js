import Company from '../models/Company.js';
import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';

/**
 * Get all companies with search, category/brand filter, and pagination
 * GET /api/companies
 */
export const getCompanies = async (req, res) => {
    try {
        const { search, category, brand, page = 1, limit = 50 } = req.query;

        const filter = { isActive: { $ne: false } };

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (brand) {
            filter.brands = brand;
        }

        if (category) {
            filter.categories = category;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [companies, total] = await Promise.all([
            Company.find(filter)
                .collation({ locale: 'ar' })
                .populate('brands', 'name logo')
                .populate('categories', 'name slug image')
                .sort({ name: 1, _id: 1 })
                .skip(skip)
                .limit(Number(limit)),
            Company.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            count: companies.length,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            },
            data: companies
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get single company by ID
 * GET /api/companies/:id
 */
export const getCompanyById = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id)
            .populate('brands', 'name logo description')
            .populate('categories', 'name slug image');

        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        res.status(200).json({
            success: true,
            data: company
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get brands belonging to a company
 * GET /api/companies/:id/brands
 */
export const getCompanyBrands = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        const brands = await Brand.find({
            $or: [
                { _id: { $in: company.brands } },
                { company: company._id }
            ]
        }).populate('categories', 'name slug image').sort({ name: 1 });

        res.status(200).json({
            success: true,
            company: { _id: company._id, name: company.name, logo: company.logo },
            count: brands.length,
            data: brands
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get products belonging to a company
 * GET /api/companies/:id/products
 */
export const getCompanyProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, category, sort } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        const brandIds = company.brands || [];
        const query = {
            $or: [
                { company: company._id },
                { brand: { $in: brandIds } }
            ]
        };

        if (category) {
            query.categories = category;
        }

        const sortOptions = {
            price_asc: { price: 1, _id: 1 },
            price_desc: { price: -1, _id: 1 },
            most_ordered: { totalOrdered: -1, _id: 1 },
            name_asc: { name: 1, _id: 1 },
            name_desc: { name: -1, _id: 1 }
        };
        const sortBy = sortOptions[sort] || { name: 1, _id: 1 };

        const [products, total] = await Promise.all([
            Product.find(query)
                .collation({ locale: 'ar' })
                .populate('categories', 'name slug image')
                .populate('brand', 'name logo')
                .populate('company', 'name logo')
                .skip(skip)
                .limit(Number(limit))
                .sort(sortBy),
            Product.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            company: { _id: company._id, name: company.name, logo: company.logo },
            count: products.length,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            },
            data: products
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get categories associated with a company
 * GET /api/companies/:id/categories
 */
export const getCompanyCategories = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id).populate('categories', 'name slug image');
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        res.status(200).json({
            success: true,
            company: { _id: company._id, name: company.name, logo: company.logo },
            count: company.categories.length,
            data: company.categories
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
