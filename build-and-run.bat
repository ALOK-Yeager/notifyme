@echo off
echo Stopping Gradle daemon...
cd android
call gradlew.bat --stop

echo Cleaning project...
call gradlew.bat clean

echo Building and installing app...
call gradlew.bat installDebug

echo Starting Metro bundler with correct host...
cd ..
npx react-native start --host 192.168.1.5
