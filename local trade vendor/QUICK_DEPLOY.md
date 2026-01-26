# ⚡ Quick Deploy Reference

## 🎯 What You Need (Copy These)

### 1. Database URL
```
From Vercel Postgres or Supabase
Format: postgresql://user:pass@host:5432/db?sslmode=require
```

### 2. JWT Secret
```bash
# Generate with:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Anthropic API Key
```
Get from: https://console.anthropic.com/
Format: sk-ant-...
```

## 🚀 Deploy Steps

1. **Go to**: https://vercel.com/new
2. **Import**: `vrushabhzade/Trade-link-`
3. **Add Environment Variables** (see below)
4. **Click Deploy**
5. **Update URLs** with actual Vercel URL
6. **Redeploy**
7. **Run migrations** (see below)

## 📋 Environment Variables

Copy-paste these into Vercel:

### Backend
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-generated-secret
ANTHROPIC_API_KEY=sk-ant-...
FRONTEND_URL=https://your-app.vercel.app
PORT=3001
NODE_ENV=production
```

### Frontend
```
VITE_API_URL=https://your-app.vercel.app
VITE_WS_URL=https://your-app.vercel.app
VITE_NODE_ENV=production
```

## 🗄️ Run Migrations

```bash
# Pull env vars
vercel env pull .env.production

# Run migrations
cd backend
npx prisma migrate deploy
npx prisma generate
```

## ✅ Test Deployment

```bash
# Health check
curl https://your-app.vercel.app/health

# API check
curl https://your-app.vercel.app/api
```

## 🔗 Important Links

- **Deploy**: https://vercel.com/new
- **Dashboard**: https://vercel.com/dashboard
- **GitHub**: https://github.com/vrushabhzade/Trade-link-
- **Anthropic**: https://console.anthropic.com/
- **Supabase**: https://supabase.com

## 📖 Full Guides

- **Step-by-Step**: `DEPLOY_NOW.md`
- **Comprehensive**: `VERCEL_DEPLOYMENT.md`
- **Troubleshooting**: `DEPLOYMENT_TROUBLESHOOTING.md`
- **Quick Start**: `DEPLOYMENT_READY.md`

---

**Time to Deploy**: ~10 minutes
**Status**: ✅ Ready to deploy
