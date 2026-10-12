import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

dotenv.config();

const syncBrandsWithCategories = async () => {
    await connectDB();
    console.log('Connected to MongoDB. Starting Brand-Category sync...');

    const brands = await Brand.find({});
    console.log(`Found ${brands.length} brands to check.`);

    let updatedCount = 0;

    for (const brand of brands) {
        // Find all distinct categories of products associated with this brand
        const categoryIds = await Product.distinct('categories', {
            brand: brand._id,
            categories: { $exists: true, $ne: [] }
        });

        if (categoryIds && categoryIds.length > 0) {
            // Merge existing categories and product categories
            const existingIds = (brand.categories || []).map(id => id.toString());
            const newIds = categoryIds.map(id => id.toString());
            const merged = Array.from(new Set([...existingIds, ...newIds])).map(id => new mongoose.Types.ObjectId(id));

            brand.categories = merged;
            await brand.save();
            updatedCount++;
        }
    }

    console.log(`Successfully synced ${updatedCount} brands with their categories.`);

    // Quick verification: Show categories for brands in 'مساحيق'
    const powderCat = await Category.findOne({ name: 'مساحيق' });
    if (powderCat) {
        const powderBrands = await Brand.find({ categories: powderCat._id }).select('name');
        console.log(`\nBrands currently linked to 'مساحيق' (${powderBrands.length} brands):`);
        console.log(powderBrands.map(b => b.name).join(', '));
    }

    await mongoose.disconnect();
    console.log('\nDone!');
    process.exit(0);
};

syncBrandsWithCategories().catch(err => {
    console.error('Error during sync:', err);
    process.exit(1);
});
