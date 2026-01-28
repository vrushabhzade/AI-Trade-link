# Railway Deployment Guide for HealthBridge Backend

This guide will walk you through deploying your HealthBridge backend API to Railway.

## Prerequisites

- [Railway account](https://railway.app/) (sign up with GitHub)
- Firebase project with service account credentials
- GitHub repository for your project

## Step 1: Prepare Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ → **Project Settings**
4. Navigate to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Download the JSON file (keep it secure!)

## Step 2: Create Railway Project

### Option A: Deploy from GitHub (Recommended)

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. **Create Railway Project**:
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click **New Project**
   - Select **Deploy from GitHub repo**
   - Choose your repository
   - Railway will auto-detect the `server` directory

3. **Configure Root Directory**:
   - In Railway dashboard, go to **Settings**
   - Set **Root Directory** to `server`
   - Click **Save**

### Option B: Deploy with Railway CLI

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Initialize and Deploy**:
   ```bash
   cd server
   railway init
   railway up
   ```

## Step 3: Configure Environment Variables

1. In Railway dashboard, go to your project
2. Click on the **Variables** tab
3. Add the following environment variables:

### Required Variables

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `PORT` | `5000` | Server port (Railway auto-assigns, but we set default) |
| `FIREBASE_SERVICE_ACCOUNT` | `{...}` | Your Firebase service account JSON (see below) |

### Setting FIREBASE_SERVICE_ACCOUNT

**Important**: Copy the **entire contents** of your service account JSON file as a single-line string.

**Example**:
```json
{"type":"service_account","project_id":"your-project-id","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk@your-project.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk%40your-project.iam.gserviceaccount.com"}
```

**Steps**:
1. Open your downloaded service account JSON file
2. Copy the entire content (it should be one line or minified)
3. Paste it as the value for `FIREBASE_SERVICE_ACCOUNT` in Railway
4. Click **Add** or **Save**

## Step 4: Deploy and Verify

1. **Trigger Deployment**:
   - Railway will automatically deploy when you push to GitHub
   - Or click **Deploy** in the Railway dashboard

2. **Monitor Deployment**:
   - Click on **Deployments** tab
   - Watch the build logs for any errors
   - Look for: `✅ Firestore Seeded with Mock Doctors`
   - Look for: `🚀 Server running on http://localhost:XXXX`

3. **Get Your Deployment URL**:
   - Go to **Settings** tab
   - Under **Domains**, you'll see your Railway URL
   - Example: `https://your-app-production.up.railway.app`

4. **Test Your API**:
   ```bash
   # Test health endpoint
   curl https://your-app-production.up.railway.app/api/health
   
   # Expected response:
   # {"status":"ok","message":"HealthBridge API is running with Firebase"}
   ```

## Step 5: Connect Frontend to Backend

Update your frontend to use the Railway backend URL:

1. **Create/Update Frontend Environment File**:
   ```bash
   # In project root (not server directory)
   touch .env.local
   ```

2. **Add Backend URL**:
   ```env
   VITE_API_URL=https://your-app-production.up.railway.app
   ```

3. **Update API Calls** (if needed):
   
   If your frontend doesn't already use an environment variable for the API URL, update your API calls:
   
   ```javascript
   // Before
   const response = await fetch('http://localhost:5000/api/doctors');
   
   // After
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
   const response = await fetch(`${API_URL}/api/doctors`);
   ```

## Troubleshooting

### Issue: "Firebase Admin initialized without credentials"

**Solution**: Ensure `FIREBASE_SERVICE_ACCOUNT` is set correctly in Railway variables.

### Issue: CORS Errors

**Solution**: Your backend already has CORS enabled (`app.use(cors())`). If you need to restrict origins:

```javascript
// In server/index.js
app.use(cors({
  origin: ['https://your-frontend-domain.com', 'http://localhost:5173']
}));
```

### Issue: Deployment Fails

**Solution**: 
1. Check Railway build logs for errors
2. Ensure `server/package.json` has all dependencies listed
3. Verify Node.js version compatibility

### Issue: API Returns 500 Errors

**Solution**:
1. Check Railway logs: Click **View Logs** in dashboard
2. Verify Firebase credentials are correct
3. Check Firestore rules allow admin SDK access

## Monitoring and Logs

- **View Logs**: Railway Dashboard → Your Project → **Logs** tab
- **Metrics**: Monitor CPU, memory, and network usage
- **Alerts**: Set up notifications for deployment failures

## Updating Your Deployment

### Automatic Deployments (GitHub)
- Push to your main branch
- Railway automatically rebuilds and deploys

### Manual Deployment (CLI)
```bash
cd server
railway up
```

## Cost Considerations

- Railway offers a **free tier** with:
  - $5 of usage per month
  - 500 hours of execution time
  - Shared resources

- Monitor your usage in Railway dashboard
- Upgrade to paid plan if needed for production use

## Next Steps

1. ✅ Backend deployed to Railway
2. 🔄 Update frontend to use Railway API URL
3. 🧪 Test all API endpoints
4. 🚀 Deploy frontend (Vercel, Netlify, etc.)
5. 🔒 Set up custom domain (optional)
6. 📊 Monitor logs and performance

## Useful Commands

```bash
# View logs
railway logs

# Open Railway dashboard
railway open

# Link to existing project
railway link

# Run commands in Railway environment
railway run node index.js
```

## Support

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [Firebase Admin SDK Docs](https://firebase.google.com/docs/admin/setup)

---

**Deployment Checklist**:
- [ ] Firebase service account JSON downloaded
- [ ] Code pushed to GitHub
- [ ] Railway project created
- [ ] Root directory set to `server`
- [ ] Environment variables configured
- [ ] Deployment successful
- [ ] Health endpoint tested
- [ ] API endpoints verified
- [ ] Frontend connected to Railway URL
