# 🚀 Railway Deployment - Action Checklist

Follow these steps in order. Check off each item as you complete it.

---

## ✅ Step 1: Get Firebase Service Account JSON

**What to do:**
1. Open your browser and go to: **https://console.firebase.google.com/**
2. Select your **HealthBridge** project (or whatever your Firebase project is called)
3. Click the **⚙️ gear icon** (top left) → **Project Settings**
4. Click the **Service Accounts** tab at the top
5. Click the blue button: **Generate New Private Key**
6. Click **Generate Key** in the popup
7. A JSON file will download - **save it somewhere safe!**

**✓ Check:** You have a `.json` file downloaded (e.g., `your-project-firebase-adminsdk-xxxxx.json`)

---

## ✅ Step 2: Open Railway and Login

**What to do:**
1. Open your browser and go to: **https://railway.app/dashboard**
2. If not logged in, click **Login with GitHub** (recommended)
3. Authorize Railway to access your GitHub account

**✓ Check:** You're on the Railway dashboard

---

## ✅ Step 3: Create New Railway Project

**What to do:**
1. On Railway dashboard, click the **New Project** button
2. Select **Deploy from GitHub repo**
3. Find and select your repository: **AI-Trade-link** (or your repo name)
4. Railway will start deploying - **DON'T WORRY**, we'll configure it next

**✓ Check:** You see your project in Railway with deployment logs

---

## ✅ Step 4: Configure Root Directory

**What to do:**
1. In your Railway project, click on your **service** (the box showing your repo name)
2. Click the **Settings** tab
3. Scroll down to find **Root Directory**
4. Type: `server`
5. Click **Save** or the checkmark

**Why:** This tells Railway to deploy only the backend (server folder), not the whole project

**✓ Check:** Root Directory shows `server`

---

## ✅ Step 5: Add Firebase Credentials

**What to do:**
1. In your Railway project, click the **Variables** tab
2. Click **New Variable** or **+ Variable**
3. In the **Variable Name** field, type exactly: `FIREBASE_SERVICE_ACCOUNT`
4. In the **Value** field:
   - Open the JSON file you downloaded in Step 1
   - **Copy the ENTIRE contents** (all the text from `{` to `}`)
   - Paste it into the Value field
5. Click **Add** or **Save**

**Important:** The value should be one long line of JSON, like:
```
{"type":"service_account","project_id":"your-project",...}
```

**✓ Check:** You see `FIREBASE_SERVICE_ACCOUNT` in your variables list

---

## ✅ Step 6: Wait for Deployment

**What to do:**
1. Click the **Deployments** tab
2. Watch the logs - you should see:
   - Build process
   - `✅ Firestore Seeded with Mock Doctors`
   - `🚀 Server running on http://localhost:XXXX`
3. Wait for the deployment status to show **Success** or a green checkmark

**If deployment fails:**
- Check the logs for errors
- Verify the `FIREBASE_SERVICE_ACCOUNT` variable is set correctly
- Verify Root Directory is set to `server`

**✓ Check:** Deployment shows "Success" or green checkmark

---

## ✅ Step 7: Get Your Railway URL

**What to do:**
1. Go to the **Settings** tab
2. Scroll to the **Domains** section
3. If no domain exists, click **Generate Domain**
4. Copy your Railway URL (e.g., `https://nagpur-ai-telemedicine-production.up.railway.app`)

**✓ Check:** You have copied your Railway URL

---

## ✅ Step 8: Test Your Backend

**What to do:**
1. Open a new browser tab
2. Paste your Railway URL and add `/api/health` at the end
   - Example: `https://your-app-production.up.railway.app/api/health`
3. Press Enter

**Expected result:**
```json
{"status":"ok","message":"HealthBridge API is running with Firebase"}
```

**✓ Check:** You see the success message in your browser

---

## ✅ Step 9: Update Frontend Configuration

**What to do:**
1. In VS Code, open your project root folder (not the server folder)
2. Create or edit the file: `.env.local`
3. Add this line (replace with your actual Railway URL):
   ```env
   VITE_API_URL=https://your-actual-railway-url.up.railway.app
   ```
4. Save the file

**✓ Check:** `.env.local` file exists with your Railway URL

---

## ✅ Step 10: Test Frontend with Backend

**What to do:**
1. In your terminal, navigate to project root
2. Run: `npm run dev`
3. Open the app in your browser
4. Try features that use the backend:
   - Find Doctors page
   - Book an appointment
   - View prescriptions

**✓ Check:** Frontend successfully connects to Railway backend

---

## 🎉 Deployment Complete!

Your backend is now live on Railway! 

**Your Backend URL:** `https://[your-url].up.railway.app`

**What's Next:**
- Deploy your frontend to Vercel/Netlify
- Monitor logs in Railway dashboard
- Set up custom domain (optional)

---

## 🆘 Troubleshooting

### Problem: "Firebase Admin initialized without credentials"
**Solution:** 
- Go to Railway → Variables tab
- Check that `FIREBASE_SERVICE_ACCOUNT` exists
- Verify the entire JSON was copied (including `{` and `}`)

### Problem: Build fails
**Solution:**
- Check Railway logs for specific error
- Verify Root Directory is set to `server`
- Ensure all dependencies are in `package.json`

### Problem: Can't access Railway URL
**Solution:**
- Ensure deployment is complete (green checkmark)
- Check that domain is generated in Settings → Domains
- Try the `/api/health` endpoint first

### Problem: CORS errors from frontend
**Solution:**
- Backend already has CORS enabled
- Check Railway logs for actual errors
- Verify frontend is using correct Railway URL

---

## 📞 Need Help?

- **Railway Docs:** https://docs.railway.app/
- **Firebase Docs:** https://firebase.google.com/docs/admin/setup
- **Full Guide:** See `RAILWAY_DEPLOYMENT.md` in your project

---

**Current Status:**
- ✅ Code pushed to GitHub
- ⏳ Waiting for you to complete Railway deployment
- ⏳ Waiting for frontend connection

**Time Estimate:** 10-15 minutes for first-time setup
