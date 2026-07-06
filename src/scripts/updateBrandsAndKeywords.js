import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_PATH = path.resolve(__dirname, '../../اصناف الهدى - with Brand.xlsx');

const updateBrandsAndKeywords = async () => {
    await connectDB();

    // Read Excel
    const wb = XLSX.readFile(XLSX_PATH);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

    // Skip header, filter valid rows
    // Columns: 0=local_id, 1=name, 2=category, 3=manufacturer, 4=Brand, 5=Keywords, 6=price, 7=stock
    const dataRows = rows.slice(1).filter(r => r[0] != null && r[1]);

    // Deduplicate by local_id (take first occurrence)
    const productMap = new Map();
    for (const row of dataRows) {
        const localId = String(row[0]);
        if (!productMap.has(localId)) {
            productMap.set(localId, {
                localId,
                brandName: row[4] ? String(row[4]).trim() : null,
                keywords: row[5] ? String(row[5]).split(',').map(k => k.trim()).filter(Boolean) : []
            });
        }
    }

    console.log(`Excel: ${productMap.size} unique products`);

    // Get all unique brand names from Excel
    const brandNames = [...new Set(
        [...productMap.values()].map(p => p.brandName).filter(Boolean)
    )];
    console.log(`Found ${brandNames.length} unique brands in Excel`);

    // Ensure all brands exist in DB (create missing ones)
    const existingBrands = await Brand.find({});
    const existingBrandMap = new Map(existingBrands.map(b => [b.name, b._id]));

    const newBrandNames = brandNames.filter(name => !existingBrandMap.has(name));
    if (newBrandNames.length > 0) {
        const newBrands = await Brand.insertMany(
            newBrandNames.map(name => ({ name }))
        );
        newBrands.forEach(b => existingBrandMap.set(b.name, b._id));
        console.log(`Created ${newBrands.length} new brands`);
    }

    // Build brand lookup
    const brandMap = existingBrandMap;

    // Update products in bulk
    const bulkOps = [];
    for (const [localId, data] of productMap) {
        const update = {
            keywords: data.keywords
        };
        if (data.brandName && brandMap.has(data.brandName)) {
            update.brand = brandMap.get(data.brandName);
        } else {
            update.brand = null;
        }

        bulkOps.push({
            updateOne: {
                filter: { local_id: localId },
                update: { $set: update }
            }
        });
    }

    if (bulkOps.length > 0) {
        const result = await Product.bulkWrite(bulkOps);
        console.log(`Bulk update result:`, {
            matched: result.matchedCount,
            modified: result.modifiedCount
        });
    }

    // Drop old text index and let the model recreate it with keywords
    try {
        await Product.collection.dropIndex('name_text');
        console.log('Dropped old text index on name');
    } catch (e) {
        // Index may not exist or have different name
        console.log('Note: Could not drop old text index (may not exist):', e.message);
    }

    // Ensure new indexes
    await Product.syncIndexes();
    console.log('Synced indexes (text index now includes keywords)');

    // Stats
    const totalProducts = await Product.countDocuments();
    const withBrand = await Product.countDocuments({ brand: { $ne: null } });
    const withKeywords = await Product.countDocuments({ keywords: { $exists: true, $ne: [] } });
    console.log(`\nStats:`);
    console.log(`  Total products: ${totalProducts}`);
    console.log(`  With brand: ${withBrand}`);
    console.log(`  With keywords: ${withKeywords}`);

    // Clean up brands that are no longer referenced
    const usedBrandIds = await Product.distinct('brand');
    const unusedBrands = await Brand.deleteMany({ _id: { $nin: usedBrandIds.filter(Boolean) } });
    console.log(`  Removed ${unusedBrands.deletedCount} unused brands`);

    await mongoose.disconnect();
    console.log('\nDone!');
    process.exit(0);
};

updateBrandsAndKeywords().catch(err => {
    console.error(err);
    process.exit(1);
});
