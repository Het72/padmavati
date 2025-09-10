require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

async function fixImageUrls() {
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
                // Get image URL from old structure if it exists in memory
                const oldImages = product._doc.images;
                const imageUrl = oldImages && oldImages.length > 0 ? oldImages[0].url : '';

                // Only update if we have an image URL to set
                if (imageUrl) {
                    await Product.findByIdAndUpdate(
                        product._id,
                        { $set: { image: imageUrl } }
                    );
                    console.log(`✅ Fixed image URL for: ${product.name}`);
                } else {
                    console.log(`⚠️ No image URL found for: ${product.name}`);
                }
                successCount++;
            } catch (error) {
                console.error(`❌ Failed to fix product ${product.name}:`, error.message);
                errorCount++;
            }
        }

        // Print summary
        console.log('\nFix Summary');
        console.log('===========');
        console.log(`Total products: ${products.length}`);
        console.log(`Successfully fixed: ${successCount}`);
        console.log(`Failed: ${errorCount}`);

    } catch (error) {
        console.error('Fix failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

// Run fix
fixImageUrls();
