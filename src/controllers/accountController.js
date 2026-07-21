import User from '../models/User.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import Transaction from '../models/Transaction.js';
import {
    getUserAccountSummary as getSummaryService,
    processUserPayment,
    recordTransaction
} from '../services/accountService.js';

// @desc    Get logged in user's account financial summary
// @route   GET /api/accounts/my-account
// @access  Private (User)
export const getMyAccount = async (req, res) => {
    try {
        const summary = await getSummaryService(req.user._id);
        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب ملخص الحساب', error: error.message });
    }
};

// @desc    Get logged in user's statement of account (Kashf 7sab)
// @route   GET /api/accounts/my-statement
// @access  Private (User)
export const getMyStatement = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const { startDate, endDate, type } = req.query;

        const filter = { user: req.user._id };

        if (type) {
            filter.type = type;
        }

        if (startDate || endDate) {
            filter.transactionDate = {};
            if (startDate) filter.transactionDate.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.transactionDate.$lte = end;
            }
        }

        const [transactions, count, summary] = await Promise.all([
            Transaction.find(filter)
                .populate('order', 'total status items')
                .populate('payment', 'amount paymentMethod paymentDate notes')
                .sort({ transactionDate: -1, _id: -1 })
                .skip(skip)
                .limit(limit),
            Transaction.countDocuments(filter),
            getSummaryService(req.user._id)
        ]);

        res.json({
            success: true,
            summary: summary.financials,
            pagination: {
                page,
                limit,
                total: count,
                pages: Math.ceil(count / limit)
            },
            data: transactions
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب كشف الحساب', error: error.message });
    }
};

