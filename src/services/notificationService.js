import axios from 'axios';
import Notification from '../models/Notification.js';
import Setting from '../models/Setting.js';

/**
 * Get Telegram credentials from process.env or MongoDB Setting document
 */
export const getTelegramCredentials = async () => {
    let token = process.env.TELEGRAM_BOT_TOKEN || '';
    let chatId = process.env.TELEGRAM_CHAT_ID || '';

    // Fallback to database settings if env variables are empty
    if (!token || !chatId) {
        try {
            const settings = await Setting.findOne({ key: 'general' }).lean();
            if (settings) {
                if (!token && settings.telegramBotToken) token = settings.telegramBotToken;
                if (!chatId && settings.telegramChatId) chatId = settings.telegramChatId;
            }
        } catch (err) {
            console.error('[NotificationService] Error fetching Telegram settings from DB:', err.message);
        }
    }

    return { token, chatId };
};

/**
 * Send message to Telegram chat
 * @param {string} text - Message text (HTML or plain text)
 * @param {object} options - Optional parameters
 */
export const sendTelegramNotification = async (text, options = {}) => {
    try {
        const { token, chatId } = await getTelegramCredentials();

        if (!token || !chatId) {
            console.warn('[NotificationService] Telegram Bot Token or Chat ID not configured.');
            return { success: false, reason: 'Credentials not configured' };
        }

        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const payload = {
            chat_id: chatId,
            text,
            parse_mode: options.parse_mode || 'HTML',
            disable_web_page_preview: true,
            ...options
        };

        const response = await axios.post(url, payload, { timeout: 10000 });
        return { success: true, data: response.data };
    } catch (error) {
        const errorDetails = error.response?.data?.description || error.message;
        console.error('[NotificationService] Failed to send Telegram message:', errorDetails);
        return { success: false, error: errorDetails };
    }
};

/**
 * Create a system notification in DB and optionally dispatch to Telegram
 */
export const createNotification = async ({
    title,
    message,
    type,
    recipientType = 'admin',
    recipientId = null,
    recipientModel = 'Admin',
    metadata = {},
    severity = 'info',
    sendTelegram = true,
    telegramText = null
}) => {
    try {
        // Save to Database
        const notification = await Notification.create({
            title,
            message,
            type,
            recipientType,
            recipientId,
            recipientModel,
            metadata,
            severity
        });

        // Send Telegram notification if enabled & target is admin / system
        if (sendTelegram && (recipientType === 'admin' || recipientType === 'all')) {
            const formattedTelegramMessage = telegramText || `<b>${title}</b>\n\n${message}`;
            sendTelegramNotification(formattedTelegramMessage).catch(err => {
                console.error('[NotificationService] Async Telegram dispatch error:', err.message);
            });
        }

        return notification;
    } catch (error) {
        console.error('[NotificationService] Error creating notification:', error.message);
        return null;
    }
};

// Helper: Arabic status translation
const formatStatus = (status) => {
    const map = {
        pending: 'قيد الانتظار ⏳',
        partially_paid: 'مدفوع جزئياً 💳',
        processing: 'جاري التحضير 📦',
        shipped: 'تم الشحن 🚚',
        delivered: 'تم التوصيل ✅',
        cancelled: 'ملغي ❌'
    };
    return map[status] || status;
};

// Helper: Payment method translation
const formatPaymentMethod = (pm) => {
    const map = {
        cash_on_delivery: 'دفع عند الاستلام (كاش)',
        deferred: 'آجل / ائتمان 📝',
        credit: 'آجل / ائتمان 📝',
        online: 'دفع إلكتروني 💳',
        bank_transfer: 'تحويل بنكي 🏦'
    };
    return map[pm] || pm;
};

/**
 * Trigger: New Order Created
 */
export const notifyNewOrder = async (order, customer) => {
    const customerName = customer?.fullName || customer?.username || 'عميل';
    const phone = customer?.phoneNumber || 'غير متوفر';

    const title = `📦 طلب جديد #${order._id}`;
    const message = `قام العميل ${customerName} بعمل طلب جديد بقيمة ${order.total} جنيه.`;

    const itemsSummary = order.items?.map(i => {
        const name = i.product?.name || 'منتج';
        return `• ${name} × ${i.quantity} (${i.price} ج.م)`;
    }).join('\n') || '';

    const telegramText = `<b>📦 طلب جديد بقيمة ${order.total} ج.م</b>\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `<b>رقم الطلب:</b> <code>${order._id}</code>\n` +
        `<b>العميل:</b> ${customerName}\n` +
        `<b>الهاتف:</b> <code>${phone}</code>\n` +
        `<b>طريقة الدفع:</b> ${formatPaymentMethod(order.paymentMethod)}\n` +
        `<b>نوع الشحن:</b> ${order.shippingType === 'express' ? 'سريع ⚡' : 'عادي 🚚'}\n` +
        `<b>العنوان:</b> ${order.address?.city || ''} - ${order.address?.locationDetails || ''}\n\n` +
        `<b>المنتجات:</b>\n${itemsSummary}\n\n` +
        `<b>إجمالي الطلب:</b> <b>${order.total} ج.م</b>\n` +
        `⏰ <i>${new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}</i>`;

    return createNotification({
        title,
        message,
        type: 'order_new',
        recipientType: 'admin',
        severity: 'success',
        metadata: {
            orderId: order._id,
            total: order.total,
            customerId: customer?._id,
            customerName,
            paymentMethod: order.paymentMethod
        },
        sendTelegram: true,
        telegramText
    });
};

/**
 * Trigger: Order Status Updated
 */
export const notifyOrderStatusChanged = async (order, customer, oldStatus, newStatus) => {
    const customerName = customer?.fullName || customer?.username || 'العميل';
    const title = `🔄 تحديث حالة الطلب #${order._id}`;
    const message = `تم تغيير حالة طلب العميل ${customerName} من (${formatStatus(oldStatus)}) إلى (${formatStatus(newStatus)}).`;

    const telegramText = `<b>🔄 تحديث حالة طلب</b>\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `<b>رقم الطلب:</b> <code>${order._id}</code>\n` +
        `<b>العميل:</b> ${customerName}\n` +
        `<b>الحالة القديمة:</b> ${formatStatus(oldStatus)}\n` +
        `<b>الحالة الجديدة:</b> ${formatStatus(newStatus)}\n` +
        `<b>المبلغ الإجمالي:</b> ${order.total} ج.م\n` +
        `⏰ <i>${new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}</i>`;

    // Notify Admin
    await createNotification({
        title,
        message,
        type: 'order_status',
        recipientType: 'admin',
        severity: newStatus === 'cancelled' ? 'warning' : 'info',
        metadata: { orderId: order._id, oldStatus, newStatus },
        sendTelegram: true,
        telegramText
    });

    // Also Notify Customer in DB if customer exists
    if (customer?._id) {
        await createNotification({
            title: `تحديث حالة طلبك #${order._id}`,
            message: `أصبحت حالة طلبك الآن: ${formatStatus(newStatus)}`,
            type: 'order_status',
            recipientType: 'customer',
            recipientId: customer._id,
            recipientModel: 'User',
            severity: 'info',
            metadata: { orderId: order._id, newStatus },
            sendTelegram: false
        });
    }
};

