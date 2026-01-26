# Vercel Deployment Troubleshooting Guide

## Common Issues & Solutions

### 1. Build Fails - TypeScript Errors

**Error**: `Type error: Cannot find module...` or `TS2307`

**Solution**:
```bash
# Test build locally first
cd frontend
npm run build

cd ../backend
npm run build
```

**Fix**: If build fails locally, temporarily disable strict mode:
- Update `frontend/tsconfig.json` and `backend/tsconfig.json`
- Set `"strict": false`

### 2. Database Connection Errors

**Error**: `Can't reach database server` or `Connection refused`

**Causes**:
- Wrong `DATABASE_URL` format
- Database doesn't allow external connections
- Missing SSL configuration

**Solutions**:

**A. Check DATABASE_URL format**:
```bash
# Correct format:
postgresql://username:password@host:5432/database?sslmode=require

# For Vercel Postgres:
postgres://default:password@host-pooler.region.postgres.vercel-storage.com:5432/verceldb?sslmode=require
```

**B. Enable external connections**:
- Vercel Postgres: Automatically configured
- Supabase: Go to Settings → Database → Connection Pooling
- Railway: Enable public networking

**C. Add SSL to connection string**:
```bash
# Add to end of DATABASE_URL
?sslmode=require
```

### 3. Prisma Migration Fails

**Error**: `Migration failed` or `Schema not found`

**Solution**:
```bash
# Run migrations manually after deployment
vercel env pull .env.production
cd backend
npx prisma migrate deploy
npx prisma generate
```

**Alternative**: Remove migrations from build script temporarily:
```json
// backend/package.json
"vercel-build": "npx prisma generate && tsc"
```

Then run migrations manually after first deployment.

### 4. Frontend Can't Connect to Backend

**Error**: `Network Error` or `Failed to fetch`

**Causes**:
- Wrong API URL
- CORS not configured
- Environment variables not set

**Solutions**:

**A. Set correct environment variables in Vercel**:
```bash
VITE_API_URL=https://your-app.vercel.app
VITE_WS_URL=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
```

**B. Update CORS in backend**:
```typescript
// backend/src/index.ts - already configured
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
```

**C. Check API routes are working**:
```bash
# Test health endpoint
curl https://your-app.vercel.app/health
```

### 5. Environment Variables Not Working

**Error**: `undefined` or `null` for env variables

**Solutions**:

**A. Check variable names**:
- Frontend: Must start with `VITE_`
- Backend: No prefix needed

**B. Redeploy after adding variables**:
```bash
vercel --prod
```

**C. Verify in Vercel dashboard**:
- Go to Project Settings → Environment Variables
- Check all variables are set for "Production"

### 6. Module Not Found Errors

**Error**: `Cannot find module 'xyz'`

**Solutions**:

**A. Ensure all dependencies are in package.json**:
```bash
# Check if module is installed
cd frontend
npm list xyz

cd ../backend
npm list xyz
```

**B. Install missing dependencies**:
```bash
npm install xyz --save
```

**C. Clear cache and reinstall**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### 7. Serverless Function Timeout

**Error**: `Function execution timed out`

**Causes**:
- Database query too slow
- External API call hanging
- Infinite loop

**Solutions**:

**A. Optimize database queries**:
```typescript
// Add indexes to frequently queried fields
// Check backend/prisma/schema.prisma
```

**B. Add timeouts to external calls**:
```typescript
// Example with fetch
const response = await fetch(url, {
  signal: AbortSignal.timeout(5000) // 5 second timeout
})
```

**C. Use Vercel Pro for longer timeouts** (10s → 60s)

### 8. Static Files Not Loading

**Error**: `404 Not Found` for CSS/JS files

**Solutions**:

**A. Check build output**:
```bash
cd frontend
npm run build
ls -la dist/
```

**B. Verify vercel.json routes**:
```json
{
  "routes": [
    {
      "src": "/(.*)",
      "dest": "frontend/dist/$1"
    }
  ]
}
```

**C. Check base path in vite.config.ts**:
```typescript
export default defineConfig({
  base: '/', // Should be '/' for root deployment
})
```

