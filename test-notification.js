const fetch = require('node-fetch');
const readline = require('readline');

// Create interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Configuration
const BACKEND_URL = 'http://192.168.1.5:3000'; // Update this to match your backend URL
let authToken = '';

// Helper function to make authenticated requests
async function makeAuthenticatedRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BACKEND_URL}${endpoint}`, options);
    const data = await response.json();

    return { status: response.status, data };
}

// Login function
async function login(email, password) {
    try {
        console.log(`Logging in with email: ${email}`);
        const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Login successful!');
            console.log('User data:', data.user);
            authToken = data.token;
            return data;
        } else {
            console.error('Login failed:', data.error || data.message || 'Unknown error');
            return null;
        }
    } catch (error) {
        console.error('Error during login:', error);
        return null;
    }
}

// Function to test socket-based notifications
async function testSocketNotification() {
    try {
        console.log('Sending test socket notification...');
        const { status, data } = await makeAuthenticatedRequest('/api/notifications/push-test', 'POST');

        console.log('Socket notification test status:', status);
        console.log('Response:', data);

        if (status === 200) {
            console.log('Test notification sent successfully!');
            if (data.delivered) {
                console.log('Notification delivered via socket in real-time!');
            } else {
                console.log('Notification saved to database but not delivered via socket (user offline)');
            }
            return true;
        } else {
            console.error('Test notification failed:', data.error || data.message || 'Unknown error');
            return false;
        }
    } catch (error) {
        console.error('Error sending test notification:', error);
        return false;
    }
}

// Function to get user profile
async function getUserProfile() {
    try {
        const { status, data } = await makeAuthenticatedRequest('/api/users/me');

        if (status === 200) {
            console.log('User profile:');
            console.log('Username:', data.username);
            console.log('Email:', data.email);
            console.log('Registered devices:', data.devices.length);

            if (data.devices.length > 0) {
                console.log('Device tokens:');
                data.devices.forEach((device, index) => {
                    console.log(`  ${index + 1}. Platform: ${device.platform}, Token: ${device.token.substring(0, 15)}...`);
                });
            } else {
                console.log('No devices registered');
            }

            return data;
        } else {
            console.error('Failed to get user profile:', data.error || data.message || 'Unknown error');
            return null;
        }
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
}

// Main function
async function main() {
    try {
        // Get login credentials
        rl.question('Enter email (default: test@example.com): ', async (email) => {
            email = email || 'test@example.com';

            rl.question('Enter password (default: password123): ', async (password) => {
                password = password || 'password123';

                // Login
                const loginResult = await login(email, password);

                if (!loginResult) {
                    console.log('Exiting due to login failure');
                    rl.close();
                    return;
                }

                // Get user profile
                const userProfile = await getUserProfile();

                // Menu
                function showMenu() {
                    console.log('\n--- NOTIFICATION TEST MENU ---');
                    console.log('1. Test socket notification');
                    console.log('2. Get user profile');
                    console.log('3. Exit');

                    rl.question('Select an option (1-3): ', async (option) => {
                        switch (option) {
                            case '1':
                                await testSocketNotification();
                                showMenu();
                                break;
                            case '2':
                                await getUserProfile();
                                showMenu();
                                break;
                            case '3':
                                console.log('Exiting...');
                                rl.close();
                                break;
                            default:
                                console.log('Invalid option');
                                showMenu();
                                break;
                        }
                    });
                }

                showMenu();
            });
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        rl.close();
    }
}

// Start the program
main();
