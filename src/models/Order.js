import mongoose from 'mongoose';
import Product from './Product.js';

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true
    }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [orderItemSchema],
    total: {
        type: Number,
        required: true,
        min: 0
    },
    paidAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'partially_paid', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cash_on_delivery'],
        default: 'cash_on_delivery'
    },
    address: {
        lat: {
            type: Number,
            required: true
        },
        lng: {
            type: Number,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        locationDetails: {
            type: String,
            required: true
        }
    },
    shippingType: {
        type: String,
        enum: ['normal', 'express'],
        default: 'normal'
    },
    estimatedDeliveryDays: {
        min: {
            type: Number,
            default: 3
        },
        max: {
            type: Number,
            default: 5
        }
    }
}, {
    timestamps: true
});

// Restore stock when order is cancelled (from dashboard or mobile)
orderSchema.pre('save', async function (next) {
    if (this.isModified('status') && this.status === 'cancelled') {
        const original = await Order.findById(this._id).lean();
        if (original && original.status !== 'cancelled') {
            const bulkOps = this.items.map(item => ({
                updateOne: {
                    filter: { _id: item.product },
                    update: { $inc: { stock: item.quantity, totalOrdered: -item.quantity } }
                }
            }));
            await Product.bulkWrite(bulkOps);
        }
    }
    next();
});

// Method to update paid amount and status
orderSchema.methods.updatePaidAmount = async function (paymentAmount) {
    this.paidAmount = (this.paidAmount || 0) + paymentAmount;

    if (this.paidAmount >= this.total) {
        this.paidAmount = this.total;
        if (this.status === 'partially_paid' || this.status === 'pending') {
            this.status = 'delivered';
        }
    } else if (this.paidAmount > 0 && this.status === 'pending') {
        this.status = 'partially_paid';
    }

    await this.save();
};

const Order = mongoose.model('Order', orderSchema);

export default Order;
