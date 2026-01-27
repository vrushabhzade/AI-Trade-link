# 🚂 Railway Backend Deployment Guide

## Step 1: Sign Up for Railway (2 minutes)

1. Go to https://railway.app
2. Click "Login" in top right
3. Click "Login with GitHub"
4. Authorize Railway to access your GitHub account
5. You'll be redirected to Railway dashboard

---

## Step 2: Create New Project (3 minutes)

### Option A: Deploy from GitHub (RECOMMENDED)

1. On Railway dashboard, click "New Project"
2. Click "Deploy from GitHub repo"
3. Select your repository: `Trade-link-`
4. Railway will detect it's a Node.js project
5. Click "Deploy Now"

### Option B: Use Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to backend
railway link
```

---

## Step 3: Configure Build Settings (2 minutes)

Railway should auto-detect the backend, but if needed:

1. Click on your deployed service
2. Go to "Settings" tab
3. Set these values:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
   - **Watch Paths**: `backend/**`

---

## Step 4: Add Environment Variables (5 minutes)

1. In your Railway project, click "Variables" tab
2. Click "New Variable" for each:

### Required Variables:

```
DATABASE_URL=postgresql://postgres:iitbomb@y142004@db.qpxlhbtzsegrfnozibbm.supabase.co:5432/postgres?sslmode=require

JWT_SECRET=74be8558ec9b4eaed0cc8a578efc5efcb26a514bd2d43ccf2b03f596447b1b1d

ANTHROPIC_API_KEY=sk-ant-api03-hzade91_tdzqsk-ant-api03-o39...hAAA

FRONTEND_URL=https://tradelink-marketplace.vercel.app

PORT=3001

NODE_ENV=production
```

**Important**: Replace `ANTHROPIC_API_KEY` with your full API key!

3. Click "Deploy" after adding all variables

---

## Step 5: Get Your Railway URL (1 minute)

1. Go to "Settings" tab
2. Scroll to "Domains" section
3. Click "Generate Domain"
4. Copy your Railway URL (e.g., `https://your-app.up.railway.app`)

---

## Step 6: Update Frontend to Use Railway Backend (3 minutes)

Now we need to point the frontend to your Railway backend:

```bash
# Remove old API URL
vercel env rm VITE_API_URL production

# Add new Railway URL
vercel env add VITE_API_URL production
# When prompted, paste your Railway URL (e.g., https://your-app.up.railway.app)

# Remove old WebSocket URL
vercel env rm VITE_WS_URL production

# Add new Railway URL for WebSocket
vercel env add VITE_WS_URL production
# When prompted, paste your Railway URL

# Redeploy frontend
vercel --prod
```

---

## Step 7: Run Database Migrations (2 minutes)

### Option A: Using Railway CLI

```bash
# Connect to your Railway project
railway link

# Run migrations
railway run npx prisma migrate deploy
```

### Option B: Using Railway Dashboard

1. Go to your Railway project
2. Click on your service
3. Go to "Deployments" tab
4. Click on the latest deployment
5. Click "View Logs"
6. Check if migrations ran automatically

If not, add this to your build command:
```
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

---

## Step 8: Test Your Backend (2 minutes)

### Test Health Endpoint

```bash
curl https://your-railway-url.up.railway.app/health
```

Should return:
```json
{"status":"ok","timestamp":"...","environment":"production"}
```

### Test API Endpoint

```bash
curl https://your-railway-url.up.railway.app/api
```

Should return API information.

---

## Step 9: Test Login/Signup (2 minutes)

1. Open https://tradelink-marketplace.vercel.app
2. Click "Sign Up"
3. Create a test account:
   - Email: test@example.com
   - Password: Test1234
4. Click "Sign Up"
5. Should redirect to dashboard!

---

## ✅ Deployment Checklist

- [ ] Signed up for Railway
- [ ] Created new project from GitHub
- [ ] Configured build settings (root directory: `backend`)
- [ ] Added all 6 environment variables
- [ ] Generated Railway domain
- [ ] Updated Vercel VITE_API_URL to Railway URL
- [ ] Updated Vercel VITE_WS_URL to Railway URL
- [ ] Redeployed frontend with `vercel --prod`
- [ ] Ran database migrations
- [ ] Health check passes
- [ ] API endpoint responds
- [ ] Can sign up and login

---

## 🎉 Success!

Once all steps are complete:
- ✅ Frontend on Vercel: https://tradelink-marketplace.vercel.app
- ✅ Backend on Railway: https://your-app.up.railway.app
- ✅ Database on Supabase
- ✅ Login/Signup working!

---

## 💰 Railway Free Tier

Railway's free tier includes:
- $5 free credit per month
- Enough for ~500 hours of runtime
- Perfect for development and testing
- Automatic HTTPS
- Easy scaling when needed

---

## 🆘 Troubleshooting

### "Build failed"
- Check build logs in Railway dashboard
- Verify root directory is set to `backend`
- Ensure all dependencies are in package.json

### "Database connection failed"
- Verify DATABASE_URL has `?sslmode=require` at end
- Check Supabase database is active
- Ensure DATABASE_URL is in Railway variables

### "Frontend still shows 'Failed to fetch'"
- Verify you updated VITE_API_URL in Vercel
- Verify you redeployed frontend with `vercel --prod`
- Check Railway backend is running (green status)
- Test Railway health endpoint directly

### "Migrations didn't run"
- Run manually: `railway run npx prisma migrate deploy`
- Or add to build command in Railway settings

---

## 📊 Monitor Your Deployment

### Railway Dashboard
- View logs: Click service → "Deployments" → Latest → "View Logs"
- Check metrics: CPU, memory, network usage
- View environment variables
- Restart service if needed

### Test Endpoints
```bash
# Health check
curl https://your-railway-url.up.railway.app/health

# API info
curl https://your-railway-url.up.railway.app/api

# Register test user
curl -X POST https://your-railway-url.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","name":"Test User"}'
```

---

## 🔗 Useful Links

- **Railway Dashboard**: https://railway.app/dashboard
- **Railway Docs**: https://docs.railway.app
- **Your Frontend**: https://tradelink-marketplace.vercel.app
- **Supabase Dashboard**: https://supabase.com/dashboard/project/qpxlhbtzsegrfnozibbm

---

**Ready to deploy?** Start with Step 1: https://railway.app
