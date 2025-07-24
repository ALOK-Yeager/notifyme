import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = 'http://192.168.1.5:3000'; // Updated for physical device

// Request notification permissions from the user
export async function requestUserPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
        console.log('Authorization status:', authStatus);
        return getFCMToken();
    }

    console.log('User declined notifications permission');
    return null;
}

// Get the FCM token for this device
export async function getFCMToken() {
    try {
        // Check if we already have a token stored
        let fcmToken = await AsyncStorage.getItem('fcmToken');

        if (!fcmToken) {
            // If not, get a new token
            fcmToken = await messaging().getToken();

            if (fcmToken) {
                console.log('New FCM Token:', fcmToken);
                // Store the token for future use
                await AsyncStorage.setItem('fcmToken', fcmToken);

                // Send token to server if user is logged in
                const token = await AsyncStorage.getItem('authToken');
                if (token) {
                    await registerTokenWithServer(fcmToken, token);
                }
            }
        }

        return fcmToken;
    } catch (error) {
        console.error('Error getting FCM token:', error);
        return null;
    }
}

// Register the FCM token with our backend
export async function registerTokenWithServer(fcmToken, authToken) {
    console.log('Registering FCM token with server:', fcmToken);
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/register-device`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                token: fcmToken,
                platform: 'android'
            })
        });

        console.log('Register FCM token response status:', response.status);
        const responseData = await response.json();
        console.log('Register FCM token response:', responseData);

        if (!response.ok) {
            throw new Error('Failed to register FCM token with server');
        }

        console.log('FCM token registered with server successfully');
        return true;
    } catch (error) {
        console.error('Error registering FCM token with server:', error);
        return false;
    }
}

// Set up notification listeners
export function setupNotificationListeners(navigationRef) {
    // Handle foreground messages
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
        console.log('Notification received in foreground:', remoteMessage);
        // Here you can show a local notification or update your UI
        // Since FCM doesn't automatically show notifications when app is in foreground
    });

    // Handle background/quit state messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
        console.log('Notification received in background:', remoteMessage);
        return Promise.resolve();
    });

    // Handle notification opened app
    messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('Notification opened app from background state:', remoteMessage);

        // Handle navigation/deep linking based on notification data
        if (remoteMessage.data && remoteMessage.data.screen) {
            // Navigate to the specific screen
            navigationRef.current?.navigate(remoteMessage.data.screen, remoteMessage.data.params);
        }
    });

    // Check if app was opened from a notification (app was closed)
    messaging()
        .getInitialNotification()
        .then(remoteMessage => {
            if (remoteMessage) {
                console.log('App was opened from quit state by notification:', remoteMessage);

                // Handle navigation/deep linking
                if (remoteMessage.data && remoteMessage.data.screen) {
                    // We need to wait a bit for navigation to be ready
                    setTimeout(() => {
                        navigationRef.current?.navigate(remoteMessage.data.screen, remoteMessage.data.params);
                    }, 1000);
                }
            }
        });

    return unsubscribeForeground;
}
