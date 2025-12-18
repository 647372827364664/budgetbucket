@echo off
REM Budget Bucket - Quick Start Script

echo.
echo ============================================
echo  Budget Bucket - E-commerce Platform
echo ============================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if .env.local exists
if not exist ".env.local" (
    echo Warning: .env.local file not found!
    echo Creating from template...
    copy ".env.local.example" ".env.local"
    echo.
    echo Please update .env.local with your Firebase and API credentials
    echo.
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Clear build cache
if exist ".next" (
    echo Clearing Next.js cache...
    rmdir /s /q ".next"
)

echo.
echo Starting development server...
echo Open your browser to: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev

pause
