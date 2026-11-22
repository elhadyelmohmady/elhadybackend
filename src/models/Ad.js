import mongoose from 'mongoose';

// Ads shown in the mobile app: home-screen slider banners (type: 'slider')
// and the app-launch popup ad (type: 'popup'). Managed from the dashboard
// at /api/dashboard/ads, consumed publicly at /api/ads.
const adSchema = new mongoose.Schema({
    title: {
        type: String,
        default: '',
        trim: true
    },
    subtitle: {
        type: String,
        default: '',
        trim: true
    },
    // Internal tracking — who paid for this ad
    advertiser: {
        type: String,
        default: '',
        trim: true
    },
    type: {
        type: String,
        enum: ['slider', 'popup'],
        default: 'slider',
        index: true
    },
    // Relative path served from /ad_images (e.g. "ad_images/ad-...webp")
    // or an absolute external URL
    image: {
        type: String,
        required: [true, 'صورة الإعلان مطلوبة'],
        trim: true
    },
    // Call-to-action button label shown on the ad (mobile)
    ctaText: {
        type: String,
        default: '',
        trim: true
    },
    // In-app navigation target: a React Navigation route name
    // (e.g. ProductsList, AllBrands, Categories)
    screen: {
        type: String,
        default: null,
        trim: true
    },
    // Navigation params object for the target screen
    params: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    // External link opened in the browser instead of an in-app screen
    externalUrl: {
        type: String,
        default: null,
        trim: true
    },
    // Lower = earlier in the slider; popup uses the lowest order among active ones
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    // Paid-ad scheduling: ad only appears to users within this window
    startDate: {
        type: Date,
        default: null
    },
    endDate: {
        type: Date,
        default: null
    },
    // How often the popup re-appears: 'once' (ever), 'daily', 'every_launch'
    popupFrequency: {
        type: String,
        enum: ['once', 'daily', 'every_launch'],
        default: 'every_launch'
    }
}, {
    timestamps: true
});

// Text search helper for the dashboard list
adSchema.index({ title: 'text', advertiser: 'text' });

const Ad = mongoose.model('Ad', adSchema);

export default Ad;
