require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { app } = require('./index');
const User = require('./models/User');
const Notification = require('./models/Notification');

async function testNotifications() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('MongoDB connected successfully');
        console.log('JWT_SECRET:', process.env.JWT_SECRET);

        // Create a test user
        let user = await User.findOne({ email: 'test@example.com' });
        if (!user) {
            user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });
            await user.save();
            console.log('Test user created');
        } else {
            console.log('Test user already exists');
        }

        // Generate token
        const token = user.generateAuthToken();
        console.log('Generated token:', token);

        // Create test notifications
        await Notification.deleteMany({ recipient: user._id });

        const notifications = [
            {
                recipient: user._id,
                type: 'in-app',
                category: 'updates',
                title: 'Test Notification 1',
                message: 'This is a test message',
                priority: 'normal'
            },
            {
                recipient: user._id,
                type: 'email',
                category: 'security',
                title: 'Test Notification 2',
                message: 'This is another test message',
                priority: 'high',
                status: { read: true }
            }
        ];

        await Notification.insertMany(notifications);
        console.log('Test notifications created');

        // Test GET /api/notifications
        console.log('Testing GET /api/notifications');
        const res = await request(app)
            .get('/api/notifications')
            .set('Authorization', `Bearer ${token}`);

        console.log('Response status:', res.status);
        console.log('Response body:', JSON.stringify(res.body, null, 2));

        // Disconnect
        await mongoose.disconnect();
        console.log('Test completed');
    } catch (err) {
        console.error('Error:', err);
    }
}

testNotifications();
