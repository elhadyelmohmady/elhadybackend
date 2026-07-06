import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import connectDB from '../config/db.js';

dotenv.config();

const seedAdmin = async () => {
    await connectDB();

    const existing = await Admin.findOne({ username: 'admin' });
    
    if (existing) {
        console.log('Admin already exists. Upgrading to super_admin with all permissions...');
        
        // Update existing admin to super_admin role with all permissions
        existing.role = 'super_admin';
        existing.permissions = {
            viewDashboard: true,
            viewOrders: true,
            manageOrders: true,
            viewUsers: true,
            manageUsers: true,
            viewProducts: true,
            manageProducts: true,
            viewCategories: true,
            manageCategories: true,
            viewBrands: true,
            manageBrands: true,
            manageAdmins: true,
            viewSettings: true,
            manageSettings: true
        };
        
        await existing.save();
        console.log('✅ Admin upgraded to super_admin with all permissions!');
        console.log('Username: admin');
        console.log('Password: admin123');
        process.exit(0);
    }

    // Create new super_admin if it doesn't exist
    await Admin.create({
        username: 'admin',
        password: 'admin123',
        fullName: 'System Admin',
        role: 'super_admin',
        permissions: {
            viewDashboard: true,
            viewOrders: true,
            manageOrders: true,
            viewUsers: true,
            manageUsers: true,
            viewProducts: true,
            manageProducts: true,
            viewCategories: true,
            manageCategories: true,
            viewBrands: true,
            manageBrands: true,
            manageAdmins: true,
            viewSettings: true,
            manageSettings: true
        }
    });

    console.log('✅ Super admin created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Role: super_admin (has all permissions)');
    process.exit(0);
};

seedAdmin().catch((err) => {
    console.error(err);
    process.exit(1);
});
