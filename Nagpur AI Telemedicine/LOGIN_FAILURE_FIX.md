# 🔍 Login Failure Diagnostic Guide

## Quick Diagnostic Steps

### Step 1: Check Browser Console
1. Open your browser at `http://localhost:5173/login`
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Try to login
5. Look for error messages (they will be in red)

**Common errors you might see:**
- `Firebase: Error (auth/user-not-found)` → User doesn't exist in Firebase Auth
- `Firebase: Error (auth/wrong-password)` → Incorrect password
- `Firebase: Error (auth/invalid-api-key)` → Firebase config issue
- `Firebase: Error (auth/network-request-failed)` → Internet/Firebase connection issue

---

### Step 2: Verify Firebase Authentication Setup

#### Check if Email/Password is Enabled:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **kiro-f5e7b**
3. Click **Authentication** in left sidebar
4. Click **Sign-in method** tab
5. **Verify**: "Email/Password" should show as **Enabled**
6. If not enabled:
   - Click on "Email/Password"
   - Toggle **Enable**
   - Click **Save**

---

### Step 3: Verify User Exists in Firebase Auth

1. In Firebase Console → **Authentication** → **Users** tab
2. Look for your email (e.g., `patient@demo.com`)
3. **If user doesn't exist**:
   - Click **Add user**
   - Enter email and password
   - Click **Add user**
4. **Copy the UID** (you'll need this for Firestore)

---

### Step 4: Verify Firestore Profile Exists

1. In Firebase Console → **Firestore Database**
2. Look for `users` collection
3. Find document with ID matching the UID from Step 3
4. **If document doesn't exist**, create it:
   - Click **Add document**
   - Document ID: `[paste UID from Auth]`
   - Add fields:
     ```
     name: "Your Name"
     email: "your@email.com"
     role: "patient"
     phone: "+91 1234567890"
     ```

---

### Step 5: Check Firebase Configuration

Open `src/firebase/config.js` and verify:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyDb9JjZ061K-fKCIA8RqEh8FlYpIupRUUs",
    authDomain: "kiro-f5e7b.firebaseapp.com",
    projectId: "kiro-f5e7b",
    // ... rest of config
};
```

**Verify these match your Firebase project**:
1. Go to Firebase Console → Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Compare values with `config.js`

---

## 🛠️ Quick Fixes

### Fix 1: Clear Browser Cache
```javascript
// Run in browser console (F12)
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Fix 2: Restart Dev Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Fix 3: Test with Registration Instead
1. Go to `http://localhost:5173/register`
2. Create a new account
3. This will automatically create both Auth user and Firestore profile

---

## 🐛 Specific Error Solutions

### Error: "No account found with this email"
**Solution**: 
- Register first at `/register`, OR
- Create user manually in Firebase Console → Authentication → Add user

### Error: "User profile not found in Firestore"
**Solution**: 
- The app should auto-create it (check console for "User profile not found in Firestore, creating...")
- If not, manually create in Firestore (see Step 4 above)

### Error: "Invalid email address format"
**Solution**: 
- Ensure email is valid format: `user@example.com`
- No spaces or special characters

### Error: "Network error"
**Solution**: 
- Check internet connection
- Verify Firebase project is active (not deleted/suspended)
- Check if you're behind a firewall/proxy

---

## 🔐 Test Credentials

Try registering a fresh account:
- **Email**: `test@example.com`
- **Password**: `test123456`
- **Name**: Test User
- **Role**: Patient
- **Phone**: +91 9999999999

Then try logging in with these credentials.

---

## 📊 Enable Debug Mode

Add this to see detailed logs:

1. Open `src/context/AuthContext.jsx`
2. The enhanced version already has console.error logs
3. Check browser console for detailed error messages

---

## ✅ Verification Checklist

- [ ] Firebase Authentication Email/Password is **Enabled**
- [ ] User exists in Firebase Console → Authentication → Users
- [ ] Firestore document exists in `users` collection with matching UID
- [ ] Firebase config in `src/firebase/config.js` is correct
- [ ] Browser console shows "✅ Firebase initialized successfully"
- [ ] No red errors in browser console
- [ ] Internet connection is working
- [ ] Dev server is running without errors

---

## 🆘 Still Failing?

**Share these details for further help:**
1. Exact error message from browser console
2. Screenshot of Firebase Authentication → Users page
3. Screenshot of Firestore `users` collection
4. Email you're trying to login with
5. Whether you can successfully register a new account

---

## 💡 Alternative: Use Registration Flow

The easiest way to test:
1. Go to `http://localhost:5173/register`
2. Fill in all fields
3. Click Register
4. This creates both Auth user AND Firestore profile automatically
5. You'll be logged in immediately

This bypasses manual setup and ensures everything is created correctly!
