import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
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
    logo: {
        type: String,
        default: null
    },
    description: {
        type: String,
        default: null
    },
    brands: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand'
    }],
    categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

companySchema.index({ brands: 1 });
companySchema.index({ categories: 1 });

// Auto-generate slug from name before saving if not provided
companySchema.pre('save', function (next) {
    if (!this.slug) {
        this.slug = this.name.trim().replace(/\s+/g, '-');
    }
    next();
});

const Company = mongoose.model('Company', companySchema);

export default Company;
