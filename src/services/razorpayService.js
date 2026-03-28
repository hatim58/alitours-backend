const Razorpay = require('razorpay');
const crypto = require('crypto');

let razorpayInstance = null;

const getRazorpayInstance = () => {
    if (!razorpayInstance) {
        razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }
    return razorpayInstance;
};

/**
 * Generate Razorpay Payment Link
 * @param {Object} options { amount (in INR/smallest currency unit depending on config), currency, description, clientData }
 */
const createPaymentLink = async ({ amount, currency = 'INR', description, clientName, clientEmail, clientPhone, referenceId }) => {
    try {
        const rzp = getRazorpayInstance();

        const payload = {
            amount: amount * 100, // Razorpay takes amount in standard multiple, typically paisa for INR (so multiply by 100)
            currency,
            accept_partial: false,
            description,
            customer: {
                name: clientName,
                email: clientEmail,
                contact: clientPhone,
            },
            notify: {
                sms: true,
                email: true,
            },
            reminder_enable: true,
            reference_id: referenceId, // Store payment/quotation ID here for mapping later
        };

        const paymentLink = await rzp.paymentLink.create(payload);
        return paymentLink;
    } catch (error) {
        console.error('Razorpay Error:', error);
        throw new Error('Failed to create payment link');
    }
};

/**
 * Verify Razorpay Webhook signature
 */
const verifyWebhookSignature = (body, signature, secret) => {
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
    return expectedSignature === signature;
};

module.exports = { createPaymentLink, verifyWebhookSignature };
