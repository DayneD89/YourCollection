# Test Commands Reference

## 📋 What You Need to Know

**⏱️ Time needed**: 2-15 minutes (depending on test scope)  
**🎓 Skill level**: Beginner-friendly  
**💻 Prerequisites**: 
- Application running (local or AWS)
- Node.js environment set up

**🎯 You'll complete**: Verification that your system works with:
- ✅ 13 backend API tests (authentication, user management, data)
- ✅ 15 frontend E2E tests (135 steps total)
- ✅ Cross-environment testing (local, dev, production)
- ✅ Performance and security validation

> 💡 **TL;DR**: Run `cd test && node runner.js --env=local` for complete test suite in 2 minutes. All 28 tests should pass, confirming your volunteer management system works correctly.

Complete reference for all testing commands across environments.

## 🎯 Quick Reference

```bash
# Run all tests against local environment
cd test && node runner.js --env=local

# Generate test report with interactive dashboard
cd test && npm run report

# Run all tests against AWS dev environment  
cd test && node runner.js --env=dev

# Run all tests against production (with confirmation)
cd test && node runner.js --env=prod
```

### 📊 Test Reporting
```bash
cd test && npm run report        # Generate local test report with dashboard
cd test && npm run report:dev    # Generate dev environment report  
cd test && npm run report:prod   # Generate prod environment report
```

Reports are saved to `test/reports/local/latest/index.html` and git-ignored for local viewing.

---

## 🧪 Multi-Environment Testing

### Local Environment (Default)
```bash
# Comprehensive testing (backend + E2E)
cd test && node runner.js --env=local

# Backend API tests only
cd backend && npm test

# Frontend E2E tests only
cd test && npm test
```

### AWS Development Environment
```bash
# Requires active AWS dev environment
cd infra/remote/tests && ./dev-active.sh

# Run tests against live AWS deployment
cd test && node runner.js --env=dev

# Scale back to save costs when done
cd infra/remote/tests && ./dev-idle.sh
```

### Production Environment
```bash
# Production testing (requires confirmation)
cd test && node runner.js --env=prod
# Will prompt: "Are you sure you want to test against production?"
```

---

## 🔧 Backend API Tests (13 Tests)

### Run All Backend Tests
```bash
cd backend
npm test
```

### Test Categories
```bash
# Authentication tests
cd test && TAGS="@auth" npm test

# User management tests  
cd test && TAGS="@admin" npm test

# Password validation tests
cd test && TAGS="@password" npm test

# Backend API tests
cd test && TAGS="@backend" npm test
```

### Backend Test Scenarios
- **Authentication**: Login, registration, JWT tokens
- **User Management**: CRUD operations, role validation
- **Password Security**: Strength validation, hashing verification
- **Admin Functions**: User creation, deletion, password resets
- **API Security**: Unauthorized access protection
- **Health Monitoring**: Service health endpoint testing

**→ [Backend Testing Details](backend-testing.md)**

---

## 🌐 Frontend E2E Tests (15 Scenarios)

### Run All E2E Tests
```bash
cd test

# Standard headless testing
npm test

# With visible browser (for debugging)
HEADLESS=false npm test

# Debug mode with console output
DEBUG=true npm test

# Full system integration tests
node runner.js --env=local
```

### Test by Feature Tags
```bash
# Change to test directory first
cd test

# Fast tests (recommended for development)
HEADLESS=true PARALLEL=false TAGS="@fast" npm test

# Backend API tests via E2E framework
HEADLESS=true PARALLEL=false TAGS="@backend" npm test
HEADLESS=true PARALLEL=false TAGS="@backend and @fast" npm test
HEADLESS=true PARALLEL=false TAGS="@backend and @auth" npm test
HEADLESS=true PARALLEL=false TAGS="@backend and @admin" npm test

# Admin functionality  
HEADLESS=true PARALLEL=false TAGS="@admin" npm test
HEADLESS=true PARALLEL=false TAGS="@admin-comprehensive" npm test
HEADLESS=true PARALLEL=false TAGS="@user-creation" npm test

# Authentication flows
HEADLESS=true PARALLEL=false TAGS="@auth" npm test
HEADLESS=true PARALLEL=false TAGS="@auth-login" npm test
HEADLESS=true PARALLEL=false TAGS="@auth-session" npm test
HEADLESS=true PARALLEL=false TAGS="@auth-context" npm test

# Survey functionality
HEADLESS=true PARALLEL=false TAGS="@survey" npm test
HEADLESS=true PARALLEL=false TAGS="@survey-comprehensive" npm test
HEADLESS=true PARALLEL=false TAGS="@form-load" npm test

# Form components
HEADLESS=true PARALLEL=false TAGS="@form-components" npm test
HEADLESS=true PARALLEL=false TAGS="@accessibility" npm test
HEADLESS=true PARALLEL=false TAGS="@validation" npm test
```

