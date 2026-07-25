import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private (authenticated user)
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            _id: user._id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            profilePhoto: user.profilePhoto,
            isActive: user.isActive,
            createdAt: user.createdAt
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching profile' });
    }
};

// @desc    Update user profile (first name, last name, profile photo)
// @route   PUT /api/users/profile
// @access  Private (authenticated user)
export const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { firstName, lastName, fullName } = req.body;

        // Update fields if provided
        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (fullName !== undefined) user.fullName = fullName;

        // Update profile photo if provided
        if (req.body.profilePhoto !== undefined) {
            user.profilePhoto = req.body.profilePhoto;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            fullName: updatedUser.fullName,
            phoneNumber: updatedUser.phoneNumber,
            profilePhoto: updatedUser.profilePhoto,
            isActive: updatedUser.isActive
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while updating profile' });
    }
};

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private (authenticated user)
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while changing password' });
    }
};

// @desc    Create a new user
// @route   POST /api/users/create
// @access  Public (registration)
export const createUser = async (req, res) => {
    const { username, password, fullName, phoneNumber } = req.body;

    try {
        const phoneExists = await User.findOne({ phoneNumber });
        if (phoneExists) {
            return res.status(400).json({ message: 'رقم الهاتف مستخدم بالفعل' });
        }

        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            return res.status(400).json({ message: 'اسم المستخدم مستخدم بالفعل' });
        }

        const user = await User.create({
            username,
            password,
            fullName,
            phoneNumber
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                fullName: user.fullName,
                phoneNumber: user.phoneNumber,
                isActive: user.isActive,
                createdAt: user.createdAt
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while creating user' });
    }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Admin (via dashboard)
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching users' });
    }
};

// @desc    Update FCM Token
// @route   PUT /api/users/fcm-token
// @access  Private (authenticated user)
export const updateFcmToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;
        
        if (!fcmToken) {
            return res.status(400).json({ message: 'FCM Token is required' });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.fcmToken = fcmToken;
        await user.save();

        res.json({ message: 'FCM Token updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while updating FCM Token' });
    }
};
