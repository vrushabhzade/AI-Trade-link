# HealthBridge - Nagpur AI Telemedicine

HealthBridge is a premium AI-powered telemedicine platform specifically designed for the **Nagpur Health Network**. It bridges the gap between rural patients and specialist care using advanced AI triage, real-time hospital tracking, and full local language support.

## 🚀 Key Features

### 1. AI-Powered Diagnostics
- **Gemini Pro Symptom Checker**: Personalized medical guidance based on Nagpur-specific health trends.
- **Smart Lab Interpretations**: Input Glucose, BP, and Hemoglobin values to get instant AI health insights and lifestyle tips.
- **PHC Referral System**: Automatic generation of official referral slips valid at any Government PHC in Nagpur District.

### 2. Specialist & Emergency Network
- **Nagpur Bed Tracker**: Live availability of hospital beds across the city (real-time Firestore sync).
- **SOS Emergency System**: One-tap trigger with a 5-second countdown to alert local 108 dispatch services.
- **AI Specialist Recommendations**: Highlights top-rated doctors with the "AI Recommended" badge.

### 3. Localized & Rural-Ready
- **Trilingual Interface**: Full support for **English, Hindi, and Marathi**.
- **PWA / Offline Support**: Installable on mobile and desktop, with service-worker caching for intermittent internet access.
- **Health Journey Timeline**: Visual history of symptoms and consultations.

## 🛠️ Tech Stack
- **Frontend**: React (Vite), Framer Motion, Lucide Icons
- **Backend**: Node.js, Express, Firebase Admin SDK
- **Database**: Firebase Firestore (real-time NoSQL)
- **Authentication**: Firebase Authentication
- **AI**: Google Gemini API
- **Visualization**: Chart.js

## 📦 Setup & Installation

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Firebase Project with Firestore and Authentication enabled
- Google Gemini API Key

### Local Development

#### 1. Clone the repository
```bash
git clone <your-repo-url>
cd "Nagpur AI Telemedicine"
```

#### 2. Install dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

#### 3. Configure Firebase

**Frontend** (`src/firebase/config.js`):
```javascript
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

**Backend** (`server/firebaseAdmin.js`):
- Download your Firebase Service Account Key from Firebase Console
- Save it as `server/serviceAccountKey.json`, OR
- Set the `FIREBASE_SERVICE_ACCOUNT` environment variable with the JSON content

#### 4. Create environment files

**Frontend** (`.env`):
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**Backend** (`server/.env`):
```env
PORT=5000
FIREBASE_SERVICE_ACCOUNT=<optional-if-using-json-file>
```

#### 5. Start the development servers

```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
npm run dev
```

The app will be available at `http://localhost:5173`

## 🔐 Demo Credentials

See [DEMO_CREDENTIALS.md](./DEMO_CREDENTIALS.md) for test accounts.

**Quick Test Accounts**:
- **Patient**: `patient@demo.com` / `demo123456`
- **Doctor**: `doctor@demo.com` / `demo123456`

> **Note**: You need to create these users in Firebase Authentication first, or register through the app.

## 🏗️ Project Structure

```
Nagpur AI Telemedicine/
├── src/                          # Frontend React app
│   ├── components/               # Reusable UI components
│   ├── context/                  # React Context (Auth, Language)
│   ├── firebase/                 # Firebase client config
│   ├── pages/                    # Route pages
│   ├── services/                 # API and AI services
│   └── main.jsx                  # App entry point
├── server/                       # Backend Express server
│   ├── firebaseAdmin.js          # Firebase Admin SDK setup
│   ├── middleware/               # Auth middleware
│   └── index.js                  # Main server file
├── public/                       # Static assets
└── README.md
```

## 🌐 Firebase Collections

The app uses the following Firestore collections:

- **`users`**: User profiles (name, role, phone)
  - **`labHistory`** (subcollection): Lab analysis history
- **`doctors`**: Doctor profiles and availability
- **`appointments`**: Appointment bookings
- **`prescriptions`**: Medical prescriptions
- **`hospitals`**: Real-time bed availability

## 🧪 Testing Features

1. **AI Symptom Checker**: Describe symptoms in any supported language
2. **Real-time Bed Tracker**: Watch live updates as hospital data changes
3. **Doctor Booking**: Search, filter, and book appointments
4. **Lab Analysis**: Input health metrics for AI-powered insights
5. **Video Consultations**: Start mock video calls (UI only)

## 📱 PWA Installation

The app is installable as a Progressive Web App:
1. Open the app in Chrome/Edge
2. Click the install icon in the address bar
3. Use it like a native app with offline support

## 🔒 Security

- Firebase Authentication with email/password
- Protected API routes with Firebase ID token verification
- Firestore security rules (configure in Firebase Console)
- HTTPS required for production

## 📄 License

This project is built for social impact in the Nagpur health sector. All rights reserved.

## 🤝 Contributing

This is a demonstration project for the Nagpur AI Telemedicine initiative. For contributions or inquiries, please contact the project maintainers.

---

**Built with ❤️ for Nagpur's Healthcare Network**