/**
 * Trigger: Order Cancelled
 */
export const notifyOrderCancelled = async (order, customer, cancelledBy = 'العميل') => {
    const customerName = customer?.fullName || customer?.username || 'عميل';
    const title = `❌ إلغاء طلب #${order._id}`;
    const message = `تم إلغاء الطلب رقم #${order._id} بواسطة ${cancelledBy}.`;

    const telegramText = `<b>❌ تم إلغاء طلب</b>\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `<b>رقم الطلب:</b> <code>${order._id}</code>\n` +
        `<b>العميل:</b> ${customerName}\n` +
        `<b>القيمة:</b> ${order.total} ج.م\n` +
        `<b>تم الإلغاء بواسطة:</b> ${cancelledBy}\n` +
        `⏰ <i>${new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}</i>`;

    return createNotification({
        title,
        message,
        type: 'order_cancelled',
        recipientType: 'admin',
        severity: 'error',
        metadata: { orderId: order._id, total: order.total, cancelledBy },
        sendTelegram: true,
        telegramText
    });
};

/**
 * Trigger: Payment Recorded
 */
export const notifyNewPayment = async (payment, order, customer, recordedByAdmin = null) => {
    const customerName = customer?.fullName || customer?.username || 'عميل';
    const amount = payment.amount || 0;
    const adminName = recordedByAdmin?.fullName || recordedByAdmin?.username || 'المسؤول';

    const title = `💰 تسجيل دفعة جديدة #${order?._id || payment._id}`;
    const message = `تم تسجيل دفعة بقيمة ${amount} ج.م للعميل ${customerName}.`;

    const telegramText = `<b>💰 تسجيل دفعة جديدة</b>\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `<b>المبلغ:</b> <b>${amount} ج.م</b>\n` +
        `<b>العميل:</b> ${customerName}\n` +
        `<b>رقم الطلب:</b> <code>${order?._id || 'غير محدد'}</code>\n` +
        `<b>طريقة الدفع:</b> ${formatPaymentMethod(payment.paymentMethod)}\n` +
        `<b>المسجل:</b> ${adminName}\n` +
        `⏰ <i>${new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}</i>`;

    return createNotification({
        title,
        message,
        type: 'payment_new',
        recipientType: 'admin',
        severity: 'success',
        metadata: { paymentId: payment._id, orderId: order?._id, amount },
        sendTelegram: true,
        telegramText
    });
};

/**
 * Trigger: Low Stock Alert
 */
export const notifyLowStock = async (product) => {
    const title = `⚠️ تنبيه مخزون منخفض: ${product.name}`;
    const message = `انخفض مخزون المنتج (${product.name}) إلى ${product.stock} فقط.`;

    const telegramText = `<b>⚠️ تنبيه مخزون منخفض!</b>\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `<b>المنتج:</b> ${product.name}\n` +
        `<b>الكمية المتبقية:</b> <b>${product.stock} قطعة</b>\n` +
        `⏰ <i>${new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}</i>`;

    return createNotification({
        title,
        message,
        type: 'stock_low',
        recipientType: 'admin',
        severity: 'warning',
        metadata: { productId: product._id, stock: product.stock },
        sendTelegram: true,
        telegramText
    });
};

/**
 * Trigger: New User Registered
 */
export const notifyNewUser = async (user) => {
    const name = user.fullName || user.username || 'عميل جديد';
    const phone = user.phoneNumber || 'غير متوفر';

    const title = `👤 تسجيل عميل جديد`;
    const message = `انضم العميل الجديد (${name}) إلى النظام.`;

    const telegramText = `<b>👤 تسجيل عميل جديد</b>\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `<b>الاسم:</b> ${name}\n` +
        `<b>الهاتف:</b> <code>${phone}</code>\n` +
        `⏰ <i>${new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}</i>`;

    return createNotification({
        title,
        message,
        type: 'user_registered',
        recipientType: 'admin',
        severity: 'info',
        metadata: { userId: user._id, name, phone },
        sendTelegram: true,
        telegramText
    });
};
