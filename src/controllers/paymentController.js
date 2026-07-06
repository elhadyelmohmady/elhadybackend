import Payment from '../models/Payment.js';
import Order from '../models/Order.js';

// Record a payment for an order (Admin only)
export const recordPayment = async (req, res) => {
    const { orderId, amount, notes } = req.body;
    const adminId = req.admin._id;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }

        if (order.status === 'cancelled') {
            return res.status(400).json({ message: 'لا يمكن تسجيل دفع لطلب ملغى' });
        }

        const remainingAmount = order.total - order.paidAmount;
        if (amount <= 0 || amount > remainingAmount) {
            return res.status(400).json({
                message: `المبلغ غير صالح. المتبقي: ${remainingAmount} جنيه`
            });
        }

        // Create payment record
        const payment = await Payment.create({
            order: orderId,
            amount,
            recordedBy: adminId,
            notes: notes?.trim()
        });

        // Update order paid amount and status
        await order.updatePaidAmount(amount);

        // Populate payment for response
        const populatedPayment = await Payment.findById(payment._id)
            .populate('recordedBy', 'username fullName');

        res.status(201).json({
            message: 'تم تسجيل الدفع بنجاح',
            data: {
                _id: populatedPayment._id,
                order: populatedPayment.order,
                amount: populatedPayment.amount,
                paymentDate: populatedPayment.paymentDate,
                recordedBy: populatedPayment.recordedBy,
                notes: populatedPayment.notes,
                createdAt: populatedPayment.createdAt
            },
            order: {
                _id: order._id,
                total: order.total,
                paidAmount: order.paidAmount,
                remainingAmount: order.total - order.paidAmount,
                status: order.status
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'حدث خطأ أثناء تسجيل الدفع', error: error.message });
    }
};

// Get all payments for a specific order (User & Admin)
export const getOrderPayments = async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }

        // Check authorization
        if (req.user && req.admin) {
            // Admin can view all
        } else if (req.user && !req.admin) {
            if (order.customer.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'غير مصرح لك' });
            }
        } else {
            return res.status(401).json({ message: 'غير مصرح لك' });
        }

        const payments = await Payment.find({ order: orderId })
            .populate('recordedBy', 'username fullName')
            .sort({ paymentDate: -1 });

        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const remaining = order.total - totalPaid;

        res.json({
            order: {
                _id: order._id,
                total: order.total,
                paidAmount: totalPaid,
                remainingAmount: remaining,
                status: order.status
            },
            payments: payments.map(p => ({
                _id: p._id,
                amount: p.amount,
                paymentDate: p.paymentDate,
                recordedBy: p.recordedBy,
                notes: p.notes,
                createdAt: p.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({ message: 'حدث خطأ أثناء جلب الدفعات', error: error.message });
    }
};

// Get all payments (Admin only - for dashboard)
export const getAllPayments = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    try {
        const [payments, count] = await Promise.all([
            Payment.find()
                .populate('order', 'total status customer')
                .populate('recordedBy', 'username fullName')
                .sort({ paymentDate: -1 })
                .skip(skip)
                .limit(limit),
            Payment.countDocuments()
        ]);

        res.json({
            count,
            pagination: { page, limit, pages: Math.ceil(count / limit) },
            data: payments.map(p => ({
                _id: p._id,
                order: {
                    _id: p.order._id,
                    total: p.order.total,
                    status: p.order.status
                },
                amount: p.amount,
                paymentDate: p.paymentDate,
                recordedBy: p.recordedBy,
                notes: p.notes,
                createdAt: p.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({ message: 'حدث خطأ أثناء جلب الدفعات', error: error.message });
    }
};

// Get user's all payments across all orders
export const getMyPayments = async (req, res) => {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    try {
        // Get all user's orders first
        const userOrders = await Order.find({ customer: userId }).select('_id');
        const orderIds = userOrders.map(o => o._id);

        if (orderIds.length === 0) {
            return res.json({
                count: 0,
                pagination: { page, limit, pages: 0 },
                data: []
            });
        }

        const [payments, count] = await Promise.all([
            Payment.find({ order: { $in: orderIds } })
                .populate('order', 'total status')
                .populate('recordedBy', 'username fullName')
                .sort({ paymentDate: -1 })
                .skip(skip)
                .limit(limit),
            Payment.countDocuments({ order: { $in: orderIds } })
        ]);

        res.json({
            count,
            pagination: { page, limit, pages: Math.ceil(count / limit) },
            data: payments.map(p => ({
                _id: p._id,
                order: {
                    _id: p.order._id,
                    total: p.order.total,
                    status: p.order.status
                },
                amount: p.amount,
                paymentDate: p.paymentDate,
                recordedBy: p.recordedBy,
                notes: p.notes,
                createdAt: p.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({ message: 'حدث خطأ أثناء جلب الدفعات', error: error.message });
    }
};
