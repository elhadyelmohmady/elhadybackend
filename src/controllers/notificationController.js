import Notification from '../models/Notification.js';
import Setting from '../models/Setting.js';
import { sendTelegramNotification, getTelegramCredentials } from '../services/notificationService.js';

// ==================== DASHBOARD ADMIN NOTIFICATIONS ====================

// @desc    Get dashboard notifications list
// @route   GET /api/dashboard/notifications
// @access  Private (Dashboard Admin)
export const getDashboardNotifications = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { isRead, type } = req.query;

    const filter = {
        recipientType: { $in: ['admin', 'all'] }
    };

    if (isRead !== undefined) {
        filter.isRead = isRead === 'true' || isRead === true;
    }

    if (type) {
        filter.type = type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Notification.countDocuments(filter),
        Notification.countDocuments({ recipientType: { $in: ['admin', 'all'] }, isRead: false })
    ]);

    res.json({
        success: true,
        data: notifications,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        },
        unreadCount
    });
};

// @desc    Get dashboard unread notifications count
// @route   GET /api/dashboard/notifications/unread-count
// @access  Private (Dashboard Admin)
export const getDashboardUnreadCount = async (req, res) => {
    const unreadCount = await Notification.countDocuments({
        recipientType: { $in: ['admin', 'all'] },
        isRead: false
    });

    res.json({
        success: true,
        unreadCount
    });
};

// @desc    Mark single dashboard notification as read
// @route   PATCH /api/dashboard/notifications/:id/read
// @access  Private (Dashboard Admin)
export const markDashboardNotificationAsRead = async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        return res.status(404).json({ success: false, message: 'الإشعار غير موجود' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
        success: true,
        message: 'تم تعليم الإشعار كمقروء',
        data: notification
    });
};

// @desc    Mark all dashboard notifications as read
// @route   PATCH /api/dashboard/notifications/read-all
// @access  Private (Dashboard Admin)
export const markAllDashboardNotificationsAsRead = async (req, res) => {
    await Notification.updateMany(
        { recipientType: { $in: ['admin', 'all'] }, isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
    );

    res.json({
        success: true,
        message: 'تم تعليم جميع الإشعارات كمقروءة'
    });
};

// @desc    Delete a dashboard notification
// @route   DELETE /api/dashboard/notifications/:id
// @access  Private (Dashboard Admin)
export const deleteDashboardNotification = async (req, res) => {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { deleteFlag: 1 }, { new: true });

    if (!notification) {
        return res.status(404).json({ success: false, message: 'الإشعار غير موجود' });
    }

    res.json({
        success: true,
        message: 'تم حذف الإشعار بنجاح'
    });
};

// @desc    Get current Telegram configuration status
// @route   GET /api/dashboard/notifications/telegram-config
// @access  Private (Dashboard Admin)
export const getTelegramConfig = async (req, res) => {
    const { token, chatId } = await getTelegramCredentials();
    const isEnvProvided = Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);

    // Mask bot token for security
    const maskedToken = token ? `${token.substring(0, 6)}...${token.substring(token.length - 4)}` : '';

    res.json({
        success: true,
        data: {
            configured: Boolean(token && chatId),
            isEnvProvided,
            botToken: maskedToken,
            chatId: chatId || '',
            hasBotToken: Boolean(token),
            hasChatId: Boolean(chatId)
        }
    });
};

// @desc    Update Telegram configuration in settings
// @route   PUT /api/dashboard/notifications/telegram-config
// @access  Private (Dashboard Admin)
export const updateTelegramConfig = async (req, res) => {
    const { botToken, chatId } = req.body;

    if (!botToken || !chatId) {
        return res.status(400).json({
            success: false,
            message: 'يرجى إدخال Bot Token و Chat ID الخاص بتليجرام'
        });
    }

    let settings = await Setting.findOne({ key: 'general' });
    if (!settings) {
        settings = new Setting({ key: 'general' });
    }

    settings.telegramBotToken = botToken.trim();
    settings.telegramChatId = chatId.trim();
    await settings.save();

    res.json({
        success: true,
        message: 'تم حفظ إعدادات تليجرام بنجاح',
        data: {
            configured: true,
            chatId: settings.telegramChatId
        }
    });
};

// @desc    Send test Telegram message
// @route   POST /api/dashboard/notifications/test-telegram
// @access  Private (Dashboard Admin)
export const testTelegramConfig = async (req, res) => {
    const { botToken, chatId, customMessage } = req.body;

    let targetToken = botToken;
    let targetChatId = chatId;

    if (!targetToken || !targetChatId) {
        const creds = await getTelegramCredentials();
        targetToken = creds.token;
        targetChatId = creds.chatId;
    }

    if (!targetToken || !targetChatId) {
        return res.status(400).json({
            success: false,
            message: 'إعدادات تليجرام غير مكتملة. يرجى توفير Bot Token و Chat ID'
        });
    }

    const testText = customMessage || (
        `<b>🔔 اختبار إشعارات تليجرام</b>\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `تم ربط نظام الإشعارات بنجاح مع لوحة التحكم! 🎉\n` +
        `سيصلك إشعار فوري هنا عند حدوث أي طلب جديد أو تغيير في النظام.\n` +
        `⏰ <i>${new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}</i>`
    );

    const result = await sendTelegramNotification(testText, {
        tokenOverride: targetToken,
        chatIdOverride: targetChatId
    });

    if (result.success) {
        return res.json({
            success: true,
            message: 'تم ارسال رسالة الاختبار بنجاح إلى تليجرام!',
            telegramResponse: result.data
        });
    } else {
        return res.status(400).json({
            success: false,
            message: 'فشل إرسال الرسالة إلى تليجرام. تحقق من صحة Bot Token و Chat ID',
            error: result.error
        });
    }
};

// ==================== USER MOBILE APP NOTIFICATIONS ====================

// @desc    Get user notifications list
// @route   GET /api/notifications
// @access  Private (Mobile User)
export const getUserNotifications = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {
        $or: [
            { recipientType: 'customer', recipientId: req.user._id },
            { recipientType: 'all' }
        ]
    };

    const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Notification.countDocuments(filter),
        Notification.countDocuments({ ...filter, isRead: false })
    ]);

    res.json({
        success: true,
        data: notifications,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        },
        unreadCount
    });
};

// @desc    Get user unread notifications count
// @route   GET /api/notifications/unread-count
// @access  Private (Mobile User)
export const getUserUnreadCount = async (req, res) => {
    const unreadCount = await Notification.countDocuments({
        $or: [
            { recipientType: 'customer', recipientId: req.user._id },
            { recipientType: 'all' }
        ],
        isRead: false
    });

    res.json({
        success: true,
        unreadCount
    });
};

// @desc    Mark single user notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private (Mobile User)
export const markUserNotificationAsRead = async (req, res) => {
    const notification = await Notification.findOne({
        _id: req.params.id,
        $or: [
            { recipientType: 'customer', recipientId: req.user._id },
            { recipientType: 'all' }
        ]
    });

    if (!notification) {
        return res.status(404).json({ success: false, message: 'الإشعار غير موجود' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
        success: true,
        message: 'تم تعليم الإشعار كمقروء',
        data: notification
    });
};
