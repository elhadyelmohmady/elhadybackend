import Admin from '../models/Admin.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { processProductImage, processBrandLogo, deleteFile } from '../utils/imageUpload.js';

// @desc    Admin login
// @route   POST /api/dashboard/auth/login
// @access  Public
export const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
        return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
        return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    }

    const token = jwt.sign(
        { id: admin._id, role: admin.role },
        process.env.JWT_SECRET || 'dashboard-secret-key',
        { expiresIn: '24h' }
    );

    res.json({
        success: true,
        data: {
            token,
            admin: {
                id: admin._id,
                username: admin.username,
                fullName: admin.fullName,
                role: admin.role,
                permissions: admin.permissions
            }
        }
    });
};

// @desc    Get current admin info
// @route   GET /api/dashboard/auth/me
// @access  Private
export const getCurrentAdmin = async (req, res) => {
    res.json({
        success: true,
        data: {
            id: req.admin._id,
            username: req.admin.username,
            fullName: req.admin.fullName,
            role: req.admin.role,
            permissions: req.admin.permissions
        }
    });
};

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const stats = await Promise.all([
        // Total users
        User.countDocuments(),
        // Active users
        User.countDocuments({ isActive: true }),
        // Total orders
        Order.countDocuments(),
        // Total products
        Product.countDocuments(),
        // Low stock products
        Product.countDocuments({ stock: { $lt: 10 } }),
        // Total revenue
        Order.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]),
        // Today's orders
        Order.countDocuments({ createdAt: { $gte: today } }),
        // This month's orders
        Order.countDocuments({ createdAt: { $gte: thisMonth } }),
        // Recent orders (last 5)
        Order.find().sort('-createdAt').limit(5).populate('customer', 'username fullName phoneNumber'),
        // Revenue this month
        Order.aggregate([
            { $match: { createdAt: { $gte: thisMonth }, status: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]),
        // Total categories
        Category.countDocuments(),
        // Total brands
        Brand.countDocuments()
    ]);

    res.json({
        success: true,
        data: {
            totalUsers: stats[0],
            activeUsers: stats[1],
            totalOrders: stats[2],
            totalProducts: stats[3],
            lowStockProducts: stats[4],
            totalRevenue: stats[5][0]?.total || 0,
            todayOrders: stats[6],
            thisMonthOrders: stats[7],
            recentOrders: stats[8],
            thisMonthRevenue: stats[9][0]?.total || 0,
            totalCategories: stats[10],
            totalBrands: stats[11]
        }
    });
};

// @desc    Get all admins
// @route   GET /api/dashboard/admins
// @access  Private (manageAdmins permission)
export const getAdmins = async (req, res) => {
    const admins = await Admin.find().select('-password').sort('-createdAt');
    res.json({ success: true, data: admins });
};

// @desc    Create new admin
// @route   POST /api/dashboard/admins
// @access  Private (manageAdmins permission)
export const createAdmin = async (req, res) => {
    const { username, password, fullName, role, permissions } = req.body;

    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
        return res.status(400).json({ success: false, message: 'اسم المستخدم موجود بالفعل' });
    }

    const admin = await Admin.create({ username, password, fullName, role, permissions });
    res.status(201).json({ success: true, data: admin });
};

// @desc    Update admin
// @route   PUT /api/dashboard/admins/:id
// @access  Private (manageAdmins permission)
export const updateAdmin = async (req, res) => {
    const { username, fullName, role, permissions } = req.body;

    const admin = await Admin.findById(req.params.id);
    if (!admin) {
        return res.status(404).json({ success: false, message: 'المدير غير موجود' });
    }

    if (username) admin.username = username;
    if (fullName) admin.fullName = fullName;
    if (role) admin.role = role;
    if (permissions) admin.permissions = permissions;

    await admin.save();
    res.json({ success: true, data: admin });
};

// @desc    Delete admin
// @route   DELETE /api/dashboard/admins/:id
// @access  Private (manageAdmins permission)
export const deleteAdmin = async (req, res) => {
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) {
        return res.status(404).json({ success: false, message: 'المدير غير موجود' });
    }
    res.json({ success: true, message: 'تم حذف المدير بنجاح' });
};

