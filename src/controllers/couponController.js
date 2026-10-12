import Coupon from '../models/Coupon.js';
import Product from '../models/Product.js';

/**
 * Validate a coupon code for the current user and cart
 * POST /api/coupons/validate
 */
export const validateCoupon = async (req, res) => {
    try {
        const { code, items, total } = req.body;
        const userId = req.user._id;

        if (!code) {
            return res.status(400).json({
                success: false,
                valid: false,
                message: 'يرجى إدخال كود الكوبون'
            });
        }

        const normalizedCode = String(code).trim().toUpperCase();
        const coupon = await Coupon.findOne({ code: normalizedCode });

        if (!coupon) {
            return res.status(404).json({
                success: false,
                valid: false,
                message: 'كود الكوبون غير صحيح'
            });
        }

        // Calculate subtotal from items if provided, otherwise use total
        let subtotal = 0;
        let validatedItems = [];

        if (Array.isArray(items) && items.length > 0) {
            const productIds = items.map(i => i.product);
            const products = await Product.find({ _id: { $in: productIds } }).lean();
            const productMap = new Map(products.map(p => [p._id.toString(), p]));

            validatedItems = items.map(item => {
                const prod = productMap.get(item.product?.toString());
                const price = prod ? prod.price : (item.price || 0);
                return { product: item.product, quantity: item.quantity, price };
            });
            subtotal = validatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        } else if (typeof total === 'number' && total > 0) {
            subtotal = total;
        }

        const validation = coupon.validateForUser(userId, subtotal, validatedItems);

        if (!validation.isValid) {
            return res.status(200).json({
                success: true,
                valid: false,
                message: validation.message,
                coupon: {
                    code: coupon.code,
                    description: coupon.description,
                    discountType: coupon.discountType,
                    discountValue: coupon.discountValue,
                    minOrderAmount: coupon.minOrderAmount,
                    maxDiscountAmount: coupon.maxDiscountAmount
                }
            });
        }

        res.status(200).json({
            success: true,
            valid: true,
            message: validation.message,
            coupon: {
                _id: coupon._id,
                code: coupon.code,
                description: coupon.description,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                minOrderAmount: coupon.minOrderAmount,
                maxDiscountAmount: coupon.maxDiscountAmount,
                expiryDate: coupon.expiryDate,
                remainingUserUsages: validation.remainingUserUsages
            },
            subtotal,
            discountAmount: validation.discountAmount,
            finalTotal: validation.finalTotal
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get available coupons for the current user
 * GET /api/coupons/available
 */
export const getAvailableCoupons = async (req, res) => {
    try {
        const userId = req.user._id;
        const now = new Date();

        const coupons = await Coupon.find({
            isActive: true,
            expiryDate: { $gte: now },
            startDate: { $lte: now }
        }).sort({ createdAt: -1 });

        // Filter out coupons where user reached their usage limit or global limit reached
        const available = coupons.filter(coupon => {
            if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
                return false;
            }
            const userUsage = (coupon.usersUsed || []).find(
                u => u.user && u.user.toString() === userId.toString()
            );
            const userCount = userUsage ? userUsage.usageCount : 0;
            return userCount < coupon.userUsageLimit;
        }).map(coupon => {
            const userUsage = (coupon.usersUsed || []).find(
                u => u.user && u.user.toString() === userId.toString()
            );
            const userCount = userUsage ? userUsage.usageCount : 0;

            return {
                _id: coupon._id,
                code: coupon.code,
                description: coupon.description,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                maxDiscountAmount: coupon.maxDiscountAmount,
                minOrderAmount: coupon.minOrderAmount,
                expiryDate: coupon.expiryDate,
                userUsageLimit: coupon.userUsageLimit,
                remainingUserUsages: coupon.userUsageLimit - userCount
            };
        });

        res.status(200).json({
            success: true,
            count: available.length,
            data: available
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
