const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const PDFGenerator = require('../utils/pdfGenerator');
const NotificationService = require('../utils/notificationService');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const fs = require('fs'); // Added missing import for fs

// POST /checkout - Receive cart + user info, store order, generate PDF, send notifications
router.post('/checkout', isAuthenticatedUser, async (req, res) => {
    try {
        const { shippingInfo, paymentInfo, notes } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!shippingInfo || !paymentInfo) {
            return res.status(400).json({
                success: false,
                message: 'Shipping info and payment info are required'
            });
        }

        // Get user's cart
        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        const user = await User.findById(userId).select('name email');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // Skip stock validation (assume items are in stock by default)

        // Calculate prices - Simplified without tax and shipping
        const itemsPrice = cart.totalAmount;
        const totalPrice = itemsPrice; // No tax or shipping

        // Prepare order items
        const orderItems = cart.items.map(item => ({
            product: item.product._id,
            name: item.product.name,
            quantity: item.quantity,
            price: item.price,
            image: item.product.images[0]?.url || '',
            category: item.product.category || 'N/A'
        }));

        // Create order
        const order = await Order.create({
            user: userId,
            orderItems,
            shippingInfo,
            paymentInfo,
            paidAt: new Date(),
            itemsPrice,
            totalPrice,
            notes
        });

        // Update product stock
        for (const item of cart.items) {
            await Product.findByIdAndUpdate(item.product._id, {
                $inc: { stock: -item.quantity }
            });
        }

        // Clear cart
        cart.items = [];
        await cart.save();

        // Populate user info for PDF generation
        await order.populate('user', 'name email');

        // Generate PDF invoice
        let pdfResult = null;
        try {
            const pdfData = await PDFGenerator.generateInvoice(order);
            pdfResult = pdfData;
            
            // Store PDF path in order
            if (pdfData && pdfData.filePath) {
                order.pdfPath = pdfData.filePath;
                await order.save();
            }
        } catch (pdfError) {
            console.error('PDF generation error:', pdfError);
        }

        // Generate Cart PDF and send via WhatsApp
        let cartPdfResult = null;
        let cartSummaryNotification = null;
        try {
            const cartPdfData = await PDFGenerator.generateCartPDF({
                items: orderItems,
                totalItems: orderItems.length
            }, user || { name: '', email: '' });
            cartPdfResult = cartPdfData;

            try {
                cartSummaryNotification = await NotificationService.sendCartSummary(
                    user.email,
                    user || { name: '', email: '' },
                    { items: orderItems },
                    cartPdfResult?.filePath
                );
            } catch (sendCartErr) {
                console.error('Cart summary email send error:', sendCartErr);
            }
        } catch (cartPdfError) {
            console.error('Cart PDF generation error:', cartPdfError);
        }

        // Send notifications
        let notificationResult = null;
        try {
            notificationResult = await NotificationService.sendOrderConfirmation(
                order, 
                pdfResult?.filePath
            );
        } catch (notificationError) {
            console.error('Notification error:', notificationError);
        }

        // Note: PDF files are kept for download functionality
        // They will be cleaned up by a scheduled task or manual cleanup

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order,
            pdfGenerated: !!pdfResult,
            notificationsSent: !!notificationResult?.success,
            notificationDebug: notificationResult,
            cartSummarySent: !!cartSummaryNotification?.success,
            invoiceNumber: order.invoiceNumber
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error processing checkout',
            error: error.message
        });
    }
});

// GET /orders (Admin) - Fetch all orders
router.get('/', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
});

// GET /orders/:orderId - Fetch a specific order's details
router.get('/:orderId', isAuthenticatedUser, async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId)
            .populate('user', 'name email')
            .populate('orderItems.product', 'name images');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if user is requesting their own order or is admin
        if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only access your own orders'
            });
        }

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching order',
            error: error.message
        });
    }
});

// GET /orders/user/:userId - Fetch all orders for a specific user
router.get('/user/:userId', isAuthenticatedUser, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if user is requesting their own orders or is admin
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only access your own orders'
            });
        }

        const orders = await Order.find({ user: userId })
            .populate('orderItems.product', 'name images')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user orders',
            error: error.message
        });
    }
});

