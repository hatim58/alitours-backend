const express = require('express');
const router = express.Router();
const {
    getLocations,
    getLocationBySlug,
    createLocation,
    updateLocation,
    deleteLocation,
} = require('../controllers/locationController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/')
    .get(getLocations)
    .post(protect, admin, createLocation);

router.route('/:id')
    .put(protect, admin, updateLocation)
    .delete(protect, admin, deleteLocation);

router.route('/slug/:slug')
    .get(getLocationBySlug);

module.exports = router;
