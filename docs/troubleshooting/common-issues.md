# Common Issues & Solutions

> **Navigation**: [Documentation Index](../index.md) | [Environment Control](environment-control.md) | [Remote Management](remote-management.md)

Frequently encountered issues and their solutions for the Party Collection application.

## 🚨 Emergency Quick Fixes

### System Won't Start
```bash
# Stop everything and restart clean
cd infra/local/scripts
./stop-local.sh --clean
./start-local.sh

# Check if containers are running
docker ps
```

### High AWS Costs
```bash
# Immediate cost reduction
cd infra/remote/tests
./dev-idle.sh     # Scale to £0.53/month
./dev-teardown.sh # Complete shutdown (£0/month)
```

### Database Connection Failed
```bash
# Reset database container
cd infra/local/docker
docker-compose restart postgres
# Wait 30 seconds, then test connection
```

---

## 🏠 Local Development Issues

### Docker Issues

**Problem**: `Docker daemon is not running`
```bash
# Solution: Start Docker Desktop
# macOS: Open Docker Desktop application
# Windows: Start Docker Desktop from Start menu
# Linux: sudo systemctl start docker
```

**Problem**: `Port already in use (3000, 3001, 5432)`
```bash
# Find what's using the ports
lsof -i :3000
lsof -i :3001
lsof -i :5432

# Kill processes or change ports in .env files
kill -9 <PID>
```

**Problem**: `Database connection refused`
```bash
# Check if PostgreSQL container is running
docker ps | grep postgres

# Restart database container
cd infra/local/docker
docker-compose restart postgres

# Check logs for errors
docker-compose logs postgres
```

### Node.js Issues

**Problem**: `Module not found` errors
```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# For both frontend and backend
cd backend && rm -rf node_modules && npm install
cd frontend && rm -rf node_modules && npm install
```

**Problem**: `Permission denied` on scripts
```bash
# Make scripts executable
chmod +x infra/local/scripts/*.sh
chmod +x infra/remote/tests/*.sh
```

**Problem**: TypeScript compilation errors
```bash
# Clean build cache
cd backend && rm -rf dist
cd frontend && rm -rf .next

# Restart with fresh builds
npm run dev
```

---

## ☁️ AWS Deployment Issues

### Permissions & Access

**Problem**: `Access Denied` errors
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Re-run permissions setup
cd infra/remote
./setup-aws-permissions.sh YOUR_GITHUB_USERNAME/YOUR_REPO_NAME
```

**Problem**: `Stack does not exist`
```bash
# Check if stack was created successfully
aws cloudformation describe-stacks --stack-name party-collection-dev-minimal

# If missing, redeploy
cd tests
./dev-deploy.sh your-email@example.com
```

**Problem**: `CloudFormation rollback`
```bash
# Check why deployment failed
aws cloudformation describe-stack-events --stack-name party-collection-dev-minimal

# Common fixes:
# 1. Check stack name uniqueness
# 2. Verify IAM permissions
# 3. Check resource limits in region
```

### Cost & Billing

**Problem**: Unexpected high costs
```bash
# Immediate actions:
./dev-idle.sh      # Scale down to minimum
./dev-status.sh    # Check current resources

# Check what's running
aws ecs list-tasks --cluster party-collection-dev-cluster
aws rds describe-db-clusters --db-cluster-identifier party-collection-dev-aurora
```

**Problem**: Aurora won't auto-pause
```bash
# Aurora v1 should auto-pause after 5 minutes idle
# Check cluster status:
aws rds describe-db-clusters --db-cluster-identifier party-collection-dev-aurora

# If still running after 10 minutes, check for connections:
# Look for active connections in database
```

---

## 🧪 Testing Issues

### Backend API Tests

**Problem**: Tests fail with `ECONNREFUSED`
```bash
# Ensure backend is running
cd backend && npm run dev

# Check if database is accessible
docker exec yourpartycollection-postgres pg_isready -U postgres

