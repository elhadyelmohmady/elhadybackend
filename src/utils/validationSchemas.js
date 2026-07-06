import { z } from 'zod';

export const productSyncSchema = z.object({
    body: z.array(z.object({
        local_id: z.string().min(1),
        name: z.string().min(1),
        price: z.number().min(0),
        stock: z.number().int().min(0),
        category: z.string().min(1),
        metadata: z.record(z.any()).optional()
    })).min(1)
});

export const createOrderSchema = z.object({
    body: z.object({
        items: z.array(z.object({
            product: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
            quantity: z.number().int().min(1)
        })).min(1, 'Order must have at least one item'),
        paymentMethod: z.enum(['cash_on_delivery']).optional().default('cash_on_delivery')
    })
});

export const orderQuerySchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10')
    })
});

export const productQuerySchema = z.object({
    query: z.object({
        q: z.string().optional(),
        category: z.string().optional(),
        brand: z.string().optional(),
        sort: z.enum(['price_asc', 'price_desc', 'most_ordered', 'name_asc', 'name_desc']).optional(),
        page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10')
    })
});
