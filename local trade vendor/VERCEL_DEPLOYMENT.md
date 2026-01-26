# Vercel Deployment Guide for TradeLink Marketplace

This guide will help you deploy the TradeLink marketplace application to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Vercel CLI installed: `npm install -g vercel`
3. A PostgreSQL database (recommended: Vercel Postgres, Supabase, or Railway)
4. Anthropic API key for AI features

## Step 1: Prepare Your Database

### Option A: Vercel Postgres (Recommended)
1. Go to your Vercel dashboard
2. Navigate to Storage → Create Database → Postgres
3. Copy the `DATABASE_URL` connection string

### Option B: External Provider (Supabase, Railway, etc.)
1. Create a PostgreSQL database with your provider
2. Copy the connection string

## Step 2: Configure Environment Variables

You'll need to set these environment variables in Vercel:

### Backend Environment Variables
```
DATABASE_URL=postgresql://username:password@host:5432/database
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
FRONTEND_URL=https://your-app.vercel.app
PORT=3001
NODE_ENV=production
REDIS_URL=redis://your-redis-url (optional, for caching)
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### Frontend Environment Variables
```
VITE_API_URL=https://your-app.vercel.app
VITE_WS_URL=https://your-app.vercel.app
VITE_NODE_ENV=production
```

## Step 3: Deploy to Vercel

### Method 1: Deploy via Vercel Dashboard (Easiest)

1. Push your code to GitHub (already done)
2. Go to https://vercel.com/new
3. Import your GitHub repository: `vrushabhzade/Trade-link-`
4. Configure project:
   - Framework Preset: Other
   - Root Directory: `./`
   - Build Command: Leave empty (handled by vercel.json)
   - Output Directory: Leave empty (handled by vercel.json)
5. Add all environment variables from Step 2
6. Click "Deploy"

### Method 2: Deploy via CLI

1. Login to Vercel:
   ```bash
   vercel login
   ```

2. Navigate to your project directory:
   ```bash
   cd path/to/Trade-link-
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Follow the prompts:
   - Set up and deploy? Yes
   - Which scope? Select your account
   - Link to existing project? No
   - Project name? tradelink-marketplace (or your choice)
   - Directory? ./
   - Override settings? No

5. Add environment variables:
   ```bash
   vercel env add DATABASE_URL production
   vercel env add JWT_SECRET production
   vercel env add FRONTEND_URL production
   vercel env add ANTHROPIC_API_KEY production
   vercel env add VITE_API_URL production
   vercel env add VITE_WS_URL production
   ```

6. Deploy to production:
   ```bash
   vercel --prod
   ```

## Step 4: Run Database Migrations

After deployment, you need to run Prisma migrations:

1. Install Vercel CLI if not already installed
2. Run migrations:
   ```bash
   vercel env pull .env.production
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   ```

Alternatively, add a build script to run migrations automatically:
- In `backend/package.json`, update the build script:
  ```json
  "build": "npx prisma generate && npx prisma migrate deploy && tsc"
  ```

## Step 5: Verify Deployment

1. Visit your deployed URL (e.g., https://your-app.vercel.app)
2. Check the health endpoint: https://your-app.vercel.app/health
3. Test user registration and login
4. Verify WebSocket connections work for chat

## Important Notes

### Database Connection
- Ensure your PostgreSQL database allows connections from Vercel's IP addresses
- Use connection pooling for better performance (Prisma Data Proxy or PgBouncer)

### File Uploads
- Vercel's serverless functions have a 4.5MB request limit
- For production, consider using cloud storage (AWS S3, Cloudinary, etc.)
- Update `backend/src/services/imageOptimizationService.ts` to use cloud storage

### WebSocket Limitations
- Vercel serverless functions have a 10-second timeout
- For real-time chat, consider using:
  - Vercel Edge Functions (beta)
  - External WebSocket service (Pusher, Ably, Socket.io hosted)
  - Separate WebSocket server on Railway/Render

### Redis Caching
- For production caching, use:
  - Vercel KV (Redis-compatible)
  - Upstash Redis
  - Redis Cloud

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript compiles locally: `npm run build`

### Database Connection Errors
- Verify `DATABASE_URL` is correct
- Check database allows external connections
- Ensure SSL is configured if required

### API Routes Not Working
- Check `vercel.json` routes configuration
- Verify environment variables are set
- Check function logs in Vercel dashboard

### Frontend Can't Connect to Backend
- Verify `VITE_API_URL` points to your Vercel domain
- Check CORS settings in `backend/src/index.ts`
- Ensure `FRONTEND_URL` environment variable is set correctly

## Post-Deployment

1. Set up custom domain (optional):
   - Go to Project Settings → Domains
   - Add your custom domain
   - Update `FRONTEND_URL` and `VITE_API_URL` environment variables

2. Enable automatic deployments:
   - Vercel automatically deploys on git push to main branch
   - Preview deployments created for pull requests

3. Monitor your application:
   - Check Vercel Analytics
   - Set up error tracking (Sentry, LogRocket)
   - Monitor database performance

## Security Checklist

- [ ] Strong `JWT_SECRET` (minimum 32 characters)
- [ ] Database credentials secured
- [ ] CORS configured for production domain only
- [ ] Rate limiting enabled
- [ ] Environment variables set correctly
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] API keys not exposed in frontend code

## Cost Considerations

- Vercel Free Tier: 100GB bandwidth, serverless function executions
- Database: Check your provider's pricing
- Consider upgrading for production traffic

## Support

For issues:
1. Check Vercel deployment logs
2. Review function logs for API errors
3. Check database connection and migrations
4. Verify environment variables are set correctly

Your TradeLink marketplace is now deployed! 🚀
