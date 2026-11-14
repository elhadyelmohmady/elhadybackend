import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import axios from 'axios';
import sharp from 'sharp';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Category from '../models/Category.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATEGORY_IMAGES_DIR = path.resolve(__dirname, '../assets/category_images');
const SERPER_API_KEY = '320b65da3d836119f04c1419792f610637fccf2e';

if (!fs.existsSync(CATEGORY_IMAGES_DIR)) {
    fs.mkdirSync(CATEGORY_IMAGES_DIR, { recursive: true });
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const CATEGORY_SEARCH_QUERIES = {
    'ادوات منزلية': [
        'مستلزمات نظافة وادوات منزلية مكنسة وجردل ومساحة',
        'cleaning supplies set broom mop bucket sponge tools',
        'ادوات منزلية نظافة'
    ],
    'اغراض للاحذية': [
        'ورنيش وفرشاة ملمع احذية كويك كيوي',
        'shoe polish brush cream care kit kiwi',
        'مستلزمات العناية بالاحذية'
    ],
    'البشرة والجسم': [
        'منتجات العناية بالبشرة والجسم لوشن كريم نيفيا دوف',
        'body skin care lotion cream moisturizer bottles',
        'العناية بالجسم والبشرة'
    ],
    'الحنه والصبغات': [
        'صبغات شعر وحنة غارنييه كولستون لوريال',
        'hair dye henna color box garnier loreal',
        'صبغة شعر وحنة'
    ],
    'برفان': [
        'عطور وبرفانات رجالي وحريمي زجاجة عطر فاخرة',
        'perfume fragrance bottle luxury set',
        'برفان عطر'
    ],
    'خامات': [
        'خامات كيماويات منظفات وصابون براميل تكسابون سلفونيك',
        'soap detergent raw materials chemicals',
        'خامات منظفات'
    ],
    'شاور ولوف استحمام': [
        'شاور جل ولوفة استحمام دوف بالدوليف نيفيا',
        'shower gel body wash bath sponge loofah',
        'شاور جل استحمام'
    ],
    'صابون للاطباق': [
        'صابون سائل غسيل الاطباق فيري بريل اوكسي',
        'dishwashing liquid soap bottle fairy pril',
        'صابون سائل اطباق'
    ],
    'صابون وغسول لليد': [
        'صابون سائل غسول اليدين ديتول لايفبوي لوكس',
        'liquid hand wash soap bottle pump dettol lux',
        'غسول اليدين صابون'
    ],
    'عناية شخصية': [
        'منتجات العناية الشخصية ديتول نيفيا مزيل عرق معجون',
        'personal care toiletries hygiene set essentials',
        'عناية شخصية'
    ],
    'عناية فم واسنان واذن': [
        'معجون وفرشاة اسنان كولجيت سنسوداين سيجنال وعيدان قطن',
        'toothpaste toothbrush oral dental care colgate sensodyne',
        'معجون وفرشاة اسنان'
    ],
    'عناية للمسنين': [
        'حفاضات كبار السن فاين كير تينيا بامبرز كبار سن',
        'adult diapers fine care tena elderly incontinence',
        'حفاضات كبار السن'
    ],
    'عناية ومنظفات للملابس': [
        'مسحوق ومنظف غسيل ملابس اريال برسيل جل اوكسي',
        'laundry detergent liquid wash persil ariel oxi',
        'منظفات الملابس والغسيل'
    ],
    'عنايه شعر': [
        'شامبو وبلسم شعر بانتين صنسيلك الفيف هيد اند شولدرز',
        'hair shampoo conditioner bottles pantene elvive',
        'شامبو عناية بالشعر'
    ],
    'فوط صحية': [
        'فوط صحية اولويز فام كوتكس سوفي',
        'sanitary pads always feminine hygiene cotton',
        'فوط صحية نسائية'
    ],
    'مبيدات حشرية': [
        'مبيد حشري ريد بف باف بايجون سبراي حشرات',
        'insecticide spray raid pif paf pest control',
        'مبيد حشرات ريد بف باف'
    ],
    'مساحيق': [
        'مسحوق غسيل اوتوماتيك اريال تايد اوكسي برسيل بونكس كيس',
        'laundry washing powder detergent pack ariel tide persil',
        'مسحوق غسيل ملابس'
    ],
    'مستحضرات': [
        'مستحضرات تجميل ومكياج وروج ماسكرا كريم اساس',
        'cosmetics makeup beauty products set foundation lipstick',
        'مستحضرات تجميل'
    ],
    'مستلزمات حلاقة وازالة الشعر': [
        'شفرات وفوم ماكينة حلاقة جيليت بلو نيفيا',
        'shaving razor foam gel gillette mach blades',
        'شفرات حلاقة وفوم'
    ],
    'مستلزمات للسيارات': [
        'شامبو غسيل سيارات وفوطة مايكروفايبر ومعطر سيارة ارما',
        'car care wash shampoo wax spray detailing kit microfiber',
        'مستلزمات غسيل سيارات'
    ],
    'معطرات وبخور': [
        'معطر جو فريدال جليد وبخور مبخرة عود',
        'air freshener spray room fridal glade incense oud',
        'معطر جو وبخور'
    ],
    'ملمع  زجاج واساس': [
        'ملمع زجاج وملمع خشب اثاث ويندكس بليدج فريدال سبراي',
        'glass cleaner furniture polish spray windex pledge',
        'ملمع زجاج واثاث'
    ],
    'مناديل مبلله ومعقمه': [
        'مناديل مبللة ومعقمة للاطفال ديتول ايزي وايبس كيرفري عبوة',
        'wet wipes disinfectant baby antibacterial wipes pack',
        'مناديل مبللة معقمة'
    ],
    'منتجات التعقيم والكحول': [
        'كحول طبي ايثيلي 70 ومطهر جل تعقيم ديتول هاند جيل',
        'medical alcohol 70 hand sanitizer gel antiseptic disinfectant',
        'كحول ومطهر تعقيم'
    ],
    'منتجات غسالات الاطباق': [
        'اقراص غسالات الاطباق فينيش فيري ملح وزيت وملمع صحون',
        'dishwasher tablets finish fairy all in one salt rinse aid',
        'اقراص غسالة اطباق فينيش'
    ],
    'منتجات وعناية للاطفال': [
        'شامبو ومنتجات اطفال جونسون بيبي زيت بودرة سيباميد',
        'baby care shampoo lotion oil powder johnson baby',
        'شامبو اطفال جونسون عناية'
    ],
    'منظفات': [
        'منظفات ومطهرات ارضيات كلوركس ديتول فلاش هاربيك جنرال',
        'cleaning supplies detergent bottles clorox dettol floor cleaner',
        'منظفات ومطهرات منزلية'
    ],
    'منعم ومعطرات للملابس': [
        'منعم ومعطر ملابس داوني كومفورت مركز عبوة',
        'fabric softener conditioner bottle downy comfort fabric care',
        'منعم ومعطر ملابس داوني'
    ],
    'ورقيات': [
        'مناديل ورقية فاين زينة بكر تواليت رول مطبخ علبة مناديل',
        'facial tissues box fine toilet paper rolls zeina kitchen towel',
        'مناديل ورقية فاين زينة'
    ]
};

async function searchGoogleImages(query) {
    try {
        const response = await axios.post('https://google.serper.dev/images', {
            q: query,
            gl: 'eg',
            hl: 'ar',
            num: 10
        }, {
            headers: {
                'X-API-KEY': SERPER_API_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        return response.data.images || [];
    } catch (err) {
        console.error(`  [Search Error for "${query}"]:`, err.message);
        return [];
    }
}

async function downloadAndProcessImage(url, outputPath) {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            }
        });

        const buffer = Buffer.from(response.data);

        // Process with sharp: resize inside 600x600, center on crisp white canvas
        await sharp(buffer)
            .resize(600, 600, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .webp({ quality: 85 })
            .toFile(outputPath);

        return true;
    } catch (err) {
        // failed this specific image url
        return false;
    }
}

async function run() {
    console.log('Connecting to MongoDB...');
    await connectDB();

    const categories = await Category.find({ deleteFlag: { $ne: 1 } }).sort({ name: 1 });
    console.log(`Found ${categories.length} non-deleted categories to process.\n`);

    let successCount = 0;
    let failedCategories = [];

    for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        const categoryName = cat.name.trim();
        const safeSlug = (cat.slug || categoryName).trim().replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '-');
        const filename = `category-${safeSlug}.webp`;
        const outputPath = path.join(CATEGORY_IMAGES_DIR, filename);
        const dbImagePath = `category_images/${filename}`;

        console.log(`[${i + 1}/${categories.length}] Processing: "${categoryName}" (Slug: ${cat.slug})`);

        const queries = CATEGORY_SEARCH_QUERIES[categoryName] || [
            `${categoryName} منتجات`,
            `${categoryName}`,
            `category ${cat.slug}`
        ];

        let saved = false;

        for (const query of queries) {
            console.log(`  Searching: "${query}"`);
            const images = await searchGoogleImages(query);
            console.log(`  Found ${images.length} image candidate(s)`);

            for (const img of images) {
                const imgUrl = img.imageUrl;
                if (!imgUrl || !imgUrl.startsWith('http')) continue;

                const success = await downloadAndProcessImage(imgUrl, outputPath);
                if (success) {
                    const stats = fs.statSync(outputPath);
                    console.log(`  ✅ Successfully downloaded & converted: ${filename} (${stats.size} bytes) from ${img.domain || imgUrl.substring(0, 30)}`);
                    saved = true;
                    break;
                }
            }

            if (saved) break;
            await sleep(500);
        }

        if (saved) {
            await Category.updateOne({ _id: cat._id }, { $set: { image: dbImagePath } });
            console.log(`  💾 Updated DB Category ${cat._id} -> image: "${dbImagePath}"\n`);
            successCount++;
        } else {
            console.error(`  ❌ Failed to download any valid image for: "${categoryName}"\n`);
            failedCategories.push(categoryName);
        }

        // small rate limit pause
        await sleep(800);
    }

    console.log('====================================');
    console.log(`Finished! Successfully processed: ${successCount}/${categories.length}`);
    if (failedCategories.length > 0) {
        console.log('Failed categories:', failedCategories);
    }
    console.log('====================================');

    await mongoose.disconnect();
    process.exit(failedCategories.length > 0 ? 1 : 0);
}

run().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