// @desc    Get application-wide money and financial overview (Total Sales, Total Cash Collected, Total Outstanding Debt, Top Debtors)
// @route   GET /api/accounts/financial-overview
// @access  Private (Admin)
export const getFinancialOverview = async (req, res) => {
    try {
        // 1. Total sales value from non-cancelled orders
        const salesAggr = await Order.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $group: { _id: null, totalSales: { $sum: '$total' }, count: { $sum: 1 } } }
        ]);
        const totalSales = salesAggr[0]?.totalSales || 0;
        const totalOrdersCount = salesAggr[0]?.count || 0;

        // 2. Total collected cash/payments across all payment records
        const paymentsAggr = await Payment.aggregate([
            { $group: { _id: null, totalCollected: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);
        const totalCollected = paymentsAggr[0]?.totalCollected || 0;
        const totalPaymentsCount = paymentsAggr[0]?.count || 0;

        // 3. Deferred / Credit sales total
        const deferredSalesAggr = await Order.aggregate([
            { $match: { status: { $ne: 'cancelled' }, paymentMethod: { $in: ['deferred', 'credit'] } } },
            { $group: { _id: null, totalDeferred: { $sum: '$total' } } }
        ]);
        const totalDeferredSales = deferredSalesAggr[0]?.totalDeferred || 0;

        // 4. Calculate total outstanding debt per user using Transactions ledger
        const userBalances = await Transaction.aggregate([
            {
                $group: {
                    _id: '$user',
                    totalDebit: {
                        $sum: {
                            $cond: [
                                { $in: ['$type', ['order_debit', 'adjustment_debit']] },
                                '$amount',
                                0
                            ]
                        }
                    },
                    totalCredit: {
                        $sum: {
                            $cond: [
                                { $in: ['$type', ['payment_credit', 'adjustment_credit']] },
                                '$amount',
                                0
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    user: '$_id',
                    totalDebit: 1,
                    totalCredit: 1,
                    balance: { $subtract: ['$totalDebit', '$totalCredit'] }
                }
            }
        ]);

        let totalOutstandingDebt = 0;
        let usersWithDebtCount = 0;
        let totalOverpaidCredit = 0;

        userBalances.forEach(item => {
            if (item.balance > 0) {
                totalOutstandingDebt += item.balance;
                usersWithDebtCount += 1;
            } else if (item.balance < 0) {
                totalOverpaidCredit += Math.abs(item.balance);
            }
        });

        // 5. Get top debtors (users with highest balance)
        const topDebtorUserIds = userBalances
            .filter(u => u.balance > 0)
            .sort((a, b) => b.balance - a.balance)
            .slice(0, 10);

        const debtorUsersMap = new Map();
        if (topDebtorUserIds.length > 0) {
            const users = await User.find({ _id: { $in: topDebtorUserIds.map(u => u.user) } })
                .select('username fullName phoneNumber creditLimit');
            users.forEach(u => debtorUsersMap.set(u._id.toString(), u));
        }

        const topDebtors = topDebtorUserIds.map(item => {
            const userObj = debtorUsersMap.get(item.user.toString());
            return {
                userId: item.user,
                username: userObj?.username || 'مستخدم غير معروف',
                fullName: userObj?.fullName || 'غير مسمى',
                phoneNumber: userObj?.phoneNumber || '',
                creditLimit: userObj?.creditLimit || 0,
                currentBalance: item.balance,
                totalDebit: item.totalDebit,
                totalCredit: item.totalCredit
            };
        });

        // 6. Total registered users count
        const totalUsersCount = await User.countDocuments();

        // 7. Recent financial transactions
        const recentTransactions = await Transaction.find()
            .populate('user', 'username fullName phoneNumber')
            .populate('recordedBy', 'username fullName')
            .sort({ transactionDate: -1, _id: -1 })
            .limit(10);

        res.json({
            success: true,
            data: {
                summary: {
                    totalSales,                 // إجمالي قيمة الطلبات الكلية
                    totalCollected,             // إجمالي النقدية المحصلة والمدفوعات
                    totalOutstandingDebt,       // إجمالي الديون المستحقة على العملاء
                    totalDeferredSales,         // إجمالي المبيعات بالأجل
                    totalOverpaidCredit,        // إجمالي أرصدة العملاء الدائنة (المقدّمة)
                    totalOrdersCount,           // عدد الطلبات
                    totalPaymentsCount,         // عدد عمليات الدفع
                    totalUsersCount,            // إجمالي عدد العملاء
                    usersWithDebtCount          // عدد العملاء المدينين (عليهم فلوس)
                },
                topDebtors,                     // قائمة بأكثر العملاء مدينية
                recentTransactions              // أحدث العمليات المالية
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب النظرة المالية الشاملة', error: error.message });
    }
};

// @desc    Get account summary for a specific user (Admin)
// @route   GET /api/accounts/users/:userId/summary
// @access  Private (Admin)
export const getUserAccountSummary = async (req, res) => {
    try {
        const { userId } = req.params;
        const summary = await getSummaryService(userId);
        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب ملخص حساب العميل', error: error.message });
    }
};

// @desc    Get statement of account (Kashf 7sab) for a specific user (Admin)
// @route   GET /api/accounts/users/:userId/statement
// @access  Private (Admin)
export const getUserStatement = async (req, res) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const { startDate, endDate, type } = req.query;

        const filter = { user: userId };

        if (type) {
            filter.type = type;
        }

        if (startDate || endDate) {
            filter.transactionDate = {};
            if (startDate) filter.transactionDate.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.transactionDate.$lte = end;
            }
        }

        const [transactions, count, summary] = await Promise.all([
            Transaction.find(filter)
                .populate('order', 'total status items')
                .populate('payment', 'amount paymentMethod paymentDate notes')
                .populate('recordedBy', 'username fullName')
                .sort({ transactionDate: -1, _id: -1 })
                .skip(skip)
                .limit(limit),
            Transaction.countDocuments(filter),
            getSummaryService(userId)
        ]);

        res.json({
            success: true,
            summary: summary.financials,
            user: summary.user,
            pagination: {
                page,
                limit,
                total: count,
                pages: Math.ceil(count / limit)
            },
            data: transactions
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب كشف حساب العميل', error: error.message });
    }
};

// @desc    Record payment for user (General or specific order) with custom date support (Admin)
// @route   POST /api/accounts/payments
// @access  Private (Admin)
export const recordAccountPayment = async (req, res) => {
    try {
        const { userId, amount, orderId, paymentMethod, paymentDate, notes } = req.body;
        const adminId = req.admin._id;

        if (!userId || !amount) {
            return res.status(400).json({ message: 'المستخدم والمبلغ مطلوبان' });
        }

        const numericAmount = Number(amount);
        if (numericAmount <= 0) {
            return res.status(400).json({ message: 'مبلغ الدفع يجب أن يكون أكبر من صفر' });
        }

        const result = await processUserPayment({
            userId,
            amount: numericAmount,
            orderId: orderId || null,
            paymentMethod: paymentMethod || 'cash',
            paymentDate: paymentDate || new Date(),
            recordedById: adminId,
            notes: notes ? notes.trim() : ''
        });

        const newSummary = await getSummaryService(userId);

        res.status(201).json({
            success: true,
            message: 'تم تسجيل عملية الدفع بنجاح',
            data: result,
            accountSummary: newSummary.financials
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء تسجيل الدفع', error: error.message });
    }
};

// @desc    Record manual credit or debit adjustment for user account (Admin)
// @route   POST /api/accounts/adjustments
// @access  Private (Admin)
export const recordAccountAdjustment = async (req, res) => {
    try {
        const { userId, type, amount, transactionDate, notes } = req.body;
        const adminId = req.admin._id;

        if (!userId || !type || !amount) {
            return res.status(400).json({ message: 'المستخدم ونوع التسوية والمبلغ مطلوبون' });
        }

        if (!['adjustment_debit', 'adjustment_credit'].includes(type)) {
            return res.status(400).json({ message: 'نوع التسوية يجب أن يكون adjustment_debit أو adjustment_credit' });
        }

        const numericAmount = Number(amount);
        if (numericAmount <= 0) {
            return res.status(400).json({ message: 'المبلغ يجب أن يكون أكبر من صفر' });
        }

        const transaction = await recordTransaction({
            userId,
            type,
            amount: numericAmount,
            transactionDate: transactionDate || new Date(),
            recordedById: adminId,
            notes: notes ? notes.trim() : (type === 'adjustment_debit' ? 'تسوية دين مالي' : 'تسوية خصم مالي')
        });

        const newSummary = await getSummaryService(userId);

        res.status(201).json({
            success: true,
            message: 'تم تسجيل التسوية المالية بنجاح',
            data: transaction,
            accountSummary: newSummary.financials
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء تسجيل التسوية المالية', error: error.message });
    }
};

// @desc    Update user credit limit and credit allowance (Admin)
// @route   PUT /api/accounts/users/:userId/credit-limit
// @access  Private (Admin)
export const updateUserCreditLimit = async (req, res) => {
    try {
        const { userId } = req.params;
        const { creditLimit, isCreditAllowed } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'المستخدم غير موجود' });
        }

        if (creditLimit !== undefined) {
            const limitVal = Number(creditLimit);
            if (isNaN(limitVal) || limitVal < 0) {
                return res.status(400).json({ message: 'حد الائتمان يجب أن يكون رقماً موجباً' });
            }
            user.creditLimit = limitVal;
        }

        if (isCreditAllowed !== undefined) {
            user.isCreditAllowed = Boolean(isCreditAllowed);
        }

        await user.save();

        const summary = await getSummaryService(userId);

        res.json({
            success: true,
            message: 'تم تحديث إعدادات الآجل والائتمان بنجاح',
            data: summary
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء تحديث حد الائتمان', error: error.message });
    }
};
