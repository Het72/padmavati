require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

async function verifyImageStructure() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected successfully to MongoDB');

        // Find one product to verify
        const product = await Product.findOne();
        console.log('\nVerifying product structure:');
        console.log('---------------------------');
        console.log('Product Name:', product.name);
        console.log('Image:', product.image);
        console.log('Has old images array:', product.images !== undefined);

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

// Run verification
verifyImageStructure();
