import express from 'express';
import { createUser, getAllUsers, getUserProfile, updateUserProfile, changePassword } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/create', createUser); // User registration (public)

// Protected routes (authenticated users only)
router.get('/profile', protect, getUserProfile); // Get user profile
router.put('/profile', protect, updateUserProfile); // Update user profile
router.put('/change-password', protect, changePassword); // Change password
router.get('/', protect, getAllUsers); // List users (authenticated)

export default router;
