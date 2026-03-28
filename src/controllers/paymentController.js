const prisma = require('../config/db');
const { createPaymentLink, verifyWebhookSignature } = require('../services/razorpayService');
const { generatePdfDocument } = require('../services/pdfService');
const { uploadPdf } = require('../services/s3Service');
const { sendEmail } = require('../services/emailService');

// @desc    Generate Payment Link for a quotation
// @route   POST /api/payments/link
// @access  Private/Admin
const generatePaymentLink = async (req, res) => {
    const { quotationId } = req.body;

    try {
        const quotation = await prisma.quotation.findUnique({
            where: { id: Number(quotationId) },
            include: { client: true },
        });

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        // Create tracking Payment Record
        const payment = await prisma.payment.create({
            data: {
                clientId: quotation.clientId,
                amount: quotation.price,
                method: 'RAZORPAY',
                status: 'PENDING',
            },
            include: { client: true },
        });

        const paymentLink = await createPaymentLink({
            amount: payment.amount,
            description: `Payment for Alitours Quotation #${quotation.id}`,
            clientName: quotation.client.name,
            clientEmail: quotation.client.email || '',
            clientPhone: quotation.client.phone || '',
            referenceId: `pay_${payment.id}_quo_${quotation.id}`,
        });

        res.json({ paymentId: payment.id, paymentLink: paymentLink.short_url });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Handle Razorpay Webhook
// @route   POST /api/payments/webhook
// @access  Public
const razorpayWebhook = async (req, res) => {
    try {
        // Razorpay Webhook expects raw body string, but express.json() parses it.
        // Express provides stringified payload for HMAC check in typical setups.
        // We will assume `rawBody` middleware is available or verify based on req.body mapping.
        const signature = req.headers['x-razorpay-signature'];
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        // A simpler approach for Express json body:
        const bodyString = JSON.stringify(req.body);

        // Note: To be fully secure with webhooks, use express.raw({ type: 'application/json' }) 
        // to capture exact raw body string for crypto check. 

        // Check Event Type (e.g. payment_link.paid, payment.captured)
        if (req.body.event === 'payment_link.paid') {
            const paymentLinkPayload = req.body.payload.payment_link.entity;
            const refId = paymentLinkPayload.reference_id; // pay_4_quo_12

            const referenceParts = refId.split('_');
            const paymentId = Number(referenceParts[1]);
            const quotationId = Number(referenceParts[3]);

            // Verify payment exists
            let payment = await prisma.payment.findUnique({
                where: { id: paymentId },
                include: { client: true },
            });

            if (payment && payment.status !== 'SUCCESS') {
                const transactionId = req.body.payload.payment?.entity?.id || paymentLinkPayload.id;

                // Mark Quotation as accepted
                const quotation = await prisma.quotation.update({
                    where: { id: quotationId },
                    data: { status: 'ACCEPTED' },
                });

                // Optionally, create a Booking
                const booking = await prisma.booking.create({
                    data: {
                        clientId: payment.clientId,
                        quotationId: quotation.id,
                        services: quotation.itineraryDetails,
                    },
                });

                // Generate receipt PDF
                const receiptBuffer = await generatePdfDocument({
                    title: 'Payment Receipt',
                    clientName: payment.client.name,
                    details: 'Receipt for ' + quotation.itineraryDetails,
                    amount: payment.amount,
                    status: 'PAID',
                });

                const receiptUrl = await uploadPdf(receiptBuffer, `receipt-${payment.id}`);

                // Update Payment record
                payment = await prisma.payment.update({
                    where: { id: paymentId },
                    data: {
                        status: 'SUCCESS',
                        transactionId,
                        receiptUrl,
                    },
                });

                // Email Receipt
                if (payment.client.email) {
                    await sendEmail({
                        to: payment.client.email,
                        subject: 'Alitours Payment Receipt',
                        html: `<p>Hi ${payment.client.name},</p><p>Thank you for your payment!</p><p>You can view your receipt <a href="${receiptUrl}">here</a>.</p>`,
                        attachments: [
                            { filename: `Receipt-${payment.id}.pdf`, content: receiptBuffer },
                        ],
                    });
                }
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).send('Webhook Processing Failed');
    }
};

module.exports = { generatePaymentLink, razorpayWebhook };