// @desc    Get users list
// @route   GET /api/dashboard/users
// @access  Private (viewUsers permission)
export const getUsers = async (req, res) => {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const query = {};

    if (search) {
        query.$or = [
            { username: { $regex: search, $options: 'i' } },
            { fullName: { $regex: search, $options: 'i' } },
            { phoneNumber: { $regex: search, $options: 'i' } }
        ];
    }

    if (isActive !== undefined) {
        query.isActive = isActive === 'true';
    }

    const users = await User.find(query)
        .select('-password')
        .sort('-createdAt')
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
        success: true,
        data: users,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
};

// @desc    Toggle user active status
// @route   PUT /api/dashboard/users/:id/toggle-status
// @access  Private (manageUsers permission)
export const toggleUserStatus = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, data: user });
};

// @desc    Get single user
// @route   GET /api/dashboard/users/:id
// @access  Private (viewUsers permission)
export const getUser = async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
        return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    res.json({ success: true, data: user });
};

// @desc    Create new user
// @route   POST /api/dashboard/users
// @access  Private (manageUsers permission)
export const createUser = async (req, res) => {
    const { username, password, fullName, phoneNumber, firstName, lastName } = req.body;

    const existingUser = await User.findOne({ $or: [{ username }, { phoneNumber }] });
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'اسم المستخدم أو رقم الهاتف موجود بالفعل' });
    }

    const user = await User.create({
        username,
        password,
        fullName,
        phoneNumber,
        firstName,
        lastName
    });

    res.status(201).json({ success: true, data: user.select('-password') });
};

// @desc    Update user
// @route   PUT /api/dashboard/users/:id
// @access  Private (manageUsers permission)
export const updateUser = async (req, res) => {
    const { username, fullName, phoneNumber, firstName, lastName, password } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    // Check for duplicate username/phone
    if (username && username !== user.username) {
        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({ success: false, message: 'اسم المستخدم موجود بالفعل' });
        }
    }

    if (phoneNumber && phoneNumber !== user.phoneNumber) {
        const existing = await User.findOne({ phoneNumber });
        if (existing) {
            return res.status(400).json({ success: false, message: 'رقم الهاتف موجود بالفعل' });
        }
    }

    if (username) user.username = username;
    if (fullName) user.fullName = fullName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (password) user.password = password;

    await user.save();
    res.json({ success: true, data: user.select('-password') });
};

// @desc    Delete user
// @route   DELETE /api/dashboard/users/:id
// @access  Private (manageUsers permission)
export const deleteUser = async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
        return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }
    res.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
};

// @desc    Get orders list
// @route   GET /api/dashboard/orders
// @access  Private (viewOrders permission)
export const getOrders = async (req, res) => {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = {};

    if (status) {
        query.status = status;
    }

    if (search) {
        const customerIds = await User.find({
            $or: [
                { username: { $regex: search, $options: 'i' } },
                { fullName: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } }
            ]
        }).distinct('_id');

        query.customer = { $in: customerIds };
    }

    const orders = await Order.find(query)
        .populate('customer', 'username fullName phoneNumber')
        .populate('items.product', 'name image')
        .sort('-createdAt')
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
        success: true,
        data: orders,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
};

// @desc    Get single order
// @route   GET /api/dashboard/orders/:id
// @access  Private (viewOrders permission)
export const getOrder = async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('customer', 'username fullName phoneNumber')
        .populate('items.product', 'name image price');

    if (!order) {
        return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    res.json({ success: true, data: order });
};

// @desc    Update order status
// @route   PUT /api/dashboard/orders/:id/status
// @access  Private (manageOrders permission)
export const updateOrderStatus = async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'حالة الطلب غير صالحة' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
        return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    const oldStatus = order.status;
    order.status = status;
    await order.save();

    // If cancelled and was not cancelled, restore stock
    if (status === 'cancelled' && oldStatus !== 'cancelled') {
        const bulkOps = order.items.map(item => ({
            updateOne: {
                filter: { _id: item.product },
                update: { $inc: { stock: item.quantity, totalOrdered: -item.quantity } }
            }
        }));
        await Product.bulkWrite(bulkOps);
    }

    res.json({ success: true, data: order });
};

