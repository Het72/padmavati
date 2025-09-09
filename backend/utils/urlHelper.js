/**
 * Utility functions for URL construction
 */

/**
 * Get the base URL for the application
 * Handles HTTPS properly for hosting platforms like Render, Heroku, etc.
 * @param {Object} req - Express request object
 * @returns {string} Base URL (e.g., https://example.com)
 */
function getBaseUrl(req) {
    // First check if BACKEND_URL environment variable is set
    if (process.env.BACKEND_URL) {
        return process.env.BACKEND_URL;
    }
    
    // For hosting platforms that terminate SSL at the load balancer/proxy
    // Check for forwarded protocol header first
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('host');
    
    return `${protocol}://${host}`;
}

/**
 * Construct image URL for uploaded files
 * @param {Object} req - Express request object
 * @param {string} filename - Image filename
 * @returns {string} Full image URL
 */
function getImageUrl(req, filename) {
    const baseUrl = getBaseUrl(req);
    return `${baseUrl}/uploads/products/${filename}`;
}

module.exports = {
    getBaseUrl,
    getImageUrl
};
