# 🆓 Free Tier Deployment Guide - TradeLink

**100% Free deployment using Supabase + Vercel + Anthropic free tiers**

**Your JWT Secret**: `74be8558ec9b4eaed0cc8a578efc5efcb26a514bd2d43ccf2b03f596447b1b1d`

---

## 🎯 What You'll Get (All Free)

- ✅ **Supabase**: Free PostgreSQL database (500MB storage, 2GB bandwidth/month)
- ✅ **Vercel**: Free hosting (100GB bandwidth, unlimited deployments)
- ✅ **Anthropic**: Free API tier ($5 credit to start)

---

## 📋 Step 1: Set Up Supabase Database (5 minutes)

### 1.1 Create Supabase Account
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email

### 1.2 Create New Project
1. Click "New Project"
2. Fill in:
   - **Name**: `tradelink-db`
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free (already selected)
3. Click "Create new project"
4. Wait 2 minutes for setup

### 1.3 Get Database URL
1. Once ready, click "Settings" (gear icon) in left sidebar
2. Click "Database"
3. Scroll to "Connection string"
4. Select "URI" tab
5. Copy the connection string
6. **IMPORTANT**: Replace `[YOUR-PASSWORD]` with your actual password
7. **IMPORTANT**: Add `?sslmode=require` at the end

Your final DATABASE_URL should look like:
```
postgresql://postgres:your-password@db.abc123xyz.supabase.co:5432/postgres?sslmode=require
```

✅ **Save this DATABASE_URL somewhere safe!**

---

## 📋 Step 2: Get Anthropic API Key (2 minutes)

### 2.1 Create Anthropic Account
1. Go to https://console.anthropic.com/
2. Click "Sign Up"
3. Sign up with email
4. Verify your email

### 2.2 Get API Key
1. Once logged in, click "API Keys" in left sidebar
2. Click "Create Key"
3. Name: `tradelink-production`
4. Click "Create Key"
5. Copy the API key (starts with `sk-ant-`)

✅ **Save this API key somewhere safe!**

**Note**: Anthropic gives you $5 free credit to start. This is enough for testing and initial usage.

---

## 📋 Step 3: Deploy to Vercel (Free Tier)

### 3.1 Login to Vercel
```bash
vercel login
```
- Browser will open
- Login with GitHub (recommended)
- Return to terminal

### 3.2 Deploy Preview
```bash
vercel
```

Answer prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → No
- **Project name?** → `tradelink-marketplace`
- **Directory?** → `./` (press ENTER)
- **Override settings?** → No

Wait for deployment. Note the preview URL.

### 3.3 Add Environment Variables

Now add each variable. When prompted, paste the values:

```bash
# 1. Database URL (from Step 1.3)
vercel env add DATABASE_URL production
# Paste your Supabase DATABASE_URL

# 2. JWT Secret
vercel env add JWT_SECRET production
# Paste: 74be8558ec9b4eaed0cc8a578efc5efcb26a514bd2d43ccf2b03f596447b1b1d

# 3. Anthropic API Key (from Step 2.2)
vercel env add ANTHROPIC_API_KEY production
# Paste your Anthropic API key

# 4. Frontend URL
vercel env add FRONTEND_URL production
# Enter: https://tradelink-marketplace.vercel.app

# 5. Port
vercel env add PORT production
# Enter: 3001

# 6. Node Environment
vercel env add NODE_ENV production
# Enter: production

# 7. Vite API URL
vercel env add VITE_API_URL production
# Enter: https://tradelink-marketplace.vercel.app

# 8. Vite WebSocket URL
vercel env add VITE_WS_URL production
# Enter: https://tradelink-marketplace.vercel.app

# 9. Vite Node Environment
vercel env add VITE_NODE_ENV production
# Enter: production
```

### 3.4 Deploy to Production
```bash
vercel --prod
```

Wait 2-3 minutes. You'll get your production URL like:
```
https://tradelink-marketplace-abc123.vercel.app
```

✅ **Save your actual Vercel URL!**

---

## 📋 Step 4: Update URLs (If Needed)

