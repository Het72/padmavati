const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const { cleanupOldImages } = require('../utils/imageUtils');
const { getImageUrl, addImageUrlToProduct, addImageUrlsToProducts } = require('../utils/imageUrlHelper');
const multer = require('multer');
const path = require('path');

// Use MongoDB storage for image uploads
const mongodbUpload = require('../middleware/mongodbUpload');
const uploadSingleImage = mongodbUpload.uploadSingleImage;
const uploadMultipleImages = mongodbUpload.uploadMultipleImages;
console.log('✅ Using MongoDB upload middleware');

// GET /products - Fetch all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        const productsWithImageUrls = addImageUrlsToProducts(req, products);
        
        res.status(200).json({
            success: true,
            count: products.length,
            products: productsWithImageUrls
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

        const productWithImageUrl = addImageUrlToProduct(req, product);

        res.status(200).json({
            success: true,
            product: productWithImageUrl
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching product',
            error: error.message
        });
    }
});

// GET /products/:id/image - Serve product image from MongoDB
router.get('/:id/image', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (!product.image || !product.image.data) {
            return res.status(404).json({
                success: false,
                message: 'No image found for this product'
            });
        }

        // Set appropriate headers
        res.set({
            'Content-Type': product.image.contentType,
            'Content-Length': product.image.size,
            'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
            'ETag': `"${product._id}"`
        });

        // Send the image data
        res.send(product.image.data);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching product image',
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
        
        // If image was uploaded, add image information to MongoDB
        if (req.file) {
            productData.image = {
                data: req.file.buffer,
                contentType: req.file.mimetype,
                filename: req.file.originalname,
                size: req.file.size
            };
        }
        
        console.log('Creating product with data:', productData);
        const product = await Product.create(productData);
        const productWithImageUrl = addImageUrlToProduct(req, product);
        
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product: productWithImageUrl
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

        // Clean up old image if it exists (not needed for MongoDB storage)
        // Images are automatically replaced when updating

        // Update with new image
        product.image = {
            data: req.file.buffer,
            contentType: req.file.mimetype,
            filename: req.file.originalname,
            size: req.file.size
        };

        await product.save();
        const productWithImageUrl = addImageUrlToProduct(req, product);

        res.status(200).json({
            success: true,
            message: 'Images uploaded successfully',
            product: productWithImageUrl
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
            // Update image in MongoDB (old image automatically replaced)
            updateData.image = {
                data: req.file.buffer,
                contentType: req.file.mimetype,
                filename: req.file.originalname,
                size: req.file.size
            };
        }

        product = await Product.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
            useFindAndModify: false
        });

        const productWithImageUrl = addImageUrlToProduct(req, product);

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            product: productWithImageUrl
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

        // Clean up product image before deleting (not needed for MongoDB storage)
        // Images are automatically deleted when product is deleted

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

        // Cleanup images for all products in the category (not needed for MongoDB storage)
        // Images are automatically deleted when products are deleted

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

// GET /products/image/:id - Serve product image from MongoDB
router.get('/image/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        if (!product.image || !product.image.data) {
            return res.status(404).json({
                success: false,
                message: 'No image found for this product'
            });
        }
        
        // Set appropriate headers
        res.set({
            'Content-Type': product.image.contentType,
            'Content-Length': product.image.data.length,
            'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
            'ETag': `"${product._id}"`
        });
        
        // Send the image data
        res.send(product.image.data);
        
    } catch (error) {
        console.error('Error serving image:', error);
        res.status(500).json({
            success: false,
            message: 'Error serving image',
            error: error.message
        });
    }
});

module.exports = router;
