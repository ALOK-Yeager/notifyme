const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');

// Get current user profile
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        logger.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
});

// Register a device token for push notifications
router.post('/register-device', auth, async (req, res) => {
    try {
        const { token, platform = 'android' } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if token already exists
        const tokenExists = user.devices.find(device => device.token === token);

        if (tokenExists) {
            // Update last active timestamp
            tokenExists.lastActive = new Date();
            await user.save();
            return res.json({ message: 'Device token updated', token });
        }

        // Add new token
        user.devices.push({
            token,
            platform,
            lastActive: new Date()
        });

        await user.save();
        logger.info(`Device token registered for user ${user._id}`);

        res.status(201).json({ message: 'Device token registered successfully', token });
    } catch (error) {
        logger.error('Error registering device token:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
});

// Unregister a device token
router.post('/unregister-device', auth, async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Remove token from user's devices
        user.devices = user.devices.filter(device => device.token !== token);

        await user.save();
        logger.info(`Device token unregistered for user ${user._id}`);

        res.json({ message: 'Device token unregistered successfully' });
    } catch (error) {
        logger.error('Error unregistering device token:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
});

// Update notification preferences
router.patch('/notification-preferences', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update only the provided fields
        if (req.body.notificationPreferences) {
            // Handle nested objects with a deep merge
            const mergeObjects = (target, source) => {
                Object.keys(source).forEach(key => {
                    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                        if (!target[key]) Object.assign(target, { [key]: {} });
                        mergeObjects(target[key], source[key]);
                    } else {
                        Object.assign(target, { [key]: source[key] });
                    }
                });
                return target;
            };

            user.notificationPreferences = mergeObjects(
                user.notificationPreferences.toObject(),
                req.body.notificationPreferences
            );

            await user.save();
            logger.info(`Notification preferences updated for user ${user._id}`);

            res.json({
                message: 'Notification preferences updated successfully',
                notificationPreferences: user.notificationPreferences
            });
        } else {
            return res.status(400).json({ error: 'No notification preferences provided' });
        }
    } catch (error) {
        logger.error('Error updating notification preferences:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
});

module.exports = router;
