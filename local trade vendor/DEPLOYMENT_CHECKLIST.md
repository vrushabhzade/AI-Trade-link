# TradeLink Deployment Checklist

Use this checklist to ensure a smooth deployment to Vercel.

## Pre-Deployment

### Code Preparation
- [x] All code pushed to GitHub repository
- [x] Latest changes committed and pushed
- [x] Build scripts configured in package.json
- [x] Vercel configuration files created

### Database Setup
- [ ] PostgreSQL database created (Vercel Postgres, Supabase, or Railway)
- [ ] Database connection string obtained
- [ ] PostGIS extension enabled (if using geospatial features)
- [ ] Database allows external connections

### API Keys & Secrets
- [ ] Anthropic API key obtained (for AI features)
- [ ] Strong JWT secret generated (minimum 32 characters)
- [ ] Redis URL obtained (optional, for caching)

### Environment Variables Prepared
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - Secret key for JWT tokens (32+ chars)
- [ ] `FRONTEND_URL` - Will be your Vercel app URL
- [ ] `ANTHROPIC_API_KEY` - API key for AI features
- [ ] `VITE_API_URL` - Will be your Vercel app URL
- [ ] `VITE_WS_URL` - Will be your Vercel app URL
- [ ] `NODE_ENV` - Set to "production"

## Deployment Steps

### Option 1: Vercel Dashboard (Recommended for First Deploy)
- [ ] Go to https://vercel.com/new
- [ ] Import GitHub repository: `vrushabhzade/Trade-link-`
- [ ] Configure project settings:
  - Framework Preset: Other
  - Root Directory: ./
  - Build Command: (leave empty)
  - Output Directory: (leave empty)
- [ ] Add all environment variables
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete

### Option 2: Vercel CLI
- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Login: `vercel login`
- [ ] Run deployment script:
  - Windows: `deploy-vercel.bat`
  - Mac/Linux: `./deploy-vercel.sh`
- [ ] Add environment variables via CLI or dashboard
- [ ] Deploy to production: `vercel --prod`

## Post-Deployment

### Database Migration
- [ ] Pull production environment: `vercel env pull .env.production`
- [ ] Run Prisma migrations:
  ```bash
  cd backend
  npx prisma migrate deploy
  npx prisma generate
  ```

### Verification
- [ ] Visit deployed URL
- [ ] Check health endpoint: `https://your-app.vercel.app/health`
- [ ] Test user registration
- [ ] Test user login
- [ ] Test product listing
- [ ] Test chat functionality
- [ ] Test WebSocket connection
- [ ] Verify AI features work

### Configuration
- [ ] Update CORS settings if needed
- [ ] Configure custom domain (optional)
- [ ] Set up SSL certificate (automatic with Vercel)
- [ ] Enable automatic deployments from GitHub

### Monitoring & Security
- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Enable Vercel Analytics
- [ ] Monitor database performance
- [ ] Review security headers
- [ ] Check rate limiting is working
- [ ] Verify environment variables are secure

## Known Limitations & Workarounds

### File Uploads
- **Issue**: Vercel has 4.5MB request limit
- **Solution**: Use cloud storage (AWS S3, Cloudinary) for production
- **Action Required**: Update `imageOptimizationService.ts`

### WebSocket
- **Issue**: Serverless functions have 10-second timeout
- **Solution**: Consider external WebSocket service (Pusher, Ably)
- **Alternative**: Use Vercel Edge Functions (beta)

### Redis Caching
- **Issue**: Need external Redis service
- **Solution**: Use Vercel KV or Upstash Redis
- **Action Required**: Update Redis connection in code

## Troubleshooting

### Build Fails
- [ ] Check build logs in Vercel dashboard
- [ ] Verify TypeScript compiles locally: `npm run build`
- [ ] Ensure all dependencies are in package.json
- [ ] Check for missing environment variables

### Database Connection Errors
- [ ] Verify DATABASE_URL is correct
- [ ] Check database allows external connections
- [ ] Ensure SSL is configured if required
- [ ] Test connection string locally

### API Routes Not Working
- [ ] Check vercel.json routes configuration
- [ ] Verify environment variables are set
- [ ] Check function logs in Vercel dashboard
- [ ] Test API endpoints with curl/Postman

### Frontend Can't Connect to Backend
- [ ] Verify VITE_API_URL points to Vercel domain
- [ ] Check CORS settings in backend
- [ ] Ensure FRONTEND_URL is set correctly
- [ ] Check browser console for errors

## Rollback Plan

If deployment fails:
1. [ ] Revert to previous deployment in Vercel dashboard
2. [ ] Check error logs
3. [ ] Fix issues locally
4. [ ] Test thoroughly
5. [ ] Redeploy

## Success Criteria

Deployment is successful when:
- [ ] Application loads without errors
- [ ] Users can register and login
- [ ] Products are displayed correctly
- [ ] Chat functionality works
- [ ] AI features respond correctly
- [ ] No console errors
- [ ] Performance is acceptable (< 3s load time)

## Next Steps After Successful Deployment

1. [ ] Share deployment URL with team
2. [ ] Update documentation with production URL
3. [ ] Set up monitoring and alerts
4. [ ] Plan for scaling (if needed)
5. [ ] Schedule regular backups
6. [ ] Document any production-specific configurations

## Support Resources

- Vercel Documentation: https://vercel.com/docs
- Prisma Deployment: https://www.prisma.io/docs/guides/deployment
- TradeLink Deployment Guide: See VERCEL_DEPLOYMENT.md
- GitHub Repository: https://github.com/vrushabhzade/Trade-link-

---

**Deployment Date**: _________________
**Deployed By**: _________________
**Production URL**: _________________
**Database Provider**: _________________
**Notes**: _________________
