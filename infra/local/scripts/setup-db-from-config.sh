#!/bin/bash
set -e

echo "🔧 Setting up database with configuration from party-survey.yaml..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOCKER_DIR="$(cd "$SCRIPT_DIR/../docker" && pwd)"

# Read configuration from party-survey.yaml
echo "📖 Reading admin credentials from party-survey.yaml..."
eval $(node "$SCRIPT_DIR/read-config.js")

echo "Admin email: ${ADMIN_EMAIL}"
echo "🗄️  Setting PostgreSQL configuration and refreshing admin user..."

# Change to docker directory
cd "$DOCKER_DIR"

# Set PostgreSQL configuration parameters and recreate admin user with config values
cat << EOF | docker-compose exec -T postgres psql -U postgres -d party_collection
-- Set configuration parameters for this session
SELECT set_config('myapp.admin_email', '${ADMIN_EMAIL}', false);
SELECT set_config('myapp.admin_password', '${ADMIN_PASSWORD}', false);

-- Remove existing admin user if email has changed
DELETE FROM users WHERE role = 'admin' AND email != '${ADMIN_EMAIL}';

-- Insert/update admin user with config values
INSERT INTO users (email, password_hash, role, first_name, last_name) 
VALUES 
    (
        '${ADMIN_EMAIL}', 
        crypt('${ADMIN_PASSWORD}', gen_salt('bf')), 
        'admin', 
        'Admin', 
        'User'
    )
ON CONFLICT (email) DO UPDATE SET
    password_hash = crypt('${ADMIN_PASSWORD}', gen_salt('bf')),
    updated_at = CURRENT_TIMESTAMP;

-- Show the configured admin user
SELECT email, role, first_name, last_name FROM users WHERE email = '${ADMIN_EMAIL}';
EOF

echo "✅ Database setup completed with admin: ${ADMIN_EMAIL}"