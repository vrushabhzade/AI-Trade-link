# Pigeon-Crypto Dashboard 🐦📈

A delightfully absurd dashboard that overlays urban pigeon sightings with cryptocurrency prices to reveal hilariously meaningless correlations.

## Project Structure

```
pigeon-crypto-dashboard/
├── frontend/          # React + TypeScript + Vite
├── backend/           # Node.js + Express + TypeScript
├── .kiro/specs/       # Feature specifications
└── package.json       # Root workspace configuration
```

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+

### Installation
```bash
npm run install:all
```

### Development
```bash
# Start both frontend and backend
npm run dev

# Or start individually:
npm run dev:frontend  # Frontend on http://localhost:5173
npm run dev:backend   # Backend on http://localhost:3001
```

### Building
```bash
npm run build
```

### Testing
```bash
npm run test
```

## Features (Coming Soon!)

- 🐦 Real-time pigeon sighting data (with realistic mock fallback)
- 💰 Live cryptocurrency price feeds
- 📊 Interactive time-series charts
- 🔗 Correlation analysis with humorous commentary
- 📱 Responsive design for mobile devices
- ⚡ Real-time updates via WebSocket

## API Endpoints

- `GET /health` - Health check
- `GET /api/dashboard-data` - Combined pigeon and crypto data
- More endpoints coming as we implement the features!

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

```bash
# API Keys (optional - will use mock data if not provided)
COINGECKO_API_KEY=your_key_here
EBIRD_API_KEY=your_key_here

# Database
REDIS_URL=redis://localhost:6379
SQLITE_DB_PATH=./data/dashboard.db
```

## Development Status

This project is being built following the spec-driven development methodology. Check the implementation progress in `.kiro/specs/pigeon-crypto-dashboard/tasks.md`.

**Current Status**: ✅ Project setup complete, ready for feature implementation!

---

*"Correlation does not imply causation, but it sure makes for entertaining charts!"* 🎯