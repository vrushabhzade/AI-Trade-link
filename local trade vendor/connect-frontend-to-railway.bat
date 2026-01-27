@echo off
echo ========================================
echo Connect Frontend to Railway Backend
echo ========================================
echo.

set /p RAILWAY_URL="Enter your Railway URL (e.g., https://your-app.up.railway.app): "

echo.
echo Updating Vercel environment variables...
echo.

echo Removing old VITE_API_URL...
vercel env rm VITE_API_URL production

echo Adding new VITE_API_URL with Railway URL...
echo %RAILWAY_URL% | vercel env add VITE_API_URL production

echo.
echo Removing old VITE_WS_URL...
vercel env rm VITE_WS_URL production

echo Adding new VITE_WS_URL with Railway URL...
echo %RAILWAY_URL% | vercel env add VITE_WS_URL production

echo.
echo Redeploying frontend to Vercel...
vercel --prod

echo.
echo ========================================
echo ✅ Done!
echo ========================================
echo.
echo Your frontend should now be connected to Railway backend!
echo.
echo Test it:
echo 1. Open: https://tradelink-marketplace.vercel.app
echo 2. Try to sign up or login
echo 3. Should work now!
echo.
pause
