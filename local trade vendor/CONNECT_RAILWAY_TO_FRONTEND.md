# 🔗 Connect Railway Backend to Vercel Frontend

## Step 1: Get Your Railway URL

1. Go to your Railway project dashboard
2. Click on your service
3. Go to **"Settings"** tab
4. Scroll to **"Domains"** section
5. If you don't see a domain, click **"Generate Domain"**
6. Copy your Railway URL (e.g., `https://tradelink-marketplace-production.up.railway.app`)

---

## Step 2: Test Your Railway Backend

Before connecting, make sure Railway is working:

```bash
# Replace YOUR-RAILWAY-URL with your actual URL
curl https://YOUR-RAILWAY-URL.up.railway.app/health
```

Should return:
```json
{"status":"ok","timestamp":"...","environment":"production"}
```

If you get an error, check:
- Railway deployment succeeded (green status)
- All environment variables are set
- Root directory is set to `backend`

---

## Step 3: Update Frontend Environment Variables

### Option A: Use the Batch Script (Windows)

1. Run: `connect-frontend-to-railway.bat`
2. Paste your Railway URL when prompted
3. Wait for deployment to complete

### Option B: Manual Commands

```bash
# Remove old API URL
vercel env rm VITE_API_URL production

# Add new Railway URL
vercel env add VITE_API_URL production
# When prompted, paste: https://YOUR-RAILWAY-URL.up.railway.app

# Remove old WebSocket URL
vercel env rm VITE_WS_URL production

# Add new Railway URL for WebSocket
vercel env add VITE_WS_URL production
# When prompted, paste: https://YOUR-RAILWAY-URL.up.railway.app

# Redeploy frontend
vercel --prod
```

**Important**: Replace `YOUR-RAILWAY-URL` with your actual Railway URL!

---

## Step 4: Test the Connection

1. Open: https://tradelink-marketplace.vercel.app
2. Click "Sign Up"
3. Create a test account:
   - Email: test@example.com
   - Password: Test1234
4. Click "Sign Up"
5. Should redirect to dashboard! ✅

---

## Troubleshooting

### "Failed to fetch" still appears

**Check 1**: Verify Railway backend is running
```bash
curl https://YOUR-RAILWAY-URL.up.railway.app/health
```

**Check 2**: Verify environment variables were updated
```bash
vercel env ls
```
Look for `VITE_API_URL` and `VITE_WS_URL` - they should point to Railway

**Check 3**: Verify you redeployed frontend
```bash
vercel --prod
```

**Check 4**: Check Railway logs for errors
- Railway Dashboard → Your Service → Deployments → View Logs

### Railway backend not responding

**Check 1**: Is deployment successful?
- Railway Dashboard → Your Service → Should show green "Active" status

**Check 2**: Are all environment variables set?
- Railway Dashboard → Variables tab
- Should have: DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY, FRONTEND_URL, NODE_ENV

**Check 3**: Is root directory correct?
- Railway Dashboard → Settings → Root Directory should be `backend`

**Check 4**: Check the logs
- Railway Dashboard → Deployments → View Logs
- Look for startup errors

### CORS errors in browser console

**Fix**: Update FRONTEND_URL in Railway
1. Railway Dashboard → Variables
2. Find FRONTEND_URL
3. Make sure it's: `https://tradelink-marketplace.vercel.app`
4. Redeploy Railway service

---

## Verification Checklist

- [ ] Railway backend is deployed and running (green status)
- [ ] Railway domain is generated
- [ ] Railway health endpoint responds: `/health`
- [ ] Updated VITE_API_URL in Vercel to Railway URL
- [ ] Updated VITE_WS_URL in Vercel to Railway URL
- [ ] Redeployed frontend with `vercel --prod`
- [ ] Frontend loads at https://tradelink-marketplace.vercel.app
- [ ] Can sign up new users
- [ ] Can login
- [ ] Dashboard loads after login

---

## Quick Reference

### Your URLs

**Frontend (Vercel)**:
```
https://tradelink-marketplace.vercel.app
```

**Backend (Railway)**:
```
https://YOUR-RAILWAY-URL.up.railway.app
```
(Replace with your actual Railway URL)

### Test Commands

```bash
# Test Railway backend
curl https://YOUR-RAILWAY-URL.up.railway.app/health

# Test Railway API
curl https://YOUR-RAILWAY-URL.up.railway.app/api

# Check Vercel environment variables
vercel env ls

# Redeploy frontend
vercel --prod
```

---

## Success! 🎉

Once everything is connected:
- ✅ Frontend on Vercel
- ✅ Backend on Railway
- ✅ Database on Supabase
- ✅ Login/Signup working
- ✅ Full application functional

Your TradeLink marketplace is now fully deployed and operational!

---

## Need Help?

If you're still having issues:
1. Share your Railway URL
2. Share any error messages from:
   - Browser console (F12)
   - Railway logs
   - Vercel deployment logs

I can help debug the specific issue!
