const multer = require('multer');

// Configure multer to store files in memory as Buffer
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB limit
    },
    fileFilter: fileFilter
});

// Middleware to handle single image upload
const uploadSingleImage = upload.single('image');

// Middleware to handle multiple image uploads
const uploadMultipleImages = upload.array('images', 5); // Max 5 images

module.exports = {
    uploadSingleImage,
    uploadMultipleImages,
    upload
};

