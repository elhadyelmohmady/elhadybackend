import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['super_admin', 'admin', 'manager', 'support'],
        default: 'admin'
    },
    permissions: {
        viewDashboard: { type: Boolean, default: true },
        viewOrders: { type: Boolean, default: true },
        manageOrders: { type: Boolean, default: true },
        viewUsers: { type: Boolean, default: true },
        manageUsers: { type: Boolean, default: false },
        viewProducts: { type: Boolean, default: true },
        manageProducts: { type: Boolean, default: false },
        viewCategories: { type: Boolean, default: true },
        manageCategories: { type: Boolean, default: false },
        viewBrands: { type: Boolean, default: true },
        manageBrands: { type: Boolean, default: false },
        manageAdmins: { type: Boolean, default: false },
        viewSettings: { type: Boolean, default: true },
        manageSettings: { type: Boolean, default: false }
    }
}, {
    timestamps: true
});

// Hash password before saving
adminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        // Still apply permission sync even if password hasn't changed
        if (this.isModified('role') || this.isNew) {
            this.syncSuperAdminPermissions();
        }
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        this.syncSuperAdminPermissions();
        next();
    } catch (error) {
        next(error);
    }
});

// Method to sync super_admin permissions (ensure they have all permissions)
adminSchema.methods.syncSuperAdminPermissions = function () {
    if (this.role === 'super_admin') {
        // Grant all permissions to super_admin
        this.permissions = {
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
    }
};

// Method to compare password
adminSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
