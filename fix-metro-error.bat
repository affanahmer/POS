@echo off
echo ========================================
echo GarmentPOS Metro Bundler Fix Script
echo ========================================
echo.

echo Step 1: Killing all existing processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im adb.exe 2>nul
echo Processes killed.

echo.
echo Step 2: Restarting ADB server...
adb kill-server
timeout /t 2 /nobreak >nul
adb start-server
timeout /t 2 /nobreak >nul

echo.
echo Step 3: Checking device connection...
adb devices

echo.
echo Step 4: Setting up port forwarding...
adb reverse tcp:8081 tcp:8081
echo Port forwarding set up.

echo.
echo Step 5: Cleaning React Native cache...
npx react-native clean
echo Cache cleaned.

echo.
echo Step 6: Starting Metro bundler...
echo Metro bundler will start in a new window...
start "Metro Bundler" cmd /k "npx react-native start --reset-cache --host 0.0.0.0"

echo.
echo Step 7: Waiting for Metro to start...
timeout /t 10 /nobreak >nul

echo.
echo Step 8: Running the app...
npx react-native run-android

echo.
echo ========================================
echo Fix script completed!
echo ========================================
echo.
echo If you still see "Unable to load script" error:
echo 1. Shake your phone to open developer menu
echo 2. Tap "Reload" or "Reload JS"
echo 3. Or press R+R on your phone
echo.
echo If the issue persists, try Wi-Fi connection:
echo 1. Make sure phone and computer are on same Wi-Fi
echo 2. Shake phone -> Configure Bundler
echo 3. Enter your computer's IP address
echo.
pause
