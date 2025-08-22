# Party Collection - Local Development Guide

> **Navigation**: [Quick Start](../getting-started/quick-start.md) | [System Architecture](../infrastructure/stack-structure.md) | [Testing Commands](../testing/test-commands.md)

This guide will help you set up and run the complete Party Collection system locally for development and testing.

## 🏗️ System Overview

The Party Collection system consists of:
- **🎨 Frontend PWA** (Next.js) - Progressive Web App with authentication
- **🔧 Backend API** (Node.js/Express) - REST API with JWT authentication  
- **🗄️ Database** (PostgreSQL) - Data storage with Docker Compose setup
- **🐳 Infrastructure** - Local development environment with Docker

## 📋 Prerequisites

Before starting, ensure you have:

1. **🐳 Docker Desktop** installed and running
   - Download from: https://www.docker.com/products/docker-desktop
   - Verify: `docker --version` and `docker-compose --version`

2. **💻 Node.js** (version 18 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

3. **📂 Git** for version control
   - Verify: `git --version`

## 🚀 Quick Start (Automated Setup)

**One Command Setup** - Everything starts automatically:

```bash
# Navigate to infrastructure scripts
cd infra/local/scripts

# Start EVERYTHING (Database + Backend + Frontend)
./start-local.sh
```

This single command will:
- ✅ Start PostgreSQL database on port 5432
- ✅ Start PgAdmin web interface on port 8080  
- ✅ Create database schema with sample data
- ✅ Install backend dependencies (if needed)
- ✅ Start backend API on port 3001
- ✅ Install frontend dependencies (if needed)
- ✅ Start frontend PWA on port 3000
- ✅ Display all connection information

**That's it!** 🎉 Everything is running automatically.

### Alternative: Manual Setup

If you prefer to start services individually:

```bash
# 1. Start just the database infrastructure
cd infra/local/scripts
./start-local.sh

# 2. In separate terminals, start each service:
cd party-collection-backend && npm run dev
cd party-collection-webapp && npm run dev
```

## 🧪 Testing the Application

### 1. Access the Web Application

1. Open your browser to: http://localhost:3000
2. You'll be redirected to the login page
3. Use one of the test accounts:

**Regular User:**
- Email: `user@example.com`
- Password: `password123`

**Administrator:**
- Email: `admin@example.com`
- Password: `admin123`

### 2. Test Authentication Flow

1. Login with either test account
2. Verify you're redirected to the appropriate dashboard
3. Regular users see the User Dashboard
4. Admins see the Admin Dashboard with additional privileges
5. Test the logout functionality

### 3. API Testing (Optional)

Test the backend API directly:

```bash
# Health check
curl http://localhost:3001/health

# Test login endpoint
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

## 🗄️ Database Management

### PgAdmin Web Interface

1. Access PgAdmin at: http://localhost:8080
2. Login credentials:
   - Email: `admin@party-collection.local`
   - Password: `admin123`
3. Add a new server connection:
   - Host: `postgres` (container name)
   - Port: `5432`
   - Database: `party_collection`
   - Username: `postgres`
   - Password: `password`

### Direct Database Access

```bash
# Connect to database via Docker
cd infra/local/docker
docker-compose exec postgres psql -U postgres -d party_collection

# Example queries
\dt                          # List tables
SELECT * FROM users;         # View users
SELECT * FROM parties;       # View parties
SELECT * FROM audit_logs;    # View audit trail
```

### Database Reset

If you need to reset the database with fresh data:

```bash
cd infra/local/scripts
./reset-local.sh
```

## 🔧 Development Workflow

### Making Changes

1. **Frontend Changes**: Edit files in `party-collection-webapp/src/`
   - Changes auto-reload in the browser
   - TypeScript errors will be shown in the terminal

2. **Backend Changes**: Edit files in `party-collection-backend/src/`
   - Changes auto-reload the server (via nodemon)
   - API changes are immediately available

3. **Database Changes**: Modify scripts in `infra/local/scripts/`
   - Run `./reset-local.sh` to apply schema changes
   - Or modify tables directly via PgAdmin

### Environment Configuration

**Backend Environment** (`party-collection-backend/.env`):
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=party_collection
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Frontend Configuration**:
- Configured in `next.config.ts` for PWA settings
- Environment variables can be added to `.env.local` if needed

## ⚙️ Managing the Environment

### Stop Everything
```bash
# Stop ALL services (Database + Backend + Frontend)
cd infra/local/scripts
./stop-local.sh
```

### Clean Shutdown (Remove all data)
```bash
# Stop and clean up all data, logs, and volumes
./stop-local.sh --clean
```

### Check Status
```bash
# See what's running and what's not
./status-local.sh
```

### Reset Database
```bash
# Reset database with fresh schema and seed data
./reset-local.sh
```

### View Logs
```bash
# View backend logs
tail -f infra/local/.pids/backend.log

# View frontend logs  
tail -f infra/local/.pids/frontend.log
```

## 🔍 Troubleshooting

### Common Issues

**Port Conflicts:**
- If ports 3000, 3001, 5432, or 8080 are in use, modify the configurations
- Check what's using a port: `lsof -i :5432`

**Docker Issues:**
```bash
# Check Docker is running
docker info

# View container status
cd infra/local/docker
docker-compose ps

# View container logs
docker-compose logs postgres
docker-compose logs pgadmin
```

**Database Connection Issues:**
```bash
# Test database connectivity
docker-compose exec postgres pg_isready -U postgres -d party_collection

# Reset database if corrupted
cd ../scripts
./reset-local.sh
```

**NPM Issues:**
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Getting Help

1. Check the logs in each terminal window
2. Verify all services are running: `docker-compose ps`
3. Test database connectivity via PgAdmin
4. Check that all ports are available and not blocked

---

## 📊 Key Workflows Summary

This section provides concise overviews of the main workflows in the Party Collection system. For detailed implementation guides, see the specific documentation files referenced below.

### 1. Authentication Flow
**User Registration & Login Process:**
- Users visit the frontend PWA and can register or login
- Registration includes email validation and password strength checking
- Authentication uses JWT tokens stored in localStorage
- Server validates credentials against PostgreSQL database with bcrypt hashing
- Successful authentication redirects users to role-appropriate dashboards
- Token expiration automatically redirects to login page

**Admin User Management:**
- Admins can create, reset passwords, and delete users through the admin panel
- All admin operations require JWT verification and role checking
- Password resets generate temporary passwords requiring immediate change
- User management operations are logged for audit purposes

*For detailed authentication flows, see: [Security Documentation](../infrastructure/security.md)*

### 2. Development Workflow
**Daily Development Process:**
1. **Startup**: Run `./start-local.sh` to start all services (database, backend, frontend)
2. **Development**: Edit code with automatic hot-reload (frontend) and nodemon restarts (backend)
3. **Testing**: Run tests locally - backend API tests and frontend E2E tests
4. **Debugging**: Use browser dev tools, terminal logs, and PgAdmin database queries
5. **Version Control**: Standard git workflow with feature branches and pull requests
6. **Shutdown**: Run `./stop-local.sh` to gracefully stop all services

**Key Development Commands:**
- `./start-local.sh` - Start entire development environment
- `npm run dev` - Start individual services in development mode
- `npm test` - Run comprehensive test suites
- `./reset-local.sh` - Reset database with fresh data

*For detailed development guides, see: [Local Workflow](local-workflow.md) | [AWS Workflow](aws-workflow.md)*

### 3. Testing Process
**Comprehensive Test Strategy:**
- **Backend Tests**: 13 API integration tests covering authentication and user management
- **Frontend Tests**: 15 E2E scenarios (135 steps) using Selenium WebDriver
- **Test Isolation**: Fresh test data created and cleaned up for each test run
- **Parallel Testing**: Tests can run in parallel for faster feedback

**Test Execution Options:**
- Full test suite: `node test-runner.js --env=local`
- Backend only: `cd backend && npm test`
- Frontend only: `cd frontend && npm test`
- Specific test modes: headed, debug, comprehensive testing available

**Test Data Management:**
- Default test accounts created on system startup
- Dynamic test users created and cleaned up during E2E tests
- Database can be reset to clean state between test runs

*For detailed testing information, see: [Testing Commands](../testing/test-commands.md) | [Backend Testing](../testing/backend-testing.md) | [Frontend Testing](../testing/frontend-testing.md)*

### 4. Deployment Flow
**Local to AWS Development Deployment:**
1. **Setup**: Configure AWS permissions and GitHub integration (one-time)
2. **Deploy**: Run `./dev-deploy.sh` to create full AWS environment
3. **Cost Management**: Use idle/active scripts to control monthly costs (£0.53 idle / £17.85 active)
4. **Updates**: Deploy code changes with `./dev-update.sh`
5. **Monitoring**: Health checks, logging, and automated alerting
6. **Emergency**: Complete teardown available with `./dev-teardown.sh`

**Production Deployment:**
- Blue/Green deployment strategy for zero-downtime updates
- Pre-production checklist ensures all tests pass and security review complete
- Traffic gradually shifted from old to new version with monitoring
- Automated rollback procedures for quick recovery if needed

**Key Deployment Scripts:**
- `./setup-aws-permissions.sh` - Configure AWS and GitHub integration
- `./dev-deploy.sh EMAIL` - Deploy full development environment
- `./dev-idle.sh` / `./dev-active.sh` - Cost management scaling
- `./dev-status.sh` - Check current deployment status

*For detailed deployment guides, see: [Deployment Overview](../deployment/) | [Cost Guide](../deployment/cost-guide.md) | [Blue-Green Strategy](../deployment/blue-green-strategy.md)*

### 5. Error Handling & Recovery
**Common Recovery Scenarios:**
- **Database Issues**: Automatic connection retry with exponential backoff
- **Authentication Problems**: Token expiration handling with automatic login redirect
- **Test Failures**: Screenshot capture and detailed logging for debugging
- **AWS Service Issues**: Auto-scaling and load balancer health checks
- **Cost Overruns**: Automated alerts and emergency scaling procedures

**Monitoring & Alerting:**
- CloudWatch dashboards for system health monitoring
- Automated alerts for service failures and cost spikes
- Daily backups and performance insights
- On-call procedures for production issues

*For detailed troubleshooting, see: [Troubleshooting Guide](../troubleshooting/) | [Common Issues](../troubleshooting/common-issues.md)*

---

## 📚 Next Steps

Once you have the local environment running:

1. **Explore the Code**: Familiarize yourself with the codebase structure
2. **Add Features**: Start implementing additional functionality
3. **Database Schema**: Extend the database schema as needed
4. **API Endpoints**: Add new API endpoints for your features
5. **Frontend Components**: Build new UI components and pages

The system is designed to be easily extensible with proper separation of concerns between the frontend, backend, and database layers.