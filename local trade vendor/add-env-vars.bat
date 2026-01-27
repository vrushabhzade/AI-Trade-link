@echo off
echo Adding environment variables to Vercel...
echo.

echo 1/9: Adding DATABASE_URL...
echo postgresql://postgres:iitbomb@y142004@db.qpxlhbtzsegrfnozibbm.supabase.co:5432/postgres?sslmode=require | vercel env add DATABASE_URL production

echo 2/9: Adding JWT_SECRET...
echo 74be8558ec9b4eaed0cc8a578efc5efcb26a514bd2d43ccf2b03f596447b1b1d | vercel env add JWT_SECRET production

echo 3/9: Adding ANTHROPIC_API_KEY...
echo Please paste your Anthropic API key when prompted
vercel env add ANTHROPIC_API_KEY production

echo 4/9: Adding FRONTEND_URL...
echo https://tradelink-marketplace.vercel.app | vercel env add FRONTEND_URL production

echo 5/9: Adding PORT...
echo 3001 | vercel env add PORT production

echo 6/9: Adding NODE_ENV...
echo production | vercel env add NODE_ENV production

echo 7/9: Adding VITE_API_URL...
echo https://tradelink-marketplace.vercel.app | vercel env add VITE_API_URL production

echo 8/9: Adding VITE_WS_URL...
echo https://tradelink-marketplace.vercel.app | vercel env add VITE_WS_URL production

echo 9/9: Adding VITE_NODE_ENV...
echo production | vercel env add VITE_NODE_ENV production

echo.
echo ✅ All environment variables added!
echo Now run: vercel --prod
pause
