const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

async function migrateImageStructure() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find all products
        const products = await Product.find({});
        console.log(`Found ${products.length} products to migrate`);

        let successCount = 0;
        let errorCount = 0;

        // Update each product
        for (const product of products) {
            try {
                // Get the first image URL from the old structure if it exists
                const imageUrl = product.images && product.images.length > 0 ? product.images[0].url : '';

                // Update the product with the new image structure
                await Product.findByIdAndUpdate(product._id, {
                    $set: { image: imageUrl },
                    $unset: { images: "" }  // Remove the old images array
                });

                console.log(`✅ Successfully migrated product: ${product.name}`);
                successCount++;
            } catch (error) {
                console.error(`❌ Error migrating product ${product.name}:`, error);
                errorCount++;
            }
        }

        console.log('\nMigration Summary:');
        console.log('==================');
        console.log(`Total products processed: ${products.length}`);
        console.log(`Successfully migrated: ${successCount}`);
        console.log(`Failed migrations: ${errorCount}`);

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        // Close the MongoDB connection
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

// Run the migration
migrateImageStructure();
