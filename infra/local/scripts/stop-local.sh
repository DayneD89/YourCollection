#!/bin/bash

# Party Collection Local Development Shutdown Script
set -e

echo "🛑 Stopping Party Collection Local Development Environment"

# Get paths and project name
SCRIPT_DIR="$(dirname "$0")"
PID_DIR="$SCRIPT_DIR/../.pids"
BASE_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
PROJECT_NAME="$(basename "$BASE_DIR")"
export COMPOSE_PROJECT_NAME="$PROJECT_NAME"

# Stop Node.js processes first
echo "🔌 Stopping Node.js services..."

# Function to kill process tree
kill_process_tree() {
    local pid=$1
    local name=$2
    
    if kill -0 "$pid" 2>/dev/null; then
        echo "⏹️  Stopping $name (PID: $pid)..."
        
        # Get all child processes (ensure this doesn't fail)
        local children=$(pgrep -P "$pid" 2>/dev/null | tr '\n' ' ' | sed 's/[[:space:]]*$//' || true)
        
        # Kill child processes first
        if [ -n "$children" ] && [ "$children" != "" ]; then
            echo "   └─ Stopping child processes: $children"
            for child in $children; do
                if [ -n "$child" ] && [ "$child" -gt 0 ] 2>/dev/null; then
                    kill_process_tree "$child" "child"
                fi
            done
        fi
        
        # Kill the main process
        kill "$pid" 2>/dev/null || true
        sleep 1
        
        # Force kill if still running
        if kill -0 "$pid" 2>/dev/null; then
            kill -9 "$pid" 2>/dev/null || true
        fi
    fi
}

if [ -f "$PID_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$PID_DIR/backend.pid")
    kill_process_tree "$BACKEND_PID" "backend"
    rm -f "$PID_DIR/backend.pid"
    echo "✅ Backend stopped"
else
    echo "ℹ️  Backend PID file not found"
fi

if [ -f "$PID_DIR/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$PID_DIR/frontend.pid")
    kill_process_tree "$FRONTEND_PID" "frontend"
    rm -f "$PID_DIR/frontend.pid"
    echo "✅ Frontend stopped"
else
    echo "ℹ️  Frontend PID file not found"
fi

# Additional cleanup: kill any remaining project related processes
echo "🧹 Cleaning up any remaining project processes..."
# Use a simpler approach that won't hang
pkill -f "$PROJECT_NAME" 2>/dev/null || true
pkill -f "nodemon.*src/index.ts" 2>/dev/null || true  
pkill -f "next.*dev.*turbopack" 2>/dev/null || true
sleep 1
# Force kill any remaining ones
pkill -9 -f "$PROJECT_NAME" 2>/dev/null || true
pkill -9 -f "nodemon.*src/index.ts" 2>/dev/null || true
pkill -9 -f "next.*dev.*turbopack" 2>/dev/null || true
echo "   └─ Process cleanup completed"

# Navigate to docker directory
cd "$SCRIPT_DIR/../docker"

# Stop Docker services
echo "📦 Stopping containers..."
timeout 30 docker-compose down || true

echo ""
echo "✅ Local development environment stopped!"
echo ""
echo "💡 Tips:"
echo "  - To start again: ./start-local.sh"
echo "  - To remove all data: ./stop-local.sh --clean (or --clear)"
echo "  - To reset database: ./reset-local.sh"

# Check if --clean or --clear flag is provided
if [[ "$1" == "--clean" ]] || [[ "$1" == "--clear" ]]; then
    echo ""
    echo "🧹 Cleaning up volumes, networks, and logs..."
    
    # Stop and remove containers with volumes
    timeout 30 docker-compose down -v --remove-orphans || true
    
    # Remove specific named volumes to ensure complete cleanup
    timeout 10 docker volume rm -f "${PROJECT_NAME}-postgres-data" "${PROJECT_NAME}-pgladmin-data" 2>/dev/null || true
    
    # Force remove any remaining containers 
    docker rm -f "${PROJECT_NAME}-postgres" "${PROJECT_NAME}-pgladmin" 2>/dev/null || true
    
    # Clean up any dangling volumes and networks
    docker volume prune -f 2>/dev/null || true
    docker network prune -f 2>/dev/null || true
    
    # Remove unused images related to the project (keeps base postgres/pgladmin images)
    docker images --filter "reference=${PROJECT_NAME}*" -q | xargs -r docker rmi -f 2>/dev/null || true
    
    # Clean up log files and PID files
    if [ -d "$PID_DIR" ]; then
        rm -f "$PID_DIR"/*.log
        rm -f "$PID_DIR"/*.pid
        echo "🗑️  Cleared log files and PID files"
    fi
    
    # Clean up any remaining Chrome headless processes
    echo "🌐 Cleaning up leftover Chrome processes..."
    pkill -f "chrome.*--headless" 2>/dev/null || true
    pkill -f "google-chrome.*--headless" 2>/dev/null || true
    pkill -f "chromium.*--headless" 2>/dev/null || true
    sleep 1
    # Force kill any stubborn Chrome processes
    pkill -9 -f "chrome.*--headless" 2>/dev/null || true
    pkill -9 -f "google-chrome.*--headless" 2>/dev/null || true
    pkill -9 -f "chromium.*--headless" 2>/dev/null || true
    echo "   └─ Chrome process cleanup completed"
    
    echo "✅ Clean shutdown complete!"
    echo "   └─ All containers, volumes, and networks removed"
    echo "   └─ Next start will create fresh database with seed data"
fi

# Explicitly exit with success code
exit 0