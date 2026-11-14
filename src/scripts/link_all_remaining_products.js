import '../config/initMongoose.js';
import mongoose from 'mongoose';
import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function linkAllRemainingProducts() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mobile_db');
    console.log('Connected to MongoDB. Starting full brand linking process...');

    const xlsxPath = path.resolve(__dirname, '../../اصناف الهدى - with Brand.xlsx');
    const wb = xlsx.readFile(xlsxPath);
    const excelRows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    const excelMap = new Map(excelRows.map(r => [String(r['رقم الصنف']), r]));

    const unlinkedProducts = await Product.collection.find({
        deleteFlag: { $ne: 1 },
        brand: null
    }).toArray();

    console.log(`Found ${unlinkedProducts.length} unlinked active products.`);

    function determineBrand(p) {
        const name = p.name.trim();
        const ex = excelMap.get(p.local_id);
        const exBrand = ex ? ex['Brand'] : null;

        // 1. Direct explicit brand from Excel (not generic)
        if (exBrand && exBrand !== 'اخري' && exBrand !== 'أخرى') {
            if (exBrand === 'سوفت') return 'سوفت روز';
            return exBrand.trim();
        }

        // 2. Dashboard products specific brands
        if (p.local_id.startsWith('dashboard_')) {
            if (name.includes('الريحاني')) return 'الريحاني';
            if (name.includes('السرايا')) return 'السرايا';
            if (name.includes('شيخ العرب')) return 'شيخ العرب';
            if (name.includes('سوفت روز')) return 'سوفت روز';
            if (name.includes('رايز')) return 'رايز';
            if (name.includes('جوليا')) return 'جوليا';
            if (name.includes('جراند')) return 'جراند';
            if (name.includes('اكس ال')) return 'اكس ال';
            if (name.includes('المدمر')) return 'المدمر';
            if (name.includes('ايفني')) return 'ايفني';
            if (name.includes('جولد فريش')) return 'جولد فريش';
            if (name.includes('جيني')) return 'جيني';
            if (name.includes('رايت')) return 'رايت';
            if (name.includes('روزي')) return 'روزي';
            if (name.includes('كفر الزيات')) return 'كفر الزيات';
            if (name.includes('سمارت')) return 'سمارت';
            if (name.includes('كاريلا')) return 'كاريلا';
            if (name.includes('كريستال')) return 'كريستال';
            if (name.includes('ماكسيمنس')) return 'ماكسيمنس';
            if (name.includes('مور')) return 'مور';
            if (name.includes('اللهلوبه')) return 'اللهلوبه';
            if (name.includes('بريمو')) return 'بريمو';
            if (name.includes('الاسطول')) return 'الاسطول';
            if (name.includes('هلال')) return 'الهلال';
            if (name.includes('سويدي')) return 'سويدي';
            if (name.includes('مصري')) return 'مصري';
            return 'عام';
        }

        // 3. Name-based matching for "اخري"
        if (name.includes('لايف فل')) return 'فل';
        if (name.includes('الفا')) return 'الفا باك';
        if (name.includes('توشيبا')) return 'توشيبا';
        if (name.includes('ايفردى') || name.includes('ايفردي')) return 'ايفردي';
        if (name.includes('لورد')) return 'لورد';
        if (name.includes('دراى') || name.includes('دراي')) return 'دراي';
        if (name.includes('الهلال') || name.includes('هلال')) return 'الهلال';
        if (name.includes('بلدوزر')) return 'بلدوزر';
        if (name.includes('الاسطول')) return 'الاسطول';
        if (name.includes('القرش')) return 'القرش';
        if (name.includes('اللهلوبه')) return 'اللهلوبه';
        if (name.includes('شيري جولد')) return 'شيري جولد';
        if (name.includes('سندريلا')) return 'سندريلا';
        if (name.includes('سيتريس') || name.includes('سيترس')) return 'سيترس';
        if (name.startsWith('فل اوتوماتيك') || name.startsWith('فل يدوي')) return 'فل';
        if (name.includes('العاشر')) return 'العاشر';
        if (name.includes('كاريلا')) return 'كاريلا';
        if (name.includes('كلوريتا')) return 'كلوريتا';
        if (name.includes('555')) return '555';
        if (name.includes('لارا')) return 'لارا';
        if (name.includes('لافينا')) return 'لافينا';
        if (name.includes('نايس')) return 'نايس';
        if (name.includes('ليدى') || name.includes('ليدي')) return 'ليدي';
        if (name.includes('العود الملكي')) return 'العود الملكي';
        if (name.includes('كفر زيات') || name.includes('كفر الزيات')) return 'كفر الزيات';
        if (name.includes('بي فاين')) return 'فاين';
        if (name.includes('سبيد')) return 'سبيد';
        if (name.includes('رامبو')) return 'رامبو';
        if (name.includes('رالي')) return 'رالي';
        if (name.includes('ديو')) return 'ديو';
        if (name.includes('ديتوركس')) return 'ديتوركس';
        if (name.includes('ريال مان')) return 'ريال مان';
        if (name.includes('انجليش ليز')) return 'انجليش ليز';
        if (name.includes('اوركس')) return 'اوركس';
        if (name.includes('ماكس بودر') || name.includes('ماكس كلير')) return 'ماكس';
        if (name.includes('بودى ليشيوس') || name.includes('بودي ليشيوس')) return 'بودي ليشيوس';
        if (name.includes('كيمو')) return 'كيمو';
        if (name.includes('جولد')) return 'جولد';
        if (name.includes('فلورو')) return 'فلورو';
        if (name.includes('موجة')) return 'موجة';
        if (name.includes('ليزر')) return 'ليزر';
        if (name.includes('ليم')) return 'ليم';
        if (name.includes('سيكرت جيرل')) return 'سيكرت جيرل';
        if (name.includes('فرست')) return 'فرست';
        if (name.includes('لادور')) return 'لادور';
        if (name.includes('ميزة لايف')) return 'ميزة لايف';
        if (name.includes('تي سوفت')) return 'تي سوفت';
        if (name.includes('مزيكا')) return 'مزيكا';
        if (name.includes('موبلكس')) return 'موبلكس';
        if (name.includes('مورال')) return 'مورال';
        if (name.includes('نابلسى شاهين') || name.includes('نابلسي')) return 'نابلسي شاهين';
        if (name.includes('لوكس')) return 'لوكس';
        if (name.includes('جرين')) return 'جرين';
        if (name.includes('التؤام')) return 'التوأم';
        if (name.includes('فاينل')) return 'فاينل';
        if (name.includes('صاروخ')) return 'صاروخ';
        if (name.includes('كوين')) return 'كوين';
        if (name.includes('لعنه الفراعنة')) return 'لعنة الفراعنة';
        if (name.includes('هى اسبراى')) return 'هي';

        return 'عام';
    }

    // Determine target brand for every unlinked product
    const mappings = [];
    const brandNamesNeeded = new Set();

    for (const p of unlinkedProducts) {
        const brandName = determineBrand(p);
        brandNamesNeeded.add(brandName);
        mappings.push({
            product: p,
            brandName
        });
    }

    console.log(`Unique brand names needed: ${brandNamesNeeded.size}`);

    // Load or create all needed brands
    const allBrandsInDB = await Brand.collection.find({}).toArray();
    const brandDocMap = new Map();

    for (const b of allBrandsInDB) {
        brandDocMap.set(b.name.trim(), b);
    }

    let createdCount = 0;
    let reactivatedCount = 0;

    for (const name of brandNamesNeeded) {
        if (!brandDocMap.has(name)) {
            const newBrand = await Brand.create({
                name,
                deleteFlag: 0,
                categories: []
            });
            brandDocMap.set(name, newBrand);
            createdCount++;
        } else {
            const existing = brandDocMap.get(name);
            if (existing.deleteFlag === 1) {
                await Brand.collection.updateOne({ _id: existing._id }, { $set: { deleteFlag: 0 } });
                existing.deleteFlag = 0;
                reactivatedCount++;
            }
        }
    }

    console.log(`Created ${createdCount} new brands, reactivated ${reactivatedCount} existing brands.`);

    // Update products in bulk
    const bulkOps = mappings.map(m => {
        const brandDoc = brandDocMap.get(m.brandName);
        return {
            updateOne: {
                filter: { _id: m.product._id },
                update: { $set: { brand: brandDoc._id } }
            }
        };
    });

    const bulkRes = await Product.collection.bulkWrite(bulkOps);
    console.log(`Updated ${bulkRes.modifiedCount} products with brand IDs.`);

    // Sync categories to brands for all touched brands
    for (const name of brandNamesNeeded) {
        const b = brandDocMap.get(name);
        const distinctCats = await Product.collection.distinct('categories', {
            brand: b._id,
            deleteFlag: { $ne: 1 }
        });
        await Brand.collection.updateOne({ _id: b._id }, { $set: { categories: distinctCats } });
    }
    console.log(`Synced categories for all ${brandNamesNeeded.size} touched brands.`);

    // Generate complete audit Excel report
    const activeCats = new Map((await Category.collection.find({}).toArray()).map(c => [c._id.toString(), c.name]));
    const auditRows = mappings.map(m => {
        const cats = (m.product.categories || []).map(c => activeCats.get(c.toString())).filter(Boolean);
        return {
            'كود الصنف': m.product.local_id,
            'اسم المنتج': m.product.name,
            'السعر': m.product.price,
            'التصنيف': cats.join(' - '),
            'البراند المربوط': m.brandName,
            'طريقة الربط': m.brandName === 'عام' ? 'صنف عام/خردوات (عام)' : (excelMap.get(m.product.local_id)?.['Brand'] ? 'مستخرج من شيت الإكسيل' : 'مستخرج من اسم المنتج/الداشبورد')
        };
    });

    const outWb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(auditRows);
    xlsx.utils.book_append_sheet(outWb, ws, 'تقرير الربط الشامل (195 صنف)');

    const reportPath = path.resolve(__dirname, '../../تقرير_ربط_المنتجات_بالكامل.xlsx');
    xlsx.writeFile(outWb, reportPath);
    console.log(`Saved detailed audit Excel report to: ${reportPath}`);

    // Verification
    const remainingUnlinked = await Product.collection.countDocuments({
        deleteFlag: { $ne: 1 },
        brand: null
    });
    console.log(`Verification: Remaining unlinked active products = ${remainingUnlinked}`);

    await mongoose.disconnect();
}

linkAllRemainingProducts().catch(err => {
    console.error('Error during full linking:', err);
    process.exit(1);
});