// @desc    Get products list
// @route   GET /api/dashboard/products
// @access  Private (viewProducts permission)
export const getProducts = async (req, res) => {
    const { page = 1, limit = 20, search, brand, category, lowStock } = req.query;
    const query = {};

    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }

    if (brand) {
        query.brand = brand;
    }

    if (category) {
        query.categories = category;
    }

    if (lowStock === 'true') {
        query.stock = { $lt: 10 };
    }

    const products = await Product.find(query)
        .populate('brand', 'name logo')
        .populate('categories', 'name')
        .sort('-createdAt')
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.json({
        success: true,
        data: products,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
};

// @desc    Get single product
// @route   GET /api/dashboard/products/:id
// @access  Private (viewProducts permission)
export const getProduct = async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate('brand', 'name logo')
        .populate('categories', 'name');

    if (!product) {
        return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }

    res.json({ success: true, data: product });
};

// @desc    Create new product
// @route   POST /api/dashboard/products
// @access  Private (manageProducts permission)
export const createProduct = async (req, res) => {
    try {
        const { name, price, stock, brand, categories, keywords, metadata } = req.body;
        let image = req.body.image || null;

        // Process uploaded image if present
        if (req.file) {
            try {
                image = await processProductImage(req.file);
            } catch (error) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to process product image' 
                });
            }
        }

        const product = await Product.create({
            name,
            price,
            stock,
            brand,
            categories: categories ? (Array.isArray(categories) ? categories : [categories]) : [],
            keywords: keywords ? (Array.isArray(keywords) ? keywords : [keywords]) : [],
            image,
            metadata: metadata ? (typeof metadata === 'string' ? JSON.parse(metadata) : metadata) : {}
        });

        res.status(201).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update product
// @route   PUT /api/dashboard/products/:id
// @access  Private (manageProducts permission)
export const updateProduct = async (req, res) => {
    try {
        const { name, price, stock, brand, categories, keywords, metadata } = req.body;

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
        }

        let image = product.image;

        // Process uploaded image if present
        if (req.file) {
            try {
                // Delete old image if exists
                if (product.image) {
                    await deleteFile(product.image);
                }
                
                // Process new image
                image = await processProductImage(req.file);
            } catch (error) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to process product image' 
                });
            }
        }

        if (name) product.name = name;
        if (price !== undefined) product.price = price;
        if (stock !== undefined) product.stock = stock;
        if (brand !== undefined) product.brand = brand;
        if (categories !== undefined) product.categories = Array.isArray(categories) ? categories : [categories];
        if (keywords !== undefined) product.keywords = Array.isArray(keywords) ? keywords : [keywords];
        if (image !== undefined) product.image = image;
        if (metadata !== undefined) product.metadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;

        await product.save();
        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete product
// @route   DELETE /api/dashboard/products/:id
// @access  Private (manageProducts permission)
export const deleteProduct = async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
        return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }
    res.json({ success: true, message: 'تم حذف المنتج بنجاح' });
};

// @desc    Get revenue statistics
// @route   GET /api/dashboard/revenue
// @access  Private (viewDashboard permission)
export const getRevenueStats = async (req, res) => {
    const { period = 'month' } = req.query;

    let groupBy;
    let startDate;

    switch (period) {
        case 'week':
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
            break;
        case 'month':
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
            break;
        case 'year':
            startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1);
            groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
            break;
        default:
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    const revenueData = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate },
                status: { $ne: 'cancelled' }
            }
        },
        {
            $group: {
                _id: groupBy,
                revenue: { $sum: '$total' },
                orders: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    res.json({
        success: true,
        data: revenueData
    });
};

// ==================== CATEGORY MANAGEMENT ====================

// @desc    Get all categories
// @route   GET /api/dashboard/categories
// @access  Private (viewCategories permission)
export const getCategories = async (req, res) => {
    const { page = 1, limit = 50, search, isActive } = req.query;
    const query = {};

    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }

    if (isActive !== undefined) {
        query.isActive = isActive === 'true';
    }

    const categories = await Category.find(query)
        .sort('-createdAt')
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await Category.countDocuments(query);

    res.json({
        success: true,
        data: categories,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
};

// @desc    Get single category
// @route   GET /api/dashboard/categories/:id
// @access  Private (viewCategories permission)
export const getCategory = async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) {
        return res.status(404).json({ success: false, message: 'التصنيف غير موجود' });
    }

    res.json({ success: true, data: category });
};

