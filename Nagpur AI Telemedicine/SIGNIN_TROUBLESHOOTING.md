# 🔧 Sign-In Error Troubleshooting Guide

## ✅ Issues Fixed

### 1. **Firebase Configuration Updated**
- ✅ Replaced placeholder values with actual Firebase credentials
- ✅ Added error handling for Firebase initialization
- ✅ File: `src/firebase/config.js`

### 2. **Enhanced Authentication Error Handling**
- ✅ Added user-friendly error messages for common issues
- ✅ Auto-creates Firestore profile if missing
- ✅ Better network error handling
- ✅ File: `src/context/AuthContext.jsx`

---

## 🚀 How to Test the Fix

### Step 1: Restart the Development Server
The Firebase config has been updated. Restart your frontend:

```bash
# Stop the current dev server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 2: Clear Browser Cache
1. Open DevTools (F12)
2. Go to Application tab
3. Clear Storage → Clear site data
4. Refresh the page

### Step 3: Try Logging In

**Option A: Register a New Account**
1. Go to `http://localhost:5173/register`
2. Fill in the form with valid data
3. Click Register
4. You should be automatically logged in

**Option B: Login with Existing Account**
1. Go to `http://localhost:5173/login`
2. Enter your email and password
3. Click Sign In

---

## 🐛 Common Errors & Solutions

### Error: "No account found with this email"
**Solution**: Register first at `/register` or create the user in Firebase Console

### Error: "User profile not found in Firestore"
**Solution**: The app will now auto-create the profile. Just refresh the page.

### Error: "Network error"
**Solution**: 
- Check your internet connection
- Verify Firebase project is active
- Check browser console for CORS errors

### Error: "Invalid API key"
**Solution**: 
- Verify Firebase config in `src/firebase/config.js`
- Get correct values from Firebase Console → Project Settings

### Error: "Too many failed attempts"
**Solution**: Wait 15 minutes or reset password in Firebase Console

---

## 🔐 Creating Demo User Manually

If you want to use the demo credentials (`patient@demo.com`):

### Via Firebase Console:
1. Go to Firebase Console → Authentication
2. Click "Add User"
3. Email: `patient@demo.com`
4. Password: `demo123456`
5. Click "Add User"

### Via Firestore Console:
1. Go to Firebase Console → Firestore Database
2. Create collection: `users`
3. Add document with ID: `[the UID from Auth]`
4. Add fields:
   ```
   name: "Rahul Sharma"
   email: "patient@demo.com"
   role: "patient"
   phone: "+91 9876543210"
   ```

---

## 📊 Checking Logs

### Browser Console (F12):
- Look for Firebase initialization message: "✅ Firebase initialized successfully"
- Check for any red error messages
- Network tab: Check if API calls are succeeding

### Backend Terminal:
- Should show: "🚀 Server running on port 5000"
- Check for Firestore connection errors

---

## 🎯 Next Steps

1. **Test Registration**: Create a new account
2. **Test Login**: Login with the created account
3. **Test Features**: Try the AI Symptom Checker, Find Doctors, etc.
4. **Check Dashboard**: Verify data loads correctly

---

## 💡 Pro Tips

- **Clear localStorage**: Run `localStorage.clear()` in browser console if stuck
- **Check Firebase Rules**: Ensure Firestore rules allow read/write
- **Enable Email/Password Auth**: In Firebase Console → Authentication → Sign-in method
- **Monitor Firebase Usage**: Check Firebase Console → Usage tab

---

## 🆘 Still Having Issues?

If problems persist:
1. Check browser console for specific error messages
2. Verify all Firebase services are enabled in Console
3. Ensure Firestore database is created (not in Realtime Database mode)
4. Check that Authentication → Sign-in method → Email/Password is enabled
