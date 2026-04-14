import express from 'express';
import {
    login,
    getCurrentAdmin,
    getDashboardStats,
    getAdmins,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    getOrders,
    getOrder,
    updateOrderStatus,
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getRevenueStats,
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    getBrands,
    getBrand,
    createBrand,
    updateBrand,
    deleteBrand
} from '../controllers/dashboardController.js';
import { authenticateDashboard, requirePermission, requireRole } from '../middleware/dashboardAuth.js';
import { productUpload, brandUpload, handleUploadError } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public routes
router.post('/auth/login', login);

// Protected routes - all require authentication
router.use(authenticateDashboard);

// Auth routes
router.get('/auth/me', getCurrentAdmin);

// Dashboard stats
router.get('/stats', requirePermission('viewDashboard'), getDashboardStats);

// Revenue stats
router.get('/revenue', requirePermission('viewDashboard'), getRevenueStats);

// ==================== ADMIN MANAGEMENT ====================
router.get('/admins', requirePermission('manageAdmins'), getAdmins);
router.post('/admins', requirePermission('manageAdmins'), createAdmin);
router.put('/admins/:id', requirePermission('manageAdmins'), updateAdmin);
router.delete('/admins/:id', requirePermission('manageAdmins'), deleteAdmin);

// ==================== USER MANAGEMENT ====================
router.get('/users', requirePermission('viewUsers'), getUsers);
router.get('/users/:id', requirePermission('viewUsers'), getUser);
router.post('/users', requirePermission('manageUsers'), createUser);
router.put('/users/:id', requirePermission('manageUsers'), updateUser);
router.delete('/users/:id', requirePermission('manageUsers'), deleteUser);
router.put('/users/:id/toggle-status', requirePermission('manageUsers'), toggleUserStatus);

// ==================== ORDER MANAGEMENT ====================
router.get('/orders', requirePermission('viewOrders'), getOrders);
router.get('/orders/:id', requirePermission('viewOrders'), getOrder);
router.put('/orders/:id/status', requirePermission('manageOrders'), updateOrderStatus);

// ==================== PRODUCT MANAGEMENT ====================
router.get('/products', requirePermission('viewProducts'), getProducts);
router.get('/products/:id', requirePermission('viewProducts'), getProduct);
router.post('/products', requirePermission('manageProducts'), productUpload.single('image'), handleUploadError, createProduct);
router.put('/products/:id', requirePermission('manageProducts'), productUpload.single('image'), handleUploadError, updateProduct);
router.delete('/products/:id', requirePermission('manageProducts'), deleteProduct);

// ==================== CATEGORY MANAGEMENT ====================
router.get('/categories', requirePermission('viewCategories'), getCategories);
router.get('/categories/:id', requirePermission('viewCategories'), getCategory);
router.post('/categories', requirePermission('manageCategories'), createCategory);
router.put('/categories/:id', requirePermission('manageCategories'), updateCategory);
router.delete('/categories/:id', requirePermission('manageCategories'), deleteCategory);

// ==================== BRAND MANAGEMENT ====================
router.get('/brands', requirePermission('viewBrands'), getBrands);
router.get('/brands/:id', requirePermission('viewBrands'), getBrand);
router.post('/brands', requirePermission('manageBrands'), brandUpload.single('logo'), handleUploadError, createBrand);
router.put('/brands/:id', requirePermission('manageBrands'), brandUpload.single('logo'), handleUploadError, updateBrand);
router.delete('/brands/:id', requirePermission('manageBrands'), deleteBrand);

export default router;
