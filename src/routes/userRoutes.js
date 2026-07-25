import express from 'express';
import { createUser, getAllUsers, getUserProfile, updateUserProfile, changePassword, updateFcmToken, getFavorites, addFavorite, removeFavorite } from '../controllers/userController.js';
import { protect, protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/create', createUser); // User registration (public)

// Protected routes (authenticated users only)
router.get('/profile', protect, getUserProfile); // Get user profile
router.put('/profile', protect, updateUserProfile); // Update user profile
router.put('/change-password', protect, changePassword); // Change password
router.put('/fcm-token', protect, updateFcmToken); // Update FCM token
router.get('/favorites', protect, getFavorites); // List favorite products
router.post('/favorites/:productId', protect, addFavorite); // Add product to favorites
router.delete('/favorites/:productId', protect, removeFavorite); // Remove product from favorites
router.get('/', protectAdmin, getAllUsers); // List users (admin only)

export default router;
