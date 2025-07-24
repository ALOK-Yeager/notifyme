import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert } from 'react-native';

const BACKEND_URL = 'http://192.168.1.5:3000'; // Updated for physical device

// Setup socket connection for real-time notifications
export function setupSocketConnection(navigationRef) {
    console.log('Setting up socket connection for real-time notifications');

    // Mock function for now - in a real implementation, this would use socket.io
    const mockSocketListener = () => {
        console.log('Socket notification listener established');

        // Return cleanup function
        return () => {
            console.log('Socket connection closed');
        };
    };

    return mockSocketListener();
}

// Register with the server for notifications
export async function registerWithServer(authToken) {
    console.log('Registering for notifications with server');
    try {
        const response = await axios.post(`${BACKEND_URL}/api/users/register-notifications`, {}, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            timeout: 5000 // 5-second timeout
        });
        console.log('Notification registration response:', response.data);
        return response.data.success;
    } catch (error) {
        console.error('Registration Error:', error.response?.data || error.message);
        return false; // Still allow app to run
    }
}

// For backwards compatibility with existing code
export const requestUserPermission = async () => {
    console.log('Notification permissions not needed for socket-based notifications');
    return true;
};

export const setupNotificationListeners = (navigationRef) => {
    return setupSocketConnection(navigationRef);
};

export const registerTokenWithServer = async (unused, authToken) => {
    return registerWithServer(authToken);
};
