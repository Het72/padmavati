const mongoose = require('mongoose');
const Product = require('./models/Product');
const cloudinary = require('./config/cloudinary');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Connect to MongoDB
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));
} else {
    console.log("⚠️  MONGODB_URI not set, cannot connect to database");
    process.exit(1);
}

async function migrateToCloudinary() {
    try {
        // Find all products with local image URLs
        const productsToUpdate = await Product.find({
            'images.url': { $regex: /uploads\/products/ }
        });

        console.log(`Found ${productsToUpdate.length} products with local images to migrate`);

        if (productsToUpdate.length === 0) {
            console.log('No products need migration');
            return;
        }

        let migratedCount = 0;
        for (const product of productsToUpdate) {
            const updatedImages = [];
            
            for (const image of product.images) {
                if (image.url.includes('uploads/products')) {
                    // Extract filename from URL
                    const filename = image.url.split('/').pop();
                    const localPath = path.join(__dirname, 'uploads', 'products', filename);
                    
                    if (fs.existsSync(localPath)) {
                        try {
                            // Upload to Cloudinary
                            const result = await cloudinary.uploader.upload(localPath, {
                                folder: 'padmavati/products',
                                public_id: `migrated_${filename.split('.')[0]}`,
                                transformation: [
                                    { width: 800, height: 600, crop: 'limit', quality: 'auto' },
                                    { fetch_format: 'auto' }
                                ]
                            });
                            
                            updatedImages.push({
                                public_id: result.public_id,
                                url: result.secure_url
                            });
                            
                            console.log(`Migrated image: ${filename} -> ${result.public_id}`);
                        } catch (uploadError) {
                            console.error(`Failed to upload ${filename}:`, uploadError.message);
                            // Keep original image if upload fails
                            updatedImages.push(image);
                        }
                    } else {
                        console.log(`Local file not found: ${filename}, keeping original URL`);
                        updatedImages.push(image);
                    }
                } else {
                    // Keep non-local images as is
                    updatedImages.push(image);
                }
            }

            // Update product with new image URLs
            await Product.findByIdAndUpdate(product._id, {
                $set: { images: updatedImages }
            });
            
            console.log(`Updated product "${product.name}" with Cloudinary URLs`);
            migratedCount++;
        }

        console.log(`Successfully migrated ${migratedCount} products to Cloudinary`);
    } catch (error) {
        console.error('Error migrating to Cloudinary:', error);
    } finally {
        mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

// Run the migration
migrateToCloudinary();
