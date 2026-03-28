const express = require('express');
const router = express.Router();
const { generatePaymentLink, razorpayWebhook } = require('../controllers/paymentController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.post('/link', protect, admin, generatePaymentLink);
router.post('/webhook', express.raw({ type: 'application/json' }), razorpayWebhook);

module.exports = router;
