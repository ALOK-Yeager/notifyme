const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        console.log('Auth Middleware - Token received:', token);

        if (!token) {
            console.log('Auth Middleware - No token provided');
            throw new Error();
        }

        // Verify token
        console.log('Auth Middleware - JWT_SECRET:', process.env.JWT_SECRET);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Auth Middleware - Decoded token:', decoded);

        // Find user
        const user = await User.findById(decoded._id).select('-password');
        console.log('Auth Middleware - User found:', user ? true : false);

        if (!user || !user.isActive) {
            console.log('Auth Middleware - User not found or inactive');
            throw new Error();
        }
        // Check if account is locked
        if (user.isLocked) {
            return res.status(423).json({
                error: 'Account Locked',
                message: 'Your account has been locked due to multiple failed login attempts'
            });
        }
        // Attach user to request
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Please authenticate'
        });
    }
};

// Role-based middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Please authenticate'
            });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};

module.exports = { auth, authorize };