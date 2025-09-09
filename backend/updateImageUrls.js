const mongoose = require('mongoose');
const Product = require('./models/Product');
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

async function updateImageUrls() {
    try {
        // Find all products with HTTP image URLs
        const productsToUpdate = await Product.find({
            'images.url': { $regex: /^http:\/\// }
        });

        console.log(`Found ${productsToUpdate.length} products with HTTP URLs to update`);

        if (productsToUpdate.length === 0) {
            console.log('No products need URL updating');
            return;
        }

        let updatedCount = 0;
        for (const product of productsToUpdate) {
            const updatedImages = product.images.map(image => ({
                ...image.toObject(),
                url: image.url.replace(/^http:\/\//, 'https://')
            }));

            await Product.findByIdAndUpdate(product._id, {
                $set: { images: updatedImages }
            });
            
            console.log(`Updated product "${product.name}" URLs from HTTP to HTTPS`);
            updatedCount++;
        }

        console.log(`Successfully updated ${updatedCount} products`);
    } catch (error) {
        console.error('Error updating image URLs:', error);
    } finally {
        mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

// Run the update
updateImageUrls();
