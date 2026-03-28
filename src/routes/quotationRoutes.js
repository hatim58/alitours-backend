const express = require('express');
const router = express.Router();
const { getQuotations, createQuotation } = require('../controllers/quotationController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/')
    .get(protect, admin, getQuotations)
    .post(protect, admin, createQuotation);

module.exports = router;
