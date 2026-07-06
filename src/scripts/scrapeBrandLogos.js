import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import axios from 'axios';
import sharp from 'sharp';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGOS_DIR = path.resolve(__dirname, '../assets/brand_logos');
const SERPER_API_KEY = '320b65da3d836119f04c1419792f610637fccf2e';

// Ensure logos directory exists
if (!fs.existsSync(LOGOS_DIR)) {
    fs.mkdirSync(LOGOS_DIR, { recursive: true });
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Search Google Images via Serper API for a brand logo
 */
const searchBrandLogo = async (brandName, sampleProductName) => {
    // Use the product name to help identify the real company behind the brand
    const query = `لوجو شركة ${brandName} logo`;

    try {
        const response = await axios.post('https://google.serper.dev/images', {
            q: query,
            gl: 'eg',
            hl: 'ar',
            num: 5
        }, {
            headers: {
                'X-API-KEY': SERPER_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        const images = response.data.images || [];
        if (images.length === 0) return null;

        // Pick the first image that looks like a logo (prefer smaller/square images)
        return images[0]?.imageUrl || null;
    } catch (error) {
        console.error(`  Serper search failed for "${brandName}":`, error.message);
        return null;
    }
};

/**
 * Download image and convert to WebP
 */
const downloadAndConvert = async (url, outputPath) => {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        });

        await sharp(Buffer.from(response.data))
            .resize(256, 256, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
            .webp({ quality: 80 })
            .toFile(outputPath);

        return true;
    } catch (error) {
        console.error(`  Download/convert failed: ${error.message}`);
        return false;
    }
};

const scrapeBrandLogos = async () => {
    await connectDB();

    const brands = await Brand.find({}).lean();
    console.log(`Found ${brands.length} brands to process`);

    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (const brand of brands) {
        const safeName = brand.name.replace(/[/\\?%*:|"<>]/g, '-');
        const outputPath = path.join(LOGOS_DIR, `${safeName}.webp`);
        const logoPath = `brand_logos/${safeName}.webp`;

        // Skip if already has a logo file
        if (fs.existsSync(outputPath)) {
            console.log(`[SKIP] ${brand.name} — logo already exists`);
            await Brand.updateOne({ _id: brand._id }, { $set: { logo: logoPath } });
            skipped++;
            continue;
        }

        // Get a sample product name for this brand to improve search
        const sampleProduct = await Product.findOne({ brand: brand._id }).lean();
        const sampleName = sampleProduct?.name || '';

        console.log(`[SEARCH] ${brand.name} (sample: "${sampleName}")`);

        const imageUrl = await searchBrandLogo(brand.name, sampleName);

        if (!imageUrl) {
            console.log(`  ❌ No image found`);
            failed++;
            await sleep(500);
            continue;
        }

        console.log(`  Found: ${imageUrl.substring(0, 80)}...`);
        const downloaded = await downloadAndConvert(imageUrl, outputPath);

        if (downloaded) {
            await Brand.updateOne({ _id: brand._id }, { $set: { logo: logoPath } });
            console.log(`  ✅ Saved & updated DB`);
            success++;
        } else {
            failed++;
        }

        // Rate limit: wait between requests
        await sleep(1000);
    }

    console.log(`\n--- Results ---`);
    console.log(`Success: ${success}`);
    console.log(`Failed: ${failed}`);
    console.log(`Skipped (already existed): ${skipped}`);
    console.log(`Total: ${brands.length}`);

    await mongoose.disconnect();
    console.log('Done!');
    process.exit(0);
};

scrapeBrandLogos().catch(err => {
    console.error(err);
    process.exit(1);
});
