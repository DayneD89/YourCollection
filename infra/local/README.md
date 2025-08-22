# Local Development Infrastructure

> **Stack**: Docker + PostgreSQL + Scripts | **Cost**: Free | **Setup**: 2 minutes | **Purpose**: Complete local development

Docker-based local development environment with PostgreSQL, PgAdmin, and automated setup scripts for zero-cost development.

## 🚀 Quick Start

```bash
# Start everything (database, backend, frontend)
cd scripts
./start-local.sh

# Run comprehensive tests
node ../../test-runner.js --env=local

# Stop everything
./stop-local.sh
```

## 📋 What's Here

- **Docker Compose** setup with PostgreSQL and PgAdmin
- **Automated scripts** for start/stop/reset operations
- **Database initialization** with default users and schema
- **Multi-environment testing** support (local/dev/prod)
- **Hot reload development** for both backend and frontend
- **Zero cost** - runs entirely on your machine

## 🐳 Services

| Service | URL | Purpose | Container |
|---------|-----|---------|-----------|
| **Frontend** | http://localhost:3000 | Next.js PWA | Native process |
| **Backend** | http://localhost:3001 | Express API | Native process |
| **PostgreSQL** | localhost:5432 | Database | `yourpartycollection-postgres` |
| **PgAdmin** | http://localhost:8080 | DB Management | `yourpartycollection-pgadmin` |

## 🛠️ Management Scripts

```bash
cd scripts/

# Core operations
./start-local.sh           # Start everything
./stop-local.sh            # Stop everything  
./stop-local.sh --clean    # Stop and remove data

# Development helpers
./logs.sh                  # View all service logs
./reset-db.sh              # Reset database to clean state
./health-check.sh          # Verify all services are running
```

**→ [../../docs/development/development-overview.md](../../docs/development/development-overview.md)** for detailed development workflow

## 🗄️ Database Setup

The local environment automatically creates:

**Default Users:**
- **Admin**: `admin@example.com` / `AdminTest123@`

*Note: Only the admin user is created automatically. Additional test users are created dynamically during test execution.*

**Database Access:**
- **Direct Connection**: `localhost:5432` (postgres/password)
- **PgAdmin Interface**: http://localhost:8080 (admin@party-collection.local / admin123)

**→ [../../docs/getting-started/database-setup.md](../../docs/getting-started/database-setup.md)** for database configuration details

## 🧪 Testing Integration

The local environment supports comprehensive testing:

```bash
# All tests against local environment
node test-runner.js --env=local

# Backend API tests only
cd ../backend && npm test

# Frontend E2E tests only  
cd ../frontend && npm test

# Specific test scenarios
cd ../frontend && npm run test:e2e -- --tags "@admin"
```

**→ [../../docs/testing/test-commands.md](../../docs/testing/test-commands.md)** for comprehensive testing strategies

## 📁 Structure

```
infra/local/
├── scripts/                 # Management scripts
│   ├── start-local.sh       # Start all services
│   ├── stop-local.sh        # Stop all services
│   ├── logs.sh              # View service logs
│   └── health-check.sh      # Service health verification
├── docker/                  # Docker configuration
│   ├── docker-compose.yml   # Service definitions
│   └── init-db.sql          # Database initialization
├── .pids/                   # Process ID tracking
└── README.md               # This file
```

## 🔧 Configuration

**Environment Variables** (automatically set by scripts):
- `NODE_ENV=development`
- `DB_HOST=localhost`
- `DB_PORT=5432`
- `FRONTEND_URL=http://localhost:3000`
- `NEXT_PUBLIC_API_URL=http://localhost:3001`

**Docker Networks**: All containers use the `party-collection-network` for internal communication.

**→ [../../docs/getting-started/quick-start.md](../../docs/getting-started/quick-start.md)** for setup and configuration details

## 🔗 Integration with Components

- **Backend**: Connects to local PostgreSQL automatically
- **Frontend**: Configured to call backend API at localhost:3001
- **Testing**: All test suites run against local environment by default
- **Development**: Hot reload enabled for both frontend and backend

## ⚡ Performance Features

- **Fast Startup**: ~30 seconds to full running environment
- **Hot Reload**: Instant code changes in development
- **Parallel Testing**: Backend and E2E tests can run simultaneously
- **Resource Efficient**: Minimal system resource usage
- **Clean Shutdown**: Proper cleanup of all processes and containers

## 🐛 Troubleshooting

Common issues and solutions:

```bash
# Containers won't start
./stop-local.sh --clean && ./start-local.sh

# Database connection issues
./reset-db.sh

# Port conflicts (3000, 3001, 5432, 8080 in use)
# Stop conflicting services or modify docker-compose.yml ports

# Permission issues
chmod +x scripts/*.sh
```

**→ [../../docs/troubleshooting/remote-management.md](../../docs/troubleshooting/remote-management.md)** for complete troubleshooting guide

## 🔄 Development Workflow

```bash
# 1. Start development environment
cd infra/local/scripts && ./start-local.sh

# 2. Make code changes (frontend or backend)
# Hot reload automatically picks up changes

# 3. Run tests
node test-runner.js --env=local

# 4. Debug with database interface
# Visit http://localhost:8080 for PgAdmin

# 5. Clean shutdown when done
./stop-local.sh
```

---

## 🔗 Related Components

- **[Backend API](../../backend/README.md)** - API server that runs in this environment
- **[Frontend PWA](../../frontend/README.md)** - React app that runs in this environment  
- **[Remote Infrastructure](../remote/README.md)** - Deploy the same system to AWS
- **[Complete Documentation](../../docs/index.md)** - Full documentation index

## 📚 Documentation Deep-Dive

- **[System Architecture](../../docs/infrastructure/stack-structure.md)** - How local development fits the system
- **[Development Workflow](../../docs/development/development-overview.md)** - Using local environment effectively
- **[Testing Strategy](../../docs/testing/test-commands.md)** - Test everything locally first
- **[Database Setup Guide](../../docs/getting-started/database-setup.md)** - PostgreSQL configuration details  
- **[Quick Start Guide](../../docs/getting-started/quick-start.md)** - Get started with local development

## 🚀 Next Steps

**Ready to deploy to the cloud?** Check out [AWS Infrastructure](../remote/README.md) to put your app on the internet with smart cost optimization.