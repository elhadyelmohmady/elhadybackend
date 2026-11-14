import '../config/initMongoose.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run(dryRun = true) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mobile_db');
    console.log(`Connected to MongoDB. DryRun: ${dryRun}`);

    const filePath = path.resolve(__dirname, '../../New Text Document (3).txt');
    const content = fs.readFileSync(filePath, 'utf8');
    const rawLines = content.split('\n');

    // Parse sections and products
    const sections = [];
    let currentProds = [];

    for (const rawLine of rawLines) {
        const line = rawLine.trim();
        if (!line) continue;

        if (line.includes('---')) {
            sections.push({
                divider: line,
                products: currentProds
            });
            currentProds = [];
            continue;
        }

        if (line === 'منخفض' || line === 'متوفر') {
            if (currentProds.length > 0) {
                currentProds[currentProds.length - 1].stockStatus = line;
            }
            continue;
        }

        const parts = line.split('\t');
        if (parts.length >= 2) {
            const name = parts[0].trim();
            const local_id = parts[1].trim();
            const priceStr = parts[4] || '0';
            const price = parseFloat(priceStr.replace(/,/g, '').replace(/[^\d.]/g, '') || 0);
            const stock = parseInt(parts[5] || 0, 10);
            const minOrder = parseInt(parts[6] || 1, 10);

            currentProds.push({
                name,
                local_id,
                price,
                stock,
                minOrder: isNaN(minOrder) || minOrder <= 0 ? 1 : minOrder,
                stockStatus: 'متوفر'
            });
        }
    }

    // Mapping function
    function determineMapping(p, divider) {
        let categoryNames = [];
        let brandName = 'عام';

        if (divider.includes('فريدال')) {
            categoryNames = ['معطرات وبخور'];
            brandName = 'فريدا';
        } else if (divider.includes('رايز')) {
            categoryNames = ['ورقيات'];
            brandName = 'رايز';
        } else if (divider.includes('كيميتول')) {
            categoryNames = ['منظفات'];
            brandName = 'كيميتول';
            if (p.name.includes('ملمع زجاج')) {
                categoryNames.push('ملمع  زجاج واساس');
            }
        } else if (divider.includes('لوف')) {
            categoryNames = ['عناية شخصية', 'شاور ولوف استحمام'];
            const n = p.name;
            if (n.includes('كلارا')) brandName = 'كلارا';
            else if (n.includes('وريتكس') || n.includes('ورينكس')) brandName = 'وريتكس';
            else if (n.includes('شيري')) brandName = 'شيري جولد';
            else if (n.includes('اية بى') || n.includes('اية بي')) brandName = 'اية بي';
            else if (n.includes('ابشر')) brandName = 'ابشر';
            else if (n.includes('اروبه') || n.includes('اروبة')) brandName = 'اروبة';
            else if (n.includes('التيسير')) brandName = 'التيسير';
            else if (n.includes('الزكية') || n.includes('الزكيه')) brandName = 'الزكية';
            else if (n.includes('لهلوبة') || n.includes('لهلوبه')) brandName = 'اللهلوبه';
            else brandName = 'عام';
        } else if (divider.includes('ليدو')) {
            categoryNames = ['منتجات وعناية للاطفال'];
            if (p.name.includes('مونى') || p.name.includes('موني')) {
                brandName = 'موني';
            } else {
                brandName = 'ليدو';
            }
        } else if (divider.includes('مقشه')) {
            categoryNames = ['ادوات منزلية'];
            const n = p.name;
            if (n.includes('الهلال') || n.includes('هلال')) brandName = 'الهلال';
            else if (n.includes('بيرامدز')) brandName = 'بيرامدز';
            else if (n.includes('فايف جى') || n.includes('فايف جي')) brandName = 'فايف جي';
            else if (n.includes('مدريد')) brandName = 'مدريد';
            else if (n.includes('الكينج')) brandName = 'الكينج';
            else if (n.includes('الهانم')) brandName = 'الهانم';
            else if (n.includes('ايديال')) brandName = 'ايديال';
            else brandName = 'عام';
        } else if (divider.includes('موب')) {
            categoryNames = ['ادوات منزلية'];
            const n = p.name;
            if (n.includes('الهلال') || n.includes('هلال')) brandName = 'الهلال';
            else if (n.includes('هايدى') || n.includes('هايدي')) brandName = 'هايدي';
            else if (n.includes('سمسمة') || n.includes('سمسمه')) brandName = 'سمسمة';
            else brandName = 'عام';
        }

        return {
            ...p,
            categoryNames,
            brandName
        };
    }

    // Flatten products
    const items = [];
    for (const s of sections) {
        for (const p of s.products) {
            items.push(determineMapping(p, s.divider));
        }
    }

    console.log(`Parsed total of ${items.length} products.`);

    // 1. Load active categories
    const allCategories = await Category.find({ deleteFlag: { $ne: 1 } });
    const catMap = new Map(allCategories.map(c => [c.name.trim(), c]));

    // Verify all categories exist
    const allCatNamesNeeded = new Set(items.flatMap(i => i.categoryNames));
    for (const cName of allCatNamesNeeded) {
        if (!catMap.has(cName)) {
            throw new Error(`Category not found in database: "${cName}"`);
        }
    }
    console.log(`Verified all ${allCatNamesNeeded.size} needed categories exist in DB.`);

    // 2. Ensure brands exist
    const allBrandNamesNeeded = new Set(items.map(i => i.brandName));
    const allBrandsInDB = await Brand.find({});
    const brandMap = new Map(allBrandsInDB.map(b => [b.name.trim(), b]));

    const brandsToCreate = [];
    for (const bName of allBrandNamesNeeded) {
        if (!brandMap.has(bName)) {
            brandsToCreate.push(bName);
        } else {
            const b = brandMap.get(bName);
            if (b.deleteFlag === 1) {
                console.log(`Brand "${bName}" exists but is soft-deleted. Will reactivate.`);
                if (!dryRun) {
                    b.deleteFlag = 0;
                    await b.save();
                }
            }
        }
    }

    console.log(`Brands to create (${brandsToCreate.length}):`, brandsToCreate);

    if (!dryRun) {
        for (const bName of brandsToCreate) {
            const newBrand = await Brand.create({
                name: bName,
                deleteFlag: 0,
                categories: []
            });
            brandMap.set(bName, newBrand);
            console.log(`Created new brand: "${bName}"`);
        }
    }

    // 3. Prepare product documents
    const now = new Date();
    const productDocs = [];
    for (const item of items) {
        const catDocs = item.categoryNames.map(cn => catMap.get(cn)).filter(Boolean);
        const catIds = catDocs.map(c => c._id);
        const brandDoc = brandMap.get(item.brandName);

        // Keywords generation
        const cleanWords = item.name.split(/[\s*+]+/g).filter(w => w.length > 1);
        const numericCode = item.local_id.replace(/^OLD-/, '');
        const keywords = [
            ...new Set([
                item.local_id,
                numericCode,
                ...cleanWords,
                item.brandName,
                ...item.categoryNames
            ])
        ];

        productDocs.push({
            local_id: item.local_id,
            name: item.name,
            price: item.price,
            stock: item.stock,
            minOrderQty: item.minOrder,
            maxOrderQty: 100,
            categories: catIds,
            brand: brandDoc ? brandDoc._id : null,
            image: null,
            deleteFlag: 0,
            keywords,
            metadata: {
                originalCode: numericCode,
                rawCode: item.local_id,
                stockStatus: item.stockStatus
            }
        });
    }

    console.log(`Sample product document:\n`, JSON.stringify(productDocs[0], null, 2));

    if (!dryRun) {
        // Upsert products to avoid duplicates if rerun
        let insertedCount = 0;
        let updatedCount = 0;

        for (const doc of productDocs) {
            const res = await Product.collection.updateOne(
                { local_id: doc.local_id },
                {
                    $set: {
                        ...doc,
                        updatedAt: now
                    },
                    $setOnInsert: {
                        createdAt: now
                    }
                },
                { upsert: true }
            );
            if (res.upsertedCount > 0) insertedCount++;
            else if (res.modifiedCount > 0) updatedCount++;
        }

        console.log(`Products import finished: ${insertedCount} inserted, ${updatedCount} updated.`);

        // Sync categories for all touched brands
        for (const bName of allBrandNamesNeeded) {
            const b = brandMap.get(bName);
            if (b) {
                const distinctCats = await Product.collection.distinct('categories', {
                    brand: b._id,
                    deleteFlag: { $ne: 1 }
                });
                await Brand.collection.updateOne({ _id: b._id }, { $set: { categories: distinctCats } });
            }
        }
        console.log(`Synced categories for all touched brands.`);
    }

    await mongoose.disconnect();
    console.log('Done.');
}

const isDryRun = process.argv.includes('--dry-run') || !process.argv.includes('--execute');
run(isDryRun).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