# Run tests with debug
cd backend && DEBUG=* npm test
```

**Problem**: Authentication tests fail
```bash
# Check if test users exist in database
cd infra/local/docker
docker-compose exec postgres psql -U postgres -d party_collection -c "SELECT email FROM users;"

# Reset database with fresh test data
cd infra/local/scripts
./stop-local.sh --clean
./start-local.sh
```

### Frontend E2E Tests

**Problem**: `ChromeDriver` errors
```bash
# Update ChromeDriver to match Chrome version
npm install chromedriver@latest

# Check Chrome and ChromeDriver version compatibility
google-chrome --version
chromedriver --version
```

**Problem**: Tests timeout waiting for elements
```bash
# The refactored test architecture includes environment-aware timeouts
# CI environments automatically get 1.5x multiplier
# Parallel execution gets additional 1.3x multiplier

# Run in headed mode to debug
HEADLESS=false DEBUG=true PARALLEL=false TAGS="@login" npm test

# For slow environments, force longer timeouts
CI=true PARALLEL=true npm test  # Gets 1.95x timeout multiplier
```

**Problem**: Test tag filtering not working as expected
```bash
# ⚠️ IMPORTANT: Custom test runner does NOT support --name parameter
# Using npm test -- --name "scenario name" will run ALL tests, not filtered

# CORRECT way to run specific tests - use TAGS environment variable:
TAGS="@login" npm test           # Run login tests
TAGS="@auth" npm test            # Run authentication tests  
TAGS="@smoke" npm test           # Run smoke tests
TAGS="@comprehensive" npm test   # Run comprehensive tests
TAGS="@password-change" npm test # Run password change tests

# Available test tags:
# @login, @auth, @password-change, @survey, @form-components
# @smoke, @comprehensive, @quick, @parallel-safe
```

**Problem**: "CommonSteps already initialized" warnings
```bash
# This is informational only - not an error
# The refactored architecture prevents double initialization automatically
# Warnings indicate the protection is working correctly

# To see initialization flow for debugging:
DEBUG=true npm test
# Look for: "🔧 Initializing CommonSteps for scenario: [scenario-name]"
```

**Problem**: "invalid session id" or WebDriver session errors
```bash
# The refactored WebDriverFactory handles session conflicts automatically
# Ensure proper cleanup in test hooks

# For debugging WebDriver issues:
HEADLESS=false DEBUG=true PARALLEL=false npm test

# Check for driver leaks - should see proper cleanup messages:
# "ℹ️ WebDriver session was already closed" (normal)
# "⚠️ Warning during WebDriver cleanup: [error]" (investigate)
```

**Problem**: Selector not found despite element being visible
```bash
# The refactored architecture uses fallback selector strategies
# Monitor which selectors work in logs:
# "✅ Found element with selector 1/3: input[type="email"] (250ms)"

# If elements still not found, the architecture tries:
# 1. Generic selectors (most reliable)
# 2. Specific selectors (fallback)  
# 3. Fuzzy selectors (last resort)

# For debugging selector issues:
HEADLESS=false DEBUG=true npm test
# Inspect the page manually to verify selectors exist
```

**Problem**: Tests flaky or intermittently failing
```bash
# The refactored architecture includes smart retry logic
# Check logs for retry attempts:
# "⚠️ Operation failed on attempt 1/3: [error]"
# "✅ Operation succeeded on attempt 2/3"

# For persistent flakiness, verify environment detection:
echo "CI: $CI"           # Should be 'true' in CI environments
echo "PARALLEL: $PARALLEL" # Should be 'true' for parallel execution

# Manual timeout override for problematic tests:
# (Not typically needed with environment-aware scaling)
```

**Problem**: Memory issues or degraded performance
```bash
# Check for WebDriver session leaks
# Proper cleanup should show these messages:
# "ℹ️ WebDriver session was already closed"

# For memory debugging, run single scenario:
TAGS="@login" PARALLEL=false npm test

