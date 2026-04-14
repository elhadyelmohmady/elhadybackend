import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Setting from '../models/Setting.js';
import SavedLocation from '../models/SavedLocation.js';

// Shipping types with delivery day ranges
const SHIPPING_TYPES = {
    normal: { min: 3, max: 5, label: 'عادي (3-5 أيام)' },
    express: { min: 1, max: 2, label: 'سريع (1-2 يوم)' }
};

export const createOrder = async (req, res) => {
    const { items, address, locationId, shippingType } = req.body;
    const customerId = req.user._id;

    let orderAddress;
    let deliveryDays;

    // Get shipping type and delivery days
    const selectedShipping = shippingType ? SHIPPING_TYPES[shippingType] : SHIPPING_TYPES.normal;
    if (!selectedShipping) {
        return res.status(400).json({ message: 'نوع الشحن غير صالح' });
    }
    deliveryDays = { min: selectedShipping.min, max: selectedShipping.max };

    // Support both saved location ID and full address object
    if (locationId) {
        const savedLocation = await SavedLocation.findOne({ _id: locationId, user: customerId });
        if (!savedLocation) {
            return res.status(404).json({ message: 'العنوان المحفوظ غير موجود' });
        }
        orderAddress = {
            lat: savedLocation.lat,
            lng: savedLocation.lng,
            city: savedLocation.city,
            locationDetails: savedLocation.locationDetails
        };
    } else if (address && address.lat && address.lng && address.city && address.locationDetails) {
        orderAddress = address;
    } else {
        return res.status(400).json({ message: 'العنوان مطلوب (خط الطول، دائرة العرض، المدينة، تفاصيل الموقع)' });
    }

    // Fetch all requested products
    const productIds = items.map(i => i.product);
    const products = await Product.find({ _id: { $in: productIds } }).lean();

    if (products.length !== productIds.length) {
        const foundIds = new Set(products.map(p => p._id.toString()));
        const missing = productIds.filter(id => !foundIds.has(id));
        return res.status(400).json({ message: 'بعض المنتجات غير موجودة', missing });
    }

    const productMap = new Map(products.map(p => [p._id.toString(), p]));
    const errors = [];

    // Validate quantity limits and stock
    for (const item of items) {
        const product = productMap.get(item.product);
        if (item.quantity < product.minOrderQty) {
            errors.push(`${product.name}: الحد الأدنى للطلب ${product.minOrderQty}`);
        }
        if (item.quantity > product.maxOrderQty) {
            errors.push(`${product.name}: الحد الأقصى للطلب ${product.maxOrderQty}`);
        }
        if (item.quantity > product.stock) {
            errors.push(`${product.name}: الكمية المتوفرة ${product.stock} فقط`);
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ message: 'خطأ في الكميات', errors });
    }

    // Build order items with server-side prices and calculate total
    const orderItems = items.map(item => {
        const product = productMap.get(item.product);
        return { product: product._id, quantity: item.quantity, price: product.price };
    });

    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Check minimum order total
    const settings = await Setting.findOne({ key: 'general' }).lean();
    const minOrderTotal = settings?.minOrderTotal || 0;
    if (total < minOrderTotal) {
        return res.status(400).json({
            message: `الحد الأدنى لقيمة الطلب ${minOrderTotal} جنيه. إجمالي طلبك: ${total} جنيه`
        });
    }

    // Atomically deduct stock — filter ensures we don't go negative
    const bulkOps = orderItems.map(item => ({
        updateOne: {
            filter: { _id: item.product, stock: { $gte: item.quantity } },
            update: { $inc: { stock: -item.quantity } }
        }
    }));
    const bulkResult = await Product.bulkWrite(bulkOps);

    if (bulkResult.modifiedCount !== orderItems.length) {
        // Rollback any successful deductions
        const rollbackOps = orderItems.map(item => ({
            updateOne: {
                filter: { _id: item.product },
                update: { $inc: { stock: item.quantity } }
            }
        }));
        await Product.bulkWrite(rollbackOps);
        return res.status(409).json({ message: 'تغيرت الكميات المتوفرة، يرجى المحاولة مرة أخرى' });
    }

    // Increment totalOrdered for each product
    const incrementOps = orderItems.map(item => ({
        updateOne: {
            filter: { _id: item.product },
            update: { $inc: { totalOrdered: item.quantity } }
        }
    }));
    await Product.bulkWrite(incrementOps);

    const order = await Order.create({
        customer: customerId,
        items: orderItems,
        total,
        status: 'pending',
        paymentMethod: req.body.paymentMethod || 'cash_on_delivery',
        address: orderAddress,
        shippingType: shippingType || 'normal',
        estimatedDeliveryDays: deliveryDays
    });

    // Populate for response
    const populated = await Order.findById(order._id)
        .populate('items.product', 'name image price')
        .populate('customer', 'fullName phoneNumber');

    res.status(201).json({
        message: 'تم إنشاء الطلب بنجاح',
        data: {
            _id: populated._id,
            customer: populated.customer,
            items: populated.items,
            total: populated.total,
            status: populated.status,
            paymentMethod: populated.paymentMethod,
            address: populated.address,
            shippingType: populated.shippingType,
            estimatedDeliveryDays: populated.estimatedDeliveryDays,
            createdAt: populated.createdAt,
            updatedAt: populated.updatedAt
        }
    });
};

export const getMyOrders = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [orders, count] = await Promise.all([
        Order.find({ customer: req.user._id })
            .populate('items.product', 'name image price')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Order.countDocuments({ customer: req.user._id })
    ]);

    res.json({
        count,
        pagination: { page, limit, pages: Math.ceil(count / limit) },
        data: orders.map(order => ({
            _id: order._id,
            customer: order.customer,
            items: order.items,
            total: order.total,
            status: order.status,
            paymentMethod: order.paymentMethod,
            address: order.address,
            shippingType: order.shippingType,
            estimatedDeliveryDays: order.estimatedDeliveryDays,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        }))
    });
};

export const getOrderById = async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, customer: req.user._id })
        .populate('items.product', 'name image price brand')
        .populate('customer', 'fullName phoneNumber');

    if (!order) {
        return res.status(404).json({ message: 'الطلب غير موجود' });
    }

    res.json({
        data: {
            _id: order._id,
            customer: order.customer,
            items: order.items,
            total: order.total,
            status: order.status,
            paymentMethod: order.paymentMethod,
            address: order.address,
            shippingType: order.shippingType,
            estimatedDeliveryDays: order.estimatedDeliveryDays,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        }
    });
};

export const cancelOrder = async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });

    if (!order) {
        return res.status(404).json({ message: 'الطلب غير موجود' });
    }

    if (order.status !== 'pending') {
        return res.status(400).json({ message: 'لا يمكن إلغاء الطلب إلا إذا كان في حالة انتظار' });
    }

    order.status = 'cancelled';
    await order.save(); // pre-save hook restores stock

    res.json({ message: 'تم إلغاء الطلب بنجاح', data: order });
};

export const getOrderSettings = async (req, res) => {
    const settings = await Setting.findOne({ key: 'general' }).lean();
    res.json({
        data: {
            minOrderTotal: settings?.minOrderTotal || 0,
            shippingTypes: Object.entries(SHIPPING_TYPES).map(([key, value]) => ({
                type: key,
                ...value
            }))
        }
    });
};
