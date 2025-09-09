const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const cloudinary = require('../config/cloudinary');

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
    if (!oldImages || oldImages.length === 0) return;
    
    for (const image of oldImages) {
        if (image.public_id) {
            try {
                // Check if it's a Cloudinary image (has cloudinary URL pattern)
                if (image.url && image.url.includes('cloudinary.com')) {
                    // Delete from Cloudinary
                    await cloudinary.uploader.destroy(image.public_id);
                    console.log(`Deleted Cloudinary image: ${image.public_id}`);
                } else {
                    // Delete from local filesystem
                    deleteImageFile(image.public_id);
                }
            } catch (error) {
                console.error('Error cleaning up image:', error);
            }
        }
    }
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
