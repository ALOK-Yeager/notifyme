# Fixing "Unable to load script" Issue on Physical Device

This document provides steps to resolve the "Unable to load script" error when running your React Native app on a physical device.

## 1. Verify Device Connection

```
adb devices
```

Make sure your device appears in the list. If not:
- Check your USB connection
- Ensure USB debugging is enabled on your device
- Try a different USB cable
- Restart your device

## 2. Update IP Address in App.tsx

We've already updated your `App.tsx` file to use your computer's IP address (192.168.1.5) instead of the emulator address. Make sure your phone and computer are on the same WiFi network.

## 3. Clear Metro Cache and Start with Specific IP

```
cd c:\Users\shash\notifyme
npx react-native start --reset-cache --host 192.168.1.5
```

Keep this terminal window open while testing.

## 4. Install and Run the App (in a new terminal)

```
cd c:\Users\shash\notifyme
npx react-native run-android
```

## 5. If Still Not Working

Try these additional steps:

1. Enable "Dev Settings" in the app (use the new Reload JS button we added)
2. In the dev menu, change the "Debug server host & port" to your computer's IP and port: "192.168.1.5:8081"
3. Reload the app

## 6. Alternate Method: Using Reverse Port Forwarding

If the above doesn't work, try:

```
adb reverse tcp:8081 tcp:8081
```

Then restart your app.

## 7. Checking Firewall Settings

Make sure your Windows firewall allows connections to port 8081.

## 8. Use the Release Build as a Last Resort

If all else fails, you can build a release version that doesn't need the Metro server:

```
cd c:\Users\shash\notifyme\android
.\gradlew.bat assembleRelease
adb install -r app\build\outputs\apk\release\app-release.apk
```

Note: This requires signing configuration to be set up in your build.gradle files.
