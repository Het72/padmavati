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

async function updateExistingProducts() {
    try {
        // Find all products without color field or with empty color
        const productsToUpdate = await Product.find({
            $or: [
                { color: { $exists: false } },
                { color: null },
                { color: '' }
            ]
        });

        console.log(`Found ${productsToUpdate.length} products to update`);

        if (productsToUpdate.length === 0) {
            console.log('No products need updating');
            return;
        }

        // Default colors for different categories
        const defaultColors = {
            'Electronics': 'Black',
            'Clothing': 'Blue',
            'Books': 'Brown',
            'Home': 'White',
            'Sports': 'Red',
            'Beauty': 'Pink',
            'Food': 'Green',
            'default': 'Gray'
        };

        let updatedCount = 0;
        for (const product of productsToUpdate) {
            const defaultColor = defaultColors[product.category] || defaultColors.default;
            
            await Product.findByIdAndUpdate(product._id, {
                $set: { color: defaultColor }
            });
            
            console.log(`Updated product "${product.name}" with color: ${defaultColor}`);
            updatedCount++;
        }

        console.log(`Successfully updated ${updatedCount} products`);
    } catch (error) {
        console.error('Error updating products:', error);
    } finally {
        mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

// Run the update
updateExistingProducts();
