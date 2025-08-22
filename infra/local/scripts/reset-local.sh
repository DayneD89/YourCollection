#!/bin/bash

# Party Collection Database Reset Script
set -e

echo "🔄 Resetting Party Collection Database"

# Navigate to docker directory
cd "$(dirname "$0")/../docker"

# Check if containers are running
if ! docker-compose ps | grep -q "Up"; then
    echo "❌ Containers are not running. Please start them first with ./start-local.sh"
    exit 1
fi

# Confirm reset
read -p "⚠️  This will delete ALL data in the database. Are you sure? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Database reset cancelled."
    exit 1
fi

echo "🗄️ Resetting database..."

# Execute reset script
docker-compose exec postgres psql -U postgres -d party_collection -f /docker-entrypoint-initdb.d/../scripts/reset-db.sql

echo "✅ Database reset complete!"
echo ""
# Read admin credentials from config
eval $(node read-config.js 2>/dev/null || echo 'ADMIN_EMAIL="admin@example.com"')

echo "📊 Database has been reset with fresh schema and seed data:"
echo "  - Admin user: ${ADMIN_EMAIL}"
echo "  - Sample parties created"
echo "  - Audit logs initialized"
echo "  - Additional test users will be created dynamically by test suite"