# 🚀 Party Collection - Complete Setup & Testing Guide

This guide will take you from zero to fully running Party Collection application with all tests passing.

## 📋 Prerequisites

- **Node.js** v18+ (Tested with v23.11.0)
- **Docker & Docker Compose** for PostgreSQL database
- **Git** for cloning the repository

## 🏁 Quick Start (TL;DR)

```bash
# Clone and setup
git clone https://github.com/yourrepo/party-collection.git
cd yourpartycollection/infra/local
bash scripts/start-local.sh

# Run all tests
cd test
node runner.js --env=local
```

## 📁 Repository Structure

```
party-collection/
├── backend/             # Node.js/TypeScript API server
├── frontend/            # Next.js React PWA
├── test/                # All tests (backend + frontend E2E)
├── infra/               # Infrastructure & Docker setup
└── docs/                # Documentation
```

## 🔧 Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd party-collection
```

### 2. Start the Infrastructure

Navigate to the infrastructure directory and start all services:

```bash
cd infra/local
bash scripts/start-local.sh
```

**What this does:**
- Starts PostgreSQL database in Docker
- Starts PgAdmin for database management
- Launches backend API server (Node.js/TypeScript)
- Launches frontend PWA (Next.js/React)

**Expected output:**
```
🎉 Local development environment is ready!

🌐 Application URLs:
  Frontend PWA: http://localhost:3000
  Backend API: http://localhost:3001
  PgAdmin: http://localhost:8080
```

### 3. Verify System is Running

Check that all services are healthy:

```bash
# Check backend health
curl http://localhost:3001/health

# Check frontend (should return HTML)
curl http://localhost:3000
```

## 🧪 Testing Guide

### NPM Test Commands Summary

The application provides convenient npm test commands across all components:

| Command | Location | Purpose |
|---------|----------|---------|
| `npm test` | `backend/` | Run backend API tests |
| `npm test` | `test/` | Run frontend E2E tests |
| `node runner.js --env=local` | `test/` | Run full system validation |

### Test Categories

The application has **4 types of tests**:

1. **Backend API Tests** - Test all API endpoints and database operations
2. **Frontend E2E Tests** - Test complete user workflows in the browser
3. **Comprehensive Tests** - Full system validation (restart + backend + frontend)
4. **Individual Test Suites** - Run specific test categories

### 🔧 Backend Tests

**Test:** API endpoints, authentication, user management, password validation

```bash
cd backend
npm test
```

**Expected Result:**
```
✅ 🎉 All tests passed! Backend is working correctly.
Total Tests: 13
✅ Passed: 13
Duration: 0.12s
```

**Tests Include:**
- ✅ Admin authentication
- ✅ User creation with password strength validation
- ✅ Password change functionality
- ✅ Admin-only operations (user management)
- ✅ Token verification and security

### 🌐 Frontend E2E Tests

**Test:** Complete user workflows, login, admin functions, password management

```bash
cd test

# Standard test command (all tests)
npm test

# Fast tests (recommended for development) - 15 scenarios, ~3 minutes, 100% pass rate
HEADLESS=true PARALLEL=false TAGS="@fast" npm test

# Specific test categories
HEADLESS=true PARALLEL=false TAGS="@admin" npm test           # Admin functionality
HEADLESS=true PARALLEL=false TAGS="@auth" npm test            # Authentication flows  
HEADLESS=true PARALLEL=false TAGS="@survey" npm test          # Survey functionality
HEADLESS=true PARALLEL=false TAGS="@form-components" npm test # Form components

# Debug mode with visible browser
HEADLESS=false DEBUG=true PARALLEL=false TAGS="@tagname" npm test
```

**Expected Result:**
```
✅ All tests passed!
15 scenarios (15 passed)
135 steps (135 passed)
Duration: ~0.4s
```

**Test Scenarios:**
- ✅ **Admin User Management** (4 scenarios)
  - View all users in system
  - Create, edit, delete users
  - Reset user passwords
  - Complete user lifecycle testing
- ✅ **User Authentication** (11 scenarios)
  - Successful/failed login attempts
  - Password change validation
  - Security controls and error handling

### 🎯 Comprehensive Test Suite

**Test:** Complete system validation - infrastructure restart + all tests

```bash
cd test
node runner.js --env=local
```

**Expected Result:**
```
🎯 OVERALL RESULT: ✅ ALL TESTS PASSED
⏱️  Total Duration: ~12s

