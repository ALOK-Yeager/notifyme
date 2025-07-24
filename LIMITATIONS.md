# Project Limitations

This document outlines the known limitations of the NotifyMe application as of the current submission date.

## 1. Real-Time Notification Delivery

- **Status**: The application uses Socket.io for real-time notifications.
- **Limitation**: Notifications are only delivered when the app is in the foreground and the user is actively connected to the Socket.io server.
- **Background**: Due to challenges with Firebase Cloud Messaging (FCM) integration, FCM-based push notifications were removed from the application in favor of a simpler socket-based approach.

## 2. Background & Killed State Notifications

- **Issue**: Notifications are not handled when the app is in a background or killed state.
- **Status**: The application does not receive notifications when it's not actively running in the foreground.
- **Workaround**: Users must open the app to see new notifications.

## 3. Notification Persistence

- **Feature**: All notifications are stored in the database and displayed in the notification list even if they weren't delivered in real-time.
- **Limitation**: Users must manually refresh or open the app to see notifications that arrived while they were offline.

## 4. Device Support

- **Limitation**: The application has been primarily tested on Android devices.
- **iOS Support**: While the codebase is designed to be cross-platform, iOS-specific configurations and testing have been limited.

## 5. Network Dependencies

- **Limitation**: The app requires a stable internet connection for real-time notification delivery.
- **Offline Handling**: Limited offline capabilities - notifications will not be received during connectivity loss.

## Future Improvements

- Re-implement push notification functionality using Firebase Cloud Messaging (FCM) or an alternative service.
- Add background notification handling.
- Implement offline mode with local notification queue.
- Enhance cross-platform support for iOS devices.

## Ethical Note

All code in this project is the original work of the author. The application originally included Firebase Cloud Messaging (FCM) for push notifications, but due to configuration and delivery issues, this feature was removed in favor of a simpler socket-based approach. This disclosure is provided for transparency and to accurately represent the current capabilities of the application.
