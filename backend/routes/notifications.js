const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { getPaginatedResults, getUnreadCount } = require('../services/notificationService');

// Get all notifications for a user
router.get('/', auth, async (req, res) => {
    try {
        console.log('GET /api/notifications - User ID:', req.user._id);
        const { notifications, pagination } = await getPaginatedResults(req.user._id, req.query);
        const unreadCount = await getUnreadCount(req.user._id);

        console.log('GET /api/notifications - Found notifications:', notifications ? notifications.length : 0);
        console.log('GET /api/notifications - Pagination:', pagination);
        console.log('GET /api/notifications - Unread count:', unreadCount);

        res.json({
            notifications,
            pagination,
            unreadCount
        });
    } catch (error) {
        console.error('GET /api/notifications - Error:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
});

// Create a new notification
router.post('/', auth, async (req, res) => {
    try {
        const { title, message, type, category = 'system', priority = 'normal' } = req.body;
        const notification = new Notification({
            recipient: req.user._id,
            title,
            message,
            type,
            category,
            priority
        });
        await notification.save();

        // Emit real-time notification
        const io = req.app.get('io');
        io.to(`user:${req.user._id}`).emit('notification', notification);

        res.status(201).json(notification);
    } catch (error) {
        res.status(400).json({ error: 'Bad Request', message: error.message });
    }
});

// Mark a notification as read
router.patch('/:id/read', auth, async (req, res) => {
    try {
        // 1) load by id + owner
        const n = await Notification.findOne({
            _id: req.params.id,
            recipient: req.user._id
        });
        // 2) 404 if missing
        if (!n) return res.status(404).json({ error: 'Not Found' });
        // 3) mark + save
        n.status.read = true;
        n.timestamps.read = new Date();
        await n.save();
        return res.json({ message: 'Notification marked as read' });
    } catch (err) {
        return res.status(500).json({ error: 'Server Error', message: err.message });
    }
});

// Mark all notifications as read
router.patch('/read-all', auth, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, 'status.read': false },
            {
                'status.read': true,
                'timestamps.read': new Date()
            }
        );
        return res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        return res.status(500).json({ error: 'Server Error', message: err.message });
    }
});

// Test push notification
router.post('/push-test', auth, async (req, res) => {
    try {
        console.log(`Sending test push notification for user ${req.user._id}`);

        // Find the user to check if they're active
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Create a test notification
        const notification = new Notification({
            userId: req.user._id,
            title: 'Test Notification',
            message: 'This is a test notification sent via socket',
            type: 'test',
            data: {
                testId: Date.now().toString(),
                timestamp: new Date()
            }
        });

        // Save notification to database
        await notification.save();

        // Get the Socket.io instance from the app
        const io = req.app.get('io');

        // Emit to the user's specific room
        if (io) {
            io.to(`user:${req.user._id}`).emit('notification', notification);

            return res.json({
                message: 'Test notification sent successfully via socket',
                notification,
                delivered: true
            });
        } else {
            return res.json({
                message: 'Socket.io not available, notification saved but not delivered',
                notification,
                delivered: false
            });
        }
    } catch (err) {
        console.error('Push test error:', err);
        return res.status(500).json({ error: 'Server Error', message: err.message });
    }
}); module.exports = router;
