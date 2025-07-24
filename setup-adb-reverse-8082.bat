@echo off
echo Setting up reverse port forwarding for React Native on port 8082...
adb reverse tcp:8082 tcp:8082
echo Done! Now your phone can connect to the Metro bundler on your computer.
