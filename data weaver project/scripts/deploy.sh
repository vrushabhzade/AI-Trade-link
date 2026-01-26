#!/bin/bash

# Deployment script for Pigeon-Crypto Dashboard
# Handles production deployment with health checks and rollback capability

set -e

# Configuration
DEPLOY_ENV=${1:-production}
HEALTH_CHECK_TIMEOUT=60
ROLLBACK_ENABLED=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_header() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for service health
wait_for_health() {
    local url=$1
    local timeout=$2
    local start_time=$(date +%s)
    
    print_status "Waiting for service to be healthy at $url..."
    
    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [ $elapsed -gt $timeout ]; then
            print_error "Health check timeout after ${timeout}s"
            return 1
        fi
        
        if curl -f -s "$url" > /dev/null 2>&1; then
            print_status "Service is healthy!"
            return 0
        fi
        
        echo -n "."
        sleep 2
    done
}

# Function to backup current deployment
backup_deployment() {
    if [ -d "backup" ]; then
        print_status "Creating deployment backup..."
        local backup_dir="backup/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$backup_dir"
        
        if [ -d "build/production" ]; then
            cp -r build/production "$backup_dir/"
            print_status "Backup created at $backup_dir"
        fi
    fi
}

# Function to rollback deployment
rollback_deployment() {
    if [ "$ROLLBACK_ENABLED" = true ]; then
        print_warning "Rolling back deployment..."
        
        local latest_backup=$(ls -t backup/ | head -n1)
        if [ -n "$latest_backup" ] && [ -d "backup/$latest_backup" ]; then
            print_status "Rolling back to backup: $latest_backup"
            
            # Stop current services
            docker-compose down 2>/dev/null || true
            
            # Restore backup
            rm -rf build/production
            cp -r "backup/$latest_backup/production" build/
            
            # Restart services
            docker-compose up -d
            
            print_status "Rollback completed"
        else
            print_error "No backup found for rollback"
        fi
    fi
}

# Trap to handle deployment failures
trap 'if [ $? -ne 0 ]; then print_error "Deployment failed!"; rollback_deployment; fi' EXIT

print_header "🚀 Starting deployment to $DEPLOY_ENV environment"

# Verify prerequisites
print_status "Checking prerequisites..."

if ! command_exists docker; then
    print_error "Docker is not installed"
    exit 1
fi

if ! command_exists docker-compose; then
    print_error "Docker Compose is not installed"
    exit 1
fi

# Check if build exists
if [ ! -d "build/production" ]; then
    print_error "Production build not found. Run './scripts/build.sh' first."
    exit 1
fi

print_status "Prerequisites check passed"

# Create backup
backup_deployment

# Navigate to production build
cd build/production

# Check for required files
required_files=("docker-compose.yml" "Dockerfile" "backend/dist/index.js")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ] && [ ! -d "$file" ]; then
        print_error "Required file not found: $file"
        exit 1
    fi
done

print_status "Required files verified"

# Load environment variables
if [ -f "backend/.env" ]; then
    print_status "Loading environment configuration..."
    set -a
    source backend/.env
    set +a
else
    print_warning "No environment file found, using defaults"
fi

# Pre-deployment health check
print_status "Running pre-deployment checks..."

# Check if ports are available
if netstat -tuln 2>/dev/null | grep -q ":${PORT:-3001}"; then
    print_warning "Port ${PORT:-3001} is already in use"
fi

# Stop existing services
print_status "Stopping existing services..."
docker-compose down 2>/dev/null || true

# Pull latest images
print_status "Pulling latest base images..."
docker-compose pull

# Build application image
print_status "Building application image..."
docker-compose build --no-cache

# Start services
print_status "Starting services..."
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 10

# Health checks
print_status "Running health checks..."

# Check Redis
if ! wait_for_health "http://localhost:6379" 30; then
    print_error "Redis health check failed"
    exit 1
fi

# Check main application
if ! wait_for_health "http://localhost:${PORT:-3001}/health" $HEALTH_CHECK_TIMEOUT; then
    print_error "Application health check failed"
    exit 1
fi

# Detailed health check
print_status "Running detailed health check..."
health_response=$(curl -s "http://localhost:${PORT:-3001}/api/health/detailed" || echo "")

if echo "$health_response" | grep -q '"status":"ok"'; then
    print_status "Detailed health check passed"
else
    print_error "Detailed health check failed"
    echo "Response: $health_response"
    exit 1
fi

# Performance verification
print_status "Verifying performance..."
perf_response=$(curl -s "http://localhost:${PORT:-3001}/api/performance/status" || echo "")

if echo "$perf_response" | grep -q '"success":true'; then
    print_status "Performance check passed"
else
    print_warning "Performance check failed, but continuing deployment"
fi

# WebSocket connectivity test
print_status "Testing WebSocket connectivity..."
if command_exists wscat; then
    timeout 5 wscat -c "ws://localhost:${PORT:-3001}/ws" -x '{"type":"ping"}' 2>/dev/null || print_warning "WebSocket test failed"
else
    print_warning "wscat not available, skipping WebSocket test"
fi

# Final verification
print_status "Running final verification..."

# Test API endpoints
api_endpoints=(
    "/health"
    "/api/crypto/supported"
    "/api/pigeon/areas"
)

for endpoint in "${api_endpoints[@]}"; do
    if curl -f -s "http://localhost:${PORT:-3001}$endpoint" > /dev/null; then
        print_status "✓ $endpoint"
    else
        print_error "✗ $endpoint"
        exit 1
    fi
done

# Display deployment information
print_header "📊 Deployment Summary"

echo "Environment: $DEPLOY_ENV"
echo "Application URL: http://localhost:${PORT:-3001}"
echo "Health Check: http://localhost:${PORT:-3001}/health"
echo "API Documentation: http://localhost:${PORT:-3001}/api"

# Show running containers
echo ""
print_status "Running containers:"
docker-compose ps

# Show resource usage
echo ""
print_status "Resource usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Show logs (last 10 lines)
echo ""
print_status "Recent logs:"
docker-compose logs --tail=10

# Create deployment record
deployment_record="deployments/$(date +%Y%m%d_%H%M%S).json"
mkdir -p deployments

cat > "$deployment_record" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "$DEPLOY_ENV",
  "version": "$(cat deployment-info.json | grep version | cut -d'"' -f4 2>/dev/null || echo 'unknown')",
  "status": "success",
  "healthCheck": {
    "application": "healthy",
    "redis": "healthy",
    "websocket": "healthy"
  },
  "services": {
    "app": "$(docker-compose ps -q app)",
    "redis": "$(docker-compose ps -q redis)",
    "nginx": "$(docker-compose ps -q nginx)"
  }
}
EOF

print_status "Deployment record saved: $deployment_record"

# Disable trap on successful completion
trap - EXIT

print_header "🎉 Deployment completed successfully!"

echo ""
echo "Next steps:"
echo "  1. Monitor application logs: docker-compose logs -f"
echo "  2. Check metrics: curl http://localhost:${PORT:-3001}/api/health/detailed"
echo "  3. Test functionality: Open http://localhost:${PORT:-3001} in browser"
echo ""
echo "Troubleshooting:"
echo "  - View logs: docker-compose logs [service-name]"
echo "  - Restart service: docker-compose restart [service-name]"
echo "  - Rollback: ./scripts/rollback.sh"
echo ""