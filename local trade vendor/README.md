# TradeLink Marketplace

AI-powered local trade marketplace platform that connects vendors and buyers through multilingual communication, intelligent price negotiation, and seamless product discovery.

## 🚀 Ready to Deploy!

**Your app is fully configured and ready for deployment!**

- ⚡ **Quick Start**: See [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) - Deploy in 10 minutes
- 📖 **Step-by-Step**: See [DEPLOY_NOW.md](./DEPLOY_NOW.md) - Complete deployment guide
- 🔧 **Troubleshooting**: See [DEPLOYMENT_TROUBLESHOOTING.md](./DEPLOYMENT_TROUBLESHOOTING.md)
- ✅ **Checklist**: See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

**GitHub Repository**: https://github.com/vrushabhzade/Trade-link-

## Features

- 🌍 **Multilingual Support**: Real-time translation powered by AI
- 🤝 **Smart Negotiations**: AI-powered price discovery and negotiation assistance  
- 📍 **Local Discovery**: Location-based product search and vendor discovery
- 💬 **Real-time Chat**: WebSocket-based messaging with translation
- 🎤 **Voice Input**: Speech-to-text for natural interaction
- 📱 **Mobile Responsive**: PWA-ready with mobile-optimized interface

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Zustand for state management
- React Query for API state
- Socket.IO for real-time features

### Backend
- Node.js with Express.js
- TypeScript
- PostgreSQL with PostGIS
- Prisma ORM
- Redis for caching
- Socket.IO for WebSocket
- Anthropic Claude API for AI features

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+ with PostGIS extension
- Redis (optional, for caching)
- Anthropic API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tradelink-marketplace
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   ```

3. **Set up environment variables**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   cd backend
   npm run db:generate
   npm run db:migrate
   ```

5. **Start the development servers**
   ```bash
   # From root directory
   npm run dev
   ```

   This will start:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

### Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/tradelink_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# Anthropic Claude API
ANTHROPIC_API_KEY="your-anthropic-api-key-here"

# Server
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

## Development

### Available Scripts

**Root level:**
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both frontend and backend for production
- `npm test` - Run tests for both frontend and backend

**Frontend:**
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm test` - Run Vitest tests

**Backend:**
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm test` - Run Jest tests
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client

### Project Structure

```
tradelink-marketplace/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── stores/         # Zustand state stores
│   │   ├── types/          # TypeScript type definitions
│   │   └── test/           # Test utilities
│   └── package.json
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── types/          # TypeScript type definitions
│   │   └── test/           # Test utilities
│   ├── prisma/             # Database schema and migrations
│   └── package.json
└── package.json            # Root package.json with workspaces
```

## API Documentation

The API follows RESTful conventions with the following main endpoints:

- `GET /health` - Health check endpoint
- `/api/auth` - Authentication endpoints (login, register, refresh)
- `/api/users` - User management
- `/api/products` - Product catalog operations
- `/api/negotiations` - Price negotiation management
- `/api/translations` - Translation services

WebSocket events are handled through Socket.IO for real-time chat and notifications.

## Testing

The project uses a dual testing approach:

- **Unit Tests**: Jest for backend, Vitest for frontend
- **Property-Based Tests**: fast-check for comprehensive input validation
- **Integration Tests**: Supertest for API testing, React Testing Library for components

Run tests with:
```bash
npm test
```

## Deployment

### Deploy to Vercel

TradeLink is optimized for deployment on Vercel. Follow these steps:

1. **Quick Deploy**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   vercel --prod
   ```

2. **Or use the deployment script**
   ```bash
   chmod +x deploy-vercel.sh
   ./deploy-vercel.sh
   ```

3. **Configure environment variables in Vercel dashboard**
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - Secret key for JWT tokens
   - `ANTHROPIC_API_KEY` - API key for AI features
   - `FRONTEND_URL` - Your Vercel app URL
   - `VITE_API_URL` - Your Vercel app URL (for frontend)

For detailed deployment instructions, see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

### Alternative Deployment Options

- **Railway**: Deploy backend and database together
- **Render**: Full-stack deployment with PostgreSQL
- **AWS/GCP/Azure**: Traditional cloud deployment
- **Docker**: Containerized deployment (Dockerfile included)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.