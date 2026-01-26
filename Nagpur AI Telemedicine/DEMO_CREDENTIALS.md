# Demo Credentials for HealthBridge Nagpur AI Telemedicine

## 🔐 Test Accounts

### Patient Account
- **Email**: `patient@demo.com`
- **Password**: `demo123456`
- **Name**: Rahul Sharma
- **Role**: Patient
- **Phone**: +91 9876543210

### Doctor Account
- **Email**: `doctor@demo.com`
- **Password**: `demo123456`
- **Name**: Dr. Anjali Deshmukh
- **Role**: Doctor
- **Phone**: +91 9876543211

---

## 📝 Usage Instructions

1. **Registration**: You can register a new account using the Register page, or use the demo credentials above.

2. **Login**: Navigate to `/login` and use either of the demo credentials.

3. **Features to Test**:
   - **AI Symptom Checker**: Describe symptoms in English, Hindi, or Marathi
   - **Find Doctors**: Search and filter by language, gender, and specialty
   - **Book Appointments**: Schedule video consultations
   - **Live Bed Tracker**: View real-time hospital bed availability
   - **Lab Report Analyzer**: Input glucose and BP values for AI analysis
   - **Prescriptions**: View and get AI explanations (Doctor role)

---

## 🔥 Firebase Setup Required

**IMPORTANT**: To use these demo credentials, you need to:

1. Create these users in your Firebase Authentication console, OR
2. Register them through the app's Register page

### Manual Firebase User Creation:
1. Go to Firebase Console → Authentication → Users
2. Click "Add User"
3. Enter the email and password from above
4. The app will create the Firestore user profile automatically on first login

---

## 🧪 Testing Scenarios

### As a Patient:
- ✅ Check symptoms using AI
- ✅ Find and book doctors
- ✅ View appointments
- ✅ Analyze lab reports
- ✅ View prescriptions

### As a Doctor:
- ✅ View incoming appointment requests
- ✅ Accept/Reject appointments
- ✅ Start video consultations
- ✅ Create prescriptions
- ✅ View patient list

---

## 🚨 Note
These are **demo credentials** for testing purposes only. In production, use strong passwords and enable Firebase security rules.
