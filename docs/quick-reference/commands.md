# Quick Reference - Commands

> **Navigation**: [Documentation Index](../index.md) | [Costs](costs.md) | [Troubleshooting](troubleshooting.md)

All essential commands for the Party Collection application in one place.

## 🏠 Local Development Commands

### Environment Management
```bash
# Start everything (database, backend, frontend)
cd infra/local/scripts && ./start-local.sh

# Stop everything
./stop-local.sh

# Clean restart (reset database)
./stop-local.sh --clean && ./start-local.sh

# Check status
docker ps
curl http://localhost:3001/health
```

### Individual Component Commands
```bash
# Backend only (requires database running)
cd backend && npm run dev

# Frontend only (requires backend running)
cd frontend && npm run dev

# Database only
cd infra/local/docker && docker-compose up -d postgres
```

### Testing Commands
```bash
# Run all tests (28 total)
node test-runner.js --env=local

# Backend tests only (13 API tests)
cd backend && npm test

# Frontend tests only (15 E2E scenarios)
cd frontend && npm test

# Specific test suites by tags
HEADLESS=true PARALLEL=false TAGS="@fast" npm test      # Fast tests (recommended)
HEADLESS=true PARALLEL=false TAGS="@admin" npm test     # Admin functionality
HEADLESS=true PARALLEL=false TAGS="@auth" npm test      # Authentication flows
HEADLESS=true PARALLEL=false TAGS="@survey" npm test    # Survey functionality
HEADLESS=false DEBUG=true PARALLEL=false TAGS="@tagname" npm test  # Debug mode
```

---

## ☁️ AWS Development Commands

### Environment Management
```bash
cd infra/remote/tests

# Deploy development environment
./dev-deploy.sh your-email@example.com

# Check current status and costs
./dev-status.sh

# Scale to active (£17.85/month)
./dev-active.sh

# Scale to idle (£0.53/month)
./dev-idle.sh

# Update code deployment
./dev-update.sh

# Complete teardown (£0/month)
./dev-teardown.sh
```

### Production Scaling (Event-Based)
```bash
cd infra/remote/tests

# Scale production for events (£150-250/month)
./prod-active.sh

# Scale production to idle (£6-28/month) 
./prod-idle.sh

# Manual ECS scaling
aws ecs update-service \
  --cluster party-collection-prod-cluster \
  --service party-collection-prod-backend \
  --desired-count 2 \
  --region eu-west-2
```

### AWS Permissions & Setup
```bash
cd infra/remote

# Setup AWS permissions (one-time)
./setup-aws-permissions.sh YOUR_GITHUB_USERNAME/YOUR_REPO_NAME

# Validate permissions
./validate-aws-permissions.sh

# Check AWS credentials
aws sts get-caller-identity
```

### AWS Resource Checks
```bash
# Check running ECS tasks
aws ecs list-tasks --cluster party-collection-dev-cluster

# Check Aurora database status
aws rds describe-db-clusters --db-cluster-identifier party-collection-dev-aurora

# Check CloudFormation stack
aws cloudformation describe-stacks --stack-name party-collection-dev-minimal

# Check costs
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-31 --granularity MONTHLY --metrics BlendedCost
```

---

## 📊 Database Commands

### Local PostgreSQL
```bash
# Connect to database
docker exec -it yourpartycollection-postgres psql -U postgres -d party_collection

# Backup database
docker exec yourpartycollection-postgres pg_dump -U postgres party_collection > backup.sql

# Restore database
cat backup.sql | docker exec -i yourpartycollection-postgres psql -U postgres -d party_collection

# Check database status
docker exec yourpartycollection-postgres pg_isready -U postgres
```

### Common SQL Queries
```sql
-- Check users
SELECT email, role FROM users;

-- Reset admin password
UPDATE users SET password_hash = crypt('AdminTest123@', gen_salt('bf')) WHERE email = 'admin@example.com';

-- Check database size
SELECT pg_database_size('party_collection') / 1024 / 1024 AS size_mb;

-- Show running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
```

### AWS Database Commands
```bash
# Connect to Aurora (requires VPN/bastion)
# Get connection details first:
aws rds describe-db-clusters --db-cluster-identifier party-collection-dev-aurora

# Create database snapshot
aws rds create-db-cluster-snapshot \
  --db-cluster-identifier party-collection-dev-aurora \
  --db-cluster-snapshot-identifier party-collection-manual-snapshot-$(date +%Y%m%d)
```

---

## 🧪 Testing & Debugging Commands

### Test Execution
```bash
# Quick smoke tests
node test-runner.js --env=local --suite=smoke

# Run with coverage
node test-runner.js --env=local --coverage

# Test specific component
cd backend && npm test -- --testNamePattern="auth"
cd frontend && HEADLESS=true PARALLEL=false TAGS="@admin" npm test

# Run tests against remote environment
node test-runner.js --env=dev  # Requires AWS environment running
```

### Debugging Commands
```bash
# View logs
tail -f infra/local/.pids/backend.log
tail -f infra/local/.pids/frontend.log

# Docker container logs
docker logs yourpartycollection-postgres
docker logs yourpartycollection-pgadmin

# Debug Node.js processes
ps aux | grep node
netstat -an | grep :300  # Check port usage

# Debug E2E tests
HEADLESS=false DEBUG=true PARALLEL=false TAGS="@tagname" npm test
```

### Performance Testing
```bash
# Backend API performance
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3001/health"

# Load testing with Apache Bench
ab -n 100 -c 10 http://localhost:3001/health

# Frontend performance audit
lighthouse http://localhost:3000 --output html
```

---

## 🔧 Development Workflow Commands

