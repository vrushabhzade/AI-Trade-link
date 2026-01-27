# 🚀 Railway Quick Start - Deploy Backend in 10 Minutes

## Your Credentials Ready:
- ✅ DATABASE_URL: `postgresql://postgres:iitbomb@y142004@db.qpxlhbtzsegrfnozibbm.supabase.co:5432/postgres?sslmode=require`
- ✅ JWT_SECRET: `74be8558ec9b4eaed0cc8a578efc5efcb26a514bd2d43ccf2b03f596447b1b1d`
- ⚠️ ANTHROPIC_API_KEY: (your key starting with `sk-ant-api03-`)

---

## 🎯 Quick Steps

### 1. Go to Railway (1 min)
👉 **Open**: https://railway.app
- Click "Login"
- Click "Login with GitHub"
- Authorize Railway

### 2. Deploy from GitHub (2 min)
- Click "New Project"
- Click "Deploy from GitHub repo"
- Select: `Trade-link-`
- Click "Deploy Now"

### 3. Configure Service (2 min)
- Click on your deployed service
- Go to "Settings" tab
- Set **Root Directory**: `backend`
- Click "Save"

### 4. Add Environment Variables (3 min)
- Click "Variables" tab
- Click "New Variable" and add each:

```
DATABASE_URL
postgresql://postgres:iitbomb@y142004@db.qpxlhbtzsegrfnozibbm.supabase.co:5432/postgres?sslmode=require

JWT_SECRET
74be8558ec9b4eaed0cc8a578efc5efcb26a514bd2d43ccf2b03f596447b1b1d

ANTHROPIC_API_KEY
[paste your full key here]

FRONTEND_URL
https://tradelink-marketplace.vercel.app

PORT
3001

NODE_ENV
production
```

### 5. Generate Domain (1 min)
- Go to "Settings" tab
- Scroll to "Domains"
- Click "Generate Domain"
- **Copy your Railway URL** (e.g., `https://tradelink-marketplace-production.up.railway.app`)

### 6. Update Frontend (2 min)
Run these commands in your terminal:

```bash
# Update API URL
vercel env rm VITE_API_URL production
echo "https://YOUR-RAILWAY-URL.up.railway.app" | vercel env add VITE_API_URL production

# Update WebSocket URL
vercel env rm VITE_WS_URL production
echo "https://YOUR-RAILWAY-URL.up.railway.app" | vercel env add VITE_WS_URL production

# Redeploy
vercel --prod
```

**Replace `YOUR-RAILWAY-URL` with your actual Railway URL!**

### 7. Test! (1 min)
1. Open: https://tradelink-marketplace.vercel.app
2. Click "Sign Up"
3. Create account: test@example.com / Test1234
4. Should work! 🎉

---

## ✅ Checklist

- [ ] Logged into Railway with GitHub
- [ ] Deployed from GitHub repo
- [ ] Set root directory to `backend`
- [ ] Added all 6 environment variables
- [ ] Generated Railway domain
- [ ] Copied Railway URL
- [ ] Updated VITE_API_URL in Vercel
- [ ] Updated VITE_WS_URL in Vercel
- [ ] Redeployed frontend
- [ ] Tested signup/login

---

## 🆘 Need Help?

### Backend not deploying?
- Check "Deployments" tab for logs
- Verify root directory is `backend`
- Check all environment variables are set

### Frontend still shows "Failed to fetch"?
- Make sure you updated BOTH VITE_API_URL and VITE_WS_URL
- Make sure you ran `vercel --prod` after updating
- Check Railway backend is running (green status)

### Test your Railway backend directly:
```bash
curl https://YOUR-RAILWAY-URL.up.railway.app/health
```

Should return: `{"status":"ok",...}`

---

## 📚 Full Guide

For detailed instructions, see: `RAILWAY_DEPLOYMENT.md`

---

**Start here**: https://railway.app 🚂