# Monitor resource usage during test execution
# Multiple concurrent drivers may indicate cleanup issues
```

---

## 🔧 Development Environment Issues

### Environment Variables

**Problem**: Missing or incorrect environment variables
```bash
# Check if .env files exist
ls -la backend/.env
ls -la frontend/.env.test

# Copy from examples if missing
cp backend/.env.example backend/.env
cp frontend/.env.test.example frontend/.env.test

# Verify variables are loaded
cd backend && node -e "console.log(process.env.DB_HOST)"
```

**Problem**: Environment mismatch between components
```bash
# Ensure all components use consistent settings
# Backend should match database settings
# Frontend should point to correct backend URL

# Common mismatches:
# - Backend DB_HOST vs PostgreSQL container name
# - Frontend API_URL vs Backend PORT
# - Test environment vs development environment
```

### File Permissions

**Problem**: Permission denied on files/directories
```bash
# Fix ownership (Linux/macOS)
sudo chown -R $USER:$USER .

# Fix script permissions
find . -name "*.sh" -exec chmod +x {} \;

# Fix Docker volume permissions
docker-compose down
sudo chown -R $USER:$USER infra/local/docker/volumes
```

---

## 🔍 Diagnostic Commands

### Health Checks
```bash
# Complete system health check
echo "=== Docker Status ==="
docker ps

echo "=== Backend Health ==="
curl http://localhost:3001/health

echo "=== Frontend Status ==="
curl http://localhost:3000

echo "=== Database Status ==="
docker exec yourpartycollection-postgres pg_isready -U postgres
```

### Log Analysis
```bash
# View all logs
cd infra/local/scripts
tail -f ../.pids/backend.log
tail -f ../.pids/frontend.log

# Docker container logs
docker logs yourpartycollection-postgres
docker logs yourpartycollection-pgadmin
```

### AWS Resource Check
```bash
# Check what's running and costing money
aws ecs list-tasks --cluster party-collection-dev-cluster
aws rds describe-db-clusters --query 'DBClusters[].Status'
aws elbv2 describe-load-balancers --query 'LoadBalancers[].LoadBalancerArn'

# Check costs
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-31 --granularity MONTHLY --metrics BlendedCost
```

---

## 🆘 When All Else Fails

### Nuclear Reset Options

**Local Environment - Complete Reset**
```bash
# Stop everything
cd infra/local/scripts
./stop-local.sh

# Remove all containers and volumes
docker system prune -a --volumes

# Remove all generated files
rm -rf backend/node_modules backend/dist
rm -rf frontend/node_modules frontend/.next
rm -rf infra/local/docker/volumes

# Start fresh
./start-local.sh
```

**AWS Environment - Complete Reset**
```bash
# Warning: This will delete everything in AWS
cd infra/remote/tests
./dev-teardown.sh

# Wait for complete deletion (5-10 minutes)
aws cloudformation wait stack-delete-complete --stack-name party-collection-dev-minimal

# Redeploy from scratch
./dev-deploy.sh your-email@example.com
```

---

## 📞 Getting Help

### Before Asking for Help
1. **Check this document** for your specific error
2. **Check logs** for detailed error messages
3. **Try the nuclear reset** for your environment
4. **Verify prerequisites** (Docker, Node.js, AWS CLI versions)

### Information to Include When Asking for Help
```bash
# System information
uname -a                    # Operating system
docker --version           # Docker version
node --version             # Node.js version
npm --version              # npm version
aws --version              # AWS CLI version

# Current state
docker ps                  # Running containers
git status                 # Git repository state
cd infra/remote/tests && ./dev-status.sh  # AWS resources
```

### Support Resources
- **[Environment Control Guide](environment-control.md)** - Infrastructure management
- **[Remote Management Guide](remote-management.md)** - AWS operations
- **[Quick Reference](../quick-reference/)** - Command cheat sheets
- **[System Architecture](../infrastructure/stack-structure.md)** - How components interact
- **[Cost Guide](../deployment/cost-guide.md)** - Cost optimization strategies

---

**💡 Pro Tip**: Most issues are resolved by restarting the affected component. When in doubt, try a clean restart before diving into complex debugging!