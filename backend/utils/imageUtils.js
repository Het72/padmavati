const fs = require('fs');
const path = require('path');

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
        const filepath = path.join(__dirname, '../uploads/products', filename);
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
    if (!oldImages || oldImages.length === 0) return;
    
    oldImages.forEach(image => {
        if (image.public_id) {
            deleteImageFile(image.public_id);
        }
    });
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
