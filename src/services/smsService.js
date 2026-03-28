/**
 * SMS service to simulate sending OTPs.
 * Since no SMS provider is integrated yet, this logs to the console for now.
 * Integrate TWILIO or MSG91 here when credentials are available.
 */
const sendOTP = async (otp, phoneNumber1, phoneNumber2) => {
    try {
        const recipients = [phoneNumber1, phoneNumber2].filter(Boolean);
        
        console.log(`------------------------------------------`);
        console.log(`[AUTH] Generating OTP: ${otp}`);
        console.log(`[AUTH] Sending SMS to ${recipients.join(' and ')}`);
        console.log(`------------------------------------------`);
        
        // Integration point for MSG91 / Twilio
        /*
        await axios.post('https://api.msg91.com/api/v5/otp', {
            template_id: '...',
            mobile: recipient,
            authkey: process.env.MSG91_AUTH_KEY,
            otp: otp
        });
        */
        
        return { success: true, message: 'OTP sent successfully to both numbers (logged to console)' };
    } catch (error) {
        console.error('SMS sending failed:', error);
        return { success: false, message: 'Could not send SMS' };
    }
};

module.exports = { sendOTP };
