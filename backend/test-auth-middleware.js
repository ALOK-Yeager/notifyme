require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const { auth } = require('./middleware/auth');

// Mock Express request and response
const mockRequest = (authHeader) => ({
    header: jest.fn().mockImplementation((name) => {
        if (name === 'Authorization') return authHeader;
        return null;
    })
});

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn();

// Test valid token
const testValidToken = async () => {
    // Create a user (you would usually mock User.findById)
    const user = {
        _id: '123456789012345678901234',
        username: 'testuser',
        email: 'test@example.com',
        isActive: true,
        isLocked: false,
        toJSON: () => ({
            _id: '123456789012345678901234',
            username: 'testuser',
            email: 'test@example.com'
        })
    };

    // Create a token
    const token = jwt.sign(
        {
            _id: user._id,
            username: user.username,
            email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    console.log('Test token:', token);

    // Mock findById to return our user
    User.findById = jest.fn().mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(user)
    }));

    // Setup req and res
    const req = mockRequest(`Bearer ${token}`);
    const res = mockResponse();

    // Call auth middleware
    await auth(req, res, mockNext);

    // Log results
    console.log('req.user set?', !!req.user);
    console.log('req.token set?', !!req.token);
    console.log('mockNext called?', mockNext.mock.calls.length > 0);
    console.log('res.status called?', res.status.mock.calls.length > 0);

    if (res.status.mock.calls.length > 0) {
        console.log('Status code:', res.status.mock.calls[0][0]);
    }

    if (res.json.mock.calls.length > 0) {
        console.log('Response body:', res.json.mock.calls[0][0]);
    }
};

// Test invalid token
const testInvalidToken = async () => {
    // Setup req and res with invalid token
    const req = mockRequest('Bearer invalid.token.here');
    const res = mockResponse();

    // Call auth middleware
    await auth(req, res, mockNext);

    // Log results
    console.log('Invalid token test:');
    console.log('req.user set?', !!req.user);
    console.log('req.token set?', !!req.token);
    console.log('mockNext called?', mockNext.mock.calls.length > 0);
    console.log('res.status called?', res.status.mock.calls.length > 0);

    if (res.status.mock.calls.length > 0) {
        console.log('Status code:', res.status.mock.calls[0][0]);
    }

    if (res.json.mock.calls.length > 0) {
        console.log('Response body:', res.json.mock.calls[0][0]);
    }
};

// Run tests
const main = async () => {
    console.log('Testing auth middleware...');
    console.log('JWT_SECRET:', process.env.JWT_SECRET);

    await testValidToken();
    mockNext.mockClear();
    await testInvalidToken();

    console.log('Tests completed.');
};

main().catch(console.error);
