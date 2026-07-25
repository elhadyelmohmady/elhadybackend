import mongoose from 'mongoose';

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

const Product = mongoose.model('Product', productSchema);

export default Product;
