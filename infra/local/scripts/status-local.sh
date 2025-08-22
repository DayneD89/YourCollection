#!/bin/bash

# Party Collection Local Development Status Script
echo "📊 Party Collection Development Environment Status"
echo ""

# Get paths
SCRIPT_DIR="$(dirname "$0")"
PID_DIR="$SCRIPT_DIR/../.pids"

# Check Docker services
echo "🐳 Docker Services:"
cd "$SCRIPT_DIR/../docker"

if docker-compose ps | grep -q "Up"; then
    docker-compose ps
    echo ""
else
    echo "❌ No Docker containers running"
    echo ""
fi

# Check Node.js services
echo "⚡ Node.js Services:"

# Check backend
if [ -f "$PID_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$PID_DIR/backend.pid")
    if kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo "✅ Backend: Running (PID: $BACKEND_PID)"
        echo "   URL: http://localhost:3001"
        echo "   Log: tail -f $PID_DIR/backend.log"
    else
        echo "❌ Backend: PID file exists but process not running"
    fi
else
    echo "❌ Backend: Not running (no PID file)"
fi

# Check frontend
if [ -f "$PID_DIR/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$PID_DIR/frontend.pid")
    if kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo "✅ Frontend: Running (PID: $FRONTEND_PID)"
        echo "   URL: http://localhost:3000"
        echo "   Log: tail -f $PID_DIR/frontend.log"
    else
        echo "❌ Frontend: PID file exists but process not running"
    fi
else
    echo "❌ Frontend: Not running (no PID file)"
fi

echo ""

# Test connectivity
echo "🌐 Connectivity Tests:"

# Test backend
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend API: Responding"
else
    echo "❌ Backend API: Not responding"
fi

# Test frontend (just check if port is open)
if nc -z localhost 3000 2>/dev/null; then
    echo "✅ Frontend: Port 3000 open"
else
    echo "❌ Frontend: Port 3000 not accessible"
fi

# Test database
if docker-compose exec postgres pg_isready -U postgres -d party_collection > /dev/null 2>&1; then
    echo "✅ Database: Ready"
else
    echo "❌ Database: Not ready"
fi

# Test PgAdmin
if nc -z localhost 8080 2>/dev/null; then
    echo "✅ PgAdmin: Port 8080 open"
else
    echo "❌ PgAdmin: Port 8080 not accessible"
fi

echo ""
echo "💡 Management Commands:"
echo "   Start all: ./start-local.sh"
echo "   Stop all: ./stop-local.sh"
echo "   Reset DB: ./reset-local.sh"
echo "   View logs: ls -la $PID_DIR/"