### Git Workflow
```bash
# Standard development flow
git checkout -b feature/new-feature
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Pre-commit testing
node test-runner.js --env=local --quick

# Check branch status
git status
git branch -v
```

### Package Management
```bash
# Install dependencies
npm install                    # Root level
cd backend && npm install     # Backend
cd frontend && npm install    # Frontend

# Update dependencies
npm update
npm audit fix

# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Code Quality
```bash
# Linting
cd backend && npm run lint
cd frontend && npm run lint

# Type checking
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# Format code
cd frontend && npm run format
```

---

## 🚀 Production Commands

### Event-Based Production Scaling
*For local party organizations - scale production up only during events/campaigns*

```bash
cd infra/remote/tests

# Before party events/campaigns
./prod-active.sh                    # £6-28 → £150-250/month
# Monitor volunteer activity and auto-scaling

# After events (scale back down)  
./prod-idle.sh                      # £150-250 → £6-28/month
# Preserves all volunteer data, minimal costs
```

### Blue/Green Deployment
```bash
# Deploy to inactive environment
./deploy-to-green.sh

# Test inactive environment
./test-green-environment.sh

# Switch traffic to new version
./switch-traffic-to-green.sh

# Monitor deployment
./monitor-deployment.sh

# Rollback if needed
./switch-traffic-to-blue.sh
```

### Production Monitoring
```bash
# Check production health
curl https://your-domain.com/health

# Check ECS service status
aws ecs describe-services --cluster party-collection-prod-cluster \
  --services party-collection-prod-backend-service

# Check auto-scaling
aws application-autoscaling describe-scalable-targets \
  --service-namespace ecs

# Monitor logs
aws logs tail /aws/ecs/party-collection-prod --follow
```

---

## 🛠️ System Maintenance Commands

### Docker Maintenance
```bash
# Clean up unused resources
docker system prune -f

# Remove unused volumes
docker volume prune -f

# Remove unused images
docker image prune -f

# Full cleanup (nuclear option)
docker system prune -a --volumes
```

### File System Cleanup
```bash
# Clean node_modules
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# Clean log files
rm -f infra/local/.pids/*.log

# Clean test artifacts
rm -f test-results.xml coverage/ lighthouse-results.json
```

### Security Updates
```bash
# Update npm dependencies for security
npm audit
npm audit fix

# Update Docker base images
docker pull node:18-alpine
docker pull postgres:14-alpine

# Update system packages (Ubuntu/Debian)
sudo apt update && sudo apt upgrade -y
```

---

## 🚨 Emergency Commands

### Immediate Actions
```bash
# Stop everything immediately
pkill -f node                    # Kill all Node processes
docker stop $(docker ps -q)      # Stop all containers
./dev-teardown.sh                # Shutdown AWS resources

# Check what's running
ps aux | grep node
docker ps
./dev-status.sh
```

### Recovery Commands
```bash
# Reset local environment completely
./stop-local.sh --clean
docker system prune -a --volumes
./start-local.sh

# Redeploy AWS from scratch
./dev-teardown.sh
# Wait 5 minutes for cleanup
./dev-deploy.sh your-email@example.com

# Emergency database restore
docker exec yourpartycollection-postgres pg_restore -U postgres -d party_collection /path/to/backup.sql
```

### Diagnostic Commands
```bash
# System health check
echo "=== Docker Status ===" && docker ps
echo "=== Port Usage ===" && netstat -an | grep LISTEN
echo "=== Node Processes ===" && ps aux | grep node
echo "=== Disk Space ===" && df -h
echo "=== Memory Usage ===" && free -m

# Network diagnostics
ping google.com
curl -I http://localhost:3001/health
nslookup your-domain.com
```

---

## 📱 Mobile/Cross-Platform Commands

### React Native (if applicable)
```bash
# iOS development
cd mobile && npx react-native run-ios

# Android development
cd mobile && npx react-native run-android

# Metro bundler
npx react-native start
```

### PWA Testing
```bash
# Test PWA features
lighthouse http://localhost:3000 --view

# Test offline functionality
# Chrome DevTools > Application > Service Workers > Offline

# Generate PWA manifest
npm run build:pwa
```

---

## ⚙️ Configuration Commands

### Environment Variables
```bash
# Check current environment
echo $NODE_ENV
echo $DATABASE_URL
printenv | grep PARTY_COLLECTION

# Set environment variables
export NODE_ENV=development
export DEBUG=*

# Load from .env file
source .env
```

### SSL/TLS (Production)
```bash
# Generate SSL certificate
certbot --nginx -d your-domain.com

# Check certificate expiry
openssl x509 -in cert.pem -text -noout | grep "Not After"

# Renew certificate
certbot renew --dry-run
```

---

## 📋 Command Cheat Sheet Summary

| Task | Command | Time |
|------|---------|------|
| **Start local dev** | `cd infra/local/scripts && ./start-local.sh` | 2 min |
| **Run all tests** | `node test-runner.js --env=local` | 5 min |
| **Deploy AWS dev** | `cd infra/remote/tests && ./dev-deploy.sh EMAIL` | 8 min |
| **Scale to idle** | `./dev-idle.sh` | 30 sec |
| **Check status** | `./dev-status.sh` | 5 sec |
| **Emergency stop** | `./dev-teardown.sh` | 2 min |
| **Reset local** | `./stop-local.sh --clean && ./start-local.sh` | 3 min |

---

**💡 Pro Tips:**
- Use `history | grep command` to find previously used commands
- Create aliases for frequently used commands in your shell
- Use `ctrl+r` to search command history
- Set up shell completion for better command discovery