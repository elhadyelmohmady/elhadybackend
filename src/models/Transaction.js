import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['order_debit', 'payment_credit', 'adjustment_debit', 'adjustment_credit'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01
    },
    balanceAfter: {
        type: Number,
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: false,
        index: true
    },
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: false
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'deferred', 'bank_transfer', 'online', 'check', 'other'],
        default: 'cash'
    },
    transactionDate: {
        type: Date,
        default: Date.now,
        required: true,
        index: true
    },
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: false
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 500
    }
}, {
    timestamps: true
});

transactionSchema.index({ user: 1, transactionDate: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
