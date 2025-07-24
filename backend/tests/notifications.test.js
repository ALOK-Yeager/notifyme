const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../index');
const User = require('../models/User');
const Notification = require('../models/Notification');

describe('Notification Endpoints', () => {
    let authToken;
    let userId;

    beforeAll(async () => {
        // Ensure clean database state
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_TEST_URI || process.env.MONGODB_URI);
        }
        await User.deleteMany({});
        await Notification.deleteMany({});

        // Create test user
        const user = await User.create({
            username: 'notiftest',
            email: 'notif@example.com',
            password: 'password123'
        });
        userId = user._id;
        authToken = user.generateAuthToken();

        console.log('Test User ID:', userId);
        console.log('Test Auth Token:', authToken);
    });
    afterAll(async () => {
        await User.deleteMany({});
        await Notification.deleteMany({});
        await mongoose.connection.close();
    });
    describe('GET /api/notifications', () => {
        beforeEach(async () => {
            // Create test notifications
            const notifications = [
                {
                    recipient: userId,
                    type: 'in-app',
                    category: 'updates',
                    title: 'Test Notification 1',
                    message: 'This is a test message',
                    priority: 'normal'
                },
                {
                    recipient: userId,
                    type: 'email',
                    category: 'security',
                    title: 'Test Notification 2',
                    message: 'This is another test message',
                    priority: 'high',
                    status: { read: true }
                }
            ];
            await Notification.insertMany(notifications);
        });
        afterEach(async () => {
            await Notification.deleteMany({});
        });
        it('should get user notifications', async () => {
            const res = await request(app)
                .get('/api/notifications')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.notifications).toHaveLength(2);
            expect(res.body).toHaveProperty('pagination');
            expect(res.body).toHaveProperty('unreadCount');
        });
        it('should filter notifications by type', async () => {
            const res = await request(app)
                .get('/api/notifications?type=email')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.notifications).toHaveLength(1);
            expect(res.body.notifications[0].type).toBe('email');
        });
        it('should filter unread notifications', async () => {
            const res = await request(app)
                .get('/api/notifications?read=false')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.notifications).toHaveLength(1);
            expect(res.body.notifications[0].status.read).toBe(false);
        });
        it('should paginate results', async () => {
            const res = await request(app)
                .get('/api/notifications?page=1&limit=1')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.notifications).toHaveLength(1);
            expect(res.body.pagination.page).toBe(1);
            expect(res.body.pagination.limit).toBe(1);
            expect(res.body.pagination.total).toBe(2);
        });
    });
    describe('PATCH /api/notifications/:id/read', () => {
        let notificationId;
        beforeEach(async () => {
            const notification = new Notification({
                recipient: userId,
                type: 'in-app',
                category: 'updates',
                title: 'Unread Notification',
                message: 'Mark me as read',
                priority: 'normal'
            });
            await notification.save();
            notificationId = notification._id;
        });
        it('should mark notification as read', async () => {
            const res = await request(app)
                .patch(`/api/notifications/${notificationId}/read`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Notification marked as read');
            // Verify in database
            const notification = await Notification.findById(notificationId);
            expect(notification.status.read).toBe(true);
            expect(notification.timestamps.read).toBeDefined();
        });
        it('should return 404 for non-existent notification', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .patch(`/api/notifications/${fakeId}/read`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('Not Found');
        });
    });
});
