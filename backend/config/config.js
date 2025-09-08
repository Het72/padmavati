module.exports = {
    PORT: process.env.PORT || 5000,
    // MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/website_db',
    JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
    DEFAULT_COUNTRY_CODE: process.env.DEFAULT_COUNTRY_CODE || '91',
    // Base URL for constructing absolute asset URLs
    BACKEND_URL: process.env.BACKEND_URL || '',
    // Uploads directory (supports persistent disks in hosting)
    UPLOADS_DIR: process.env.UPLOADS_DIR || '',
    // Placeholder image for missing product images
    PLACEHOLDER_IMAGE_URL: process.env.PLACEHOLDER_IMAGE_URL || 'https://via.placeholder.com/600x600?text=No+Image',
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
