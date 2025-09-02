const nodemailer = require('nodemailer');
const fs = require('fs');

class EmailService {
    constructor() {
        const emailService = process.env.EMAIL_SERVICE || 'mailtrap';
        
        if (emailService === 'mailtrap') {
            // Mailtrap configuration
            this.transporter = nodemailer.createTransport({
                host: 'smtp.mailtrap.io',
                port: 2525,
                auth: {
                    user: process.env.MAILTRAP_USER,
                    pass: process.env.MAILTRAP_PASS
                }
            });
        } else if (emailService === 'ethereal') {
            // Ethereal (nodemailer testing service)
            this.transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.ETHEREAL_USER,
                    pass: process.env.ETHEREAL_PASS
                }
            });
        } else if (emailService === 'brevo') {
            // Brevo (Sendinblue) configuration
            this.transporter = nodemailer.createTransport({
                host: 'smtp-relay.brevo.com',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.BREVO_USER || 'your_brevo_email@domain.com',
                    pass: process.env.BREVO_API_KEY
                }
            });
        } else if (emailService === 'sendgrid') {
            // SendGrid configuration
            this.transporter = nodemailer.createTransport({
                host: 'smtp.sendgrid.net',
                port: 587,
                secure: false,
                auth: {
                    user: 'apikey',
                    pass: process.env.SENDGRID_API_KEY
                }
            });
        } else {
            // Gmail fallback
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD
                }
            });
        }
    }

    async sendInvoiceEmail(userEmail, userName, order, pdfPath) {
        try {
            const mailOptions = {
                from: `"Padmavati Store" <${process.env.BREVO_USER || 'hetshah685@gmail.com'}>`,
                to: userEmail,
                subject: `Invoice for Order #${order.invoiceNumber || order._id}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Order Confirmation</h2>
                        <p>Hello ${userName},</p>
                        <p>Thank you for your order! Your invoice is attached to this email.</p>
                        
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Order Details</h3>
                            <p><strong>Order ID:</strong> ${order._id}</p>
                            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                            <p><strong>Total Amount:</strong> ₹${order.totalPrice.toFixed(2)}</p>
                            <p><strong>Status:</strong> ${order.orderStatus}</p>
                        </div>
                        
                        <p>If you have any questions about your order, please don't hesitate to contact us.</p>
                        
                        <p>Best regards,<br>Your Store Team</p>
                    </div>
                `,
                attachments: [
                    {
                        filename: `invoice_${(order.shippingInfo?.name || order.user?.name || 'customer').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').toLowerCase()}_${order.invoiceNumber || order._id}.pdf`,
                        path: pdfPath
                    }
                ]
            };

            const result = await this.transporter.sendMail(mailOptions);
            
            return {
                success: true,
                messageId: result.messageId,
                message: 'Invoice email sent successfully'
            };

        } catch (error) {
            console.error('Email sending error:', error);
            return {
                success: false,
                message: 'Failed to send invoice email',
                error: error.message
            };
        }
    }

    async sendCartSummaryEmail(userEmail, userName, cart, pdfPath) {
        try {
            const totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            const mailOptions = {
                from: `"Padmavati Store" <${process.env.BREVO_USER || 'hetshah685@gmail.com'}>`,
                to: userEmail,
                subject: 'Your Cart Summary',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Cart Summary</h2>
                        <p>Hello ${userName},</p>
                        <p>Here's your current cart summary with ${cart.items.length} items.</p>
                        
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Cart Details</h3>
                            <p><strong>Total Items:</strong> ${cart.items.length}</p>
                            <p><strong>Total Amount:</strong> ₹${totalAmount.toFixed(2)}</p>
                            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                        </div>
                        
                        <p>Check the attached PDF for complete details!</p>
                        
                        <p>Best regards,<br>Your Store Team</p>
                    </div>
                `,
                attachments: [
                    {
                        filename: `cart_summary_${userName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.pdf`,
                        path: pdfPath
                    }
                ]
            };

            const result = await this.transporter.sendMail(mailOptions);
            
            return {
                success: true,
                messageId: result.messageId,
                message: 'Cart summary email sent successfully'
            };

        } catch (error) {
            console.error('Email sending error:', error);
            return {
                success: false,
                message: 'Failed to send cart summary email',
                error: error.message
            };
        }
    }

    async sendOrderConfirmationEmail(userEmail, userName, order, pdfPath) {
        try {
            const mailOptions = {
                from: `"Padmavati Store" <${process.env.BREVO_USER || 'hetshah685@gmail.com'}>`,
                to: userEmail,
                subject: `Order Confirmation - #${order.invoiceNumber || order._id}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Order Confirmation</h2>
                        <p>Hello ${userName},</p>
                        <p>Your order has been confirmed and is being processed!</p>
                        
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Order Details</h3>
                            <p><strong>Order ID:</strong> ${order._id}</p>
                            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                            <p><strong>Total Amount:</strong> ₹${order.totalPrice.toFixed(2)}</p>
                            <p><strong>Status:</strong> ${order.orderStatus}</p>
                        </div>
                        
                        <p>Your invoice is attached to this email for your records.</p>
                        
                        <p>We'll keep you updated on the status of your order.</p>
                        
                        <p>Best regards,<br>Your Store Team</p>
                    </div>
                `,
                attachments: [
                    {
                        filename: `order_confirmation_${(order.shippingInfo?.name || order.user?.name || 'customer').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').toLowerCase()}_${order._id}.pdf`,
                        path: pdfPath
                    }
                ]
            };

            const result = await this.transporter.sendMail(mailOptions);
            
            return {
                success: true,
                messageId: result.messageId,
                message: 'Order confirmation email sent successfully'
            };

        } catch (error) {
            console.error('Email sending error:', error);
            return {
                success: false,
                message: 'Failed to send order confirmation email',
                error: error.message
            };
        }
    }
}

module.exports = EmailService;
