const dotenv = require('dotenv');
dotenv.config();

console.log('Environment variables check:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Missing');
console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? 'Set' : 'Missing');
console.log('JWT_EXPIRE:', process.env.JWT_EXPIRE);
console.log('JWT_REFRESH_EXPIRE:', process.env.JWT_REFRESH_EXPIRE);

// Test JWT generation
const User = require('./models/User');
const mongoose = require('mongoose');

async function testJWT() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create a test user
        const user = new User({
            username: 'jwttest',
            email: 'jwt@test.com',
            password: 'password123'
        });

        // Test token generation
        const token = user.generateAuthToken();
        console.log('Generated token:', token ? 'Success' : 'Failed');
        console.log('Token length:', token?.length);

        await mongoose.connection.close();
    } catch (error) {
        console.error('JWT Test Error:', error.message);
    }
}

testJWT();
