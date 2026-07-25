import Setting from '../models/Setting.js';

// @desc    Public app status check — maintenance mode + force/soft update info.
//          Called by the mobile app on every launch, before login.
// @route   GET /api/app/status
// @access  Public
export const getAppStatus = async (req, res) => {
    const setting = await Setting.findOne({ key: 'general' }).lean();

    res.json({
        success: true,
        data: {
            maintenanceMode: setting?.maintenanceMode || false,
            maintenanceMessage: setting?.maintenanceMessage || 'التطبيق تحت الصيانة حاليًا، حاول مرة أخرى بعد قليل.',
            minRequiredVersion: setting?.minRequiredVersion || '',
            latestVersion: setting?.latestVersion || '',
            updateMessage: setting?.updateMessage || 'يتوفر إصدار جديد من التطبيق يحتوي على تحسينات وإصلاحات.',
            androidStoreUrl: setting?.androidStoreUrl || '',
            iosStoreUrl: setting?.iosStoreUrl || ''
        }
    });
};