### 9. WebSocket Connection Fails

**Error**: `WebSocket connection failed`

**Limitation**: Vercel serverless functions don't support persistent WebSocket connections.

**Solutions**:

**A. Use external WebSocket service**:
- Pusher (recommended)
- Ably
- Socket.io hosted service

**B. Deploy WebSocket server separately**:
- Railway
- Render
- Heroku

**C. Use Vercel Edge Functions** (beta):
- Limited WebSocket support
- Check Vercel docs for latest updates

### 10. Large Bundle Size Warning

**Error**: `Chunk size exceeds 500kb`

**Solutions**:

**A. Already optimized in vite.config.ts**:
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom'],
        // ... other chunks
      }
    }
  }
}
```

**B. Analyze bundle**:
```bash
cd frontend
npm run build -- --mode analyze
```

**C. Lazy load heavy components**:
```typescript
const HeavyComponent = lazy(() => import('./HeavyComponent'))
```

## Quick Diagnostic Commands

### Test Local Build
```bash
# Frontend
cd frontend
npm run build
npm run preview

# Backend
cd backend
npm run build
npm start
```

### Check Vercel Deployment
```bash
# View deployment logs
vercel logs

# Check environment variables
vercel env ls

# Pull production env locally
vercel env pull .env.production
```

### Test API Endpoints
```bash
# Health check
curl https://your-app.vercel.app/health

# API test
curl https://your-app.vercel.app/api

# Test with auth
curl -H "Authorization: Bearer YOUR_TOKEN" https://your-app.vercel.app/api/users
```

## Step-by-Step Deployment Fix

If deployment is completely broken, follow these steps:

### 1. Test Locally
```bash
# Build both projects
cd frontend && npm run build
cd ../backend && npm run build
```

### 2. Fix Build Errors
- Check TypeScript errors
- Fix import paths
- Ensure all dependencies installed

### 3. Simplify Vercel Config
Create minimal `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ]
}
```

### 4. Deploy Frontend Only First
```bash
# Comment out backend build in vercel.json
vercel --prod
```

### 5. Add Backend After Frontend Works
```json
{
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build"
    },
    {
      "src": "backend/src/index.ts",
      "use": "@vercel/node"
    }
  ]
}
```

### 6. Add Environment Variables
- Go to Vercel dashboard
- Add all required variables
- Redeploy

### 7. Test Each Endpoint
```bash
curl https://your-app.vercel.app/health
curl https://your-app.vercel.app/api
```

## Getting Help

### Check Vercel Logs
1. Go to Vercel dashboard
2. Click on your deployment
3. Go to "Functions" tab
4. Click on any function to see logs

### Enable Debug Mode
Add to `vercel.json`:
```json
{
  "env": {
    "NODE_ENV": "production",
    "DEBUG": "*"
  }
}
```

### Contact Support
- Vercel Discord: https://vercel.com/discord
- Vercel Support: https://vercel.com/support
- GitHub Issues: Post your error with logs

## Prevention Checklist

Before deploying:
- [ ] Local build succeeds
- [ ] All tests pass
- [ ] Environment variables documented
- [ ] Database accessible from internet
- [ ] CORS configured correctly
- [ ] API routes tested locally
- [ ] Dependencies up to date
- [ ] No hardcoded localhost URLs

## Common Error Messages & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `ECONNREFUSED` | Can't connect to database | Check DATABASE_URL and firewall |
| `MODULE_NOT_FOUND` | Missing dependency | Add to package.json |
| `FUNCTION_INVOCATION_TIMEOUT` | Function too slow | Optimize queries, add timeouts |
| `DEPLOYMENT_ERROR` | Build failed | Check build logs, fix errors |
| `CORS_ERROR` | CORS not configured | Update backend CORS settings |
| `404_NOT_FOUND` | Route not configured | Check vercel.json routes |
| `500_INTERNAL_ERROR` | Server error | Check function logs |

## Need More Help?

Share these details:
1. Error message from Vercel logs
2. Your vercel.json configuration
3. Environment variables (names only, not values)
4. Build command output
5. What you've tried so far

I'll help you debug the specific issue!
