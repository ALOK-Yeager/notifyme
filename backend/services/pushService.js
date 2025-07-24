const logger = require('../utils/logger');
const admin = require('firebase-admin');
const User = require('../models/User');

class PushService {
    constructor() {
        // Initialize Firebase Admin SDK
        try {
            // Check if already initialized
            if (!admin.apps.length) {
                // In production, you should use environment variables for these credentials
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: process.env.FIREBASE_PROJECT_ID,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
                    })
                });
            }
            logger.info('Firebase Admin SDK initialized for push notifications');
        } catch (error) {
            logger.error('Failed to initialize Firebase Admin SDK:', error);
        }
    }

    async sendPush({ tokens, title, body, data = {}, priority = 'high' }) {
        if (!tokens || tokens.length === 0) {
            logger.warn('No tokens provided for push notification');
            return { success: 0, failure: 0 };
        }

        try {
            // Prepare notification payload
            const message = {
                notification: {
                    title,
                    body
                },
                data: {
                    ...data,
                    click_action: 'FLUTTER_NOTIFICATION_CLICK'
                },
                tokens: tokens.map(t => t.token),
                android: {
                    priority
                },
                apns: {
                    headers: {
                        'apns-priority': priority === 'high' ? '10' : '5'
                    }
                }
            };

            // Send notification
            logger.info(`Sending push notification to ${tokens.length} devices: ${title}`);
            const response = await admin.messaging().sendMulticast(message);

            // Log results
            logger.info(`Push notification sent with success: ${response.successCount}, failures: ${response.failureCount}`);

            // Handle failures and cleanup
            if (response.failureCount > 0) {
                const failedTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push({
                            token: tokens[idx].token,
                            error: resp.error.code
                        });

                        // If token is expired or invalid, remove it
                        if (
                            resp.error.code === 'messaging/invalid-registration-token' ||
                            resp.error.code === 'messaging/registration-token-not-registered'
                        ) {
                            this.removeInvalidToken(tokens[idx].token);
                        }
                    }
                });

                logger.warn('Failed push notification tokens:', failedTokens);
            }

            return {
                success: response.successCount,
                failure: response.failureCount,
                results: response.responses.map((resp, idx) => ({
                    token: tokens[idx].token,
                    success: resp.success,
                    error: resp.success ? null : resp.error.code
                }))
            };
        } catch (error) {
            logger.error('Error sending push notification:', error);
            return {
                success: 0,
                failure: tokens.length,
                error: error.message
            };
        }
    }

    async removeInvalidToken(token) {
        try {
            // Remove invalid token from user's device tokens
            await User.updateMany(
                { 'devices.token': token },
                { $pull: { devices: { token } } }
            );
            logger.info(`Removed invalid token: ${token}`);
        } catch (error) {
            logger.error('Error removing invalid token:', error);
        }
    }

    async sendTestPush(userId) {
        try {
            // Find user and their device tokens
            const user = await User.findById(userId);
            if (!user || !user.devices || user.devices.length === 0) {
                logger.warn(`No devices found for user ${userId} to send test notification`);
                return { success: 0, failure: 0, message: 'No devices registered' };
            }

            // Send test notification
            return await this.sendPush({
                tokens: user.devices,
                title: 'Test Notification',
                body: `Hello ${user.username}! This is a test push notification.`,
                data: {
                    type: 'test',
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            logger.error('Error sending test push notification:', error);
            return {
                success: 0,
                failure: 1,
                error: error.message
            };
        }
    }
}

module.exports = new PushService();
