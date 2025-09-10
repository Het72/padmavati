require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

async function fixProducts() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected successfully to MongoDB');

        // Find all products
        const products = await Product.find({});
        console.log(`Found ${products.length} products to fix`);

        let successCount = 0;
        let errorCount = 0;

        // Process each product
        for (const product of products) {
            try {
                let imageUrl = '';
                
                // Try to get URL from old images array if it exists in raw document
                const rawProduct = product.toObject();
                if (rawProduct.images && rawProduct.images.length > 0) {
                    imageUrl = rawProduct.images[0].url;
                }

                // Update product with image URL if found
                if (imageUrl) {
                    await Product.findByIdAndUpdate(product._id, {
                        $set: { image: imageUrl }
                    });
                    console.log(`✅ Updated image for: ${product.name}`);
                } else {
                    // If no image found, set a default image URL
                    const defaultImage = 'https://padmavati-backend.onrender.com/uploads/products/default-product.jpg';
                    await Product.findByIdAndUpdate(product._id, {
                        $set: { image: defaultImage }
                    });
                    console.log(`ℹ️ Set default image for: ${product.name}`);
                }
                successCount++;
            } catch (error) {
                console.error(`❌ Failed to update ${product.name}:`, error.message);
                errorCount++;
            }
        }

        // Print summary
        console.log('\nFix Summary');
        console.log('===========');
        console.log(`Total products: ${products.length}`);
        console.log(`Successfully updated: ${successCount}`);
        console.log(`Failed: ${errorCount}`);

    } catch (error) {
        console.error('Fix failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

// Run fix
fixProducts();
