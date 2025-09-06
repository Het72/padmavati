const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const { uploadSingleImage, uploadMultipleImages } = require('../middleware/upload');
const { cleanupOldImages } = require('../utils/imageUtils');
const multer = require('multer');
const path = require('path');

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
            // Use environment variable for base URL or construct from request
            const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
            const imageUrl = `${baseUrl}/uploads/products/${req.file.filename}`;
            productData.images = [{
                public_id: req.file.filename,
                url: imageUrl
            }];
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

// POST /products/upload-images (Admin) - Upload multiple images for a product
router.post('/upload-images/:id', isAuthenticatedUser, authorizeRoles('admin'), uploadMultipleImages, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No images uploaded'
            });
        }

        // Add new images to existing images array
        const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
        const newImages = req.files.map(file => ({
            public_id: file.filename,
            url: `${baseUrl}/uploads/products/${file.filename}`
        }));

        product.images = [...product.images, ...newImages];
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
        let product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        let updateData = { ...req.body };
        
        // If new image was uploaded, update image information and cleanup old images
        if (req.file) {
            // Clean up old images before setting new ones
            if (product.images && product.images.length > 0) {
                await cleanupOldImages(product.images);
            }
            
            const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
            const imageUrl = `${baseUrl}/uploads/products/${req.file.filename}`;
            updateData.images = [{
                public_id: req.file.filename,
                url: imageUrl
            }];
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

        // Clean up product images before deleting
        if (product.images && product.images.length > 0) {
            await cleanupOldImages(product.images);
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
            if (product.images && product.images.length > 0) {
                await cleanupOldImages(product.images);
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
