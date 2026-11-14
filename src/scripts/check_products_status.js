import '../config/initMongoose.js';
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';

async function main() {
    await mongoose.connect('mongodb://localhost:27017/mobile_db');

    // 1. Check all products in collection
    const allRaw = await Product.collection.find({}).toArray();
    console.log(`Total products in collection: ${allRaw.length}`);

    // Check categories and brands existence
    const allCategories = await Category.collection.find({}).toArray();
    const activeCatIds = new Set(allCategories.filter(c => c.deleteFlag !== 1).map(c => c._id.toString()));
    const allCatIds = new Set(allCategories.map(c => c._id.toString()));

    const allBrands = await Brand.collection.find({}).toArray();
    const activeBrandIds = new Set(allBrands.filter(b => b.deleteFlag !== 1).map(b => b._id.toString()));
    const allBrandIds = new Set(allBrands.map(b => b._id.toString()));

    // Categorize products
    let activeProducts = [];
    let deletedProducts = [];

    for (const p of allRaw) {
        const isDeleted = p.deleteFlag === 1;
        const brandId = p.brand ? p.brand.toString() : null;
        const hasValidActiveBrand = brandId && activeBrandIds.has(brandId);
        const hasAnyBrand = brandId && allBrandIds.has(brandId);

        const catIds = (p.categories || []).map(c => c.toString());
        const activeCats = catIds.filter(c => activeCatIds.has(c));
        const allCats = catIds.filter(c => allCatIds.has(c));

        const info = {
            id: p._id,
            local_id: p.local_id,
            name: p.name,
            price: p.price,
            stock: p.stock,
            deleteFlag: p.deleteFlag,
            hasValidActiveBrand,
            hasAnyBrand,
            brandId,
            activeCatsCount: activeCats.length,
            allCatsCount: allCats.length,
            rawCatsCount: catIds.length
        };

        if (isDeleted) {
            deletedProducts.push(info);
        } else {
            activeProducts.push(info);
        }
    }

    console.log(`Active products: ${activeProducts.length}`);
    console.log(`Deleted products: ${deletedProducts.length}`);

    // Active stats
    const activeNoBrand = activeProducts.filter(p => !p.hasValidActiveBrand);
    const activeNoCat = activeProducts.filter(p => p.activeCatsCount === 0);
    const activeNeither = activeProducts.filter(p => !p.hasValidActiveBrand && p.activeCatsCount === 0);
    const activeNoBrandOrNoCat = activeProducts.filter(p => !p.hasValidActiveBrand || p.activeCatsCount === 0);

    console.log('\n--- ACTIVE PRODUCTS STATS ---');
    console.log(`Without Brand: ${activeNoBrand.length}`);
    console.log(`Without Category: ${activeNoCat.length}`);
    console.log(`Without Brand AND Without Category: ${activeNeither.length}`);
    console.log(`Without Brand OR Without Category: ${activeNoBrandOrNoCat.length}`);

    if (activeNeither.length > 0) {
        console.log('\nProducts with NEITHER brand nor category:');
        console.log(JSON.stringify(activeNeither, null, 2));
    }

    if (activeNoCat.length > 0 && activeNoCat.length !== activeNeither.length) {
        console.log('\nProducts without category:');
        console.log(JSON.stringify(activeNoCat, null, 2));
    }

    // All products stats
    const allNoBrand = allRaw.filter(p => !p.brand || !allBrandIds.has(p.brand.toString()));
    const allNoCat = allRaw.filter(p => !p.categories || p.categories.length === 0 || !p.categories.some(c => allCatIds.has(c.toString())));
    const allNeither = allRaw.filter(p => (!p.brand || !allBrandIds.has(p.brand.toString())) && (!p.categories || p.categories.length === 0 || !p.categories.some(c => allCatIds.has(c.toString()))));
    const allNoBrandOrNoCat = allRaw.filter(p => (!p.brand || !allBrandIds.has(p.brand.toString())) || (!p.categories || p.categories.length === 0 || !p.categories.some(c => allCatIds.has(c.toString()))));

    console.log('\n--- ALL PRODUCTS (INCL DELETED) STATS ---');
    console.log(`Without Brand: ${allNoBrand.length}`);
    console.log(`Without Category: ${allNoCat.length}`);
    console.log(`Without Brand AND Without Category: ${allNeither.length}`);
    console.log(`Without Brand OR Without Category: ${allNoBrandOrNoCat.length}`);

    await mongoose.disconnect();
}

main().catch(console.error);
