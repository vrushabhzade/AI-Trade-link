#!/bin/bash

# Build script for Pigeon-Crypto Dashboard
# Builds both frontend and backend for production deployment

set -e

echo "🚀 Building Pigeon-Crypto Dashboard for production..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or later."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or later is required. Current version: $(node --version)"
    exit 1
fi

print_status "Node.js version: $(node --version)"

# Install root dependencies
print_status "Installing root dependencies..."
npm install

# Build frontend
print_status "Building frontend..."
cd frontend

# Install frontend dependencies
print_status "Installing frontend dependencies..."
npm ci --only=production

# Run frontend tests
print_status "Running frontend tests..."
npm test -- --passWithNoTests --watchAll=false

# Build frontend for production
print_status "Building frontend for production..."
npm run build

# Verify frontend build
if [ ! -d "dist" ]; then
    print_error "Frontend build failed - dist directory not found"
    exit 1
fi

print_status "Frontend build completed successfully"
cd ..

# Build backend
print_status "Building backend..."
cd backend

# Install backend dependencies
print_status "Installing backend dependencies..."
npm ci --only=production

# Run backend tests
print_status "Running backend tests..."
npm test -- --passWithNoTests

# Build backend for production
print_status "Building backend for production..."
npm run build

# Verify backend build
if [ ! -d "dist" ]; then
    print_error "Backend build failed - dist directory not found"
    exit 1
fi

print_status "Backend build completed successfully"
cd ..

# Create production package
print_status "Creating production package..."
mkdir -p build/production

# Copy built files
cp -r frontend/dist build/production/frontend
cp -r backend/dist build/production/backend
cp -r backend/node_modules build/production/backend/
cp backend/package.json build/production/backend/
cp backend/.env.production build/production/backend/.env

# Copy deployment files
cp Dockerfile build/production/
cp docker-compose.yml build/production/
cp nginx.conf build/production/

# Create deployment info
cat > build/production/deployment-info.json << EOF
{
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "$(node -p "require('./package.json').version")",
  "nodeVersion": "$(node --version)",
  "platform": "$(uname -s)",
  "architecture": "$(uname -m)",
  "frontendSize": "$(du -sh frontend/dist | cut -f1)",
  "backendSize": "$(du -sh backend/dist | cut -f1)"
}
EOF

print_status "Production package created in build/production/"

# Generate deployment instructions
cat > build/production/DEPLOYMENT.md << 'EOF'
# Deployment Instructions

## Docker Deployment (Recommended)

1. Build and run with Docker Compose:
   ```bash
   docker-compose up -d
   ```

2. Check application health:
   ```bash
   curl http://localhost:3001/health
   ```

## Manual Deployment

1. Ensure Node.js 18+ is installed
2. Set environment variables from `.env.production`
3. Start the application:
   ```bash
   cd backend
   node dist/index.js
   ```

## Environment Variables

Copy and configure the following environment variables:

### Backend (.env)
- NODE_ENV=production
- PORT=3001
- DATABASE_PATH=./data/production.db
- REDIS_URL=redis://localhost:6379
- COINGECKO_API_KEY=your_api_key
- COINMARKETCAP_API_KEY=your_api_key
- EBIRD_API_KEY=your_api_key

### Frontend
- Served as static files from frontend/ directory
- Configure reverse proxy to serve static files and proxy API requests

## Health Monitoring

- Health check endpoint: `/health`
- Detailed health: `/api/health/detailed`
- Error statistics: `/api/errors/stats`

## Performance Monitoring

- Performance stats: `/api/performance/status`
- WebSocket stats: `/api/websocket/status`
- Cache stats: `/api/cache/status`
EOF

print_status "Deployment instructions created: build/production/DEPLOYMENT.md"

# Calculate build sizes
FRONTEND_SIZE=$(du -sh frontend/dist 2>/dev/null | cut -f1 || echo "Unknown")
BACKEND_SIZE=$(du -sh backend/dist 2>/dev/null | cut -f1 || echo "Unknown")
TOTAL_SIZE=$(du -sh build/production 2>/dev/null | cut -f1 || echo "Unknown")

echo ""
echo "📊 Build Summary:"
echo "  Frontend size: $FRONTEND_SIZE"
echo "  Backend size: $BACKEND_SIZE"
echo "  Total package size: $TOTAL_SIZE"
echo ""
print_status "Build completed successfully! 🎉"
echo ""
echo "Next steps:"
echo "  1. Review build/production/DEPLOYMENT.md for deployment instructions"
echo "  2. Configure environment variables for your deployment environment"
echo "  3. Deploy using Docker Compose or manual deployment method"
echo ""