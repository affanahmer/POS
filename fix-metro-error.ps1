# GarmentPOS Metro Bundler Fix Script
Write-Host "========================================" -ForegroundColor Green
Write-Host "GarmentPOS Metro Bundler Fix Script" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Step 1: Killing all existing processes..." -ForegroundColor Yellow
try {
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Stop-Process -Name "adb" -Force -ErrorAction SilentlyContinue
    Write-Host "Processes killed." -ForegroundColor Green
} catch {
    Write-Host "No processes to kill." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 2: Restarting ADB server..." -ForegroundColor Yellow
& adb kill-server
Start-Sleep -Seconds 2
& adb start-server
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Step 3: Checking device connection..." -ForegroundColor Yellow
& adb devices

Write-Host ""
Write-Host "Step 4: Setting up port forwarding..." -ForegroundColor Yellow
& adb reverse tcp:8081 tcp:8081
Write-Host "Port forwarding set up." -ForegroundColor Green

Write-Host ""
Write-Host "Step 5: Cleaning React Native cache..." -ForegroundColor Yellow
& npx react-native clean
Write-Host "Cache cleaned." -ForegroundColor Green

Write-Host ""
Write-Host "Step 6: Starting Metro bundler..." -ForegroundColor Yellow
Write-Host "Metro bundler will start in a new window..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx react-native start --reset-cache --host 0.0.0.0"

Write-Host ""
Write-Host "Step 7: Waiting for Metro to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "Step 8: Running the app..." -ForegroundColor Yellow
& npx react-native run-android

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Fix script completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "If you still see 'Unable to load script' error:" -ForegroundColor Red
Write-Host "1. Shake your phone to open developer menu" -ForegroundColor White
Write-Host "2. Tap 'Reload' or 'Reload JS'" -ForegroundColor White
Write-Host "3. Or press R+R on your phone" -ForegroundColor White
Write-Host ""
Write-Host "If the issue persists, try Wi-Fi connection:" -ForegroundColor Red
Write-Host "1. Make sure phone and computer are on same Wi-Fi" -ForegroundColor White
Write-Host "2. Shake phone -> Configure Bundler" -ForegroundColor White
Write-Host "3. Enter your computer's IP address" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
