import mongoose from 'mongoose';

const couponUserUsageSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    usageCount: {
        type: Number,
        default: 1,
        min: 0
    },
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    lastUsedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'كود الكوبون مطلوب'],
        unique: true,
        trim: true,
        uppercase: true,
        index: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage',
        required: true
    },
    discountValue: {
        type: Number,
        required: [true, 'قيمة الخصم مطلوبة'],
        min: [0.01, 'قيمة الخصم يجب أن تكون أكبر من 0']
    },
    maxDiscountAmount: {
        type: Number,
        default: null,
        min: [0, 'الحد الأقصى للخصم لا يمكن أن يكون سالباً']
    },
    minOrderAmount: {
        type: Number,
        default: 0,
        min: [0, 'الحد الأدنى للطلب لا يمكن أن يكون سالباً']
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date,
        required: [true, 'تاريخ انتهاء الكوبون مطلوب']
    },
    usageLimit: {
        type: Number,
        default: null,
        min: [1, 'إجمالي حد الاستخدام يجب أن يكون 1 على الأقل']
    },
    usedCount: {
        type: Number,
        default: 0,
        min: 0
    },
    userUsageLimit: {
        type: Number,
        default: 1,
        min: [1, 'حد الاستخدام لكل مستخدم يجب أن يكون 1 على الأقل']
    },
    usersUsed: [couponUserUsageSchema],
    applicableCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    applicableBrands: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand'
    }],
    applicableProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
couponSchema.index({ expiryDate: 1, isActive: 1 });
couponSchema.index({ 'usersUsed.user': 1 });

// Virtual to check if coupon is currently expired
couponSchema.virtual('isExpired').get(function () {
    if (!this.expiryDate) return false;
    return new Date() > this.expiryDate;
});

// Virtual to check remaining global usages
couponSchema.virtual('remainingUsages').get(function () {
    if (this.usageLimit == null) return null;
    return Math.max(0, this.usageLimit - (this.usedCount || 0));
});

/**
 * Calculate the discount amount for a given subtotal
 */
couponSchema.methods.calculateDiscount = function (subtotal) {
    if (!subtotal || subtotal <= 0) return 0;

    let discount = 0;
    if (this.discountType === 'percentage') {
        discount = (subtotal * this.discountValue) / 100;
        if (this.maxDiscountAmount != null && this.maxDiscountAmount > 0) {
            discount = Math.min(discount, this.maxDiscountAmount);
        }
    } else if (this.discountType === 'fixed') {
        discount = Math.min(this.discountValue, subtotal);
    }

    return Math.round(discount * 100) / 100;
};

/**
 * Validate coupon eligibility for a user and cart subtotal
 */
couponSchema.methods.validateForUser = function (userId, subtotal, orderItems = []) {
    const now = new Date();

    if (!this.isActive) {
        return { isValid: false, message: 'الكوبون غير مفعّل حالياً' };
    }

    if (this.startDate && now < this.startDate) {
        return { isValid: false, message: 'الكوبون غير سارٍ بعد، يبدأ في ' + this.startDate.toLocaleDateString('ar-EG') };
    }

    if (this.expiryDate && now > this.expiryDate) {
        return { isValid: false, message: 'الكوبون منتهي الصلاحية' };
    }

    if (this.usageLimit != null && this.usedCount >= this.usageLimit) {
        return { isValid: false, message: 'تم استنفاد الحد الأقصى لاستخدام هذا الكوبون' };
    }

    // Check user usage limit
    const userUsage = (this.usersUsed || []).find(
        u => u.user && u.user.toString() === userId.toString()
    );
    const userCount = userUsage ? userUsage.usageCount : 0;

    if (userCount >= this.userUsageLimit) {
        return {
            isValid: false,
            message: `لقد استنفدت الحد الأقصى المسموح لاستخدام هذا الكوبون (${this.userUsageLimit} ${this.userUsageLimit === 1 ? 'مرة' : 'مرات'})`
        };
    }

    // Check minimum order amount
    if (this.minOrderAmount > 0 && subtotal < this.minOrderAmount) {
        return {
            isValid: false,
            message: `الحد الأدنى لقيمة الطلب لتطبيق هذا الكوبون هو ${this.minOrderAmount} جنيه`
        };
    }

    const discountAmount = this.calculateDiscount(subtotal);

    return {
        isValid: true,
        message: 'الكوبون صالح للاستخدام',
        discountAmount,
        finalTotal: Math.max(0, subtotal - discountAmount),
        remainingUserUsages: this.userUsageLimit - userCount
    };
};

/**
 * Apply coupon usage atomically
 */
couponSchema.methods.applyUsage = async function (userId, orderId) {
    this.usedCount = (this.usedCount || 0) + 1;

    const userEntry = (this.usersUsed || []).find(
        u => u.user && u.user.toString() === userId.toString()
    );

    if (userEntry) {
        userEntry.usageCount += 1;
        if (orderId && !userEntry.orders.includes(orderId)) {
            userEntry.orders.push(orderId);
        }
        userEntry.lastUsedAt = new Date();
    } else {
        this.usersUsed.push({
            user: userId,
            usageCount: 1,
            orders: orderId ? [orderId] : [],
            lastUsedAt: new Date()
        });
    }

    return await this.save();
};

/**
 * Revert coupon usage when an order is cancelled
 */
couponSchema.methods.revertUsage = async function (userId, orderId) {
    this.usedCount = Math.max(0, (this.usedCount || 0) - 1);

    const userIndex = (this.usersUsed || []).findIndex(
        u => u.user && u.user.toString() === userId.toString()
    );

    if (userIndex !== -1) {
        const userEntry = this.usersUsed[userIndex];
        userEntry.usageCount = Math.max(0, userEntry.usageCount - 1);
        if (orderId) {
            userEntry.orders = userEntry.orders.filter(
                id => id && id.toString() !== orderId.toString()
            );
        }
        if (userEntry.usageCount === 0) {
            this.usersUsed.splice(userIndex, 1);
        }
    }

    return await this.save();
};

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;