// @desc    Create new category
// @route   POST /api/dashboard/categories
// @access  Private (manageCategories permission)
export const createCategory = async (req, res) => {
    const { name, slug, description, image, parentCategory, isActive } = req.body;

    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
        return res.status(400).json({ success: false, message: 'الرابط موجود بالفعل' });
    }

    const category = await Category.create({
        name,
        slug,
        description,
        image,
        parentCategory,
        isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({ success: true, data: category });
};

// @desc    Update category
// @route   PUT /api/dashboard/categories/:id
// @access  Private (manageCategories permission)
export const updateCategory = async (req, res) => {
    const { name, slug, description, image, parentCategory, isActive } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
        return res.status(404).json({ success: false, message: 'التصنيف غير موجود' });
    }

    // Check for duplicate slug
    if (slug && slug !== category.slug) {
        const existing = await Category.findOne({ slug });
        if (existing) {
            return res.status(400).json({ success: false, message: 'الرابط موجود بالفعل' });
        }
    }

    if (name) category.name = name;
    if (slug) category.slug = slug;
    if (description) category.description = description;
    if (image !== undefined) category.image = image;
    if (parentCategory !== undefined) category.parentCategory = parentCategory;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();
    res.json({ success: true, data: category });
};

// @desc    Delete category
// @route   DELETE /api/dashboard/categories/:id
// @access  Private (manageCategories permission)
export const deleteCategory = async (req, res) => {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
        return res.status(404).json({ success: false, message: 'التصنيف غير موجود' });
    }
    res.json({ success: true, message: 'تم حذف التصنيف بنجاح' });
};

// ==================== BRAND MANAGEMENT ====================

// @desc    Get all brands
// @route   GET /api/dashboard/brands
// @access  Private (viewBrands permission)
export const getBrands = async (req, res) => {
    const { page = 1, limit = 50, search } = req.query;
    const query = {};

    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }

    const brands = await Brand.find(query)
        .sort('-createdAt')
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await Brand.countDocuments(query);

    res.json({
        success: true,
        data: brands,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
};

// @desc    Get single brand
// @route   GET /api/dashboard/brands/:id
// @access  Private (viewBrands permission)
export const getBrand = async (req, res) => {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
        return res.status(404).json({ success: false, message: 'العلامة التجارية غير موجودة' });
    }

    res.json({ success: true, data: brand });
};

// @desc    Create new brand
// @route   POST /api/dashboard/brands
// @access  Private (manageBrands permission)
export const createBrand = async (req, res) => {
    try {
        const { name, slug, description } = req.body;
        let logo = req.body.logo || null;

        // Process uploaded logo if present
        if (req.file) {
            try {
                logo = await processBrandLogo(req.file);
            } catch (error) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to process brand logo' 
                });
            }
        }

        const existingBrand = await Brand.findOne({ slug });
        if (existingBrand) {
            return res.status(400).json({ success: false, message: 'الرابط موجود بالفعل' });
        }

        const brand = await Brand.create({
            name,
            slug,
            description,
            logo
        });

        res.status(201).json({ success: true, data: brand });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update brand
// @route   PUT /api/dashboard/brands/:id
// @access  Private (manageBrands permission)
export const updateBrand = async (req, res) => {
    try {
        const { name, slug, description } = req.body;

        const brand = await Brand.findById(req.params.id);
        if (!brand) {
            return res.status(404).json({ success: false, message: 'العلامة التجارية غير موجودة' });
        }

        // Check for duplicate slug
        if (slug && slug !== brand.slug) {
            const existing = await Brand.findOne({ slug });
            if (existing) {
                return res.status(400).json({ success: false, message: 'الرابط موجود بالفعل' });
            }
        }

        // Process uploaded logo if present
        if (req.file) {
            try {
                // Delete old logo if exists
                if (brand.logo) {
                    await deleteFile(brand.logo);
                }
                
                // Process new logo
                brand.logo = await processBrandLogo(req.file);
            } catch (error) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to process brand logo' 
                });
            }
        }

        if (name) brand.name = name;
        if (slug) brand.slug = slug;
        if (description) brand.description = description;

        await brand.save();
        res.json({ success: true, data: brand });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete brand
// @route   DELETE /api/dashboard/brands/:id
// @access  Private (manageBrands permission)
export const deleteBrand = async (req, res) => {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) {
        return res.status(404).json({ success: false, message: 'العلامة التجارية غير موجودة' });
    }
    res.json({ success: true, message: 'تم حذف العلامة التجارية بنجاح' });
};
