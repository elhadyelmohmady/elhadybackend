import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
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
    categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }]
}, { timestamps: true });

brandSchema.index({ categories: 1 });

const Brand = mongoose.model('Brand', brandSchema);
export default Brand;
