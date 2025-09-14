const fs = require('fs');
const path = require('path');
const config = require('../config/config');

// Validate image file type
const isValidImageType = (mimetype) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return allowedTypes.includes(mimetype);
};

// Validate image file size (in bytes)
const isValidImageSize = (size, maxSizeMB = 5) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return size <= maxSizeBytes;
};

// Generate unique filename
const generateUniqueFilename = (originalname) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const extension = path.extname(originalname);
    const nameWithoutExt = path.basename(originalname, extension);
    return `${nameWithoutExt}-${timestamp}-${random}${extension}`;
};

// Delete image file from filesystem
const deleteImageFile = (filename) => {
    try {
        const baseUploadsDir = (config.UPLOADS_DIR && config.UPLOADS_DIR.trim().length > 0)
            ? config.UPLOADS_DIR
            : path.join(__dirname, '..', 'uploads');
        const filepath = path.join(baseUploadsDir, 'products', filename);
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting image file:', error);
        return false;
    }
};

// Clean up old images when product is updated/deleted
const cleanupOldImages = async (oldImages) => {
    // For MongoDB storage, images are automatically cleaned up when the product is deleted
    // No additional cleanup needed since images are stored as part of the product document
    console.log('Images stored in MongoDB - no cleanup needed');
};

// Get image dimensions (basic validation)
const getImageInfo = (file) => {
    return {
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
    };
};

module.exports = {
    isValidImageType,
    isValidImageSize,
    generateUniqueFilename,
    deleteImageFile,
    cleanupOldImages,
    getImageInfo
};
