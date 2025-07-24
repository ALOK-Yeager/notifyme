require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function testAuth() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('MongoDB connected successfully');
        console.log('JWT_SECRET:', process.env.JWT_SECRET);

        // Create a test user
        const user = new User({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        });

        // Generate token
        const token = user.generateAuthToken();
        console.log('Generated token:', token);

        // Disconnect
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

testAuth();
