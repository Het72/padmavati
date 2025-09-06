const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const config = require("./config/config");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
const productsDir = path.join(uploadsDir, 'products');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
}

if (!fs.existsSync(productsDir)) {
    fs.mkdirSync(productsDir, { recursive: true });
    console.log('Created uploads/products directory');
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from uploads directory with caching headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '1y', // Cache for 1 year
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        // Set appropriate headers for different file types
        if (path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.png') || path.endsWith('.gif') || path.endsWith('.webp')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
            res.setHeader('Content-Type', 'image/jpeg'); // Default to JPEG
        }
    }
}));

// Database connection
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));
} else {
    console.log("⚠️  MONGODB_URI not set, running without database connection");
}

// Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Website Backend API' });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error occurred:', err);
    console.error('Error stack:', err.stack);
    
    // Handle multer errors specifically
    if (err instanceof multer.MulterError) {
        console.error('Multer error:', err.code, err.message);
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                success: false,
                message: 'File too large. Maximum size is 20MB' 
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ 
                success: false,
                message: 'Too many files. Maximum is 5 files' 
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ 
                success: false,
                message: 'Unexpected field name in file upload' 
            });
        }
        if (err.code === 'ENOENT') {
            return res.status(500).json({ 
                success: false,
                message: 'Upload directory not found. Please contact administrator.' 
            });
        }
    }
    
    // Handle other file upload errors
    if (err.message === 'Only image files are allowed!') {
        return res.status(400).json({ 
            success: false,
            message: 'Only image files are allowed!' 
        });
    }
    
    // Handle filesystem errors
    if (err.code === 'ENOENT') {
        return res.status(500).json({ 
            success: false,
            message: 'File system error. Please contact administrator.' 
        });
    }
    
    res.status(500).json({ 
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
