const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const { cleanupOldImages } = require('../utils/imageUtils');
const { getImageUrl } = require('../utils/urlHelper');
const multer = require('multer');
const path = require('path');

// Choose upload middleware based on environment
let uploadSingleImage, uploadMultipleImages;

try {
    // Try to use Cloudinary if environment variables are set
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
        const cloudinaryUpload = require('../middleware/cloudinaryUpload');
        uploadSingleImage = cloudinaryUpload.uploadSingleImage;
        uploadMultipleImages = cloudinaryUpload.uploadMultipleImages;
        console.log('✅ Using Cloudinary upload middleware');
    } else {
        throw new Error('Cloudinary not configured');
    }
} catch (error) {
    // Fallback to local storage
    const localUpload = require('../middleware/upload');
    uploadSingleImage = localUpload.uploadSingleImage;
    uploadMultipleImages = localUpload.uploadMultipleImages;
    console.log('⚠️  Using local upload middleware (Cloudinary not configured)');
}

// GET /products - Fetch all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
});

// GET /products/categories - Fetch distinct product categories
router.get('/categories/list', async (req, res) => {
    try {
        const categories = await Product.distinct('category');
        res.status(200).json({ success: true, categories });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error.message
        });
    }
});

// GET /products/:id - Fetch single product details
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching product',
            error: error.message
        });
    }
});

// POST /products (Admin) - Add a new product with image
router.post('/', isAuthenticatedUser, authorizeRoles('admin'), (req, res, next) => {
    uploadSingleImage(req, res, (err) => {
        if (err) {
            console.error('Upload error:', err);
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ 
                        success: false,
                        message: 'File too large. Maximum size is 20MB' 
                    });
                }
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return res.status(400).json({ 
                        success: false,
                        message: 'Unexpected field name in file upload' 
                    });
                }
            }
            return res.status(400).json({ 
                success: false,
                message: 'File upload error: ' + err.message 
            });
        }
        next();
    });
}, async (req, res) => {
    try {
        let productData = { ...req.body };
        
        // Add the authenticated user as the product creator
        productData.user = req.user.id;
        
        console.log('Product creation request:', {
            body: req.body,
            file: req.file ? {
                filename: req.file.filename,
                mimetype: req.file.mimetype,
                size: req.file.size
            } : 'No file'
        });
        
        // Ensure stock is a number
        if (productData.stock) {
            productData.stock = parseInt(productData.stock);
        }
        
        // Ensure price is a number
        if (productData.price) {
            productData.price = parseFloat(productData.price);
        }
        
        // If image was uploaded, add image information
        if (req.file) {
            // Check if it's Cloudinary or local storage
            if (req.file.secure_url) {
                // Cloudinary
                productData.image = req.file.secure_url;
            } else {
                // Local storage
                const imageUrl = getImageUrl(req, req.file.filename);
                productData.image = imageUrl;
            }
        }
        
        console.log('Creating product with data:', productData);
        const product = await Product.create(productData);
        
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(400).json({
            success: false,
            message: 'Error creating product',
            error: error.message
        });
    }
});

// POST /products/upload-image (Admin) - Update product image
router.post('/upload-image/:id', isAuthenticatedUser, authorizeRoles('admin'), uploadSingleImage, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image uploaded'
            });
        }

        // Clean up old image if it exists
        if (product.image) {
            try {
                await cleanupOldImages([{ url: product.image }]);
            } catch (cleanupError) {
                console.error('Error cleaning up old image:', cleanupError);
            }
        }

        // Update with new image
        if (req.file.secure_url) {
            // Cloudinary
            product.image = req.file.secure_url;
        } else {
            // Local storage
            product.image = getImageUrl(req, req.file.filename);
        }

        await product.save();

        res.status(200).json({
            success: true,
            message: 'Images uploaded successfully',
            product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error uploading images',
            error: error.message
        });
    }
});

// PUT /products/:id (Admin) - Update a product with optional image
router.put('/:id', isAuthenticatedUser, authorizeRoles('admin'), uploadSingleImage, async (req, res) => {
    try {
        console.log('Product update request:', {
            id: req.params.id,
            body: req.body,
            file: req.file ? {
                filename: req.file.filename,
                mimetype: req.file.mimetype,
                size: req.file.size
            } : 'No file'
        });
        
        let product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        let updateData = { ...req.body };
        
        // If new image was uploaded, update image information
        if (req.file) {
            // Clean up old image if it exists
            if (product.image) {
                try {
                    await cleanupOldImages([{ url: product.image }]);
                } catch (cleanupError) {
                    console.error('Error cleaning up old image:', cleanupError);
                }
            }
            
            if (req.file.secure_url) {
                // Cloudinary
                updateData.image = req.file.secure_url;
            } else {
                // Local storage
                updateData.image = getImageUrl(req, req.file.filename);
            }
        }

        product = await Product.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
            useFindAndModify: false
        });

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating product',
            error: error.message
        });
    }
});

// DELETE /products/:id (Admin) - Delete a product
router.delete('/:id', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Clean up product image before deleting
        if (product.image) {
            try {
                await cleanupOldImages([{ url: product.image }]);
            } catch (cleanupError) {
                console.error('Error cleaning up image:', cleanupError);
            }
        }

        await product.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: error.message
        });
    }
});

// DELETE /products/category/:name (Admin) - Delete all products under a category
router.delete('/category/:name', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
    try {
        const categoryName = req.params.name;
        const products = await Product.find({ category: categoryName });

        // Cleanup images for all products in the category
        for (const product of products) {
            if (product.image) {
                try {
                    await cleanupOldImages([{ url: product.image }]);
                } catch (cleanupError) {
                    console.error('Error cleaning up image:', cleanupError);
                }
            }
        }

        const result = await Product.deleteMany({ category: categoryName });
        res.status(200).json({
            success: true,
            message: `Category '${categoryName}' deleted with ${result.deletedCount} product(s) removed`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting category',
            error: error.message
        });
    }
});

module.exports = router;
