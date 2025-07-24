const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

class SocketService {
    constructor(io) {
        this.io = io;
        this.userSockets = new Map(); // userId -> Set of socket IDs
        this.socketUsers = new Map(); // socketId -> userId
        this.initialize();
    }
    initialize() {
        // Authentication middleware for Socket.io
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Authentication required'));
                }
                // Verify token
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                // Find user
                const user = await User.findById(decoded._id).select('-password');
                if (!user || !user.isActive) {
                    return next(new Error('Invalid user'));
                }
                // Attach user to socket
                socket.userId = user._id.toString();
                socket.user = user;
                next();
            } catch (error) {
                logger.error('Socket authentication error:', error);
                next(new Error('Authentication failed'));
            }
        });
        // Connection handler
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }
    handleConnection(socket) {
        const userId = socket.userId;
        logger.info(`User ${userId} connected via socket ${socket.id}`);
        // Add socket to user's socket set
        if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId).add(socket.id);
        this.socketUsers.set(socket.id, userId);
        // Join user-specific room
        socket.join(`user:${userId}`);
        // Join preference-based rooms
        const preferences = socket.user.notificationPreferences;
        if (preferences.email.categories.marketing) {
            socket.join('category:marketing');
        }
        if (preferences.email.categories.updates) {
            socket.join('category:updates');
        }
        // Send connection acknowledgment
        socket.emit('connected', {
            socketId: socket.id,
            userId: userId
        });
        // Handle events
        this.setupEventHandlers(socket);
        // Handle disconnection
        socket.on('disconnect', () => {
            this.handleDisconnect(socket);
        });
    }
    setupEventHandlers(socket) {
        // Subscribe to notification updates
        socket.on('subscribe:notifications', async (data) => {
            try {
                const { types, categories } = data;
                // Join type-specific rooms
                if (types && Array.isArray(types)) {
                    types.forEach(type => {
                        socket.join(`type:${type}`);
                    });
                }
                // Join category-specific rooms
                if (categories && Array.isArray(categories)) {
                    categories.forEach(category => {
                        socket.join(`category:${category}`);
                    });
                }
                socket.emit('subscribed', {
                    types,
                    categories
                });
            } catch (error) {
                logger.error('Subscribe error:', error);
                socket.emit('error', {
                    message: 'Failed to subscribe to notifications'
                });
            }
        });
        // Unsubscribe from notification updates
        socket.on('unsubscribe:notifications', async (data) => {
            try {
                const { types, categories } = data;
                // Leave type-specific rooms
                if (types && Array.isArray(types)) {
                    types.forEach(type => {
                        socket.leave(`type:${type}`);
                    });
                }
                // Leave category-specific rooms
                if (categories && Array.isArray(categories)) {
                    categories.forEach(category => {
                        socket.leave(`category:${category}`);
                    });
                }
                socket.emit('unsubscribed', {
                    types,
                    categories
                });
            } catch (error) {
                logger.error('Unsubscribe error:', error);
                socket.emit('error', {
                    message: 'Failed to unsubscribe from notifications'
                });
            }
        });
        // Mark notification as seen (different from read)
        socket.on('notification:seen', async (data) => {
            try {
                const { notificationId } = data;
                // Emit to other devices of the same user
                this.emitToUser(socket.userId, 'notification:seen', {
                    notificationId
                }, socket.id);
            } catch (error) {
                logger.error('Notification seen error:', error);
            }
        });
        // Request notification count
        socket.on('get:unreadCount', async () => {
            try {
                const Notification = require('../models/Notification');
                const count = await Notification.getUnreadCount(socket.userId);
                socket.emit('unreadCount', { count });
            } catch (error) {
                logger.error('Get unread count error:', error);
                socket.emit('error', {
                    message: 'Failed to get unread count'
                });
            }
        });
        // Ping/Pong for connection health
        socket.on('ping', () => {
            socket.emit('pong', {
                timestamp: Date.now()
            });
        });
    }
    handleDisconnect(socket) {
        const userId = this.socketUsers.get(socket.id);
        if (userId) {
            logger.info(`User ${userId} disconnected from socket ${socket.id}`);
            // Remove socket from user's socket set
            const userSocketSet = this.userSockets.get(userId);
            if (userSocketSet) {
                userSocketSet.delete(socket.id);
                // If user has no more sockets, remove from map
                if (userSocketSet.size === 0) {
                    this.userSockets.delete(userId);
                    // Emit user offline event
                    this.io.emit('user:offline', { userId });
                }
            }
            // Remove from socket-user map
            this.socketUsers.delete(socket.id);
        }
    }
    // Emit to specific user (all their sockets)
    emitToUser(userId, event, data, excludeSocketId = null) {
        const userSocketSet = this.userSockets.get(userId.toString());
        if (userSocketSet) {
            userSocketSet.forEach(socketId => {
                if (socketId !== excludeSocketId) {
                    this.io.to(socketId).emit(event, data);
                }
            });
        }
    }
    // Emit to multiple users
    emitToUsers(userIds, event, data) {
        userIds.forEach(userId => {
            this.emitToUser(userId, event, data);
        });
    }
    // Broadcast to all connected users
    broadcast(event, data) {
        this.io.emit(event, data);
    }
    // Emit to room
    emitToRoom(room, event, data) {
        this.io.to(room).emit(event, data);
    }
    // Check if user is online
    isUserOnline(userId) {
        return this.userSockets.has(userId.toString());
    }
    // Get online users count
    getOnlineUsersCount() {
        return this.userSockets.size;
    }
    // Get user's active socket count
    getUserSocketCount(userId) {
        const userSocketSet = this.userSockets.get(userId.toString());
        return userSocketSet ? userSocketSet.size : 0;
    }
}

module.exports = SocketService;
