# 🚀 Next Steps: Complete Railway Deployment

Your code is now on GitHub! Follow these steps to complete the Railway deployment:

## Step 1: Get Firebase Service Account Credentials

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your **HealthBridge** project
3. Click the **⚙️ gear icon** → **Project Settings**
4. Navigate to the **Service Accounts** tab
5. Click **Generate New Private Key**
6. Click **Generate Key** to download the JSON file
7. **Save this file securely** - you'll need it in the next step

## Step 2: Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
   - If you don't have an account, sign up with GitHub (it's free!)

2. Click **New Project**

3. Select **Deploy from GitHub repo**

4. Choose your repository: `AI-Trade-link` (or the repository name)

5. Railway will start deploying automatically - **WAIT**, we need to configure it first!

## Step 3: Configure Railway Settings

1. In your Railway project dashboard, click on your service

2. Go to the **Settings** tab

3. Scroll down to **Root Directory**
   - Set it to: `server`
   - Click **Save**

4. This tells Railway to deploy only the backend (server folder)

## Step 4: Set Environment Variables

1. In Railway dashboard, click on the **Variables** tab

2. Click **New Variable**

3. Add the following variable:
   - **Variable Name**: `FIREBASE_SERVICE_ACCOUNT`
   - **Value**: Open the JSON file you downloaded in Step 1, copy **ALL** the content, and paste it here
   
   **Important**: The value should be the entire JSON object on a single line, like:
   ```json
   {"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",...}
   ```

4. Click **Add** to save the variable

## Step 5: Deploy!

1. Railway will automatically redeploy with the new configuration

2. Watch the **Deployments** tab for progress
   - You should see build logs
   - Look for: `✅ Firestore Seeded with Mock Doctors`
   - Look for: `🚀 Server running on http://localhost:XXXX`

3. Once deployment is complete, go to **Settings** tab

4. Under **Domains**, you'll see your Railway URL
   - Example: `https://nagpur-ai-telemedicine-production.up.railway.app`
   - Click **Generate Domain** if no domain exists

## Step 6: Test Your Deployment

Open your browser or use curl to test:

```bash
# Replace with your actual Railway URL
https://your-app-production.up.railway.app/api/health
```

**Expected Response**:
```json
{"status":"ok","message":"HealthBridge API is running with Firebase"}
```

## Step 7: Connect Frontend to Backend

1. In your project root (not server folder), create/update `.env.local`:

```env
VITE_API_URL=https://your-actual-railway-url.up.railway.app
```

2. Update your frontend code to use this environment variable (if not already):

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Use in API calls
fetch(`${API_URL}/api/doctors`)
```

3. Test your frontend locally with the Railway backend

## ✅ Deployment Checklist

- [ ] Firebase service account JSON downloaded
- [ ] Railway account created
- [ ] Railway project created from GitHub
- [ ] Root directory set to `server`
- [ ] `FIREBASE_SERVICE_ACCOUNT` environment variable added
- [ ] Deployment successful (check logs)
- [ ] Railway domain generated
- [ ] `/api/health` endpoint tested
- [ ] Frontend `.env.local` updated with Railway URL
- [ ] Frontend tested with Railway backend

## 🐛 Troubleshooting

### "Firebase Admin initialized without credentials"
- Check that `FIREBASE_SERVICE_ACCOUNT` is set in Railway Variables
- Ensure the entire JSON was copied (including curly braces)

### "Build failed"
- Check Railway logs for specific error
- Ensure root directory is set to `server`
- Verify `package.json` has all dependencies

### CORS errors from frontend
- Your backend already has CORS enabled
- If issues persist, check Railway logs

### Can't access Railway URL
- Ensure deployment is complete (green checkmark)
- Check that a domain is generated in Settings → Domains
- Try accessing `/api/health` endpoint first

## 📞 Need Help?

- **Railway Docs**: https://docs.railway.app/
- **Firebase Admin Docs**: https://firebase.google.com/docs/admin/setup
- **Full Deployment Guide**: See `RAILWAY_DEPLOYMENT.md` in your project

## 🎉 Success!

Once you see the health check working, your backend is live! You can now:
- Deploy your frontend (Vercel, Netlify, etc.)
- Test all API endpoints
- Monitor logs in Railway dashboard
- Scale as needed

---

**Your Railway URL will be**: `https://[your-project-name]-production.up.railway.app`

Copy this URL and use it in your frontend configuration!
