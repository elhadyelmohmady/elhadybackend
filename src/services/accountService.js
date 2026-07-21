import Transaction from '../models/Transaction.js';
import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

/**
 * Calculates current balance and financial metrics for a specific user
 * @param {string|ObjectId} userId 
 */
export const getUserAccountSummary = async (userId) => {
    const user = await User.findById(userId).select('username fullName phoneNumber creditLimit isCreditAllowed createdAt');
    if (!user) {
        throw new Error('المستخدم غير موجود');
    }

    const stats = await Transaction.aggregate([
        { $match: { user: user._id } },
        {
            $group: {
                _id: '$type',
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        }
    ]);

    let totalDebit = 0;   // المسحوبات والطلبك والديون (مدين)
    let totalCredit = 0;  // المدفوعات والتسويات (دائن)

    stats.forEach(item => {
        if (item._id === 'order_debit' || item._id === 'adjustment_debit') {
            totalDebit += item.totalAmount;
        } else if (item._id === 'payment_credit' || item._id === 'adjustment_credit') {
            totalCredit += item.totalAmount;
        }
    });

    const currentBalance = totalDebit - totalCredit;

    // Account status label
    let accountStatus = 'balanced'; // خالص
    if (currentBalance > 0) {
        accountStatus = 'in_debt'; // عليه دَين
    } else if (currentBalance < 0) {
        accountStatus = 'overpaid'; // له رصيد دائن
    }

    const availableCredit = user.isCreditAllowed 
        ? Math.max(0, user.creditLimit - currentBalance)
        : 0;

    return {
        user: {
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            creditLimit: user.creditLimit || 0,
            isCreditAllowed: user.isCreditAllowed ?? true,
            availableCredit
        },
        financials: {
            totalDebit,           // إجمالي المسحوبات/الطلبات
            totalCredit,          // إجمالي المدفوعات
            currentBalance,       // الرصيد الحالي (المستحق عليه)
            accountStatus        // حالة الحساب
        }
    };
};

/**
 * Records a new financial ledger transaction for a user and updates balance
 */
export const recordTransaction = async ({
    userId,
    type,
    amount,
    orderId = null,
    paymentId = null,
    paymentMethod = 'cash',
    transactionDate = new Date(),
    recordedById = null,
    notes = ''
}) => {
    const summary = await getUserAccountSummary(userId);
    const previousBalance = summary.financials.currentBalance;

    let balanceAfter = previousBalance;
    if (type === 'order_debit' || type === 'adjustment_debit') {
        balanceAfter += amount;
    } else if (type === 'payment_credit' || type === 'adjustment_credit') {
        balanceAfter -= amount;
    }

    const transaction = await Transaction.create({
        user: userId,
        type,
        amount,
        balanceAfter,
        order: orderId,
        payment: paymentId,
        paymentMethod,
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
        recordedBy: recordedById,
        notes: notes ? notes.trim() : ''
    });

    return transaction;
};

/**
 * Process payment for user (either general or tied to specific order) with custom date support
 */
export const processUserPayment = async ({
    userId,
    amount,
    orderId = null,
    paymentMethod = 'cash',
    paymentDate = new Date(),
    recordedById = null,
    notes = ''
}) => {
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
        throw new Error('مبلغ الدفع يجب أن يكون أكبر من 0');
    }

    const customDate = paymentDate ? new Date(paymentDate) : new Date();

    // 1. Create Payment record
    const payment = await Payment.create({
        user: userId,
        order: orderId || null,
        amount: numericAmount,
        paymentMethod,
        paymentDate: customDate,
        recordedBy: recordedById,
        notes: notes ? notes.trim() : ''
    });

    // 2. Allocate payment to order(s)
    if (orderId) {
        const order = await Order.findOne({ _id: orderId, customer: userId });
        if (order) {
            await order.updatePaidAmount(numericAmount);
        }
    } else {
        // Auto-allocate payment to oldest unpaid or partially paid orders
        let remainingPayment = numericAmount;
        const openOrders = await Order.find({
            customer: userId,
            status: { $in: ['pending', 'partially_paid', 'processing', 'shipped'] }
        }).sort({ createdAt: 1 });

        for (const order of openOrders) {
            if (remainingPayment <= 0) break;
            const remainingOrderAmount = order.total - (order.paidAmount || 0);
            if (remainingOrderAmount > 0) {
                const allocation = Math.min(remainingPayment, remainingOrderAmount);
                await order.updatePaidAmount(allocation);
                remainingPayment -= allocation;
            }
        }
    }

    // 3. Record transaction ledger entry
    const transaction = await recordTransaction({
        userId,
        type: 'payment_credit',
        amount: numericAmount,
        orderId,
        paymentId: payment._id,
        paymentMethod,
        transactionDate: customDate,
        recordedById,
        notes: notes || (orderId ? `سداد للطلب رقم #${orderId}` : 'سداد حساب عام')
    });

    return { payment, transaction };
};
