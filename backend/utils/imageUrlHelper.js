// Helper functions for handling image URLs with MongoDB storage

// Get base URL for image serving
function getBaseUrl(req) {
    if (req.get('host')) {
        const protocol = req.secure ? 'https' : 'http';
        return `${protocol}://${req.get('host')}`;
    }
    return '';
}

// Add image URL to a single product
function addImageUrlToProduct(req, product) {
    if (!product) return product;
    
    const productObj = product.toObject ? product.toObject() : product;
    
    // If product has image data, add the image URL
    if (productObj.image && productObj.image.data) {
        const baseUrl = getBaseUrl(req);
        productObj.imageUrl = `${baseUrl}/api/products/image/${productObj._id}`;
    } else {
        productObj.imageUrl = null;
    }
    
    // Remove the binary data from the response to reduce payload size
    if (productObj.image && productObj.image.data) {
        delete productObj.image.data;
    }
    
    return productObj;
}

// Add image URLs to multiple products
function addImageUrlsToProducts(req, products) {
    if (!products || !Array.isArray(products)) return products;
    
    return products.map(product => addImageUrlToProduct(req, product));
}

// Legacy function for backward compatibility
function getImageUrl(req, filename) {
    const baseUrl = getBaseUrl(req);
    return `${baseUrl}/uploads/products/${filename}`;
}

module.exports = {
    getBaseUrl,
    addImageUrlToProduct,
    addImageUrlsToProducts,
    getImageUrl
};

