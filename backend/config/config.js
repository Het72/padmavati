module.exports = {
    PORT: process.env.PORT || 5000,
    // MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/website_db',
    JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
    DEFAULT_COUNTRY_CODE: process.env.DEFAULT_COUNTRY_CODE || '91',
    // Email Configuration
    EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'mailtrap',
    // Gmail Configuration
    EMAIL_USER: process.env.EMAIL_USER || '',
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || '',
    // Mailtrap Configuration
    MAILTRAP_USER: process.env.MAILTRAP_USER || '',
    MAILTRAP_PASS: process.env.MAILTRAP_PASS || '',
    // Ethereal Configuration
    ETHEREAL_USER: process.env.ETHEREAL_USER || '',
    ETHEREAL_PASS: process.env.ETHEREAL_PASS || '',
    // Brevo Configuration
    BREVO_USER: process.env.BREVO_USER || '',
    BREVO_API_KEY: process.env.BREVO_API_KEY || '',
    // SendGrid Configuration
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || ''
};
