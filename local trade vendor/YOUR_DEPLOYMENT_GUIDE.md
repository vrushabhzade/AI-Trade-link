# 🚀 Your TradeLink Deployment Guide

**Generated**: January 26, 2026  
**Status**: Ready to Deploy

---

## ✅ What You Have Ready

- ✅ Vercel CLI installed (v50.1.3)
- ✅ Code pushed to GitHub
- ✅ All configuration files ready
- ✅ JWT Secret generated (see below)

---

## 🔑 Your Generated JWT Secret

**IMPORTANT**: Save this somewhere safe!

```
74be8558ec9b4eaed0cc8a578efc5efcb26a514bd2d43ccf2b03f596447b1b1d
```

---

## 📋 What You Need Before Deploying

### 1. Database URL (Choose One)

**Option A: Vercel Postgres (Easiest)**
1. Go to https://vercel.com/dashboard
2. Click "Storage" → "Create Database" → "Postgres"
3. Name: `tradelink-db`
4. Copy the DATABASE_URL

**Option B: Supabase (Free)**
1. Go to https://supabase.com
2. Create new project: `tradelink-db`
3. Go to Settings → Database
4. Copy connection string and add `?sslmode=require` at end

### 2. Anthropic API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Create API key
4. Copy the key (starts with `sk-ant-`)

---

## 🚀 Deployment Method 1: Vercel Dashboard (Recommended)

### Step 1: Go to Vercel
Visit: https://vercel.com/new

### Step 2: Import Your Repository
- Click "Import Git Repository"
- Search for: `Trade-link-`
- Click "Import"

### Step 3: Configure Project
- **Project Name**: `tradelink-marketplace` (or your choice)
- **Framework Preset**: Other (leave as is)
- **Root Directory**: `./` (leave as is)
- **Build Command**: (leave empty)
- **Output Directory**: (leave empty)

### Step 4: Add Environment Variables

Click "Environment Variables" and add these:

```
DATABASE_URL
[Your database URL from Step 1 above]

JWT_SECRET
74be8558ec9b4eaed0cc8a578efc5efcb26a514bd2d43ccf2b03f596447b1b1d

ANTHROPIC_API_KEY
[Your Anthropic API key from Step 2 above]

FRONTEND_URL
https://tradelink-marketplace.vercel.app

PORT
3001

NODE_ENV
production

VITE_API_URL
https://tradelink-marketplace.vercel.app

VITE_WS_URL
https://tradelink-marketplace.vercel.app

VITE_NODE_ENV
production
```

**Note**: Replace `tradelink-marketplace` with your actual project name if different

### Step 5: Deploy
- Click "Deploy"
- Wait 2-3 minutes
- Note your actual Vercel URL

### Step 6: Update URLs
After deployment:
1. Go to Settings → Environment Variables
2. Update these with your ACTUAL Vercel URL:
   - `FRONTEND_URL`
   - `VITE_API_URL`
   - `VITE_WS_URL`
3. Go to Deployments → Click "..." → "Redeploy"

---

## 🚀 Deployment Method 2: Vercel CLI

### Step 1: Login to Vercel
```bash
vercel login
```

### Step 2: Deploy
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? **Select your account**
- Link to existing project? **No**
- Project name? **tradelink-marketplace**
- Directory? **./`**
- Override settings? **No**

### Step 3: Add Environment Variables

You'll need to add each variable:

```bash
vercel env add DATABASE_URL production
# Paste your database URL when prompted

vercel env add JWT_SECRET production
# Paste: 74be8558ec9b4eaed0cc8a578efc5efcb26a514bd2d43ccf2b03f596447b1b1d

vercel env add ANTHROPIC_API_KEY production
# Paste your Anthropic API key

vercel env add FRONTEND_URL production
# Enter: https://your-project-name.vercel.app

vercel env add PORT production
# Enter: 3001

vercel env add NODE_ENV production
# Enter: production

vercel env add VITE_API_URL production
# Enter: https://your-project-name.vercel.app

vercel env add VITE_WS_URL production
# Enter: https://your-project-name.vercel.app

vercel env add VITE_NODE_ENV production
# Enter: production
```

### Step 4: Deploy to Production
```bash
vercel --prod
```

---

## 🗄️ Run Database Migrations

After deployment, run migrations:

```bash
# Pull environment variables
vercel env pull .env.production

# Run migrations
cd backend
npx prisma migrate deploy
npx prisma generate
```

---

## ✅ Test Your Deployment

### 1. Health Check
```bash
curl https://your-app.vercel.app/health
```

Should return: `{"status":"ok",...}`

### 2. API Check
```bash
curl https://your-app.vercel.app/api
```

Should return API information

### 3. Open in Browser
Visit your Vercel URL and test:
- Homepage loads
- Can register new user
- Can log in
- Dashboard works

---

## 📝 Deployment Checklist

- [ ] Database created and URL ready
- [ ] Anthropic API key obtained
- [ ] JWT secret saved (see above)
- [ ] Logged into Vercel
- [ ] Project deployed
- [ ] Environment variables added
- [ ] URLs updated with actual Vercel URL
- [ ] Redeployed with correct URLs
- [ ] Database migrations run
- [ ] Health check passes
- [ ] Can register and login

---

## 🆘 Quick Troubleshooting

### Build Fails
- Check Vercel deployment logs
- Verify all environment variables are set
- Try redeploying

### Database Connection Error
- Verify DATABASE_URL format
- Check database allows external connections
- Ensure `?sslmode=require` is added (for Supabase)

### Can't Access App
- Check if deployment completed successfully
- Verify environment variables are saved
- Check Vercel function logs

---

## 🔗 Important Links

- **Deploy Now**: https://vercel.com/new
- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Repo**: https://github.com/vrushabhzade/Trade-link-
- **Anthropic Console**: https://console.anthropic.com/
- **Supabase**: https://supabase.com

---

## 📚 Additional Documentation

- **Detailed Guide**: DEPLOY_ACTION_PLAN.md
- **Quick Reference**: QUICK_DEPLOY.md
- **Troubleshooting**: DEPLOYMENT_TROUBLESHOOTING.md

---

**Ready to deploy?** Choose Method 1 (Dashboard) or Method 2 (CLI) above! 🚀

**Your JWT Secret**: `74be8558ec9b4eaed0cc8a578efc5efcb26a514bd2d43ccf2b03f596447b1b1d`
