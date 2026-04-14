import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import Setting from '../models/Setting.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLS_PATH = path.resolve(__dirname, '../../Copy of اصناف الهدى (1).xls');
const METADATA_PATH = path.resolve(__dirname, '../assets/products_metadata.json');

const seedData = async () => {
    await connectDB();

    // Read XLS
    const wb = XLSX.readFile(XLS_PATH);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

    // Skip header row
    const dataRows = rows.slice(1).filter(r => r[0] != null && r[1]);

    // Extract unique categories and brands
    const categoryNames = [...new Set(dataRows.map(r => r[2]).filter(Boolean))];
    const brandNames = [...new Set(dataRows.map(r => r[3]).filter(Boolean))];

    // Load image metadata
    const imageMetadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8'));
    const PLACEHOLDER_IMAGE = 'product_images/placeholder.webp';

    console.log(`Found ${categoryNames.length} categories, ${brandNames.length} brands, ${dataRows.length} product rows`);
    console.log(`Loaded ${Object.keys(imageMetadata).length} image entries from metadata.`);

    // Clear existing data
    await Promise.all([
        Category.deleteMany({}),
        Brand.deleteMany({}),
        Product.deleteMany({})
    ]);
    console.log('Cleared existing data.');

    // Seed categories (generate slug manually since insertMany skips pre-save hooks)
    const categories = await Category.insertMany(
        categoryNames.map(name => ({ name, slug: name.trim().replace(/\s+/g, '-') }))
    );
    const categoryMap = new Map(categories.map(c => [c.name, c._id]));
    console.log(`Seeded ${categories.length} categories.`);

    // Seed brands
    const brands = await Brand.insertMany(
        brandNames.map(name => ({ name }))
    );
    const brandMap = new Map(brands.map(b => [b.name, b._id]));
    console.log(`Seeded ${brands.length} brands.`);

    // Deduplicate products by local_id — merge categories if same product appears with different categories
    const productIndex = new Map();

    for (const row of dataRows) {
        const localId = String(row[0]);
        const name = row[1];
        const categoryName = row[2];
        const brandName = row[3];
        const price = typeof row[4] === 'number' ? row[4] : 0;
        const stock = typeof row[5] === 'number' ? row[5] : 0;

        if (productIndex.has(localId)) {
            // Merge: add category if different
            const existing = productIndex.get(localId);
            if (categoryName && categoryMap.has(categoryName)) {
                const catId = categoryMap.get(categoryName);
                if (!existing.categories.some(id => id.equals(catId))) {
                    existing.categories.push(catId);
                }
            }
            // Keep higher price / stock if different
            if (price > existing.price) existing.price = price;
            if (stock > existing.stock) existing.stock = stock;
        } else {
            const categories = [];
            if (categoryName && categoryMap.has(categoryName)) {
                categories.push(categoryMap.get(categoryName));
            }

            // Match image from metadata by product name
            const imagePath = imageMetadata[name]?.image_path || PLACEHOLDER_IMAGE;

            productIndex.set(localId, {
                local_id: localId,
                name,
                price,
                stock,
                categories,
                brand: brandName && brandMap.has(brandName) ? brandMap.get(brandName) : null,
                image: imagePath
            });
        }
    }

    const products = [...productIndex.values()];
    await Product.insertMany(products);
    console.log(`Seeded ${products.length} products.`);

    // Stats
    const multiCat = products.filter(p => p.categories.length > 1).length;
    const noBrand = products.filter(p => !p.brand).length;
    const withImage = products.filter(p => p.image && p.image !== PLACEHOLDER_IMAGE).length;
    const withPlaceholder = products.filter(p => p.image === PLACEHOLDER_IMAGE).length;
    console.log(`Products with multiple categories: ${multiCat}`);
    console.log(`Products without brand: ${noBrand}`);
    console.log(`Products with image: ${withImage}`);
    console.log(`Products with placeholder: ${withPlaceholder}`);

    // Seed default settings (upsert to avoid duplicates)
    await Setting.findOneAndUpdate(
        { key: 'general' },
        { $setOnInsert: { key: 'general', minOrderTotal: 100 } },
        { upsert: true, new: true }
    );
    console.log('Default settings ensured (minOrderTotal: 100).');

    await mongoose.disconnect();
    console.log('Done!');
    process.exit(0);
};

seedData().catch(err => {
    console.error(err);
    process.exit(1);
});
