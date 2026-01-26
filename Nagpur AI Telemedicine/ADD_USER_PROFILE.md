## Manual User Profile Creation for Firebase Auth User

You have a Firebase Auth user with ID: `Sipb1KAPsGVL59IzN5FeqPpaqD92`

### Option 1: Using Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database**
4. Click **"Start Collection"** (if no collections exist) or find the `users` collection
5. Create a new document with the following:

**Document ID**: `Sipb1KAPsGVL59IzN5FeqPpaqD92`

**Fields**:
```
name: "Rahul Sharma" (string)
email: "patient@demo.com" (string)
role: "patient" (string)
phone: "+91 9876543210" (string)
createdAt: [current timestamp] (timestamp)
```

### Option 2: Using the App (Automatic)

The app's `AuthContext` is already set up to create user profiles automatically. Just:

1. Login with your Firebase Auth credentials
2. The app will detect the missing Firestore profile
3. It will create the profile automatically on first login

However, you need to update the `AuthContext.jsx` to handle existing users better.

### Option 3: Run this in Browser Console

1. Open your app at `http://localhost:5173`
2. Open Browser DevTools (F12)
3. Go to Console tab
4. Paste and run this code:

```javascript
import { db } from './firebase/config';
import { doc, setDoc } from 'firebase/firestore';

const userId = 'Sipb1KAPsGVL59IzN5FeqPpaqD92';
const userProfile = {
  name: 'Rahul Sharma',
  email: 'patient@demo.com',
  role: 'patient',
  phone: '+91 9876543210',
  createdAt: new Date().toISOString()
};

await setDoc(doc(db, 'users', userId), userProfile);
console.log('✅ User profile created!');
```

### Recommended: Firebase Console Method

The easiest and most reliable method is **Option 1** - using the Firebase Console directly to add the document to the `users` collection.

---

## Next Steps After Creating Profile

Once the profile is created, you can login with:
- **Email**: The email associated with the Firebase Auth user
- **Password**: The password you set in Firebase Auth

The app will then load the user profile from Firestore and display the appropriate dashboard based on the role.
