/**
 * Test script to validate device token registration
 * This script simulates the device registration flow and helps debug issues
 * 
 * Note: This is legacy code maintained for documentation purposes.
 * FCM functionality has been removed from the application in favor of socket-based notifications.
 * This script is no longer needed for the current application workflow.
 */

const fetch = require('node-fetch');

// Configuration
const BACKEND_URL = 'http://192.168.1.5:3000';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';
const TEST_DEVICE_ID = 'test_device_id_' + Date.now(); // Unique test device ID

async function runTests() {
    console.log('=== Device Registration Test ===');
    console.log(`Backend URL: ${BACKEND_URL}`);
    console.log(`Test Device ID: ${TEST_DEVICE_ID}`);
    console.log('\n⚠️ NOTICE: This script is for documentation purposes only. ⚠️');
    console.log('FCM functionality has been removed from the application.');
    console.log('The application now uses socket.io for real-time notifications.');
    console.log('Use test-notification.js to test socket notifications instead.');

    // Step 1: Login to get auth token
    console.log('\n1. Attempting login...');
    let authToken;
    try {
        const loginResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
        });

        const loginData = await loginResponse.json();

        if (loginResponse.ok) {
            console.log('✅ Login successful!');
            authToken = loginData.token;
            console.log(`Auth Token: ${authToken.substring(0, 15)}...`);
        } else {
            console.log('❌ Login failed:', loginData.message || 'Unknown error');
            return;
        }
    } catch (error) {
        console.log('❌ Login request failed:', error.message);
        return;
    }

    // Step 2: Get user profile to check for any registered devices
    console.log('\n2. Getting user profile...');
    try {
        const profileResponse = await fetch(`${BACKEND_URL}/api/users/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });

        const profileData = await profileResponse.json();

        if (profileResponse.ok) {
            console.log('✅ Profile retrieved successfully!');
            if (profileData.devices && profileData.devices.length > 0) {
                console.log(`Found ${profileData.devices.length} registered devices:`);
                profileData.devices.forEach((device, index) => {
                    console.log(`  ${index + 1}. Platform: ${device.platform}, Token: ${device.token.substring(0, 15)}...`);
                });
            } else {
                console.log('No devices registered for this user.');
            }
        } else {
            console.log('❌ Profile retrieval failed:', profileData.message || 'Unknown error');
        }
    } catch (error) {
        console.log('❌ Profile request failed:', error.message);
    }

    // Step 3: Test a socket notification
    console.log('\n3. Triggering test socket notification...');
    try {
        const notificationTestResponse = await fetch(`${BACKEND_URL}/api/notifications/push-test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });

        const notificationTestData = await notificationTestResponse.json();

        if (notificationTestResponse.ok) {
            console.log('✅ Socket notification test triggered successfully!');
            console.log('Response:', notificationTestData);
            if (notificationTestData.delivered) {
                console.log('Notification delivered via socket in real-time!');
            } else {
                console.log('Notification saved to database but not delivered via socket (user offline)');
            }
        } else {
            console.log('❌ Socket notification test failed:', notificationTestData.message || 'Unknown error');
        }
    } catch (error) {
        console.log('❌ Socket notification test request failed:', error.message);
    }

    console.log('\n=== Test Complete ===');
    console.log('For more information, use the test-notification.js script with the menu interface.');
}

// Run the tests
runTests();

// Step 5: Verify registered tokens
console.log('\n5. Verifying registered tokens...');
try {
    const userResponse = await fetch(`${BACKEND_URL}/api/users/me`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    });

    const userData = await userResponse.json();

    if (userResponse.ok) {
        console.log('✅ User profile retrieved successfully!');
        console.log('Device tokens:', userData.devices || 'No devices array found');
    } else {
        console.log('❌ User profile retrieval failed:', userData.message || 'Unknown error');
    }
} catch (error) {
    console.log('❌ User profile request failed:', error.message);
}

console.log('\n=== Test Complete ===');
}

runTests().catch(error => {
    console.error('Unhandled error during test:', error);
});
