import mongoose from 'mongoose';
import '../config/initMongoose.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import { deserialize } from 'bson';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Migration Script: Clean, map, and synchronize products, brands, and categories
 * - Ensures active real consumer brands exist (Duru, Lifebuoy, Comfort, Vaseline, Fairy, Oral-B, Axe, Bebem, Luna)
 * - Corrects missing, orphan, and misclassified categories
 * - Links products with high confidence to verified working brands
 * - Cleans unbranded / generic supplies to null
 * - Soft-deletes pseudo-brands (brands named after categories)
 * - Synchronizes brand.categories relations across all active brands
 */
const cleanAndSync = async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mobile_db');
    console.log('Connected to MongoDB. Starting database review and sync...');

    // 1. Ensure real consumer brands exist
    const brandsToEnsure = [
        { name: 'دورو', logo: null },
        { name: 'لايف بوي', logo: 'brand_logos/لايف بوي.webp' },
        { name: 'كمفورت', logo: null },
        { name: 'فازلين', logo: null },
        { name: 'فيري', logo: null },
        { name: 'اورال بي', logo: 'brand_logos/اورال بي.webp' },
        { name: 'اكس', logo: null },
        { name: 'بى بم', logo: null },
        { name: 'لونا', logo: 'brand_logos/لونا.webp' }
    ];

    for (const bData of brandsToEnsure) {
        let existing = await Brand.findOne({ name: bData.name });
        if (!existing) {
            existing = await Brand.create({
                name: bData.name,
                logo: bData.logo,
                deleteFlag: 0
            });
            console.log(`Created brand: ${bData.name}`);
        } else if (existing.deleteFlag === 1) {
            existing.deleteFlag = 0;
            if (bData.logo) existing.logo = bData.logo;
            await existing.save();
            console.log(`Re-activated brand: ${bData.name}`);
        }
    }

    // 2. Load active categories
    const allCats = await Category.find({}).lean();
    const activeCats = allCats.filter(c => c.isActive && c.deleteFlag !== 1);
    const catByName = new Map(activeCats.map(c => [c.name.trim(), c]));

    // 3. Load active brands map
    const allBrandsInDB = await Brand.find({}).lean();
    const activeBrandsMap = new Map();
    for (const b of allBrandsInDB) {
        if (b.deleteFlag !== 1) {
            activeBrandsMap.set(b.name.trim(), b);
        }
    }

    // 4. Load dump brands map if dump exists
    const dumpPath = path.resolve(__dirname, '../../../mobile_db_dump/mobile_db/brands.bson');
    const dumpBrands = new Map();
    if (fs.existsSync(dumpPath)) {
        const buf = fs.readFileSync(dumpPath);
        let offset = 0;
        while (offset < buf.length) {
            const size = buf.readInt32LE(offset);
            const doc = deserialize(buf.subarray(offset, offset + size));
            dumpBrands.set(doc._id.toString(), doc.name.trim());
            offset += size;
        }
    }

    const brandAliases = {
        'بلو لاين': 'بلولاين',
        'دوف': 'دووف',
        '.بيبي جوي': 'بيبي جوي',
        'باهي.': 'باهي',
        'بونكس': 'بونيكس',
        'مستر ماسيل': 'مستر ماسل',
        'هيد': 'هيد اند شولدرز',
        'هيداندشولدرز': 'هيد اند شولدرز',
        'لايف بوى': 'لايف بوي',
        'لايفبوي': 'لايف بوي',
        'اورال بى': 'اورال بي'
    };

    function getActiveBrandByName(name) {
        if (!name) return null;
        name = name.trim();
        const alias = brandAliases[name] || name;
        return activeBrandsMap.get(alias) || null;
    }

    const pseudoBrandNames = new Set(['ادوات منزليه ومنظفات', 'مستحضرات وعناية شخصيه', 'مبيدات', 'ورقيات', 'صابون', 'مساحيق', 'مبلل']);

    function classifyCategory(p) {
        const n = p.name.trim();

        const validExisting = (p.categories || []).filter(c => {
            const obj = allCats.find(cat => cat._id.toString() === c.toString());
            return obj && obj.isActive && obj.deleteFlag !== 1 && obj.name !== 'متنوع';
        });

        if (validExisting.length > 0) {
            return validExisting;
        }

        if (n.includes('مبيد') || n.includes('فئران') || n.includes('صراصير') || n.includes('ناموس') || n.includes('حشرات') || n.includes('سم فار') || n.includes('طائر') || n.includes('زاحف') || n.includes('بيرسول')) {
            return [catByName.get('مبيدات')._id];
        }
        if (n.includes('فيبا') || n.includes('وفير') || (n.includes('صابون') && (n.includes('لتر') || n.includes('مل') || n.includes('سائل')) && !n.includes('هاند'))) {
            return [catByName.get('صابون للصحون')._id];
        }
        if (n.startsWith('ريحة') || n.includes('معطر') || n.includes('فريدال') || n.includes('فاين معطر') || n.includes('فل اسبانى') || n.includes('تروبيكانا') || n.includes('بخور')) {
            return [catByName.get('معطرات')._id];
        }
        if (n.includes('دورو') || n.includes('دوش') || n.includes('ريفولى') || n.includes('لوكس') || n.includes('صابون') || n.includes('هاندووش') || n.includes('هاندوش')) {
            return [catByName.get('صابون')._id];
        }
        if (n.startsWith('مبلل') || n.includes('مبلل')) {
            return [catByName.get('مبللات')._id];
        }
        if (n.startsWith('لوف') || n.includes('لوف') || n.startsWith('سلك') || n.includes('سلك') || n.startsWith('مقشة') || n.startsWith('مقشى') || n.startsWith('موب') || n.startsWith('مساحة') || n.startsWith('مشابك') || n.includes('مشابك') || n.startsWith('كبريت') || n.includes('سفنجة') || n.includes('عصايا') || n.includes('فرش تواليت') || n.includes('فرش توليت') || n.includes('فرش توالت') || n.includes('جردل') || n.includes('فوط') || n.includes('فويل') || n.includes('غطاء') || n.includes('حبل غسيل') || n.includes('حجر ريموت') || n.includes('حجر قلم') || n.includes('ولاعة') || n.includes('زعافة')) {
            return [catByName.get('ادوات منزلية')._id];
        }
        if (n.includes('ديتول') || n.includes('كلوركس') || n.includes('كلوريل') || n.includes('فلاش') || n.includes('مسلك') || n.includes('مزيل دهون') || n.includes('سيترس') || n.includes('سيتريس') || n.includes('منظف') || n.includes('زهرة بيضاء') || n.includes('زهرة زرقاء') || n.includes('فنيك') || n.includes('مستر ماسل') || n.includes('مستر ماسيل') || n.includes('سوبر كلين')) {
            return [catByName.get('منظفات')._id];
        }
        if (n.includes('اريال') || n.includes('برسيل') || n.includes('اوكسي') || n.includes('مسحوق') || n.includes('اوتوماتيك') || n.includes('اونر') || n.includes('بونكس') || n.includes('بونيكس') || n.includes('تايد')) {
            return [catByName.get('مساحيق')._id];
        }
        if (n.includes('معجون') || n.includes('فرش دكتور برو') || n.includes('فرش اطفال') || n.includes('فرش اسنان') || n.includes('سنسوداين') || n.includes('سيجنال') || n.includes('كلوز اب') || n.includes('اورال بي') || n.includes('اورال بى')) {
            return [catByName.get('عناية للفم')._id];
        }
        if (n.includes('ملمع تابلوة') || n.includes('سيارات')) {
            return [catByName.get('منتجات للسيارات')._id];
        }
        if (n.includes('زجاج') || n.includes('ملمع زجاج') || n.includes('ويندكس') || n.includes('جلاسي')) {
            return [catByName.get('ملمعات الزجاج')._id];
        }
        if (n.includes('ورق') || n.includes('مناديل') || n.includes('منديل') || n.includes('فاين') || n.includes('زينه') || n.includes('فاميليا') || n.includes('وايت')) {
            return [catByName.get('ورقيات')._id];
        }
        if (n.includes('بامبرز') || n.includes('بيبي جوي') || n.includes('مولفكس') || n.includes('بى بم') || n.includes('حفاضات') || n.includes('اطفال')) {
            return [catByName.get('عنايه للاطفال')._id];
        }
        if (n.includes('فوط صحية') || n.includes('اولويز') || n.includes('صوفي') || n.includes('مولبد') || n.includes('برايفت')) {
            return [catByName.get('فوط صحية')._id];
        }
        if (n.includes('داونى') || n.includes('داوني') || n.includes('منعم') || n.includes('كمفورت')) {
            return [catByName.get('منعم')._id];
        }
        if (n.includes('كراون') || n.includes('ورنيش') || n.includes('احذية') || n.includes('صبغة احذية')) {
            return [catByName.get('اغراض للاحذية')._id];
        }
        if (n.includes('شاور') || n.includes('قصافة') || n.includes('ملقاط') || n.includes('مشط') || n.includes('سباركل') || n.includes('شامبو') || n.includes('بلسم') || n.includes('كريم') || n.includes('زيت') || n.includes('سويت') || n.includes('حلاقة') || n.includes('اسبراي') || n.includes('سبراى') || n.includes('مزيل عرق') || n.includes('فازلين') || n.includes('كولونيا')) {
            return [catByName.get('عناية شخصية')._id];
        }

        return [catByName.get('ادوات منزلية')._id];
    }

    function detectBrand(p) {
        const n = p.name.trim();

        if (p.brand) {
            const bDoc = allBrandsInDB.find(b => b._id.toString() === p.brand.toString());
            if (bDoc) {
                if (bDoc.name === 'باهي.') return activeBrandsMap.get('باهي');
                if (bDoc.name === '.بيبي جوي') return activeBrandsMap.get('بيبي جوي');
            }
        }

        if (p.brand) {
            const existingB = allBrandsInDB.find(b => b._id.toString() === p.brand.toString());
            if (existingB && existingB.deleteFlag !== 1 && !pseudoBrandNames.has(existingB.name)) {
                return existingB;
            }
        }

        if (p.brand) {
            const dumpName = dumpBrands.get(p.brand.toString());
            if (dumpName && dumpName !== 'اخري' && !pseudoBrandNames.has(dumpName)) {
                const activeMatch = getActiveBrandByName(dumpName);
                if (activeMatch) return activeMatch;
            }
        }

        if (n.includes('مولفكس')) return activeBrandsMap.get('مولفكس');
        if (n.includes('اورال بى') || n.includes('اورال بي')) return activeBrandsMap.get('اورال بي');
        if (n.includes('لايف بوى') || n.includes('لايف بوي')) return activeBrandsMap.get('لايف بوي');
        if (n.includes('فازلين اوريجنال') || (n.includes('فازلين') && !n.includes('بيور فازلين'))) return activeBrandsMap.get('فازلين');
        if (n.includes('كمفورت')) return activeBrandsMap.get('كمفورت');
        if (n.includes('فيري')) return activeBrandsMap.get('فيري');
        if (n.startsWith('اكس اسبراي') || n.includes('اكس ستييك')) return activeBrandsMap.get('اكس');
        if (n.startsWith('بى بم') || n.includes('بى بم')) return activeBrandsMap.get('بى بم');
        if (n.includes('لونا') || n.includes('زبدة كاكاو لونا')) return activeBrandsMap.get('لونا');
        if (n.includes('دورو')) return activeBrandsMap.get('دورو');
        if (n.includes('مستر ماسيل') || n.includes('مستر ماسل')) return activeBrandsMap.get('مستر ماسل');
        if (n.startsWith('سيترس') || n.includes(' سيترس ')) return activeBrandsMap.get('سيترس');
        if (n.includes('تربو بق') || n.includes('تربو فلاى') || n.includes('تربو ماكس')) return activeBrandsMap.get('تربو');
        if (n.startsWith('راجون') || n.includes(' راجون ')) return activeBrandsMap.get('راجون');
        if (n.includes('سام ريد')) return activeBrandsMap.get('ريد');
        if (n.includes('مبلل وايت')) return activeBrandsMap.get('وايت');
        if (n.includes('بيور قدم') || n.includes('بيور فازلين')) return activeBrandsMap.get('بيور');
        if (n.includes('خلة اسنان كوكو')) return activeBrandsMap.get('كوكو');
        if (n.includes('سنسواين')) return activeBrandsMap.get('سنسوداين');
        if (n.includes('فل 9ك+ليدر')) return activeBrandsMap.get('ليدر');
        if (n.includes('فيبكس رول')) return activeBrandsMap.get('فيبكس');
        if (n.includes('بليدج')) return activeBrandsMap.get('بليدج');
        if (n.includes('فاميليا')) return activeBrandsMap.get('فاميليا');
        if (n.includes('لودي ماكس')) return activeBrandsMap.get('لودي');
        if (n.includes('وايت مطبخ')) return activeBrandsMap.get('وايت');
        if (n.includes('بيبي جوي')) return activeBrandsMap.get('بيبي جوي');
        if (n.includes('كلوركس')) return activeBrandsMap.get('كلوركس');
        if (n.includes('اوكسي')) return activeBrandsMap.get('اوكسي');
        if (n.includes('ايفا')) return activeBrandsMap.get('ايفا');
        if (n.includes('دابر')) return activeBrandsMap.get('دابر');
        if (n.includes('صن سيلك') || n.includes('صن سلك')) return activeBrandsMap.get('صن سيلك');
        if (n.includes('فريدا')) return activeBrandsMap.get('فريدا');
        if (n.includes('فيبا')) return activeBrandsMap.get('فيبا');
        if (n.includes('كراون')) return activeBrandsMap.get('كراون');
        if (n.includes('كلوريل')) return activeBrandsMap.get('كلوريل');
        if (n.includes('كلوز اب')) return activeBrandsMap.get('كلوز اب');
        if (n.includes('كلير') && !n.includes('ماكس كلير')) return activeBrandsMap.get('كلير');
        if (n.includes('كامي')) return activeBrandsMap.get('كامي');
        if (n.includes('لانا')) return activeBrandsMap.get('لانا');

        return null;
    }

    const allProductsRaw = await Product.collection.find({}).toArray();
    const bulkOps = [];

    for (const p of allProductsRaw) {
        const newCats = classifyCategory(p);
        const newBrand = detectBrand(p);

        const oldCatIds = (p.categories || []).map(c => c.toString()).sort().join(',');
        const newCatIds = newCats.map(c => c.toString()).sort().join(',');
        const catChanged = oldCatIds !== newCatIds;

        const oldBrandId = p.brand ? p.brand.toString() : null;
        const newBrandId = newBrand ? newBrand._id.toString() : null;
        const brandChanged = oldBrandId !== newBrandId;

        if (catChanged || brandChanged) {
            const update = {};
            if (catChanged) update.categories = newCats;
            if (brandChanged) update.brand = newBrand ? newBrand._id : null;

            bulkOps.push({
                updateOne: {
                    filter: { _id: p._id },
                    update: { $set: update }
                }
            });
        }
    }

    if (bulkOps.length > 0) {
        const res = await Product.collection.bulkWrite(bulkOps);
        console.log(`Updated ${res.modifiedCount} products.`);
    }

    // 5. Soft-delete pseudo brands and duplicates
    await Brand.updateMany(
        { name: { $in: [...pseudoBrandNames, 'باهي.'] } },
        { $set: { deleteFlag: 1 } }
    );

    // 6. Sync categories to brands
    const activeBrands = await Brand.find({ deleteFlag: { $ne: 1 } });
    let synced = 0;
    for (const b of activeBrands) {
        const catIds = await Product.distinct('categories', {
            brand: b._id,
            categories: { $exists: true, $ne: [] }
        });
        b.categories = catIds;
        await b.save();
        synced++;
    }
    console.log(`Synced categories for ${synced} active brands.`);

    await mongoose.disconnect();
    console.log('Done!');
};

cleanAndSync().catch(err => {
    console.error('Error during clean and sync:', err);
    process.exit(1);
});
