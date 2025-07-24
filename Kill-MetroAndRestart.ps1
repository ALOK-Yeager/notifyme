# Check and kill processes using port 8083
Write-Host "Finding processes using port 8083..."
$processInfo = netstat -ano | Select-String ":8083"
if ($processInfo) {
    $processInfo | ForEach-Object {
        $parts = $_ -split '\s+', 5
        if ($parts.Count -ge 5) {
            $pid = $parts[4]
            Write-Host "Found process $pid using port 8083"
            Write-Host "Attempting to kill process $pid..."
            try {
                Stop-Process -Id $pid -Force
                Write-Host "Successfully killed process $pid"
            } catch {
                Write-Host "Failed to kill process $pid. You may need to run this script as administrator."
            }
        }
    }
}

# Set up port forwarding for a different port
Write-Host "Setting up port forwarding for port 8084 (alternative port)..."
adb reverse tcp:8084 tcp:8084
adb reverse tcp:3000 tcp:3000

# Start Metro bundler on the new port
Write-Host "Starting Metro bundler on port 8084..."
npx react-native start --reset-cache --port 8084