🔧 BACKEND TESTS: ✅ PASSED
🌐 FRONTEND TESTS: ✅ PASSED
```

**What it does:**
1. **🛑 Stops all services** (clean shutdown)
2. **🚀 Starts services fresh** (clean startup)
3. **⏳ Waits for readiness** (health checks)
4. **🔧 Runs backend tests** (API validation)
5. **🌐 Runs frontend E2E tests** (user workflow validation)
6. **📊 Generates comprehensive report**

## 🛑 System Management

### Stop the System

```bash
cd infra/local
bash scripts/stop-local.sh --clean
```

### Start the System

```bash
cd infra/local
bash scripts/start-local.sh
```

### Reset Database (if needed)

```bash
cd infra/local
bash scripts/reset-local.sh
```

## 👤 Test Accounts

The system includes pre-configured test accounts:

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| `user@example.com` | `UserPass123@` | User | Regular user testing |
| `admin@example.com` | `AdminTest123@` | Admin | Admin functionality testing |

## 🌐 Application URLs

Once started, access the application at:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend PWA** | http://localhost:3000 | Main application interface |
| **Backend API** | http://localhost:3001 | REST API endpoints |
| **PgAdmin** | http://localhost:8080 | Database management |

### Database Connection (PgAdmin)

- **Host:** `localhost`
- **Port:** `5432`
- **Database:** `party_collection`
- **Username:** `postgres`
- **Password:** `password`

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Check what's using the port
lsof -i :3000  # or :3001, :5432, :8080

# Kill the process
kill -9 <PID>

# Or restart with clean flag
bash scripts/stop-local.sh --clean
bash scripts/start-local.sh
```

#### 2. Docker Issues

```bash
# Reset Docker containers
docker-compose down --volumes
docker system prune -f

# Restart infrastructure
bash scripts/start-local.sh
```

#### 3. Database Connection Errors

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Reset database
bash scripts/reset-local.sh
```

#### 4. Tests Failing

```bash
# Run comprehensive test to diagnose
npm run test:comprehensive

# Check if services are healthy
curl http://localhost:3001/health
curl http://localhost:3000
```

### Debug Mode

Run tests with debug information:

```bash
# Frontend E2E with debug (visible browser)
HEADLESS=false DEBUG=true PARALLEL=false TAGS="@tagname" npm test

# Run specific test file
HEADLESS=true PARALLEL=false npm test -- features/admin-create-user.feature

# Run specific scenario by name
HEADLESS=true PARALLEL=false npm test -- --name "Admin can create a basic user"

# View detailed logs
tail -f infra/local/.pids/*.log
```

## 🔄 CI/CD Integration

For automated testing in CI/CD pipelines:

```bash
#!/bin/bash
# ci-test-script.sh

set -e  # Exit on any error

echo "🚀 Starting CI/CD test pipeline..."

# Start services
cd infra/local
bash scripts/start-local.sh

# Wait for services to be ready
sleep 10

# Run comprehensive tests
cd test
node runner.js --env=local

# Cleanup
cd ../infra/local
bash scripts/stop-local.sh --clean

echo "✅ All tests passed in CI/CD pipeline!"
```

## 📊 Test Coverage

| Component | Test Type | Coverage | Duration |
|-----------|-----------|----------|----------|
| **Backend API** | Unit/Integration | 13 tests | ~0.12s |
| **Frontend E2E** | End-to-End | 15 scenarios, 135 steps | ~0.4s |
| **System Integration** | Full Stack | Complete validation | ~12s |

## 🎯 Success Criteria

A successful setup should show:

✅ **All services started without errors**  
✅ **Backend tests: 13/13 passing**  
✅ **Frontend E2E tests: 15/15 scenarios passing**  
✅ **Comprehensive test: ALL TESTS PASSED**  
✅ **Applications accessible at expected URLs**

## 🤝 Contributing

When adding new features:

1. **Add backend tests** in `backend/`
2. **Add E2E test scenarios** in `test/features/`
3. **Run comprehensive tests** before committing
4. **Ensure all tests pass** in both parallel and sequential modes

## 📞 Support

If you encounter issues:

1. Check this troubleshooting guide
2. Run the comprehensive test to identify the problem
3. Check service logs in `.pids/*.log`
4. Verify all prerequisites are installed

---

🎉 **Congratulations!** You now have a fully functional Party Collection application with comprehensive testing. The system is ready for development, testing, and deployment.