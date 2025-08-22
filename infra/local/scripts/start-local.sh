#!/bin/bash

# Party Collection Local Development Startup Script
set -e

echo "🚀 Starting Party Collection Local Development Environment"

# Get the base directory and set project name for Docker Compose
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
BACKEND_DIR="$BASE_DIR/backend"
FRONTEND_DIR="$BASE_DIR/frontend"
PID_DIR="$SCRIPT_DIR/../.pids"

# Set the Docker Compose project name based on the root directory name
export COMPOSE_PROJECT_NAME="$(basename "$BASE_DIR")"
echo "📦 Using Docker Compose project name: $COMPOSE_PROJECT_NAME"

# Create PID directory with absolute path
PID_DIR_ABS="$(cd "$SCRIPT_DIR/.." && pwd)/.pids"
mkdir -p "$PID_DIR_ABS"

# Function to cleanup on exit (only for failures)
cleanup_on_error() {
    echo "🧹 Cleaning up processes due to error..."
    if [ -f "$PID_DIR_ABS/backend.pid" ]; then
        kill $(cat "$PID_DIR_ABS/backend.pid") 2>/dev/null || true
        rm -f "$PID_DIR_ABS/backend.pid"
    fi
    if [ -f "$PID_DIR_ABS/frontend.pid" ]; then
        kill $(cat "$PID_DIR_ABS/frontend.pid") 2>/dev/null || true
        rm -f "$PID_DIR_ABS/frontend.pid"
    fi
}

# Set trap for cleanup on interruption/error
trap cleanup_on_error INT TERM

# Check if Docker is running and start it if needed
if ! docker info > /dev/null 2>&1; then
    echo "🐳 Docker is not running. Starting Docker Desktop..."
    
    # Check if we're on macOS and Docker Desktop is installed
    if [[ "$OSTYPE" == "darwin"* ]] && [ -d "/Applications/Docker.app" ]; then
        open -a Docker
        echo "⏳ Waiting for Docker Desktop to start..."
        
        # Wait for Docker to be ready (up to 120 seconds)
        timeout=120
        while ! docker info > /dev/null 2>&1; do
            if [ $timeout -le 0 ]; then
                echo "❌ Timeout waiting for Docker to start. Please start Docker Desktop manually."
                exit 1
            fi
            sleep 2
            timeout=$((timeout-2))
            echo "   Docker starting... ($((120-timeout))s elapsed)"
        done
        echo "✅ Docker Desktop started successfully!"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Try to start Docker service on Linux
        echo "🐧 Attempting to start Docker service on Linux..."
        sudo systemctl start docker 2>/dev/null || {
            echo "❌ Failed to start Docker service. Please start Docker manually."
            exit 1
        }
        sleep 3
        if ! docker info > /dev/null 2>&1; then
            echo "❌ Docker failed to start. Please check Docker installation."
            exit 1
        fi
        echo "✅ Docker service started successfully!"
    else
        echo "❌ Docker is not running and automatic startup is not supported on this platform."
        echo "   Please start Docker Desktop manually and run this script again."
        exit 1
    fi
fi

# Check if Node.js is installed
if ! command -v node > /dev/null 2>&1; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Navigate to docker directory
cd "$SCRIPT_DIR/../docker"

# Start services
echo "📦 Starting PostgreSQL and PgAdmin..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
timeout=60
while ! docker-compose exec postgres pg_isready -U postgres -d party_collection > /dev/null 2>&1; do
    if [ $timeout -le 0 ]; then
        echo "❌ Timeout waiting for PostgreSQL to be ready"
        exit 1
    fi
    sleep 2
    timeout=$((timeout-2))
done

echo "✅ PostgreSQL is ready!"

# Check and install backend dependencies
echo "🔧 Setting up backend..."
if [ -d "$BACKEND_DIR" ]; then
    cd "$BACKEND_DIR"
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing backend dependencies..."
        npm install
    fi
    echo "🚀 Starting backend server..."
    nohup npm run dev > "$PID_DIR_ABS/backend.log" 2>&1 &
    echo $! > "$PID_DIR_ABS/backend.pid"
    echo "✅ Backend started (PID: $!)"
else
    echo "⚠️  Backend directory not found at $BACKEND_DIR"
fi

# Check and install frontend dependencies
echo "🔧 Setting up frontend..."
if [ -d "$FRONTEND_DIR" ]; then
    cd "$FRONTEND_DIR"
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing frontend dependencies..."
        npm install
    fi
    echo "🚀 Starting frontend server..."
    nohup npm run dev > "$PID_DIR_ABS/frontend.log" 2>&1 &
    echo $! > "$PID_DIR_ABS/frontend.pid"
    echo "✅ Frontend started (PID: $!)"
else
    echo "⚠️  Frontend directory not found at $FRONTEND_DIR"
fi

# Wait a moment for services to start
echo "⏳ Waiting for services to initialize..."

# Setup database with configuration from party-survey.yaml after PostgreSQL is ready
sleep 2
echo "🔧 Setting up database with configuration..."
"$SCRIPT_DIR/setup-db-from-config.sh"
sleep 3

# Display connection information
echo ""
echo "🎉 Local development environment is ready!"
echo ""
echo "🌐 Application URLs:"
echo "  Frontend PWA: http://localhost:3000"
echo "  Backend API: http://localhost:3001"
echo "  PgAdmin: http://localhost:8080"
echo ""
echo "📊 Database Information:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: party_collection"
echo "  Username: postgres"
echo "  Password: password"
echo ""
# Read admin credentials from config
echo "📖 Reading admin credentials from party-survey.yaml..."
eval $(node "$SCRIPT_DIR/read-config.js")

echo "👤 Admin Account (from configuration):"
echo "  Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}"
echo ""
echo "ℹ️  Note: Additional test users will be created dynamically by the test suite as needed"
echo ""
echo "📋 Service Status:"
cd "$SCRIPT_DIR/../docker"
docker-compose ps
echo ""
if [ -f "$PID_DIR/backend.pid" ] && kill -0 $(cat "$PID_DIR/backend.pid") 2>/dev/null; then
    echo "✅ Backend: Running (PID: $(cat "$PID_DIR/backend.pid"))"
else
    echo "❌ Backend: Not running"
fi

if [ -f "$PID_DIR/frontend.pid" ] && kill -0 $(cat "$PID_DIR/frontend.pid") 2>/dev/null; then
    echo "✅ Frontend: Running (PID: $(cat "$PID_DIR/frontend.pid"))"
else
    echo "❌ Frontend: Not running"
fi
echo ""
echo "📝 Management:"
echo "  Stop all services: ./stop-local.sh"
echo "  Reset database: ./reset-local.sh"
echo "  View logs: tail -f ../.pids/*.log"
echo ""
echo "🎯 Ready to develop! Visit http://localhost:3000 to get started."

# Disable the error cleanup trap since startup was successful
trap - INT TERM

echo "🎯 All services started successfully! Processes will continue running."
echo "   Use './stop-local.sh' to stop all services."