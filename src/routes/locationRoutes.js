import express from 'express';
import {
    getLocations,
    getDefaultLocation,
    addLocation,
    updateLocation,
    deleteLocation,
    setDefaultLocation
} from '../controllers/locationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected (require authentication)
router.use(protect);

router.get('/', getLocations); // Get all saved locations
router.get('/default', getDefaultLocation); // Get default location
router.post('/', addLocation); // Save new location
router.put('/:id', updateLocation); // Update location
router.delete('/:id', deleteLocation); // Delete location
router.put('/:id/set-default', setDefaultLocation); // Set as default

export default router;
