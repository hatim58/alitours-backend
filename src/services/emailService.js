const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an email using Resend
 * @param {Object} options { to, subject, html, attachments }
 */
const sendEmail = async ({ to, subject, html, attachments = [] }) => {
    try {
        const data = await resend.emails.send({
            from: 'Alitours <onboarding@resend.dev>', // Update with your verified domain
            to: [to],
            subject,
            html,
            attachments, // Format: { filename: 'file.pdf', path: 'url or base64', content: buffer }
        });
        return data;
    } catch (error) {
        console.error('Email sending failed:', error);
        throw new Error('Could not send email');
    }
};

module.exports = { sendEmail };
