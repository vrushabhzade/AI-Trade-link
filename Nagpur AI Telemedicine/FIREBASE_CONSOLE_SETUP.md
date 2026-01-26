# 📋 Step-by-Step: Adding User Profile via Firebase Console

## User ID to Add
**Firebase Auth UID**: `Sipb1KAPsGVL59IzN5FeqPpaqD92`

---

## 🔥 Step-by-Step Instructions

### Step 1: Open Firebase Console
1. Go to [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Sign in with your Google account
3. Select your project: **kiro-f5e7b**

### Step 2: Navigate to Firestore Database
1. In the left sidebar, click **"Firestore Database"**
2. If you see "Create database", click it and choose:
   - **Start in production mode** (or test mode for development)
   - **Location**: Choose closest to Nagpur (asia-south1 recommended)
3. Click **"Enable"**

### Step 3: Create the Users Collection
1. Click **"Start collection"** (if this is your first collection)
2. **Collection ID**: Enter `users`
3. Click **"Next"**

### Step 4: Add the User Document
Now you'll create the document for your user:

**Document ID**: 
```
Sipb1KAPsGVL59IzN5FeqPpaqD92
```
*(Paste this exact ID - it must match the Firebase Auth UID)*

**Add the following fields:**

| Field Name | Type | Value |
|------------|------|-------|
| `name` | string | `Rahul Sharma` |
| `email` | string | `patient@demo.com` |
| `role` | string | `patient` |
| `phone` | string | `+91 9876543210` |
| `createdAt` | string | `2026-01-21T06:42:50.000Z` |

### Step 5: Save the Document
1. Click **"Save"**
2. You should now see the document in the `users` collection

---

## ✅ Verification

After creating the document:

1. **Refresh the Firestore page** - You should see:
   ```
   users (collection)
   └── Sipb1KAPsGVL59IzN5FeqPpaqD92 (document)
       ├── name: "Rahul Sharma"
       ├── email: "patient@demo.com"
       ├── role: "patient"
       ├── phone: "+91 9876543210"
       └── createdAt: "2026-01-21T06:42:50.000Z"
   ```

2. **Test Login**:
   - Go to `http://localhost:5173/login`
   - Enter the email associated with this Firebase Auth user
   - Enter the password
   - You should now successfully login and see the dashboard!

---

## 🎯 Quick Copy-Paste Values

For easy copying:

```
Document ID:
Sipb1KAPsGVL59IzN5FeqPpaqD92

Field: name
Value: Rahul Sharma

Field: email
Value: patient@demo.com

Field: role
Value: patient

Field: phone
Value: +91 9876543210

Field: createdAt
Value: 2026-01-21T06:42:50.000Z
```

---

## 🔍 Troubleshooting

### "Collection already exists"
- Just click on the existing `users` collection
- Click **"Add document"**
- Continue from Step 4

### "Document ID already exists"
- The user profile already exists!
- Click on the document to view/edit it
- Or delete it and recreate with correct values

### "Permission denied"
- Check Firestore Rules in Firebase Console
- For development, you can temporarily use:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if true;
      }
    }
  }
  ```
  ⚠️ **Warning**: This allows all access. Use proper rules in production!

---

## 🚀 Next Steps After Adding Profile

1. **Clear browser cache** (F12 → Application → Clear Storage)
2. **Login** at `http://localhost:5173/login`
3. **Test features**:
   - AI Symptom Checker
   - Find Doctors
   - Book Appointments
   - Lab Report Analyzer

---

## 💡 Pro Tip: Adding Multiple Users

To add the doctor demo account as well:

**Document ID**: `[Get from Firebase Auth after creating doctor@demo.com]`

**Fields**:
- name: `Dr. Anjali Deshmukh`
- email: `doctor@demo.com`
- role: `doctor`
- phone: `+91 9876543211`
- createdAt: `2026-01-21T06:42:50.000Z`

---

## ✨ You're All Set!

Once the document is created, your user profile is ready. The app will automatically load this data when you login with the corresponding Firebase Auth credentials.
