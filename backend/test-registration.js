const http = require('http');

// Test registration
const registerData = JSON.stringify({
    username: 'testuser123',
    email: 'testuser123@example.com',
    password: 'password123',
    confirmPassword: 'password123'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(registerData)
    }
};

console.log('🔍 Testing registration endpoint...');

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(`📱 Registration Response: ${res.statusCode}`, JSON.parse(data));
        if (res.statusCode === 201) {
            console.log('✅ Registration working correctly!');
        } else {
            console.log('⚠️ Registration issue:', JSON.parse(data));
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
});

req.write(registerData);
req.end();