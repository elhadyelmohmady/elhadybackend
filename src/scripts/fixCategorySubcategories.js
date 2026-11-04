import dotenv from 'dotenv';
dotenv.config();

import '../config/initMongoose.js';
import connectDB from '../config/db.js';
import Category from '../models/Category.js';

const mappings = [
    // Under: مستحضرات و عنايه شخصيه
    {
        parentPattern: /^مستحضرات و عنايه شخصيه$|^مستحضرات$/i,
        children: [
            /^مزيل عرق/i,
            /^مستلزمات حلاقه و ازالة شعر/i,
            /^عنايه بالفم و اسنان و اذن|^عنايةفم|^عناية للفم/i,
            /^عنايه بالبشره/i,
            /^عنايه بالشعر/i,
            /^عنايه بالجسم/i,
            /^عناية شخصية$/i,
            /^برفان$/i
        ]
    },
    // Under: سوائل و عنايه بالمنزل
    {
        parentPattern: /^سوائل و عنايه بالمنزل$|^سوائل$/i,
        children: [
            /^ملمع زجاج|^ملمعات الزجاج|^منظفات الزجاج/i,
            /^منظف اطباق|^صابون للصحون|^منتجات غسالات الاطباق/i,
            /^منظف ارضيات/i,
            /^منظف حمامات/i,
            /^لوازم مطابخ/i,
            /^معطرات جو|^معطرات$/i,
            /^منعم$/i,
            /^منظفات$/i
        ]
    },
    // Under: ورقيات
    {
        parentPattern: /^ورقيات$/i,
        children: [
            /^فوط صحية/i,
            /^منديل مبلله|^مبللات/i
        ]
    },
    // Under: ادوات منزلية
    {
        parentPattern: /^ادوات منزلية$/i,
        children: [
            /^خردوات$/i
        ]
    },
    // Under: خردوات
    {
        parentPattern: /^خردوات$/i,
        children: [
            /^عنايه بالاحذيه|^اغراض للاحذية|^اغراض احذيه/i,
            /^منتجات للسيارات/i
        ]
    }
];

async function run() {
    await connectDB();
    console.log('--- Fixing Category and Subcategory Links ---');

    for (const map of mappings) {
        const parent = await Category.findOne({ name: map.parentPattern, deleteFlag: { $ne: 1 } });
        if (!parent) {
            console.log(`Parent not found for pattern: ${map.parentPattern}`);
            continue;
        }

        console.log(`\nParent: "${parent.name}" (${parent._id})`);

        for (const childPattern of map.children) {
            const children = await Category.find({
                name: childPattern,
                _id: { $ne: parent._id },
                deleteFlag: { $ne: 1 }
            });

            for (const child of children) {
                child.parentCategory = parent._id;
                if (!child.description) child.description = child.name;
                await child.save();
                console.log(`  -> Linked Subcategory: "${child.name}" (${child._id}) to parent "${parent.name}"`);
            }
        }
    }

    console.log('\n--- Verification ---');
    const parents = await Category.find({ parentCategory: null, deleteFlag: { $ne: 1 } })
        .populate('subcategories', 'name slug');

    for (const p of parents) {
        if (p.subcategories && p.subcategories.length > 0) {
            console.log(`📁 ${p.name} has ${p.subcategories.length} subcategories:`);
            p.subcategories.forEach(sub => console.log(`   └─ 📄 ${sub.name}`));
        }
    }

    process.exit(0);
}

run().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
