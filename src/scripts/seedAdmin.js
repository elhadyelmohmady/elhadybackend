import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import connectDB from '../config/db.js';

dotenv.config();

const seedAdmin = async () => {
    await connectDB();

    const existing = await Admin.findOne({ username: 'admin' });
    if (existing) {
        console.log('Admin already exists.');
        process.exit(0);
    }

    await Admin.create({
        username: 'admin',
        password: 'admin123',
        fullName: 'System Admin'
    });

    console.log('Admin created successfully! Username: admin, Password: admin123');
    process.exit(0);
};

seedAdmin().catch((err) => {
    console.error(err);
    process.exit(1);
});
