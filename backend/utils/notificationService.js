const EmailService = require('./emailService');

class NotificationService {
    static normalizePhoneNumber(raw, defaultCountryCode = (process.env.DEFAULT_COUNTRY_CODE || '91')) {
        if (!raw) return '';
        const digits = String(raw).replace(/\D/g, '');
        if (digits.startsWith('0')) {
            return defaultCountryCode + digits.replace(/^0+/, '');
        }
        if (digits.length === 10) {
            return defaultCountryCode + digits;
        }
        if (digits.startsWith('91') || digits.startsWith('1') || digits.length > 10) {
            return digits;
        }
        return digits;
    }


    static async sendSMSNotification(phoneNumber, message) {
        try {
            // Placeholder for SMS API integration
            console.log(`SMS notification sent to ${phoneNumber}: ${message}`);
            
            // Example integration with Twilio SMS API:
            // const accountSid = process.env.TWILIO_ACCOUNT_SID;
            // const authToken = process.env.TWILIO_AUTH_TOKEN;
            // const client = require('twilio')(accountSid, authToken);
            
            // await client.messages.create({
            //     body: message,
            //     from: process.env.TWILIO_PHONE_NUMBER,
            //     to: phoneNumber
            // });
            
            return {
                success: true,
                message: 'SMS notification sent successfully',
                phoneNumber
            };
        } catch (error) {
            console.error('SMS notification error:', error);
            return {
                success: false,
                message: 'Failed to send SMS notification',
                error: error.message
            };
        }
    }

    static async sendOrderConfirmation(order, pdfPath = null) {
        try {
            const userEmail = order.shippingInfo.email;
            const userName = order.user?.name || 'Customer';
            
            // Send email notification with PDF
            const emailService = new EmailService();
            const emailResult = await emailService.sendOrderConfirmationEmail(userEmail, userName, order, pdfPath);
            
            return {
                success: true,
                email: emailResult,
                message: 'Order confirmation notification sent'
            };
        } catch (error) {
            console.error('Order confirmation notification error:', error);
            return {
                success: false,
                message: 'Failed to send order confirmation notification',
                error: error.message
            };
        }
    }

    static async sendCartSummary(userEmail, user, cart, pdfPath) {
        try {
            // Send email notification with PDF
            const emailService = new EmailService();
            const emailResult = await emailService.sendCartSummaryEmail(userEmail, user.name, cart, pdfPath);
            
            return {
                success: true,
                email: emailResult,
                message: 'Cart summary sent successfully via email'
            };

        } catch (error) {
            console.error('Send cart summary error:', error);
            return {
                success: false,
                message: 'Failed to send cart summary',
                error: error.message
            };
        }
    }
}

module.exports = NotificationService;
