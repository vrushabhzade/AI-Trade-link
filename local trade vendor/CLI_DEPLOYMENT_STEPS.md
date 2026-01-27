# 🚀 CLI Deployment Steps for TradeLink

**Your JWT Secret**: `74be8558ec9b4eaed0cc8a578efc5efcb26a514bd2d43ccf2b03f596447b1b1d`

---

## ⚠️ BEFORE YOU START - Prerequisites

You MUST have these ready before deploying:

### 1. Database URL
Get from one of these:

**Option A: Vercel Postgres**
- Go to https://vercel.com/dashboard
- Click "Storage" → "Create Database" → "Postgres"
- Name: `tradelink-db`
- Copy the DATABASE_URL

**Option B: Supabase (Free)**
- Go to https://supabase.com
- Create project: `tradelink-db`
- Settings → Database → Copy connection string
- Add `?sslmode=require` at the end

### 2. Anthropic API Key
- Go to https://console.anthropic.com/
- Sign up/login
- Create API key
- Copy it (starts with `sk-ant-`)

---

## 📋 Step-by-Step CLI Deployment

### Step 1: Login to Vercel

```bash
vercel login
```

- A browser window will open
- Login with your GitHub account
- Return to terminal and press ENTER

### Step 2: Deploy (Preview)

```bash
vercel
```

Answer the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → No
- **What's your project's name?** → `tradelink-marketplace` (or your choice)
- **In which directory is your code located?** → `./` (press ENTER)
- **Want to override the settings?** → No

Wait for deployment to complete. Note the preview URL.

### Step 3: Add Environment Variables

Now add each environment variable. You'll be prompted to paste the value for each:

```bash
# Database URL
vercel env add DATABASE_URL production
# Paste your database URL when prompted

# JWT Secret
vercel env add JWT_SECRET production
# Paste: 74be8558ec9b4eaed0cc8a578efc5efcb26a514bd2d43ccf2b03f596447b1b1d

# Anthropic API Key
vercel env add ANTHROPIC_API_KEY production
# Paste your Anthropic API key

# Frontend URL (use your project name)
vercel env add FRONTEND_URL production
# Enter: https://tradelink-marketplace.vercel.app

# Port
vercel env add PORT production
# Enter: 3001

# Node Environment
vercel env add NODE_ENV production
# Enter: production

# Vite API URL
vercel env add VITE_API_URL production
# Enter: https://tradelink-marketplace.vercel.app

# Vite WebSocket URL
vercel env add VITE_WS_URL production
# Enter: https://tradelink-marketplace.vercel.app

# Vite Node Environment
vercel env add VITE_NODE_ENV production
# Enter: production
```

### Step 4: Deploy to Production

```bash
vercel --prod
```

This will deploy with all environment variables. Wait 2-3 minutes.

### Step 5: Note Your Actual URL

After deployment, you'll get your actual Vercel URL like:
```
https://tradelink-marketplace-abc123.vercel.app
```

### Step 6: Update URLs with Actual Vercel URL

If your actual URL is different from what you entered, update these variables:

```bash
# Update FRONTEND_URL
vercel env rm FRONTEND_URL production
vercel env add FRONTEND_URL production
# Enter your ACTUAL Vercel URL

# Update VITE_API_URL
vercel env rm VITE_API_URL production
vercel env add VITE_API_URL production
# Enter your ACTUAL Vercel URL

# Update VITE_WS_URL
vercel env rm VITE_WS_URL production
vercel env add VITE_WS_URL production
# Enter your ACTUAL Vercel URL
```

Then redeploy:
```bash
vercel --prod
```

### Step 7: Run Database Migrations

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

---

## ✅ Test Your Deployment

### 1. Health Check
```bash
curl https://your-actual-url.vercel.app/health
```

Should return: `{"status":"ok",...}`

### 2. API Check
```bash
curl https://your-actual-url.vercel.app/api
```

Should return API information

### 3. Open in Browser
Visit your Vercel URL and test:
- Homepage loads
- Register new user
- Login works
- Dashboard accessible

---

## 🆘 Troubleshooting

### "Error: The user aborted a request"
- Run `vercel login` again
- Let the browser window open
- Complete the login
- Return to terminal

### "No Space Left" or "Build Failed"
- Check Vercel dashboard for detailed logs
- Verify all environment variables are set
- Try deploying again

### "Database Connection Error"
- Verify DATABASE_URL is correct
- Check database allows external connections
- Ensure `?sslmode=require` is added (for Supabase)

### "Cannot find module"
- Make sure you're in the project root directory
- Run `npm install` if needed
- Try deploying again

---

## 📝 Quick Command Reference

```bash
# Login
vercel login

# Deploy preview
vercel

# Deploy production
vercel --prod

# Add environment variable
vercel env add VARIABLE_NAME production

# Remove environment variable
vercel env rm VARIABLE_NAME production

# Pull environment variables
vercel env pull .env.production

# View deployments
vercel ls

# View logs
vercel logs
```

---

## 🔗 Important Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Get Database**: https://vercel.com/dashboard (Storage) or https://supabase.com
- **Get API Key**: https://console.anthropic.com/
- **GitHub Repo**: https://github.com/vrushabhzade/Trade-link-

---

## ✅ Deployment Checklist

- [ ] Logged into Vercel CLI
- [ ] Database URL ready
- [ ] Anthropic API key ready
- [ ] JWT secret saved (see top of file)
- [ ] Deployed preview with `vercel`
- [ ] Added all environment variables
- [ ] Deployed to production with `vercel --prod`
- [ ] Noted actual Vercel URL
- [ ] Updated URLs if needed
- [ ] Ran database migrations
- [ ] Health check passes
- [ ] Can register and login

---

**Ready to start?** Begin with Step 1 above!

**Your JWT Secret**: `74be8558ec9b4eaed0cc8a578efc5efcb26a514bd2d43ccf2b03f596447b1b1d`
