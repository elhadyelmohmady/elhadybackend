import dotenv from 'dotenv';
dotenv.config();

import '../config/initMongoose.js';
import connectDB from '../config/db.js';
import Company from '../models/Company.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import Admin from '../models/Admin.js';

const companiesData = [
    {
        name: 'يونيليفر (Unilever)',
        slug: 'unilever',
        description: 'شركة يونيليفر العالمية للسلع الاستهلاكية ومنتجات العناية الشخصية والمنزلية',
        brandNames: ['دوف', 'دووف', 'لايف بوي', 'كمفورت', 'فازلين', 'صن سيلك', 'صن-سيلك', 'سيجنال', 'لوكس', 'اكس', 'دورو', 'كلوز اب']
    },
    {
        name: 'بروكتر آند غامبل (P&G)',
        slug: 'pg',
        description: 'شركة بروكتر آند غامبل العالمية لمساحيق الغسيل والعناية الشخصية والأطفال',
        brandNames: ['اريال', 'تايد', 'بونكس', 'داوني', 'فيري', 'بامبرز', 'هيد', 'بانتين', 'اولويز', 'جيليت', 'اورال بي', 'اورال-بي']
    },
    {
        name: 'هنكل (Henkel)',
        slug: 'henkel',
        description: 'شركة هنكل الألمانية للمنظفات ومنتجات العناية بالملابس والمنزل',
        brandNames: ['برسيل', 'بريل', 'باهي']
    },
    {
        name: 'دابر إيجيبت (Dabur)',
        slug: 'dabur',
        description: 'شركة دابر العالمية المتخصصة في منتجات العناية بالشعر والصحة الطبيعية',
        brandNames: ['دابر', 'فاتيكا']
    },
    {
        name: 'إيفا لمستحضرات التجميل (Eva Cosmetics)',
        slug: 'eva-cosmetics',
        description: 'شركة إيفا لمستحضرات العناية الشخصية والجلدية والشعر',
        brandNames: ['ايفا', 'سيلفر']
    },
    {
        name: 'مجموعة فاين الصحية (Fine Hygienic Holding)',
        slug: 'fine',
        description: 'مجموعة فاين للورقيات الصحية وحفاضات الأطفال ومنتجات الحماية',
        brandNames: ['فاين']
    },
    {
        name: 'آرما للصناعات (Arma)',
        slug: 'arma',
        description: 'شركة آرما للمنظفات ومساحيق الغسيل والزيوت',
        brandNames: ['اوكسي']
    },
    {
        name: 'مجموعة زينة (Zeina Group)',
        slug: 'zeina-group',
        description: 'مجموعة زينة للورقيات ومنتجات النظافة المنزلية',
        brandNames: ['زينه']
    }
];

async function seed() {
    await connectDB();
    console.log('--- Starting Companies Seeding & Linking ---');

    for (const compData of companiesData) {
        // Find brands matching any of the names
        const regexPatterns = compData.brandNames.map(b => new RegExp(`^${b}$|^${b}[\\s.]`, 'i'));
        const matchedBrands = await Brand.find({
            name: { $in: regexPatterns },
            deleted: { $ne: true }
        });

        const brandIds = matchedBrands.map(b => b._id);

        // Find products belonging to these brands
        const matchedProducts = await Product.find({
            brand: { $in: brandIds },
            deleted: { $ne: true }
        });

        // Collect all distinct category IDs from brands and products
        const categorySet = new Set();
        matchedBrands.forEach(b => (b.categories || []).forEach(c => categorySet.add(c.toString())));
        matchedProducts.forEach(p => (p.categories || []).forEach(c => categorySet.add(c.toString())));
        const categoryIds = Array.from(categorySet);

        // Upsert company
        let company = await Company.findOne({
            $or: [{ name: compData.name }, { slug: compData.slug }]
        });

        if (!company) {
            company = new Company({
                name: compData.name,
                slug: compData.slug,
                description: compData.description,
                brands: brandIds,
                categories: categoryIds,
                isActive: true
            });
        } else {
            company.slug = compData.slug;
            company.brands = brandIds;
            company.categories = categoryIds;
            company.description = compData.description;
            company.isActive = true;
        }

        await company.save();

        // Update brands to reference this company
        if (brandIds.length > 0) {
            await Brand.updateMany(
                { _id: { $in: brandIds } },
                { $set: { company: company._id } }
            );
        }

        // Update products to reference this company
        if (brandIds.length > 0) {
            await Product.updateMany(
                { brand: { $in: brandIds } },
                { $set: { company: company._id } }
            );
        }

        console.log(`✅ Company "${company.name}": Linked ${matchedBrands.length} brands, ${matchedProducts.length} products, ${categoryIds.length} categories.`);
        console.log(`   Brands: ${matchedBrands.map(b => b.name).join(', ')}`);
    }

    // Update super_admin permissions
    const updateResult = await Admin.updateMany(
        { role: 'super_admin' },
        {
            $set: {
                'permissions.viewCompanies': true,
                'permissions.manageCompanies': true
            }
        }
    );
    console.log(`Updated permissions for ${updateResult.modifiedCount} super_admin accounts.`);

    console.log('--- Seeding Completed Successfully ---');
    process.exit(0);
}

seed().catch(err => {
    console.error('Seeding error:', err);
    process.exit(1);
});
