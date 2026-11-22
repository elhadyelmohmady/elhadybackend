import express from 'express';
import Ad from '../models/Ad.js';

const router = express.Router();

// Helper: only active ads whose paid schedule window includes "now"
const activeAdsQuery = (type) => {
    const now = new Date();
    return {
        type,
        isActive: true,
        $or: [{ startDate: null }, { startDate: { $lte: now } }],
        $and: [{ $or: [{ endDate: null }, { endDate: { $gte: now } }] }]
    };
};

// @desc    Active slider banners for the mobile home screen
// @route   GET /api/ads
// @access  Public
router.get('/', async (req, res) => {
    try {
        const ads = await Ad.find(activeAdsQuery('slider'))
            .sort({ order: 1, createdAt: -1 })
            .select('title subtitle image ctaText screen params externalUrl order')
            .lean();

        res.json({
            success: true,
            count: ads.length,
            data: ads
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    The popup ad to show on app launch (lowest order wins)
// @route   GET /api/ads/popup
// @access  Public
router.get('/popup', async (req, res) => {
    try {
        const ad = await Ad.findOne(activeAdsQuery('popup'))
            .sort({ order: 1, createdAt: -1 })
            .select('title subtitle image ctaText screen params externalUrl popupFrequency')
            .lean();

        res.json({
            success: true,
            data: ad || null
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
