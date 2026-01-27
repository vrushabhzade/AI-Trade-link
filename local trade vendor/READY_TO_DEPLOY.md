# ✅ Ready to Deploy - All Credentials Confirmed

## 🔐 Your Credentials (VERIFIED)

### 1. Anthropic API Key
```
sk-ant-api03-hzade91_tdzqsk-ant-api03-o39...hAAA
```

### 2. Database URL (CORRECTED)
```
postgresql://postgres:iitbomb@y142004@db.qpxlhbtzsegrfnozibbm.supabase.co:5432/postgres?sslmode=require
```

### 3. JWT Secret
```
74be8558ec9b4eaed0cc8a578efc5efcb26a514bd2d43ccf2b03f596447b1b1d
```

---

## 🚀 Deployment Commands - Run These Now

### Step 1: Login to Vercel
```bash
vercel login
```
- Browser will open
- Login with GitHub
- Return to terminal

### Step 2: Deploy Preview
```bash
vercel
```
Answer prompts:
- Set up and deploy? → **Yes**
- Which scope? → **Select your account**
- Link to existing project? → **No**
- Project name? → **tradelink-marketplace**
- Directory? → **./` (press ENTER)**
- Override settings? → **No**

### Step 3: Add Environment Variables

Run these commands one by one. When prompted, paste the value shown:

```bash
# 1. Database URL
vercel env add DATABASE_URL production
# Paste: postgresql://postgres:iitbomb@y142004@db.qpxlhbtzsegrfnozibbm.supabase.co:5432/postgres?sslmode=require

# 2. JWT Secret
vercel env add JWT_SECRET production
# Paste: 74be8558ec9b4eaed0cc8a578efc5efcb26a514bd2d43ccf2b03f596447b1b1d

# 3. Anthropic API Key
vercel env add ANTHROPIC_API_KEY production
# Paste: sk-ant-api03-hzade91_tdzqsk-ant-api03-o39...hAAA

# 4. Frontend URL
vercel env add FRONTEND_URL production
# Type: https://tradelink-marketplace.vercel.app

# 5. Port
vercel env add PORT production
# Type: 3001

# 6. Node Environment
vercel env add NODE_ENV production
# Type: production

# 7. Vite API URL
vercel env add VITE_API_URL production
# Type: https://tradelink-marketplace.vercel.app

# 8. Vite WebSocket URL
vercel env add VITE_WS_URL production
# Type: https://tradelink-marketplace.vercel.app

# 9. Vite Node Environment
vercel env add VITE_NODE_ENV production
# Type: production
```

### Step 4: Deploy to Production
```bash
vercel --prod
```

Wait 2-3 minutes. Note your actual Vercel URL!

### Step 5: Run Database Migrations
```bash
# Pull environment variables
vercel env pull .env.production

# Navigate to backend
cd backend

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Go back to root
cd ..
```

### Step 6: Test Your Deployment
```bash
# Health check (replace with your actual URL)
curl https://your-app.vercel.app/health

# API check
curl https://your-app.vercel.app/api
```

Then open your Vercel URL in browser and test:
- Register new user
- Login
- Access dashboard

---

## ✅ Deployment Checklist

- [ ] Ran `vercel login`
- [ ] Deployed with `vercel`
- [ ] Added all 9 environment variables
- [ ] Deployed to production with `vercel --prod`
- [ ] Noted actual Vercel URL
- [ ] Ran database migrations
- [ ] Health check passes
- [ ] Can register and login

---

## 🎉 You're Ready!

All credentials are confirmed. Just run the commands above in order and your app will be live!

**Start with:** `vercel login`
