require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

async function migrateToNewImageStructure() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected successfully to MongoDB');

        // Find all products
        const products = await Product.find({});
        console.log(`Found ${products.length} products to migrate`);

        let successCount = 0;
        let errorCount = 0;

        // Process each product
        for (const product of products) {
            try {
                const oldImages = product.images || [];
                const imageUrl = oldImages.length > 0 ? oldImages[0].url : '';

                // Update the product with new image structure
                await Product.findByIdAndUpdate(
                    product._id,
                    {
                        $set: { image: imageUrl },
                        $unset: { images: 1 }
                    },
                    { new: true }
                );

                console.log(`✅ Migrated product: ${product.name}`);
                successCount++;
            } catch (error) {
                console.error(`❌ Failed to migrate product ${product.name}:`, error.message);
                errorCount++;
            }
        }

        // Print summary
        console.log('\nMigration Summary');
        console.log('=================');
        console.log(`Total products: ${products.length}`);
        console.log(`Successfully migrated: ${successCount}`);
        console.log(`Failed: ${errorCount}`);

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        // Close database connection
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

// Run migration
migrateToNewImageStructure();