If your actual Vercel URL is different from `tradelink-marketplace.vercel.app`, update these:

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

# Redeploy
vercel --prod
```

---

## 📋 Step 5: Run Database Migrations

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

## ✅ Step 6: Test Your Deployment

### 6.1 Health Check
```bash
curl https://your-actual-url.vercel.app/health
```

Should return: `{"status":"ok",...}`

### 6.2 API Check
```bash
curl https://your-actual-url.vercel.app/api
```

Should return API information

### 6.3 Browser Test
1. Open your Vercel URL in browser
2. You should see TradeLink homepage
3. Click "Sign Up"
4. Create test account:
   - Email: test@example.com
   - Password: Test1234 (8+ chars, 1 upper, 1 lower, 1 number)
5. Login with test account
6. Dashboard should load

---

## 🎉 You're Live on Free Tier!

Your TradeLink marketplace is now deployed at:
```
https://your-app-name.vercel.app
```

### Free Tier Limits

**Supabase Free Tier:**
- 500MB database storage
- 2GB bandwidth per month
- Unlimited API requests
- Perfect for testing and small projects

**Vercel Free Tier:**
- 100GB bandwidth per month
- Unlimited deployments
- Automatic HTTPS
- Perfect for hobby projects

**Anthropic Free Tier:**
- $5 free credit
- Enough for ~25,000 API calls
- Great for testing

---

## 📊 Monitor Your Usage

### Supabase
- Dashboard: https://supabase.com/dashboard
- Check database size and bandwidth usage
- View logs and metrics

### Vercel
- Dashboard: https://vercel.com/dashboard
- Check bandwidth usage
- View deployment logs
- Monitor function execution

### Anthropic
- Console: https://console.anthropic.com/
- Check API usage and credits
- View request logs

---

## 🆙 When to Upgrade

You'll need to upgrade when you exceed:

**Supabase:**
- 500MB database storage
- 2GB bandwidth/month
- Upgrade: $25/month for Pro

**Vercel:**
- 100GB bandwidth/month
- Upgrade: $20/month for Pro

**Anthropic:**
- $5 free credit used
- Pay-as-you-go: $0.25 per 1M tokens

---

## 🆘 Troubleshooting

### "Database connection failed"
- Check DATABASE_URL has `?sslmode=require` at end
- Verify password is correct (no special characters causing issues)
- Check Supabase project is active

### "Anthropic API error"
- Verify API key is correct
- Check you have remaining credit
- Ensure key is not expired

### "Vercel build failed"
- Check deployment logs in Vercel dashboard
- Verify all environment variables are set
- Try redeploying

### "Out of bandwidth"
- Check usage in Supabase/Vercel dashboards
- Consider upgrading if needed
- Optimize images and API calls

---

## ✅ Deployment Checklist

- [ ] Created Supabase account
- [ ] Created database project
- [ ] Got DATABASE_URL with `?sslmode=require`
- [ ] Created Anthropic account
- [ ] Got Anthropic API key
- [ ] Logged into Vercel CLI
- [ ] Deployed with `vercel`
- [ ] Added all 9 environment variables
- [ ] Deployed to production with `vercel --prod`
- [ ] Updated URLs if needed
- [ ] Ran database migrations
- [ ] Health check passes
- [ ] Can register and login
- [ ] Dashboard works

---

## 🔗 Quick Links

- **Your App**: https://your-app-name.vercel.app
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Anthropic Console**: https://console.anthropic.com/
- **GitHub Repo**: https://github.com/vrushabhzade/Trade-link-

---

## 💡 Tips for Free Tier

1. **Optimize Database Queries**: Use indexes, limit results
2. **Cache API Responses**: Reduce Anthropic API calls
3. **Compress Images**: Reduce bandwidth usage
4. **Monitor Usage**: Check dashboards regularly
5. **Clean Up Test Data**: Keep database size small

---

**Ready to deploy?** Start with Step 1 above!

**Your Credentials:**
- JWT Secret: `74be8558ec9b4eaed0cc8a578efc5efcb26a514bd2d43ccf2b03f596447b1b1d`
- Database URL: (get from Supabase)
- API Key: (get from Anthropic)