### E2E Test Scenarios
- **Backend API Tests**: Authentication, user management, password validation, form functionality (12 feature files)
- **Authentication Flow**: Login, logout, registration (3 scenarios)
- **User Dashboard**: Protected access, user interface (2 scenarios)  
- **Admin Functions**: User management, creation, deletion (4 scenarios)
- **Password Management**: Changes, validations, security (3 scenarios)
- **Navigation & UI**: Responsive design, PWA features (3 scenarios)

**→ [E2E Testing Details](frontend-testing.md)**

---

## 🔄 Test Data Management

### Default Test Users
The system creates this user automatically:

```bash
# Created automatically by start-local.sh
Admin: admin@example.com / AdminTest123@

# Additional test users are created dynamically during test execution
```

### Test Data Reset
```bash
# Reset local database to clean state
cd infra/local/scripts
./reset-db.sh

# This recreates default users and cleans all test data
```

### Environment Variables for Testing
```bash
# Backend testing (.env file)
DB_HOST=localhost
DB_PORT=5432
NODE_ENV=test

# Frontend E2E testing (.env.test file)  
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=AdminTest123@
NEXT_PUBLIC_API_URL=http://localhost:3001
TEST_CLEANUP_USERS=true
```

**→ [Backend Testing](backend-testing.md)** - Test data and setup details

---

## 🚀 Performance and Load Testing

### Basic Performance Tests
```bash
# Backend API performance
cd backend
npm run test:performance  # If available

# Frontend load time testing
cd frontend  
npm run test:lighthouse  # If available
```

### Manual Performance Testing
```bash
# Backend API response times
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3001/api/users"

# Load testing with ab (Apache Bench)
ab -n 100 -c 10 http://localhost:3001/health
```

**→ [Frontend Testing](frontend-testing.md)** - E2E performance testing

---

## 🔍 Debugging Tests

### Backend Test Debugging
```bash
# Run tests with debug output
cd backend
DEBUG=* npm test

# Test specific functionality in isolation
cd test
TAGS="@auth" npm test
```

### Frontend E2E Test Debugging
```bash
cd test

# Debug mode with browser visible
HEADLESS=false DEBUG=true PARALLEL=false TAGS="@tagname" npm test

# Run specific test file
HEADLESS=true PARALLEL=false npm test -- features/admin-create-user.feature

# Run specific scenario by name
HEADLESS=true PARALLEL=false npm test -- --name "Admin can create a basic user"

# Take screenshots on failure
SCREENSHOT_ON_FAILURE=true npm test
```

### Common Debug Techniques
- **Browser DevTools**: Available in headed mode
- **Console Logging**: Available in debug mode  
- **Screenshots**: Automatically taken on test failures
- **Video Recording**: Can be enabled for full test runs

**→ [Infrastructure Validation](../infrastructure/validation.md)** - System verification

---

## 📊 Test Reports and Coverage

### Test Output Formats
```bash
# JSON report output
cd test && node runner.js --env=local --format=json > test-results.json

# Detailed console output
cd test && node runner.js --env=local --verbose

# Summary only
cd test && node runner.js --env=local --quiet
```

### Coverage Analysis
```bash
# Backend test coverage
cd backend  
npm run test:coverage  # If available

# Frontend coverage  
cd frontend
npm run test:coverage  # If available
```

**→ [Cost Guide](../deployment/cost-guide.md)** - Test environment costs

---

## ⚠️ Test Environment Requirements

### Local Testing Requirements
- Docker and Docker Compose installed
- PostgreSQL container running
- Backend and frontend services started
- Node.js 18+ installed

### AWS Testing Requirements  
- AWS CLI configured
- Active AWS development environment
- Valid AWS credentials
- Network access to deployed services

### CI/CD Testing Requirements
- GitHub Actions secrets configured
- OIDC provider set up in AWS
- Docker buildx available for ARM64 builds

**→ [Security Testing](../infrastructure/security.md)** - Security validation

---

## 🔗 Related Documentation

- **[Backend Testing](backend-testing.md)** - Complete API testing strategy
- **[Frontend Testing](frontend-testing.md)** - E2E testing details
- **[Performance Testing](performance-testing.md)** - Load testing and performance benchmarks
- **[GitHub Actions](../workflows/github-actions-overview.md)** - CI/CD automation
- **[Infrastructure Validation](../infrastructure/validation.md)** - System verification
- **[Security Testing](../infrastructure/security.md)** - Security validation