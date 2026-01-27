# 🔧 Railway Deployment Troubleshooting

## Common Issues and Fixes

### Issue 1: "Build Failed" - Wrong Directory

**Problem**: Railway is building from root instead of `backend` directory

**Fix**:
1. Go to your Railway project
2. Click on your service
3. Go to "Settings" tab
4. Find "Root Directory"
5. Set it to: `backend`
6. Click "Save"
7. Go to "Deployments" tab
8. Click "Redeploy" on the latest deployment

---

### Issue 2: "Module not found" or "Cannot find package"

**Problem**: Dependencies not installed correctly

**Fix**:
1. Check that `backend/package.json` exists
2. In Railway Settings, verify:
   - Build Command: (leave empty, nixpacks handles it)
   - Start Command: `npm start`
3. Redeploy

---

### Issue 3: "Prisma Client not generated"

**Problem**: Prisma client wasn't generated during build

**Fix**:
1. Go to Railway Settings
2. Add a custom build command:
   ```
   npm install && npx prisma generate && npm run build
   ```
3. Redeploy

---

### Issue 4: "Database connection failed"

**Problem**: DATABASE_URL not set or incorrect

**Fix**:
1. Go to "Variables" tab
2. Check DATABASE_URL exists and has this format:
   ```
   postgresql://postgres:iitbomb@y142004@db.qpxlhbtzsegrfnozibbm.supabase.co:5432/postgres?sslmode=require
   ```
3. Make sure it ends with `?sslmode=require`
4. Redeploy

---

### Issue 5: "Port already in use" or "EADDRINUSE"

**Problem**: Railway assigns a PORT automatically

**Fix**:
1. Remove PORT from environment variables (Railway sets it automatically)
2. Or change your code to use `process.env.PORT || 3001`
3. Redeploy

---

### Issue 6: Build succeeds but app crashes on start

**Problem**: Missing environment variables or start command issue

**Fix**:
1. Check all environment variables are set:
   - DATABASE_URL ✅
   - JWT_SECRET ✅
   - ANTHROPIC_API_KEY ✅
   - FRONTEND_URL ✅
   - NODE_ENV ✅
2. Check "Deployments" → "View Logs" for error messages
3. Verify start command is `npm start`
4. Redeploy

---

## Step-by-Step Fix for Most Issues

### 1. Verify Root Directory

```
Railway Dashboard → Your Service → Settings → Root Directory = "backend"
```

### 2. Verify Environment Variables

Go to "Variables" tab and ensure these exist:

```
DATABASE_URL=postgresql://postgres:iitbomb@y142004@db.qpxlhbtzsegrfnozibbm.supabase.co:5432/postgres?sslmode=require
JWT_SECRET=74be8558ec9b4eaed0cc8a578efc5efcb26a514bd2d43ccf2b03f596447b1b1d
ANTHROPIC_API_KEY=sk-ant-api03-... (your full key)
FRONTEND_URL=https://tradelink-marketplace.vercel.app
NODE_ENV=production
```

**Note**: Remove PORT if it exists (Railway sets it automatically)

### 3. Verify Build Settings

Go to "Settings" tab:
- **Build Command**: (leave empty)
- **Start Command**: `npm start`
- **Watch Paths**: (leave empty)

### 4. Check Logs

Go to "Deployments" → Click latest deployment → "View Logs"

Look for errors like:
- `Cannot find module` → Dependencies issue
- `Prisma Client not generated` → Build issue
- `ECONNREFUSED` → Database connection issue
- `Port already in use` → Port configuration issue

### 5. Redeploy

After making changes:
1. Go to "Deployments" tab
2. Click "Redeploy" on the latest deployment
3. Watch the logs for errors

---

## Alternative: Deploy Using Railway CLI

If the web interface isn't working, try the CLI:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Set root directory
railway up --rootDirectory backend

# Or deploy directly
cd backend
railway up
```

---

## Check Deployment Status

### Test Health Endpoint

Once deployed, test your Railway URL:

```bash
curl https://your-app.up.railway.app/health
```

Should return:
```json
{"status":"ok","timestamp":"...","environment":"production"}
```

### Test API Endpoint

```bash
curl https://your-app.up.railway.app/api
```

Should return API information.

---

## Still Having Issues?

### Get Detailed Logs

1. Railway Dashboard → Your Service
2. Click "Deployments" tab
3. Click on the failed deployment
4. Click "View Logs"
5. Copy the error message

### Common Error Messages

**"Error: Cannot find module '@prisma/client'"**
- Fix: Add build command: `npm install && npx prisma generate && npm run build`

**"Error: P1001: Can't reach database server"**
- Fix: Check DATABASE_URL has `?sslmode=require` at the end

**"Error: listen EADDRINUSE: address already in use"**
- Fix: Remove PORT from environment variables

**"Error: Command failed with exit code 1"**
- Fix: Check build logs for specific error
- Usually a TypeScript compilation error

---

## Quick Reset

If nothing works, try a fresh deployment:

1. Delete the current Railway service
2. Create a new project
3. Deploy from GitHub again
4. Set root directory to `backend`
5. Add all environment variables
6. Generate domain
7. Deploy

---

## Need More Help?

Share the error message from Railway logs and I can provide a specific fix!

Common places to find errors:
1. Railway Dashboard → Deployments → View Logs
2. Railway Dashboard → Settings → Check configuration
3. Railway Dashboard → Variables → Verify all are set
