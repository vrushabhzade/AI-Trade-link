@echo off
REM TradeLink Vercel Deployment Script for Windows
REM This script helps you deploy the TradeLink marketplace to Vercel

echo.
echo ================================
echo TradeLink Vercel Deployment Helper
echo ================================
echo.

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Vercel CLI is not installed.
    echo [INFO] Install it with: npm install -g vercel
    exit /b 1
)

echo [OK] Vercel CLI found
echo.

REM Login to Vercel
echo [INFO] Logging in to Vercel...
call vercel login

echo.
echo Before deploying, make sure you have:
echo   1. Created a PostgreSQL database
echo   2. Prepared your environment variables
echo   3. Pushed your code to GitHub
echo.

set /p CONFIRM="Are you ready to deploy? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo [CANCELLED] Deployment cancelled
    exit /b 1
)

echo.
echo [INFO] Starting deployment...
echo.

REM Deploy to Vercel
call vercel --prod

echo.
echo [SUCCESS] Deployment complete!
echo.
echo Next steps:
echo   1. Add environment variables in Vercel dashboard
echo   2. Run database migrations
echo   3. Test your deployment
echo.
echo See VERCEL_DEPLOYMENT.md for detailed instructions
echo.
pause
