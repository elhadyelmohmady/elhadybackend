import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: [
            'order_new',
            'order_status',
            'order_cancelled',
            'payment_new',
            'user_registered',
            'stock_low',
            'system_event'
        ],
        required: true
    },
    recipientType: {
        type: String,
        enum: ['admin', 'customer', 'all'],
        default: 'admin'
    },
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'recipientModel',
        default: null
    },
    recipientModel: {
        type: String,
        enum: ['User', 'Admin'],
        default: 'Admin'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: {
        type: Date,
        default: null
    },
    severity: {
        type: String,
        enum: ['info', 'success', 'warning', 'error'],
        default: 'info'
    }
}, {
    timestamps: true
});

notificationSchema.index({ recipientType: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
