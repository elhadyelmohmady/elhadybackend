import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        default: null,
        trim: true
    },
    image: {
        type: String,
        default: null
    },
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null,
        set: (v) => (!v || v === '' || v === 'null' || v === 'undefined' ? null : v)
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

categorySchema.index({ parentCategory: 1 });
categorySchema.index({ isActive: 1 });

// Virtual to populate subcategories
categorySchema.virtual('subcategories', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parentCategory'
});

// Auto-generate slug from name before saving if not provided
categorySchema.pre('save', function (next) {
    if (!this.slug) {
        this.slug = this.name.trim().replace(/\s+/g, '-');
    }
    next();
});

const Category = mongoose.model('Category', categorySchema);
export default Category;
