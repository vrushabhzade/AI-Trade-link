# 🚀 Deploy TradeLink to Vercel - Step by Step

Your app is ready! Follow these steps to get it live in the next 10 minutes.

## ✅ Pre-Deployment Status

- ✅ Code pushed to GitHub: https://github.com/vrushabhzade/Trade-link-
- ✅ All configuration files ready
- ✅ Environment variables use proper fallbacks
- ✅ Build scripts configured
- ✅ 21 deployment checks passed

## 🎯 Step 1: Set Up Database (5 minutes)

### Option A: Vercel Postgres (Easiest)

1. Go to https://vercel.com/dashboard
2. Click "Storage" in the top menu
3. Click "Create Database" → Select "Postgres"
4. Name it: `tradelink-db`
5. Click "Create"
6. Copy the `DATABASE_URL` (you'll need this in Step 3)

### Option B: Supabase (Free Tier)

1. Go to https://supabase.com
2. Click "New Project"
3. Name: `tradelink-db`
4. Set a strong database password
5. Click "Create Project" (wait 2 minutes)
6. Go to Settings → Database → Connection String
7. Copy the URI connection string
8. Add `?sslmode=require` to the end
9. Your DATABASE_URL looks like:
   ```
   postgresql://postgres:[password]@[host].supabase.co:5432/postgres?sslmode=require
   ```

## 🎯 Step 2: Get Anthropic API Key (2 minutes)

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Click "API Keys" in the left menu
4. Click "Create Key"
5. Name it: `tradelink-production`
6. Copy the API key (starts with `sk-ant-`)

## 🎯 Step 3: Generate JWT Secret (30 seconds)

Run this command in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output - this is your JWT_SECRET.

## 🎯 Step 4: Deploy to Vercel (3 minutes)

### Using Vercel Dashboard (Recommended)

1. **Go to Vercel**
   - Visit: https://vercel.com/new
   - Sign in with GitHub

2. **Import Repository**
   - Click "Import Git Repository"
   - Search for: `Trade-link-`
   - Click "Import"

3. **Configure Project**
   - Project Name: `tradelink-marketplace` (or your choice)
   - Framework Preset: **Other** (leave as is)
   - Root Directory: `./` (leave as is)
   - Build Command: (leave empty - handled by vercel.json)
   - Output Directory: (leave empty - handled by vercel.json)

4. **Add Environment Variables**
   
   Click "Environment Variables" and add these:

   **Backend Variables:**
   ```
   DATABASE_URL = [paste your database URL from Step 1]
   JWT_SECRET = [paste your JWT secret from Step 3]
   ANTHROPIC_API_KEY = [paste your API key from Step 2]
   FRONTEND_URL = https://tradelink-marketplace.vercel.app
   PORT = 3001
   NODE_ENV = production
   ```

   **Frontend Variables:**
   ```
   VITE_API_URL = https://tradelink-marketplace.vercel.app
   VITE_WS_URL = https://tradelink-marketplace.vercel.app
   VITE_NODE_ENV = production
   ```

   **Note:** Replace `tradelink-marketplace` with your actual project name if different.

5. **Deploy!**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - You'll see "Congratulations!" when done

## 🎯 Step 5: Update Environment Variables (1 minute)

After deployment, Vercel gives you a URL like: `https://tradelink-marketplace-abc123.vercel.app`

1. Go to your project in Vercel dashboard
2. Click "Settings" → "Environment Variables"
3. Update these three variables with your ACTUAL Vercel URL:
   - `FRONTEND_URL` → Your actual Vercel URL
   - `VITE_API_URL` → Your actual Vercel URL
   - `VITE_WS_URL` → Your actual Vercel URL
4. Click "Save"
5. Go to "Deployments" tab
6. Click "..." on the latest deployment → "Redeploy"

## 🎯 Step 6: Run Database Migrations (2 minutes)

Your database needs tables. Run migrations:

### Option 1: Using Vercel CLI

```bash
# Install Vercel CLI if not installed
npm install -g vercel

# Pull environment variables
vercel env pull .env.production

# Run migrations
cd backend
npx prisma migrate deploy
npx prisma generate
```

### Option 2: Using Prisma Studio

```bash
# Set your DATABASE_URL temporarily
export DATABASE_URL="your-database-url-from-step-1"

# Run migrations
cd backend
npx prisma migrate deploy
npx prisma generate
```

## 🎯 Step 7: Test Your Deployment (2 minutes)

1. **Open Your App**
   - Visit your Vercel URL
   - You should see the TradeLink homepage

2. **Test Health Check**
   ```bash
   curl https://your-app.vercel.app/health
   ```
   Should return: `{"status":"ok",...}`

3. **Test Registration**
   - Click "Sign Up"
   - Create a test account
   - Password must have: 8+ chars, 1 uppercase, 1 lowercase, 1 number

4. **Test Login**
   - Log in with your test account
   - You should be redirected to the dashboard

5. **Test API**
   ```bash
   curl https://your-app.vercel.app/api
   ```
   Should return API information

## ✅ Success Checklist

- [ ] Database created and DATABASE_URL copied
- [ ] Anthropic API key obtained
- [ ] JWT secret generated
- [ ] Project imported to Vercel
- [ ] All environment variables added
- [ ] First deployment completed
- [ ] Environment variables updated with actual URL
- [ ] Redeployed with correct URLs
- [ ] Database migrations run
- [ ] Health check returns OK
- [ ] Can register new user
- [ ] Can log in successfully
- [ ] Dashboard loads

## 🎉 You're Live!

Your TradeLink marketplace is now deployed at:
```
https://your-app-name.vercel.app
```

Share this URL with your users!

## 🔧 Common Issues & Quick Fixes

### Build Fails
- Check Vercel build logs for specific error
- Verify all environment variables are set
- Try redeploying

### Database Connection Error
- Verify DATABASE_URL format is correct
- Check database allows external connections
- Ensure `?sslmode=require` is added for Supabase

### 404 on API Routes
- Verify vercel.json is in root directory
- Check environment variables are saved
- Redeploy after adding variables

### Can't Register/Login
- Check JWT_SECRET is set
- Verify DATABASE_URL is correct
- Run database migrations
- Check browser console for errors

### WebSocket Not Working
- Vercel has 10-second timeout for serverless functions
- For production chat, consider external WebSocket service
- Or use Vercel Edge Functions (beta)

## 📱 Next Steps

### Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. Update environment variables with new domain

### Monitoring
- Enable Vercel Analytics in project settings
- Set up error tracking (Sentry)
- Monitor database performance

### Scaling
- Upgrade Vercel plan for more bandwidth
- Add Redis caching (Vercel KV or Upstash)
- Consider CDN for static assets

## 🆘 Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Discord**: https://vercel.com/discord
- **Troubleshooting Guide**: See `DEPLOYMENT_TROUBLESHOOTING.md`

---

**Your GitHub Repo**: https://github.com/vrushabhzade/Trade-link-

**Deploy Dashboard**: https://vercel.com/dashboard

Good luck! 🚀
