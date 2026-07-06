import Product from '../models/Product.js';

/**
 * Bulk upsert products based on local_id
 * POST /api/sync/products
 */
export const syncProducts = async (req, res) => {
    const products = req.body;

    const operations = products.map(product => ({
        updateOne: {
            filter: { local_id: product.local_id },
            update: { $set: product },
            upsert: true
        }
    }));

    const result = await Product.bulkWrite(operations);

    res.status(200).json({
        success: true,
        data: {
            matchedCount: result.matchedCount,
            upsertedCount: result.upsertedCount,
            modifiedCount: result.modifiedCount
        }
    });
};
