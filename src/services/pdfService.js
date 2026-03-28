const PDFDocument = require('pdfkit');

/**
 * Generate PDF buffer for Quotations or Invoices
 * @param {Object} data Needs title, clientName, details, amount
 * @returns {Promise<Buffer>}
 */
const generatePdfDocument = (data) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Header
            doc
                .fontSize(25)
                .text('Alitours', { align: 'center' })
                .moveDown();

            doc
                .fontSize(20)
                .text(data.title || 'Quotation', { align: 'center' })
                .moveDown();

            // Client Info
            doc
                .fontSize(12)
                .text(`Date: ${new Date().toLocaleDateString()}`)
                .text(`Client: ${data.clientName}`)
                .moveDown();

            // Details
            doc
                .fontSize(14)
                .text('Details:', { underline: true })
                .moveDown(0.5)
                .fontSize(12)
                .text(data.details || 'N/A')
                .moveDown();

            // Pricing
            doc
                .fontSize(14)
                .text('Summary:', { underline: true })
                .moveDown(0.5)
                .fontSize(12)
                .text(`Total Amount: $${(data.amount || 0).toFixed(2)}`)
                .moveDown();

            if (data.status) {
                doc.text(`Status: ${data.status}`);
            }

            // Footer
            doc
                .moveDown(4)
                .fontSize(10)
                .text('Thank you for choosing Alitours!', { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generatePdfDocument };
