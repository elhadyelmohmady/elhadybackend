import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        default: 'general'
    },
    minOrderTotal: {
        type: Number,
        required: true,
        default: 100,
        min: 0
    },
    telegramBotToken: {
        type: String,
        default: ''
    },
    telegramChatId: {
        type: String,
        default: ''
    },
    maintenanceMode: {
        type: Boolean,
        default: false
    },
    maintenanceMessage: {
        type: String,
        default: 'التطبيق تحت الصيانة حاليًا، حاول مرة أخرى بعد قليل.'
    },
    minRequiredVersion: {
        type: String,
        default: ''
    },
    latestVersion: {
        type: String,
        default: ''
    },
    updateMessage: {
        type: String,
        default: 'يتوفر إصدار جديد من التطبيق يحتوي على تحسينات وإصلاحات.'
    },
    androidStoreUrl: {
        type: String,
        default: ''
    },
    iosStoreUrl: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

const Setting = mongoose.model('Setting', settingSchema);

export default Setting;
