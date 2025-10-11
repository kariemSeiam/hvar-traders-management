@echo off
echo ====================================
echo   Starting Traders Manager Server
echo ====================================
echo.
echo Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from: https://nodejs.org
    pause
    exit /b 1
)

echo Node.js found!
echo.
echo Checking for dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo.
echo Starting server...
echo.
call npm start

