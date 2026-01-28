# HealthBridge Backend API

Backend API for the HealthBridge Telemedicine application built with Express.js and Firebase.

## 🚀 Quick Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

**See**: [RAILWAY_QUICKSTART.md](../RAILWAY_QUICKSTART.md) for 5-minute deployment guide.

## 📋 Features

- **RESTful API** with Express.js
- **Firebase Firestore** for data storage
- **Firebase Admin SDK** for backend operations
- **CORS enabled** for frontend integration
- **Auto-seeding** of mock data (doctors, hospitals)

## 🛠️ Tech Stack

- Node.js (ES Modules)
- Express.js
- Firebase Admin SDK
- Firestore Database
- dotenv for environment management

## 📁 Project Structure

```
server/
├── index.js              # Main server file
├── firebaseAdmin.js      # Firebase Admin SDK setup
├── package.json          # Dependencies
├── railway.json          # Railway deployment config
├── .env                  # Local environment variables
├── .env.example          # Environment template
├── middleware/           # Custom middleware
├── models/              # Data models (if any)
└── routes/              # API routes (if separated)
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/doctors` | Get all doctors |
| POST | `/api/appointments` | Book appointment |
| GET | `/api/appointments` | Get all appointments |
| PATCH | `/api/appointments/:id` | Update appointment status |
| GET | `/api/prescriptions` | Get prescriptions |
| POST | `/api/prescriptions` | Create prescription |
| GET | `/api/lab-history` | Get lab history (protected) |
| POST | `/api/lab-history` | Add lab record (protected) |

## 🏃 Local Development

### Prerequisites
- Node.js 18+ installed
- Firebase project with Firestore enabled
- Firebase service account credentials

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   ```
   
   Then add your Firebase credentials to `.env`:
   ```env
   PORT=5000
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Test the API**:
   ```bash
   curl http://localhost:5000/api/health
   ```

## 🌐 Deployment

### Railway (Recommended)

See detailed guides:
- **Quick Start**: [RAILWAY_QUICKSTART.md](../RAILWAY_QUICKSTART.md)
- **Full Guide**: [RAILWAY_DEPLOYMENT.md](../RAILWAY_DEPLOYMENT.md)

**TL;DR**:
1. Get Firebase service account JSON
2. Deploy to Railway from GitHub
3. Set `FIREBASE_SERVICE_ACCOUNT` environment variable
4. Done! 🎉

### Other Platforms

The app can be deployed to any Node.js hosting platform:
- Render
- Heroku
- Vercel (serverless)
- AWS/GCP/Azure

Just ensure:
- `npm start` runs the server
- `FIREBASE_SERVICE_ACCOUNT` environment variable is set
- Port is configurable via `PORT` environment variable

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `FIREBASE_SERVICE_ACCOUNT` | Yes | Firebase service account JSON |

## 🗄️ Database

Uses **Firebase Firestore** with the following collections:

- `doctors` - Doctor profiles
- `hospitals` - Hospital bed availability
- `appointments` - Patient appointments
- `prescriptions` - Medical prescriptions
- `users/{userId}/labHistory` - Lab test history (subcollection)

### Auto-Seeding

On server start, the database is automatically seeded with:
- 4 mock doctors
- 4 mock hospitals

This only happens if the collections are empty.

## 🧪 Testing

```bash
# Health check
curl http://localhost:5000/api/health

# Get doctors
curl http://localhost:5000/api/doctors

# Book appointment
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{"doctorId":"abc123","patientName":"John Doe","date":"2026-02-01","time":"10:00 AM"}'
```

## 🐛 Troubleshooting

### "Firebase Admin initialized without credentials"
- Ensure `FIREBASE_SERVICE_ACCOUNT` environment variable is set
- Verify the JSON is valid and complete

### CORS errors
- Backend has CORS enabled by default
- If needed, configure specific origins in `index.js`

### Port already in use
- Change `PORT` in `.env` file
- Or kill the process using port 5000

## 📚 Documentation

- [Railway Deployment Guide](../RAILWAY_DEPLOYMENT.md)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Express.js Documentation](https://expressjs.com/)

## 📄 License

Part of the HealthBridge Telemedicine project.
