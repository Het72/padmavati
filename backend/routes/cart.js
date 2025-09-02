const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const { isAuthenticatedUser } = require('../middleware/auth');
const PDFGenerator = require('../utils/pdfGenerator');
const NotificationService = require('../utils/notificationService');
const fs = require('fs'); // Added for file cleanup

// POST /cart - Save cart data for a user
router.post('/', isAuthenticatedUser, async (req, res) => {
    try {
        const { items } = req.body;
        const userId = req.user.id;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart items are required and must be an array'
            });
        }

        // Validate items and get current product prices (no stock checks)
        const validatedItems = [];
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: `Product with ID ${item.product} not found`
                });
            }

            if (item.quantity < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Quantity must be at least 1'
                });
            }
            validatedItems.push({
                product: item.product,
                quantity: item.quantity,
                price: product.price,
                category: product.category || 'N/A',
            });
        }

        // Find existing cart or create new one
        let cart = await Cart.findOne({ user: userId });
        
        if (cart) {
            // Update existing cart
            cart.items = validatedItems;
            await cart.save();
        } else {
            // Create new cart
            cart = await Cart.create({
                user: userId,
                items: validatedItems
            });
        }

        // Populate product details for response
        await cart.populate('items.product', 'name price images');

        res.status(200).json({
            success: true,
            message: 'Cart saved successfully',
            cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error saving cart',
            error: error.message
        });
    }
});

// GET /cart/:userId - Fetch cart for a specific user
router.get('/:userId', isAuthenticatedUser, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if user is requesting their own cart or is admin
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only access your own cart'
            });
        }

        const cart = await Cart.findOne({ user: userId }).populate('items.product', 'name price images stock');

        if (!cart) {
            return res.status(200).json({
                success: true,
                message: 'Cart is empty',
                cart: {
                    user: userId,
                    items: [],
                    totalAmount: 0,
                    totalItems: 0
                }
            });
        }

        res.status(200).json({
            success: true,
            cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching cart',
            error: error.message
        });
    }
});

// DELETE /cart/:userId - Clear cart
router.delete('/:userId', isAuthenticatedUser, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if user is clearing their own cart or is admin
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only clear your own cart'
            });
        }

        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // Clear cart items
        cart.items = [];
        await cart.save();

        res.status(200).json({
            success: true,
            message: 'Cart cleared successfully',
            cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error clearing cart',
            error: error.message
        });
    }
});

// Additional utility endpoint: Add item to cart
router.post('/add-item', isAuthenticatedUser, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const userId = req.user.id;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        // Validate product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check stock availability
        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock. Available: ${product.stock}`
            });
        }

        // Find or create cart
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = await Cart.create({
                user: userId,
                items: []
            });
        }

        // Check if product already exists in cart
        const existingItemIndex = cart.items.findIndex(item => 
            item.product.toString() === productId
        );

        if (existingItemIndex > -1) {
            // Update quantity
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            cart.items.push({
                product: productId,
                quantity,
                price: product.price,
                category: product.category || 'N/A',
            });
        }

        await cart.save();
        await cart.populate('items.product', 'name price images');

        res.status(200).json({
            success: true,
            message: 'Item added to cart successfully',
            cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding item to cart',
            error: error.message
        });
    }
});

// Additional utility endpoint: Remove item from cart
router.delete('/remove-item/:productId', isAuthenticatedUser, async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // Remove item from cart
        cart.items = cart.items.filter(item => 
            item.product.toString() !== productId
        );

        await cart.save();
        await cart.populate('items.product', 'name price images');

        res.status(200).json({
            success: true,
            message: 'Item removed from cart successfully',
            cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error removing item from cart',
            error: error.message
        });
    }
});

// POST /cart/generate-pdf/:userId - Generate PDF from cart and send via email
router.post('/generate-pdf/:userId', isAuthenticatedUser, async (req, res) => {
    try {
        const { userId } = req.params;
        const { email } = req.body;
        
        // Check if user is requesting their own cart or is admin
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only access your own cart'
            });
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required for PDF delivery'
            });
        }

        // Get user details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get cart with populated product details
        const cart = await Cart.findOne({ user: userId }).populate('items.product', 'name price images stock');
        
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty. Cannot generate PDF.'
            });
        }

        // Generate PDF from cart
        const pdfResult = await PDFGenerator.generateCartPDF(cart, user);
        
        // Send PDF via email
        const notificationResult = await NotificationService.sendCartSummary(
            email,
            user,
            cart,
            pdfResult.filePath
        );

        // Clean up temporary PDF file
        try {
            fs.unlinkSync(pdfResult.filePath);
        } catch (cleanupError) {
            console.error('Error cleaning up PDF file:', cleanupError);
        }

        res.status(200).json({
            success: true,
            message: 'Cart PDF generated and sent via email successfully',
            pdfGenerated: true,
            emailSent: notificationResult.success,
            cart: {
                totalItems: cart.items.length,
                totalAmount: cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
            }
        });

    } catch (error) {
        console.error('Error generating cart PDF:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating cart PDF',
            error: error.message
        });
    }
});

module.exports = router;