// PUT /orders/:orderId/status (Admin) - Update order status
router.put('/:orderId/status', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
    try {
        const { orderId } = req.params;
        const { orderStatus, notes } = req.body;

        if (!orderStatus) {
            return res.status(400).json({
                success: false,
                message: 'Order status is required'
            });
        }

        const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(orderStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order status'
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Update order status
        order.orderStatus = orderStatus;
        if (notes) order.notes = notes;
        
        // Set deliveredAt if status is 'Delivered'
        if (orderStatus === 'Delivered') {
            order.deliveredAt = new Date();
        }

        await order.save();

        // Send status update notification
        try {
            const message = `Order Status Update\n\nOrder ID: ${order.invoiceNumber}\nNew Status: ${orderStatus}\n\nThank you for your patience!`;
            await NotificationService.sendSMSNotification(order.shippingInfo.phoneNo, message);
        } catch (notificationError) {
            console.error('Status update notification error:', notificationError);
        }

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating order status',
            error: error.message
        });
    }
});

// DELETE /orders/:orderId/clear-status (Admin) - Clear order status and reset to pending
router.delete('/:orderId/clear-status', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Clear order status and reset to pending
        order.orderStatus = 'Pending';
        order.notes = order.notes ? `${order.notes}\n[Status cleared by admin on ${new Date().toLocaleString()}]` : `[Status cleared by admin on ${new Date().toLocaleString()}]`;
        order.deliveredAt = null; // Clear delivery date

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Order status cleared and reset to pending',
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error clearing order status',
            error: error.message
        });
    }
});

// DELETE /orders/user/:userId/clear-all (Admin) - Clear all orders for a specific user
router.delete('/user/:userId/clear-all', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Find all orders for the user
        const userOrders = await Order.find({ user: userId });
        
        if (userOrders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No orders found for this user'
            });
        }

        // Clear all order statuses
        const updatePromises = userOrders.map(order => {
            order.orderStatus = 'Pending';
            order.notes = order.notes ? `${order.notes}\n[All statuses cleared by admin on ${new Date().toLocaleString()}]` : `[All statuses cleared by admin on ${new Date().toLocaleString()}]`;
            order.deliveredAt = null;
            return order.save();
        });

        await Promise.all(updatePromises);

        res.status(200).json({
            success: true,
            message: `Cleared status for ${userOrders.length} order(s) for user ${user.email}`,
            clearedOrders: userOrders.length,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error clearing user orders',
            error: error.message
        });
    }
});

// DELETE /orders/clear-all (Admin) - Clear all orders statuses in the system
router.delete('/clear-all', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
    try {
        // Find all orders
        const allOrders = await Order.find({});
        
        if (allOrders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No orders found in the system'
            });
        }

        // Clear all order statuses
        const updatePromises = allOrders.map(order => {
            order.orderStatus = 'Pending';
            order.notes = order.notes ? `${order.notes}\n[All system orders cleared by admin on ${new Date().toLocaleString()}]` : `[All system orders cleared by admin on ${new Date().toLocaleString()}]`;
            order.deliveredAt = null;
            return order.save();
        });

        await Promise.all(updatePromises);

        res.status(200).json({
            success: true,
            message: `Cleared status for all ${allOrders.length} order(s) in the system`,
            clearedOrders: allOrders.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error clearing all orders',
            error: error.message
        });
    }
});

// GET /orders/:id/pdf - Generate and serve order PDF
router.get('/:id/pdf', isAuthenticatedUser, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user');
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Check if user owns this order or is admin
        if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Generate PDF if it doesn't exist
        let pdfPath = order.pdfPath;
        if (!pdfPath) {
            const pdfResult = await PDFGenerator.generateInvoice(order);
            
            if (pdfResult.success) {
                // Update order with PDF path
                order.pdfPath = pdfResult.filePath;
                await order.save();
                pdfPath = pdfResult.filePath;
            } else {
                return res.status(500).json({ success: false, message: 'Failed to generate PDF' });
            }
        }

        // Check if PDF file exists
        if (!fs.existsSync(pdfPath)) {
            // Regenerate PDF if file is missing
            const pdfResult = await PDFGenerator.generateInvoice(order);
            
            if (pdfResult.success) {
                order.pdfPath = pdfResult.filePath;
                await order.save();
                pdfPath = pdfResult.filePath;
            } else {
                return res.status(500).json({ success: false, message: 'Failed to generate PDF' });
            }
        }

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        // Use customer name from checkout form, fallback to invoice number
        const customerName = order.shippingInfo?.name || order.user?.name || 'customer';
        const sanitizedName = customerName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').toLowerCase();
        res.setHeader('Content-Disposition', `attachment; filename="invoice_${sanitizedName}_${order.invoiceNumber}.pdf"`);
        
        // Stream the PDF file
        const fileStream = fs.createReadStream(pdfPath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate PDF', error: error.message });
    }
});

module.exports = router;
