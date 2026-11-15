import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Coupon from '../models/Coupon.js';
import Product from '../models/Product.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mobile_db';

async function seed() {
    try {
        console.log('Connecting to MongoDB:', MONGODB_URI);
        await mongoose.connect(MONGODB_URI);

        // 1. Seed Coupons
        console.log('\n--- Seeding Coupons ---');
        const now = new Date();
        const oneYearLater = new Date();
        oneYearLater.setFullYear(now.getFullYear() + 1);

        const couponsData = [
            {
                code: 'ELHADY10',
                description: 'خصم 10% على إجمالي الطلب للعملاء',
                discountType: 'percentage',
                discountValue: 10,
                maxDiscountAmount: 300,
                minOrderAmount: 500,
                startDate: now,
                expiryDate: oneYearLater,
                usageLimit: 1000,
                userUsageLimit: 3,
                isActive: true
            },
            {
                code: 'WELCOME50',
                description: 'خصم ترحيبي 50 ج.م للطلبات فوق 1,000 ج.م',
                discountType: 'fixed',
                discountValue: 50,
                minOrderAmount: 1000,
                startDate: now,
                expiryDate: oneYearLater,
                usageLimit: 500,
                userUsageLimit: 1,
                isActive: true
            },
            {
                code: 'BIGSAVER',
                description: 'خصم 15% للمحلات والطلبات الكبيرة',
                discountType: 'percentage',
                discountValue: 15,
                maxDiscountAmount: 750,
                minOrderAmount: 2500,
                startDate: now,
                expiryDate: oneYearLater,
                usageLimit: 500,
                userUsageLimit: 5,
                isActive: true
            },
            {
                code: 'JOMBLA5',
                description: 'خصم جملة 5% إضافي فوق 5,000 ج.م',
                discountType: 'percentage',
                discountValue: 5,
                minOrderAmount: 5000,
                startDate: now,
                expiryDate: oneYearLater,
                usageLimit: 1000,
                userUsageLimit: 10,
                isActive: true
            }
        ];

        for (const cData of couponsData) {
            const existing = await Coupon.findOne({ code: cData.code });
            if (!existing) {
                await Coupon.create(cData);
                console.log(`+ Created coupon: ${cData.code} (${cData.description})`);
            } else {
                console.log(`= Coupon already exists: ${cData.code}`);
            }
        }

        // 2. Seed Offers (originalPrice) & Best Prices & Quantity Tiers on real products
        console.log('\n--- Seeding Product Offers, Best Prices & Quantity Tiers ---');
        const popularKeywords = ['اريال', 'اوكسي', 'برسيل', 'سلفر', 'سيتيل', 'شامبو', 'صابون', 'مسحوق'];
        const products = await Product.find({
            stock: { $gt: 5 },
            price: { $gt: 10 },
            $or: popularKeywords.map(k => ({ name: { $regex: k, $options: 'i' } }))
        }).limit(30);

        console.log(`Found ${products.length} popular products to apply offers to.`);

        let onSaleCount = 0;
        let bestPriceCount = 0;
        let quantityTierCount = 0;

        for (let i = 0; i < products.length; i++) {
            const p = products[i];
            let modified = false;

            // 1) Apply onSale / originalPrice to first 15
            if (i < 15) {
                const markup = Math.round(p.price * 1.25); // was 25% higher
                p.originalPrice = markup;
                modified = true;
                onSaleCount++;
            }

            // 2) Mark bestPrice on 10 products
            if (i % 2 === 0 && bestPriceCount < 10) {
                p.isBestPrice = true;
                modified = true;
                bestPriceCount++;
            }

            // 3) Add quantity tiers to 12 products
            if (i % 2 === 1 && quantityTierCount < 12) {
                const tier5Price = Math.round(p.price * 0.93 * 10) / 10;
                const tier10Price = Math.round(p.price * 0.88 * 10) / 10;

                p.quantityTiers = [
                    {
                        minQuantity: 5,
                        price: tier5Price,
                        label: 'خصم 5 قطع فأكثر'
                    },
                    {
                        minQuantity: 10,
                        price: tier10Price,
                        label: 'خصم 10 قطع فأكثر'
                    }
                ];
                modified = true;
                quantityTierCount++;
            }

            if (modified) {
                await p.save();
            }
        }

        console.log(`\nDone seeding:`);
        console.log(`- Coupons active: ${couponsData.length}`);
        console.log(`- Products on sale (originalPrice > price): ${onSaleCount}`);
        console.log(`- Products marked Best Price (isBestPrice): ${bestPriceCount}`);
        console.log(`- Products with Quantity Tiers (عروض كميات): ${quantityTierCount}`);

        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seed();
