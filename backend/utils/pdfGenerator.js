const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
    static async generateInvoice(order) {
        console.log('🎯 DEBUG: Using UPDATED PDF Generator - NO TAX/SHIPPING');
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                // Use customer name from checkout form, fallback to invoice number
                const customerName = order.shippingInfo?.name || order.user?.name || 'customer';
                const sanitizedName = customerName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').toLowerCase();
                const fileName = `invoice_${sanitizedName}_${order.invoiceNumber}.pdf`;
                const filePath = path.join(__dirname, '../temp', fileName);
                
                // Ensure temp directory exists
                const tempDir = path.dirname(filePath);
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }
                
                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                // Company Logo (if exists)
                const logoPath = path.join(__dirname, '../../frontend/public/logo.jpg');
                if (fs.existsSync(logoPath)) {
                    try {
                        doc.image(logoPath, 50, 50, { width: 120, height: 60 });
                        doc.moveDown(0.5);
                    } catch (logoError) {
                        console.log('Logo loading error:', logoError.message);
                    }
                }

                // Header
                doc.fontSize(20).text('Order Invoice', { align: 'right' });
                doc.moveDown();
                
                // Company Info
                doc.fontSize(12).text('Padmavati Creations', { align: 'right' });
                doc.fontSize(10).text('E10, Global Market', { align: 'right' });
                doc.fontSize(10).text('Surat, Gujarat 395001', { align: 'right' });
                doc.fontSize(10).text('Phone: +91 9104052511', { align: 'right' });
                doc.moveDown();

                // Invoice Details
                doc.fontSize(14).text('Invoice Details');
                // doc.fontSize(10).text(`Invoice Number: ${order.invoiceNumber}`);
                doc.fontSize(10).text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
                // doc.fontSize(10).text(`Order ID: ${order._id}`);
                doc.moveDown();

                // Customer Info
                doc.fontSize(14).text('Customer Information');
                doc.fontSize(10).text(`Name: ${order.shippingInfo.name || order.user.name || 'N/A'}`);
                doc.fontSize(10).text(`Phone: ${order.shippingInfo.phoneNo || 'N/A'}`);
                doc.fontSize(10).text(`Address: ${order.shippingInfo.address || 'N/A'}`);
                doc.moveDown();
                
                // Merge Notes into customer info (if present)
                if (order.notes) {
                    doc.fontSize(10).text(`Notes: ${order.notes}`);
                    doc.moveDown();
                }

                // Order Items Table
                doc.fontSize(14).text('Order Items');
                doc.moveDown();

                // Table Header
                const tableTop = doc.y;
                doc.fontSize(10);
                doc.text('Product', 50, tableTop);
                doc.text('Category', 200, tableTop);
                doc.text('Quantity', 380, tableTop);
                doc.text('Price', 450, tableTop);
                doc.text('Total', 520, tableTop);
                
                doc.moveTo(50, tableTop + 20).lineTo(580, tableTop + 20).stroke();
                doc.moveDown();

                // Table Rows with images
                let currentY = doc.y;
                order.orderItems.forEach((item, index) => {
                    // Product image (if available)
                    if (item.image) {
                        try {
                            // Try to load image from URL or local path
                            const imagePath = item.image.startsWith('http') ? item.image : path.join(__dirname, '../uploads/products', item.image);
                            if (fs.existsSync(imagePath) || item.image.startsWith('http')) {
                                // For local images, we can embed them directly
                                // For URLs, we'll skip for now as PDFKit doesn't support direct URL loading
                                if (!item.image.startsWith('http')) {
                                    doc.image(imagePath, 50, currentY, { width: 30, height: 30 });
                                }
                            }
                        } catch (imageError) {
                            console.log('Image loading error:', imageError.message);
                        }
                    }
                    
                    // Product details
                    doc.fontSize(10);
                    doc.text(item.category || 'N/A', 200, currentY);
                    doc.text(item.name, 90, currentY);
                    doc.text(item.quantity.toString(), 380, currentY);
                    doc.text(`${item.price.toFixed(2)}`, 450, currentY);
                    doc.text(`${(item.price * item.quantity).toFixed(2)}`, 520, currentY);
                    
                    currentY += 40; // Increased spacing to accommodate images
                });

                doc.moveDown();
                doc.moveTo(50, currentY).lineTo(580, currentY).stroke();
                doc.moveDown();

                // Totals block with precise right alignment
                const rightEdge = doc.page.width - doc.page.margins.right;
                const leftEdge = doc.page.margins.left;
                const totalsY = currentY + 10;

                // Divider above totals
                doc.moveTo(leftEdge, totalsY - 8).lineTo(rightEdge, totalsY - 8).stroke();

                const totalValueStr = `Rs. ${order.totalPrice.toFixed(2)}`;
                // Use equal font sizes for label and value
                const totalValueFontSize = 14;
                const totalLabelFontSize = 14;

                doc.fontSize(totalValueFontSize);
                const totalValueWidth = doc.widthOfString(totalValueStr);
                const totalValueX = rightEdge - totalValueWidth;
                doc.text(totalValueStr, totalValueX, totalsY);

                const totalLabelStr = 'Total:';
                doc.fontSize(totalLabelFontSize);
                const totalLabelWidth = doc.widthOfString(totalLabelStr);
                const totalLabelX = totalValueX - 10 - totalLabelWidth;
                doc.text(totalLabelStr, totalLabelX, totalsY);
                
                doc.moveDown(2);

                // Footer
                doc.fontSize(12).text('Thank you for your business!', 50, doc.y, { align: 'center' });
                doc.fontSize(12).text('GST is applicable additionally', 50, doc.y, { align: 'center' });

                doc.end();

                stream.on('finish', () => {
                    try {
                        const stats = fs.statSync(filePath);
                        resolve({ 
                            success: true,
                            filePath, 
                            fileName,
                            fileSize: stats.size
                        });
                    } catch (error) {
                        resolve({ 
                            success: true,
                            filePath, 
                            fileName,
                            fileSize: 0
                        });
                    }
                });

                stream.on('error', (error) => {
                    reject(error);
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    static async generateCartPDF(cart, user) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                // Use customer name for cart PDF filename
                const customerName = user?.name || 'customer';
                const sanitizedName = customerName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').toLowerCase();
                const fileName = `cart_${sanitizedName}_${Date.now()}.pdf`;
                const filePath = path.join(__dirname, '../temp', fileName);
                
                // Ensure temp directory exists
                const tempDir = path.dirname(filePath);
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }
                
                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                // Company Logo (if exists)
                const logoPath = path.join(__dirname, '../../frontend/public/logo.jpg');
                if (fs.existsSync(logoPath)) {
                    try {
                        doc.image(logoPath, 50, 50, { width: 80, height: 80 });
                        doc.moveDown(0.5);
                    } catch (logoError) {
                        console.log('Logo loading error:', logoError.message);
                    }
                }

                // Header
                doc.fontSize(20).text('CART SUMMARY', { align: 'center' });
                doc.moveDown();
                
                // Company Info
                doc.fontSize(12).text('Padmavati Croptop Manufacturers', { align: 'center' });
                doc.fontSize(10).text('E310, Ground Floor, Global Textile Market', { align: 'center' });
                doc.fontSize(10).text('Surat, Gujarat 395010', { align: 'center' });
                doc.fontSize(10).text('Phone: +91 9104052511', { align: 'center' });
                doc.moveDown();

                // Cart Details
                doc.fontSize(14).text('Cart Details');
                doc.fontSize(10).text(`Date: ${new Date().toLocaleDateString()}`);
                doc.fontSize(10).text(`Customer: ${user.name || 'Guest'}`);
                doc.fontSize(10).text(`Email: ${user.email || 'N/A'}`);
                doc.moveDown();

                // Cart Items Table
                doc.fontSize(14).text('Cart Items');
                doc.moveDown();

                // Table Header
                const tableTop = doc.y;
                doc.fontSize(10);
                doc.text('Product', 50, tableTop);
                doc.text('Category', 200, tableTop);
                doc.text('Quantity', 300, tableTop);
                doc.text('Price', 380, tableTop);
                doc.text('Total', 450, tableTop);
                
                doc.moveTo(50, tableTop + 20).lineTo(580, tableTop + 20).stroke();
                doc.moveDown();

                // Table Rows
                let currentY = doc.y;
                let totalAmount = 0;
                
                cart.items.forEach((item) => {
                    const itemTotal = item.price * item.quantity;
                    totalAmount += itemTotal;
                    
                    doc.text(item.product?.name || item.name || 'Product', 50, currentY);
                    doc.text(item.category || 'N/A', 200, currentY);
                    doc.text(item.quantity.toString(), 300, currentY);
                    doc.text(`₹${item.price.toFixed(2)}`, 380, currentY);
                    doc.text(`₹${itemTotal.toFixed(2)}`, 450, currentY);
                    currentY += 20;
                });

                doc.moveDown();
                doc.moveTo(50, currentY).lineTo(580, currentY).stroke();
                doc.moveDown();

                // Totals
                doc.fontSize(12);
                doc.text(`Total Items: ${cart.totalItems || cart.items.length}`, { align: 'right' });
                doc.moveDown();
                doc.fontSize(14).text(`Total Amount: ₹${totalAmount.toFixed(2)}`, { align: 'right' });
                doc.moveDown();

                // Footer
                doc.fontSize(10).text('This is your current cart summary', { align: 'center' });
                doc.fontSize(8).text('Generated on: ' + new Date().toLocaleString(), { align: 'center' });

                doc.end();

                stream.on('finish', () => {
                    try {
                        const stats = fs.statSync(filePath);
                        resolve({ 
                            success: true,
                            filePath, 
                            fileName,
                            fileSize: stats.size
                        });
                    } catch (error) {
                        resolve({ 
                            success: true,
                            filePath, 
                            fileName,
                            fileSize: 0
                        });
                    }
                });

                stream.on('error', (error) => {
                    reject(error);
                });

            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = PDFGenerator;
