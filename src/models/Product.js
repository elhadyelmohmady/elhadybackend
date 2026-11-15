import mongoose from 'mongoose';

const quantityTierSchema = new mongoose.Schema({
    minQuantity: {
        type: Number,
        required: [true, 'أقل كمية للحصول على الخصم مطلوبة'],
        min: [2, 'أقل كمية يجب أن تكون 2 على الأقل']
    },
    price: {
        type: Number,
        required: [true, 'السعر المخفض للكمية مطلوب'],
        min: [0.01, 'السعر يجب أن يكون أكبر من 0']
    },
    label: {
        type: String,
        trim: true,
        default: ''
    }
}, { _id: false });

const productSchema = new mongoose.Schema({
    local_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    price: { type: Number, required: true },
    originalPrice: { type: Number, default: null, min: 0 },
    isBestPrice: {
        type: Boolean,
        default: false,
        index: true
    },
    quantityTiers: [quantityTierSchema],
    stock: { type: Number, default: 0 },
    categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        default: null
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        default: null
    },
    image: {
        type: String,
        default: null
    },
    minOrderQty: {
        type: Number,
        default: 1,
        min: 1
    },
    maxOrderQty: {
        type: Number,
        default: 100
    },
    keywords: [{
        type: String,
        trim: true
    }],
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    totalOrdered: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

productSchema.index({ name: 'text', keywords: 'text' });
productSchema.index({ brand: 1 });
productSchema.index({ company: 1 });
productSchema.index({ categories: 1 });

// True when the product has a valid "before" price higher than its current price
productSchema.virtual('onSale').get(function () {
    return Boolean(this.originalPrice && this.originalPrice > this.price);
});

// Rounded percentage off the original price, e.g. 25 for a 25% discount
productSchema.virtual('discountPercent').get(function () {
    if (!this.originalPrice || this.originalPrice <= this.price) return 0;
    return Math.round((1 - this.price / this.originalPrice) * 100);
});

// True when the product has quantity discount tiers
productSchema.virtual('hasQuantityOffers').get(function () {
    return Array.isArray(this.quantityTiers) && this.quantityTiers.length > 0;
});

// Calculate price based on requested quantity
productSchema.methods.getPriceForQuantity = function (quantity) {
    if (!this.quantityTiers || this.quantityTiers.length === 0) {
        return this.price;
    }
    const sorted = [...this.quantityTiers].sort((a, b) => b.minQuantity - a.minQuantity);
    const applicableTier = sorted.find(tier => quantity >= tier.minQuantity);
    return applicableTier ? applicableTier.price : this.price;
};

const Product = mongoose.model('Product', productSchema);

export default Product;
