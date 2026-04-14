import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

export const authenticateDashboard = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ success: false, message: 'غير مصرح - يرجى تسجيل الدخول' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dashboard-secret-key');
        const admin = await Admin.findById(decoded.id).select('-password');

        if (!admin) {
            return res.status(401).json({ success: false, message: 'غير مصرح - المستخدم غير موجود' });
        }

        req.admin = admin;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'غير مصرح - رمز غير صالح' });
    }
};

export const requirePermission = (permission) => {
    return (req, res, next) => {
        // Super admin has all permissions
        if (req.admin.role === 'super_admin') {
            return next();
        }
        
        if (!req.admin.permissions[permission]) {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية للوصول إلى هذا المورد'
            });
        }
        next();
    };
};

export const requireRole = (...roles) => {
    return (req, res, next) => {
        // Super admin has access to all roles
        if (req.admin.role === 'super_admin') {
            return next();
        }
        
        if (!roles.includes(req.admin.role)) {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية للوصول إلى هذا المورد'
            });
        }
        next();
    };
};
