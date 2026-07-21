import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Setting from '../models/Setting.js';
import SavedLocation from '../models/SavedLocation.js';
import User from '../models/User.js';
import { getUserAccountSummary, recordTransaction } from '../services/accountService.js';
import { notifyNewOrder, notifyOrderCancelled } from '../services/notificationService.js';

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

    // Support saved location ID, partial/full address object, or fallback default address
    if (locationId) {
        const savedLocation = await SavedLocation.findOne({ _id: locationId, user: customerId });
        if (!savedLocation) {
            return res.status(404).json({ message: 'العنوان المحفوظ غير موجود' });
        }
        orderAddress = {
            lat: savedLocation.lat ?? 0,
            lng: savedLocation.lng ?? 0,
            city: savedLocation.city || 'غير محدد',
            locationDetails: savedLocation.locationDetails || 'مقر العميل'
        };
    } else if (address) {
        orderAddress = {
            lat: typeof address.lat === 'number' ? address.lat : 0,
            lng: typeof address.lng === 'number' ? address.lng : 0,
            city: address.city || 'غير محدد',
            locationDetails: address.locationDetails || (typeof address === 'string' ? address : 'مقر العميل / استلام مباشر')
        };
    } else {
        orderAddress = {
            lat: 0,
            lng: 0,
            city: 'غير محدد',
            locationDetails: 'مقر العميل / استلام مباشر'
        };
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

    const requestedPaymentMethod = req.body.paymentMethod || 'cash_on_delivery';

    // Validate deferred / credit payment requirements
    if (requestedPaymentMethod === 'deferred' || requestedPaymentMethod === 'credit') {
        const summary = await getUserAccountSummary(customerId);
        if (!summary.user.isCreditAllowed) {
            return res.status(400).json({ message: 'عفواً، الدفع بالأجل غير مفعّل لحسابك' });
        }
        if (summary.user.creditLimit > 0) {
            const potentialBalance = summary.financials.currentBalance + total;
            if (potentialBalance > summary.user.creditLimit) {
                return res.status(400).json({
                    message: `تم تجاوز الحد الأقصى للائتمان/الأجل. الحد المسموح: ${summary.user.creditLimit} جنيه، الرصيد الحالي: ${summary.financials.currentBalance} جنيه، إجمالي الطلب: ${total} جنيه`
                });
            }
        }
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
        paymentMethod: requestedPaymentMethod,
        address: orderAddress,
        shippingType: shippingType || 'normal',
        estimatedDeliveryDays: deliveryDays
    });

    // Map Order paymentMethod enum → Transaction paymentMethod enum
    const paymentMethodMap = {
        cash_on_delivery: 'cash',
        credit: 'deferred',
        deferred: 'deferred',
        online: 'online',
        bank_transfer: 'bank_transfer',
    };
    const transactionPaymentMethod = paymentMethodMap[requestedPaymentMethod] || 'other';

    // Log financial ledger transaction for the user
    await recordTransaction({
        userId: customerId,
        type: 'order_debit',
        amount: total,
        orderId: order._id,
        paymentMethod: transactionPaymentMethod,
        transactionDate: order.createdAt,
        notes: `طلب جديد رقم #${order._id} (${requestedPaymentMethod === 'deferred' || requestedPaymentMethod === 'credit' ? 'آجل' : 'نقدي'})`
    });

    // Populate for response
    const populated = await Order.findById(order._id)
        .populate('items.product', 'name image price')
        .populate('customer', 'fullName phoneNumber username');

    // Trigger Telegram and In-App notification
    notifyNewOrder(populated, populated.customer).catch(err => {
        console.error('Error triggering new order notification:', err.message);
    });

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
            .sort({ createdAt: -1, _id: 1 })
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

    // Revert debt in user account ledger
    await recordTransaction({
        userId: req.user._id,
        type: 'adjustment_credit',
        amount: order.total,
        orderId: order._id,
        notes: `إلغاء الطلب رقم #${order._id}`
    });

    // Trigger Telegram notification
    notifyOrderCancelled(order, req.user, 'العميل').catch(err => {
        console.error('Error triggering order cancelled notification:', err.message);
    });

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
