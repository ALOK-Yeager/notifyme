console.log('Starting index.js...');

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const logger = require('./config/logger');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');

// Import middleware
const { auth } = require('./middleware/auth');
const errorHandler = require('./middleware/error');

console.log('Dependencies required successfully.');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || '*',
        credentials: true
    }
});

// Attach io instance to app
app.set('io', io);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => logger.info('MongoDB connected successfully'))
    .catch(err => {
        logger.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true
}));
app.use(express.json());

// Apply rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

console.log('Middleware configured.');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', auth, userRoutes);
app.use('/api/notifications', auth, notificationRoutes);

console.log('Routes configured:', {
    auth: '/api/auth',
    users: '/api/users',
    notifications: '/api/notifications'
});

// Error Handling Middleware
app.use(errorHandler);

console.log('Error handler configured.');

// Export app for testing
module.exports = { app, server };

console.log('App exported.');

// Start server only if this file is run directly
console.log('Checking if running as main module...');
if (require.main === module) {
    console.log('Running as main module. Starting server...');
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`Server is listening on port ${PORT}`);
        logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
} else {
    console.log('Not running as main module. Server not started.');
}