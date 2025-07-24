const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');

// Validation schemas
const registerSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).optional()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        // Validate input
        const { error } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation Error',
                message: error.details[0].message
            });
        }
        const { username, email, password } = req.body;
        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });
        if (existingUser) {
            return res.status(409).json({
                error: 'Conflict',
                message: existingUser.email === email
                    ? 'Email already registered'
                    : 'Username already taken'
            });
        }
        // Create new user
        const user = new User({
            username,
            email,
            password
        });
        await user.save();
        // Generate tokens
        const token = user.generateAuthToken();
        const refreshToken = user.generateRefreshToken();
        // Send welcome notification
        const io = req.app.get('io');
        io.to(`user:${user._id}`).emit('notification', {
            type: 'welcome',
            title: 'Welcome to NotifyMe!',
            message: 'Your account has been created successfully.'
        });
        logger.info(`New user registered: ${email}`);
        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            },
            token,
            refreshToken
        });
    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to create user'
        });
    }
});

// Login user - Fixed version
router.post('/login', async (req, res) => {
    try {
        // --- ADD THIS BLOCK ---
        const { error } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation Error',
                message: error.details[0].message
            });
        }
        // --- END OF BLOCK TO ADD ---

        const { email, password } = req.body;

        // Find user and include password for comparison
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ error: 'Authentication Failed' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Authentication Failed' });
        }

        // Generate tokens
        const token = user.generateAuthToken();
        const refreshToken = user.generateRefreshToken();

        res.json({
            message: 'Login successful',
            token,
            refreshToken,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server Error', message: 'Internal server error during login' });
    }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Refresh token is required'
            });
        }
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        // Find user
        const user = await User.findById(decoded._id);
        if (!user || !user.isActive) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid refresh token'
            });
        }
        // Generate new tokens
        const newToken = user.generateAuthToken();
        const newRefreshToken = user.generateRefreshToken();
        res.json({
            token: newToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid refresh token'
        });
    }
});

// Logout endpoint
router.post('/logout', auth, async (req, res) => {
    try {
        // In a production app, you might want to:
        // 1. Blacklist the token in Redis
        // 2. Remove device token for push notifications
        // 3. Clear any server-side sessions
        const socketService = req.app.get('socketService');
        socketService.handleDisconnect(req.user._id);
        logger.info(`User logged out: ${req.user.email}`);
        res.json({
            message: 'Logout successful'
        });
    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to logout'
        });
    }
});

module.exports = router;
