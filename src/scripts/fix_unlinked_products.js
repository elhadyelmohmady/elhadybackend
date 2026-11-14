import '../config/initMongoose.js';
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';

async function fix() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mobile_db');
    console.log('Connected to MongoDB. Starting fix...');

    // 1. Get Category: 'صابون للاطباق'
    const dishSoapCat = await Category.findOne({ name: 'صابون للاطباق', deleteFlag: { $ne: 1 } });
    if (!dishSoapCat) {
        console.error('Category صابون للاطباق not found!');
        process.exit(1);
    }

    // 2. Ensure Brand: 'بروميكس'
    let promixBrand = await Brand.findOne({ name: 'بروميكس' });
    if (!promixBrand) {
        promixBrand = await Brand.create({
            name: 'بروميكس',
            categories: [dishSoapCat._id],
            deleteFlag: 0
        });
        console.log(`Created brand: بروميكس (${promixBrand._id})`);
    } else if (promixBrand.deleteFlag === 1) {
        promixBrand.deleteFlag = 0;
        await promixBrand.save();
        console.log(`Re-activated brand: بروميكس (${promixBrand._id})`);
    }

    // 3. Fix the 2 Promix products (missing category + missing brand)
    const promixRes = await Product.updateMany(
        { local_id: { $in: ['4426', '4817'] } },
        {
            $set: {
                categories: [dishSoapCat._id],
                brand: promixBrand._id
            }
        }
    );
    console.log(`Updated Promix products: ${promixRes.modifiedCount} products updated.`);

    // 4. Find Ariel and Oxy brands
    const arielBrand = await Brand.findOne({ name: 'اريال', deleteFlag: { $ne: 1 } });
    const oxyBrand = await Brand.findOne({ name: 'اوكسي', deleteFlag: { $ne: 1 } });

    if (arielBrand) {
        const arielRes = await Product.updateMany(
            {
                local_id: { $in: ['dashboard_1793817608799_aefqy6', 'dashboard_1793817838142_58pd1t'] },
                brand: null
            },
            { $set: { brand: arielBrand._id } }
        );
        console.log(`Updated dashboard Ariel products: ${arielRes.modifiedCount} products linked to Ariel.`);
    }

    if (oxyBrand) {
        const oxyRes = await Product.updateMany(
            {
                local_id: { $in: ['dashboard_1793820621353_v7sz2a', 'dashboard_1793820771082_y1xpnc'] },
                brand: null
            },
            { $set: { brand: oxyBrand._id } }
        );
        console.log(`Updated dashboard Oxy products: ${oxyRes.modifiedCount} products linked to Oxy.`);
    }

    console.log('Fix completed successfully.');
    await mongoose.disconnect();
}

fix().catch(err => {
    console.error(err);
    process.exit(1);
});
