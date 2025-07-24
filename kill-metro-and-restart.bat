@echo off
echo Trying to free up port 8083...

REM Kill processes using port 8083
echo Finding processes using port 8083...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :8083') DO (
  echo Found process %%P using port 8083
  echo Attempting to kill process %%P...
  taskkill /F /PID %%P 2>nul
  IF %ERRORLEVEL% EQU 0 (
    echo Successfully killed process %%P
  ) ELSE (
    echo Failed to kill process %%P. You may need to run this script as administrator.
  )
)

REM Try to use a different port
echo Setting up port forwarding for port 8084 (alternative port)...
adb reverse tcp:8084 tcp:8084
adb reverse tcp:3000 tcp:3000

echo Starting Metro bundler on port 8084...
npx react-native start --reset-cache --port 8084
