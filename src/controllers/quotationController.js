const prisma = require('../config/db');
const { generatePdfDocument } = require('../services/pdfService');
const { uploadPdf } = require('../services/s3Service');
const { sendEmail } = require('../services/emailService');

// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Private/Admin
const getQuotations = async (req, res) => {
    try {
        const quotations = await prisma.quotation.findMany({
            include: { client: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(quotations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new quotation, generate PDF, upload to S3, email client
// @route   POST /api/quotations
// @access  Private/Admin
const createQuotation = async (req, res) => {
    const { clientId, itineraryDetails, price } = req.body;

    try {
        // 1. Fetch Client
        const client = await prisma.client.findUnique({ where: { id: Number(clientId) } });
        if (!client) return res.status(404).json({ message: 'Client not found' });

        // 2. Create Quotation Record
        let quotation = await prisma.quotation.create({
            data: {
                clientId: Number(clientId),
                itineraryDetails,
                price: Number(price),
                status: 'SENT',
            },
            include: { client: true },
        });

        // 3. Generate PDF
        const pdfBuffer = await generatePdfDocument({
            title: 'Quotation',
            clientName: client.name,
            details: itineraryDetails,
            amount: price,
            status: 'SENT',
        });

        // 4. Upload to S3/R2
        const pdfUrl = await uploadPdf(pdfBuffer, `quotation-${quotation.id}`);

        // 5. Update DB with PDF URL
        quotation = await prisma.quotation.update({
            where: { id: quotation.id },
            data: { pdfUrl },
        });

        // 6. Send Email (Optional if email is not present)
        if (client.email) {
            // You can attach directly from buffer or provide a link
            await sendEmail({
                to: client.email,
                subject: `Your Travel Quotation from Alitours`,
                html: `<p>Hi ${client.name},</p><p>Please find your travel itinerary quotation attached.</p><p>You can also view it <a href="${pdfUrl}">here</a>.</p>`,
                attachments: [
                    { filename: `Quotation-${quotation.id}.pdf`, content: pdfBuffer },
                ],
            });
        }

        res.status(201).json(quotation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getQuotations, createQuotation };
