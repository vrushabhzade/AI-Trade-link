# Quick Start: Deploy to Railway

## 🚀 Fast Track Deployment (5 minutes)

### 1. Get Firebase Credentials
- Go to [Firebase Console](https://console.firebase.google.com/) → Your Project → ⚙️ Settings → Service Accounts
- Click **Generate New Private Key** → Download JSON

### 2. Deploy to Railway
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

**Or manually:**
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repository
4. Set **Root Directory** to `server` in Settings

### 3. Set Environment Variables
In Railway dashboard → Variables tab:

```
FIREBASE_SERVICE_ACCOUNT = <paste entire JSON from step 1>
```

### 4. Deploy & Test
- Railway auto-deploys
- Get your URL from Settings → Domains
- Test: `https://your-app.railway.app/api/health`

## 📖 Full Documentation
See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed instructions.

## 🔗 Connect Frontend
Update your frontend `.env.local`:
```env
VITE_API_URL=https://your-app.railway.app
```

## ✅ Checklist
- [ ] Firebase service account JSON downloaded
- [ ] Railway project created from GitHub
- [ ] Root directory set to `server`
- [ ] `FIREBASE_SERVICE_ACCOUNT` environment variable set
- [ ] Deployment successful (check logs)
- [ ] Test `/api/health` endpoint
- [ ] Frontend connected to Railway URL
