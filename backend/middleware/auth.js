const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

exports.isAuthenticatedUser = async (req, res, next) => {
    try {
        // Check for token in cookies
        let token = req.cookies?.token;
        
        // Also check for token in Authorization header (Bearer token)
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
            console.log('Found token in Authorization header');
        }
        
        console.log('Auth middleware - Token exists:', !!token);

        if (!token) {
            return res.status(401).json({ message: 'Please login to access this resource' });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);
        console.log('Token decoded:', decoded);
        
        req.user = await User.findById(decoded.id);
        console.log('User found:', req.user ? `ID: ${req.user._id}, Role: ${req.user.role}` : 'No user found');
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        return res.status(401).json({ message: 'Please login to access this resource' });
    }
};

exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        console.log('Authorize roles middleware - User role:', req.user.role, 'Required roles:', roles);
        
        if (!roles.includes(req.user.role)) {
            console.log('Role authorization failed - Access denied');
            return res.status(403).json({ 
                message: `Role (${req.user.role}) is not allowed to access this resource` 
            });
        }
        
        console.log('Role authorization successful - Access granted');
        next();
    };
};
