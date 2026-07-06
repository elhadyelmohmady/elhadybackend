import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Drop the old email index if it exists
        try {
            await mongoose.connection.collection('users').dropIndex('email_1');
            console.log('Dropped old email index');
        } catch (err) {
            // Index might not exist, ignore
            if (err.code !== 27) console.error('Error dropping index:', err.message);
        }

        const adminData = {
            username: process.env.ADMIN_USERNAME || 'admin',
            password: process.env.ADMIN_PASSWORD || 'admin123',
            fullName: 'System Admin',
            phoneNumber: '0000000000',
            role: 'admin',
            isActive: true
        };

        const admin = await User.findOneAndUpdate(
            { role: 'admin' },
            adminData,
            { upsert: true, new: true, runValidators: true }
        );

        // Note: findOneAndUpdate doesn't trigger 'save' middleware for hashing
        // unless we handle it. But User.create is better for hashing.
        // Let's use delete and create for simplicity in a seed script.
        await User.deleteOne({ role: 'admin' });
        const newAdmin = await User.create(adminData);

        console.log(`Admin created/updated: ${newAdmin.username}`);
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedAdmin();
