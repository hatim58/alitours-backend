const express = require('express');
const router = express.Router();
const {
    getPackages,
    getPackageById,
    createPackage,
    updatePackage,
    deletePackage,
} = require('../controllers/packageController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/')
    .get(getPackages)
    .post(protect, admin, createPackage);

router.route('/:id')
    .get(getPackageById)
    .put(protect, admin, updatePackage)
    .delete(protect, admin, deletePackage);

module.exports = router;
