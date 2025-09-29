@echo off
echo ========================================
echo GarmentPOS Wi-Fi Connection Fix
echo ========================================
echo.

echo Step 1: Getting your computer's IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set "IP=%%b"
        goto :found
    )
)
:found
echo Your computer's IP address is: %IP%
echo.

echo Step 2: Starting Metro bundler...
start "Metro Bundler" cmd /k "npx react-native start --reset-cache --host 0.0.0.0"

echo.
echo Step 3: Waiting for Metro to start...
timeout /t 10 /nobreak >nul

echo.
echo Step 4: Instructions for your phone...
echo.
echo 1. Make sure your phone and computer are on the SAME Wi-Fi network
echo 2. Open the GarmentPOS app on your phone
echo 3. Shake your phone to open developer menu
echo 4. Tap "Configure Bundler" or "Settings"
echo 5. Enter this IP address: %IP%:8081
echo 6. Tap "Apply" or "OK"
echo 7. Tap "Reload" or "Reload JS"
echo.
echo If you don't see the developer menu when shaking:
echo - Make sure USB Debugging is enabled
echo - Try pressing Ctrl+M (if connected via USB)
echo - Or press R+R quickly on your phone
echo.
echo ========================================
echo Wi-Fi fix setup completed!
echo ========================================
echo.
pause
