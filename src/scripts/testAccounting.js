import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import Transaction from '../models/Transaction.js';
import { getUserAccountSummary, processUserPayment, recordTransaction } from '../services/accountService.js';

dotenv.config();

const runTest = async () => {
    try {
        console.log('Connecting to Mongo...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/elhady_db');
        console.log('Connected to DB');

        // Find or create test user
        let user = await User.findOne({ username: 'accounting_test_user' });
        if (!user) {
            user = await User.create({
                username: 'accounting_test_user',
                password: 'password123',
                fullName: 'مستخدم تجريبي للحسابات',
                phoneNumber: '01000000999',
                creditLimit: 5000,
                isCreditAllowed: true
            });
            console.log('Created test user:', user._id);
        } else {
            console.log('Found test user:', user._id);
        }

        // Clean up previous test transactions for this user
        await Transaction.deleteMany({ user: user._id });
        await Payment.deleteMany({ user: user._id });

        console.log('1. Testing initial summary...');
        let summary = await getUserAccountSummary(user._id);
        console.log('Initial summary:', JSON.stringify(summary, null, 2));

        console.log('2. Recording order debit (Order #1: 1500 EGP)...');
        await recordTransaction({
            userId: user._id,
            type: 'order_debit',
            amount: 1500,
            paymentMethod: 'deferred',
            transactionDate: new Date('2026-07-01T10:00:00Z'),
            notes: 'طلب بالأجل رقم #TEST101'
        });

        summary = await getUserAccountSummary(user._id);
        console.log('Summary after Order #1 (1500 EGP):', summary.financials);

        console.log('3. Recording custom backdated payment (Payment: 500 EGP on 2026-07-05)...');
        const paymentResult = await processUserPayment({
            userId: user._id,
            amount: 500,
            paymentMethod: 'cash',
            paymentDate: new Date('2026-07-05T14:30:00Z'),
            notes: 'دفعة سداد نقدي كاش بتاريخ 5-7'
        });
        console.log('Payment result:', paymentResult.payment._id);

        summary = await getUserAccountSummary(user._id);
        console.log('Summary after Payment (500 EGP):', summary.financials);

        console.log('4. Fetching Statement of Account (Kashf 7sab)...');
        const transactions = await Transaction.find({ user: user._id }).sort({ transactionDate: 1 });
        console.log('Statement Ledger:');
        transactions.forEach((tx, idx) => {
            console.log(` #${idx + 1} | Date: ${tx.transactionDate.toISOString().substring(0, 10)} | Type: ${tx.type} | Amount: ${tx.amount} EGP | Balance After: ${tx.balanceAfter} EGP | Notes: ${tx.notes}`);
        });

        console.log('\nAll Accounting tests completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Test error:', err);
        process.exit(1);
    }
};

runTest();
