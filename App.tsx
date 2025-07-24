/**
 * NotifyMe - React Native Notification App
 * Connected to Node.js backend with real-time notifications
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
  useColorScheme,
  DevSettings,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setupNotificationListeners,
  registerWithServer
} from './src/services/notificationService';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  status: {
    read: boolean;
    readAt?: Date;
  };
  createdAt: string;
}

interface User {
  id: string;
  username: string;
  email: string;
}

const BACKEND_URL = 'http://192.168.1.5:3000'; // Your computer's IP address

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [username, setUsername] = useState('testuser');
  const [isRegistering, setIsRegistering] = useState(false);

  // Reference for navigation
  const navigationRef = useRef(null);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#000' : '#fff',
    flex: 1,
  };

  const textStyle = {
    color: isDarkMode ? '#fff' : '#000',
  };

  // Initialize socket-based notifications
  useEffect(() => {
    const unsubscribe = setupNotificationListeners(navigationRef);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // FCM related code is temporarily disabled to focus on core features.
  // The code for handling push notifications will be restored later.

  // Check for stored auth token on startup
  useEffect(() => {
    const checkToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        if (storedToken) {
          // Validate token with server
          const response = await fetch(`${BACKEND_URL}/api/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setToken(storedToken);
            setUser(userData.user);
            setIsLoggedIn(true);
            fetchNotifications(storedToken);
          }
        }
      } catch (error) {
        console.error('Token validation error:', error);
      }
    };

    checkToken();
  }, []);  // Login function
  const handleLogin = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save token and user info
        setToken(data.token);
        setUser(data.user);
        setIsLoggedIn(true);

        // Store auth token for persistence
        await AsyncStorage.setItem('authToken', data.token);

        // Register with server for notifications
        await registerWithServer(data.token);

        Alert.alert('Success', 'Logged in successfully!');
        fetchNotifications(data.token);
      } else {
        Alert.alert('Error', data.message || 'Login failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Make sure backend is running.');
      console.error('Login error:', error);
    }
  };

  // Debug: Let's add console logs to see what's happening during registration
  const handleRegister = async () => {
    console.log('handleRegister called with data:', { username, email, password });

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      console.log('Response status:', response.status);
      console.log('Response data:', data);

      if (response.ok && data.token) {
        console.log('Registration successful, setting user state');

        // Save token and user info
        setToken(data.token);
        setUser(data.user);
        setIsLoggedIn(true);

        // Store auth token for persistence
        await AsyncStorage.setItem('authToken', data.token);

        // Register with server for notifications
        await registerWithServer(data.token);

        Alert.alert('Success', 'Account created successfully!');
        fetchNotifications(data.token);
      } else {
        console.error('Registration failed:', data);
        Alert.alert('Registration Failed', data.message || 'Please try again');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Network error. Please check your connection.');
    }
  };

  // Fetch notifications
  const fetchNotifications = async (authToken: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Fetch notifications error:', error);
    }
  };

  // Test notification creation
  const createTestNotification = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'Test Notification',
          message: `Hello ${user?.username}! This is a test notification from your React Native app.`,
          type: 'in-app', // Changed from 'info' to 'in-app'
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Test notification created!');
        fetchNotifications(token);
      } else {
        const data = await response.json();
        Alert.alert('Error', data.message || 'Failed to create notification');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
      console.error('Create notification error:', error);
    }
  };

  // Reload JavaScript bundle
  const reloadJSBundle = () => {
    try {
      DevSettings.reload();
    } catch (error) {
      console.error('Failed to reload JS bundle:', error);
      Alert.alert('Error', 'Could not reload. Try closing and reopening the app.');
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      // Unregister from server
      if (token) {
        try {
          await fetch(`${BACKEND_URL}/api/users/unregister-notifications`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            }
          });
        } catch (err) {
          console.error('Error unregistering from notifications:', err);
        }
      }

      // Clear AsyncStorage
      await AsyncStorage.removeItem('authToken');

      // Reset state
      setIsLoggedIn(false);
      setUser(null);
      setToken('');
      setNotifications([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Render notification item
  const renderNotification = ({ item }: { item: Notification }) => (
    <View style={[styles.notificationItem, { borderColor: isDarkMode ? '#333' : '#ddd' }]}>
      <Text style={[styles.notificationTitle, textStyle]}>{item.title}</Text>
      <Text style={[styles.notificationMessage, textStyle]}>{item.message}</Text>
      <Text style={[styles.notificationTime, { color: isDarkMode ? '#aaa' : '#666' }]}>
        {new Date(item.createdAt).toLocaleString()}
      </Text>
      <View style={[styles.statusBadge, { backgroundColor: item.status.read ? '#4CAF50' : '#FF9800' }]}>
        <Text style={styles.statusText}>{item.status.read ? 'Read' : 'Unread'}</Text>
      </View>
    </View>
  );

  // Trigger a push notification test
  const testPushNotification = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/notifications/push-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        Alert.alert('Success', 'Push notification test triggered! You should receive it shortly.');
      } else {
        const data = await response.json();
        Alert.alert('Error', data.message || 'Failed to trigger push notification');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
      console.error('Push notification test error:', error);
    }
  };

  // Check for stored auth token on startup
  useEffect(() => {
    const checkToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        if (storedToken) {
          // Validate token with server
          const response = await fetch(`${BACKEND_URL}/api/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setToken(storedToken);
            setUser(userData.user);
            setIsLoggedIn(true);
            fetchNotifications(storedToken);
          }
        }
      } catch (error) {
        console.error('Token validation error:', error);
      }
    };

    checkToken();
  }, []);

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={backgroundStyle}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <ScrollView contentInsetAdjustmentBehavior="automatic" style={backgroundStyle}>
          <View style={styles.container}>
            <Text style={[styles.title, textStyle]}>NotifyMe</Text>
            <Text style={[styles.subtitle, textStyle]}>Real-time Notification System</Text>

            <View style={styles.formContainer}>
              <TextInput
                style={[styles.input, { borderColor: isDarkMode ? '#333' : '#ddd', color: isDarkMode ? '#fff' : '#000' }]}
                placeholder="Email"
                placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {isRegistering && (
                <TextInput
                  style={[styles.input, { borderColor: isDarkMode ? '#333' : '#ddd', color: isDarkMode ? '#fff' : '#000' }]}
                  placeholder="Username"
                  placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              )}

              <TextInput
                style={[styles.input, { borderColor: isDarkMode ? '#333' : '#ddd', color: isDarkMode ? '#fff' : '#000' }]}
                placeholder="Password"
                placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={styles.button}
                onPress={isRegistering ? handleRegister : handleLogin}
              >
                <Text style={styles.buttonText}>
                  {isRegistering ? 'Register' : 'Login'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => setIsRegistering(!isRegistering)}
              >
                <Text style={[styles.linkText, textStyle]}>
                  {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, textStyle]}>Welcome {user?.username}!</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.testButton} onPress={createTestNotification}>
            <Text style={styles.buttonText}>Create In-App Notification</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.testButton, styles.pushButton]} onPress={testPushNotification}>
            <Text style={styles.buttonText}>Test Push Notification</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.testButton, styles.reloadButton]} onPress={reloadJSBundle}>
            <Text style={styles.buttonText}>Reload JS</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, textStyle]}>Your Notifications</Text>

        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item._id}
          style={styles.notificationsList}
          ListEmptyComponent={
            <Text style={[styles.emptyText, textStyle]}>
              No notifications yet. Create a test notification!
            </Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.8,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 10,
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  testButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  pushButton: {
    backgroundColor: '#007AFF',
    marginRight: 0,
    marginLeft: 10,
  },
  reloadButton: {
    backgroundColor: '#FF9500',
    marginRight: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    position: 'relative',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 10,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    marginBottom: 5,
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 50,
    opacity: 0.6,
  },
});


export default App;
