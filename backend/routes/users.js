const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

// POST /users - Register user
router.post('/', async (req, res) => {
    try {
        const { name, email, password, avatar } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create default avatar if not provided
        const defaultAvatar = avatar || {
            public_id: 'default_avatar',
            url: 'https://via.placeholder.com/150x150?text=User'
        };

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            avatar: defaultAvatar
        });

        // Generate JWT token
        const token = user.getJwtToken();

        // Remove password from response
        user.password = undefined;

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user,
            token
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message
        });
    }
});

// POST /users/admin - Create admin user (for initial setup)
router.post('/admin', async (req, res) => {
    try {
        const { name, email, password, avatar, adminSecret } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }

        // Check admin secret (you can set this in your .env file)
        const expectedSecret = process.env.ADMIN_SECRET || 'admin123';
        if (adminSecret !== expectedSecret) {
            return res.status(403).json({
                success: false,
                message: 'Invalid admin secret'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create default avatar if not provided
        const defaultAvatar = avatar || {
            public_id: 'default_avatar',
            url: 'https://via.placeholder.com/150x150?text=Admin'
        };

        // Create admin user
        const user = await User.create({
            name,
            email,
            password,
            avatar: defaultAvatar,
            role: 'admin'
        });

        // Generate JWT token
        const token = user.getJwtToken();

        // Remove password from response
        user.password = undefined;

        res.status(201).json({
            success: true,
            message: 'Admin user created successfully',
            user,
            token
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating admin user',
            error: error.message
        });
    }
});

// GET /users/:id - Get user details
router.get('/:id', isAuthenticatedUser, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user is requesting their own details or is admin
        if (req.user.id !== id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only access your own user details'
            });
        }

        const user = await User.findById(id).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user details',
            error: error.message
        });
    }
});

// PUT /users/:id - Update user info
router.put('/:id', isAuthenticatedUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, avatar, currentPassword, newPassword } = req.body;

        // Check if user is updating their own info or is admin
        if (req.user.id !== id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own user information'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update basic fields
        if (name) user.name = name;
        if (email) {
            // Check if new email is already taken by another user
            const existingUser = await User.findOne({ email, _id: { $ne: id } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already taken by another user'
                });
            }
            user.email = email;
        }
        if (avatar) user.avatar = avatar;

        // Handle password change
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is required to change password'
                });
            }

            // Verify current password
            const isPasswordValid = await user.comparePassword(currentPassword);
            if (!isPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            user.password = newPassword;
        }

        await user.save();

        // Remove password from response
        user.password = undefined;

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
});

// DELETE /users/:id - Delete user
router.delete('/:id', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent admin from deleting themselves
        if (req.user.id === id) {
            return res.status(400).json({
                success: false,
                message: 'Admin cannot delete their own account'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user has any orders (but allow deletion anyway for admin)
        const Order = require('../models/Order');
        const userOrders = await Order.countDocuments({ user: id });
        
        if (userOrders > 0) {
            console.log(`⚠️ Admin deleting user with ${userOrders} order(s): ${user.email}`);
            // Continue with deletion even if user has orders
        }

        await user.deleteOne();

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
});

// DELETE /users/email/:email - Delete user by email (Admin only)
router.delete('/email/:email', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
    try {
        const { email } = req.params;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent admin from deleting themselves
        if (req.user.id === user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Admin cannot delete their own account'
            });
        }

        // Check if user has any orders (but allow deletion anyway for admin)
        const Order = require('../models/Order');
        const userOrders = await Order.countDocuments({ user: user._id });
        
        if (userOrders > 0) {
            console.log(`⚠️ Admin deleting user with ${userOrders} order(s): ${user.email}`);
            // Continue with deletion even if user has orders
        }

        await user.deleteOne();

        res.status(200).json({
            success: true,
            message: `User with email ${email} deleted successfully`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
});

// DELETE /users/remove/hetshah - Remove specific user hetshah1072@gmail.com (Admin only)
router.delete('/remove/hetshah', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
    try {
        const targetEmail = 'hetshah1072@gmail.com';
        
        const user = await User.findOne({ email: targetEmail });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: `User with email ${targetEmail} not found`
            });
        }

        // Check if user has any orders (but allow deletion anyway for admin)
        const Order = require('../models/Order');
        const userOrders = await Order.countDocuments({ user: user._id });
        
        if (userOrders > 0) {
            console.log(`⚠️ Admin deleting user hetshah1072@gmail.com with ${userOrders} order(s)`);
            // Continue with deletion even if user has orders
        }

        await user.deleteOne();

        res.status(200).json({
            success: true,
            message: `User ${targetEmail} deleted successfully`,
            deletedUser: {
                id: user._id,
                name: user.name,
                email: user.email,
                ordersCount: userOrders
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
});

// Additional utility endpoints

// POST /users/login - User login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user and include password for comparison
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = user.getJwtToken();

        // Remove password from response
        user.password = undefined;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            user,
            token
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error during login',
            error: error.message
        });
    }
});

// GET /users/profile/me - Get current user profile
router.get('/profile/me', isAuthenticatedUser, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: error.message
        });
    }
});

// PUT /users/profile/me - Update current user profile
router.put('/profile/me', isAuthenticatedUser, async (req, res) => {
    try {
        const { name, email, avatar, currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id);

        // Update basic fields
        if (name) user.name = name;
        if (email) {
            // Check if new email is already taken by another user
            const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already taken by another user'
                });
            }
            user.email = email;
        }
        if (avatar) user.avatar = avatar;

        // Handle password change
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is required to change password'
                });
            }

            // Verify current password
            const isPasswordValid = await user.comparePassword(currentPassword);
            if (!isPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            user.password = newPassword;
        }

        await user.save();

        // Remove password from response
        user.password = undefined;

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
});

// GET /users (Admin) - Get all users
router.get('/', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
});

// PUT /users/:id/promote (Admin) - Promote user to admin
router.put('/:id/promote', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { adminSecret } = req.body;

        // Check admin secret for additional security
        const expectedSecret = process.env.ADMIN_SECRET || 'admin123';
        if (adminSecret !== expectedSecret) {
            return res.status(403).json({
                success: false,
                message: 'Invalid admin secret'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'User is already an admin'
            });
        }

        user.role = 'admin';
        await user.save();

        // Remove password from response
        user.password = undefined;

        res.status(200).json({
            success: true,
            message: 'User promoted to admin successfully',
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error promoting user',
            error: error.message
        });
    }
});

module.exports = router;
