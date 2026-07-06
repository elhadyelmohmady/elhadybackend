import SavedLocation from '../models/SavedLocation.js';

// @desc    Get all saved locations for user
// @route   GET /api/locations
// @access  Private
export const getLocations = async (req, res) => {
    try {
        const locations = await SavedLocation.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
        res.json({ data: locations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ في جلب العناوين المحفوظة' });
    }
};

// @desc    Get default location
// @route   GET /api/locations/default
// @access  Private
export const getDefaultLocation = async (req, res) => {
    try {
        const location = await SavedLocation.findOne({ user: req.user._id, isDefault: true });

        if (!location) {
            return res.status(404).json({ message: 'لا يوجد عنوان افتراضي' });
        }

        res.json({ data: location });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ في جلب العنوان الافتراضي' });
    }
};

// @desc    Save a new location
// @route   POST /api/locations
// @access  Private
export const addLocation = async (req, res) => {
    try {
        const { label, lat, lng, city, locationDetails, isDefault } = req.body;

        if (!label || !lat || !lng || !city || !locationDetails) {
            return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
        }

        const location = await SavedLocation.create({
            user: req.user._id,
            label,
            lat,
            lng,
            city,
            locationDetails,
            isDefault: isDefault || false
        });

        res.status(201).json({ message: 'تم حفظ العنوان بنجاح', data: location });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ في حفظ العنوان' });
    }
};

// @desc    Update a location
// @route   PUT /api/locations/:id
// @access  Private
export const updateLocation = async (req, res) => {
    try {
        const { label, lat, lng, city, locationDetails, isDefault } = req.body;

        const location = await SavedLocation.findOne({ _id: req.params.id, user: req.user._id });

        if (!location) {
            return res.status(404).json({ message: 'العنوان غير موجود' });
        }

        if (label) location.label = label;
        if (lat) location.lat = lat;
        if (lng) location.lng = lng;
        if (city) location.city = city;
        if (locationDetails) location.locationDetails = locationDetails;
        if (isDefault !== undefined) location.isDefault = isDefault;

        await location.save();

        res.json({ message: 'تم تحديث العنوان بنجاح', data: location });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ في تحديث العنوان' });
    }
};

// @desc    Delete a location
// @route   DELETE /api/locations/:id
// @access  Private
export const deleteLocation = async (req, res) => {
    try {
        const location = await SavedLocation.findOne({ _id: req.params.id, user: req.user._id });

        if (!location) {
            return res.status(404).json({ message: 'العنوان غير موجود' });
        }

        await location.deleteOne();

        res.json({ message: 'تم حذف العنوان بنجاح' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ في حذف العنوان' });
    }
};

// @desc    Set a location as default
// @route   PUT /api/locations/:id/set-default
// @access  Private
export const setDefaultLocation = async (req, res) => {
    try {
        const location = await SavedLocation.findOne({ _id: req.params.id, user: req.user._id });

        if (!location) {
            return res.status(404).json({ message: 'العنوان غير موجود' });
        }

        location.isDefault = true;
        await location.save();

        res.json({ message: 'تم تعيين العنوان كافتراضي بنجاح', data: location });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ في تعيين العنوان الافتراضي' });
    }
};
