const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../index');
const User = require('../models/User');

describe('Authentication Endpoints', () => {
    beforeAll(async () => {
        // Ensure connection and clean state
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_TEST_URI || process.env.MONGODB_URI);
        }
        await User.deleteMany({});
    });

    afterAll(async () => {
        // Clean up and close connection
        await User.deleteMany({});
        await mongoose.connection.close();
    });
    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123',
                    confirmPassword: 'password123'
                });

            if (res.statusCode !== 201) {
                console.error('Register endpoint error:', res.body);
            }
            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('refreshToken');
            expect(res.body.user.email).toBe('test@example.com');
        });
        it('should not register user with existing email', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser2',
                    email: 'test@example.com',
                    password: 'password123',
                    confirmPassword: 'password123'
                });
            expect(res.statusCode).toBe(409);
            expect(res.body.error).toBe('Conflict');
        });
        it('should validate password confirmation', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser3',
                    email: 'test3@example.com',
                    password: 'password123',
                    confirmPassword: 'differentpassword'
                });
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Validation Error');
        });
    });
    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Clear all users to avoid duplicate key errors
            await User.deleteMany({});
            await User.create({
                username: 'logintest',
                email: 'login@example.com',
                password: 'password123'
            });
        });
        afterEach(async () => {
            await User.deleteMany({});
        });
        it('should login with valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'password123'
                });
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('refreshToken');
            expect(res.body.message).toBe('Login successful');
        });
        it('should not login with invalid password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'wrongpassword'
                });
            expect(res.statusCode).toBe(401);
            expect(res.body.error).toBe('Authentication Failed');
        });
        it('should not login with non-existent email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123'
                });
            expect(res.statusCode).toBe(401);
            expect(res.body.error).toBe('Authentication Failed');
        });
    });
});
