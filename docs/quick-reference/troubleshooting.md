# Quick Reference - Common Fixes

> **Navigation**: [Documentation Index](../index.md) | [Commands](commands.md) | [Costs](costs.md)

Essential troubleshooting commands and solutions for the most common Party Collection issues.

## 🚨 Emergency Quick Fixes

### Application Won't Start
```bash
# 1. Kill everything and restart
pkill -f node
docker stop $(docker ps -q)
cd infra/local/scripts && ./start-local.sh

# 2. Check if ports are blocked
netstat -an | grep :3000    # Frontend
netstat -an | grep :3001    # Backend  
netstat -an | grep :5432    # Database
```

### Can't Connect to Database
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart database container
cd infra/local/docker
docker-compose restart postgres

# Connect manually
docker exec -it yourpartycollection-postgres psql -U postgres -d party_collection
```

### Tests Failing Mysteriously
```bash
# Reset test environment
cd infra/local/scripts
./stop-local.sh --clean && ./start-local.sh

# Wait for services
sleep 30

# Run tests with fresh state
node test-runner.js --env=local
```

### AWS Costs Spiking
```bash
# Emergency cost control (immediate)
cd infra/remote/tests
./dev-idle.sh        # Scale to minimum
# OR
./dev-teardown.sh    # Complete shutdown

# Check what's running
./dev-status.sh
```

---

## 🔧 Common Issues & Instant Solutions

### "Port Already in Use" Errors

**Problem**: `Error: listen EADDRINUSE :::3000`
```bash
# Kill process on specific port
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Or kill all Node processes
pkill -f node

# Restart application
cd infra/local/scripts && ./start-local.sh
```

### Docker Container Issues

**Problem**: Containers not starting or crashing
```bash
# Check container status
docker ps -a

# View container logs
docker logs yourpartycollection-postgres
docker logs yourpartycollection-pgadmin

# Restart specific container
cd infra/local/docker
docker-compose restart postgres

# Nuclear option: Clean restart
docker-compose down
docker system prune -f
docker-compose up -d
```

### Database Connection Refused

**Problem**: `ECONNREFUSED 127.0.0.1:5432`
```bash
# Check if database is ready
docker exec yourpartycollection-postgres pg_isready -U postgres

# Wait for database to start
timeout 60 bash -c 'until docker exec yourpartycollection-postgres pg_isready -U postgres; do sleep 2; done'

# Check database logs
docker logs yourpartycollection-postgres | tail -20

# Restart database if needed
cd infra/local/docker && docker-compose restart postgres
```

### Authentication Problems

**Problem**: Login not working, JWT errors
```bash
# Reset admin password
docker exec yourpartycollection-postgres psql -U postgres -d party_collection -c \
  "UPDATE users SET password_hash = crypt('AdminTest123@', gen_salt('bf')) WHERE email = 'admin@example.com';"

# Check if users table exists
docker exec yourpartycollection-postgres psql -U postgres -d party_collection -c "SELECT email FROM users;"

# Recreate users if table is empty
cd backend && npm run dev
# Backend will automatically create the default admin user
```

### Frontend Not Loading

**Problem**: White screen, build errors, hot reload issues
```bash
# Clear Next.js cache
cd frontend
rm -rf .next
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Restart with clean cache
npm run dev

# If still broken, reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### E2E Tests Timing Out

**Problem**: Selenium tests hanging or failing on element waits
```bash
# Run tests in headed mode to see what's happening
cd frontend
HEADLESS=false npm run test:e2e:debug

# Increase timeouts for slow environments
TIMEOUT_MS=10000 npm test

# Check if services are ready
curl http://localhost:3001/health
curl http://localhost:3000

# Reset test environment
cd infra/local/scripts
./stop-local.sh --clean && ./start-local.sh
sleep 60  # Wait longer for services
```

### AWS Deployment Stuck

**Problem**: ECS tasks not starting, CloudFormation hanging
```bash
# Check ECS service status
cd infra/remote/tests
./dev-status.sh

# Check ECS task failures
aws ecs describe-services --cluster party-collection-dev-cluster --services party-collection-dev-backend-service

# Force service update
aws ecs update-service --cluster party-collection-dev-cluster --service party-collection-dev-backend-service --force-new-deployment

# Emergency reset
./dev-teardown.sh && ./dev-deploy.sh your-email@example.com
```

---

## 🩺 Health Check Commands

### Quick System Status
```bash
# One-liner health check
echo "Backend: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/health)" && \
echo "Frontend: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000)" && \
echo "Database: $(docker exec yourpartycollection-postgres pg_isready -U postgres | cut -d' ' -f3-)"
```

### Detailed Health Check
```bash
#!/bin/bash
# health-check.sh
echo "=== Party Collection Health Check ==="

# Check Docker
if docker ps >/dev/null 2>&1; then
  echo "✅ Docker is running"
else
  echo "❌ Docker is not running"
  exit 1
fi

# Check containers
if docker ps | grep -q yourpartycollection-postgres; then
  echo "✅ PostgreSQL container running"
else
  echo "❌ PostgreSQL container not found"
fi

# Check database connection
if docker exec yourpartycollection-postgres pg_isready -U postgres >/dev/null 2>&1; then
  echo "✅ Database is ready"
else
  echo "❌ Database connection failed"
fi

# Check backend
if curl -f -s http://localhost:3001/health >/dev/null; then
  echo "✅ Backend API responding"
else
  echo "❌ Backend API not responding"
fi

# Check frontend
if curl -f -s http://localhost:3000 >/dev/null; then
  echo "✅ Frontend responding"
else
  echo "❌ Frontend not responding"
fi

echo "=== Health check completed ==="
```

---

## 🔍 Log Analysis Commands

### View Recent Logs
```bash
# Backend logs (last 50 lines)
tail -50 infra/local/.pids/backend.log

# Frontend logs (last 50 lines) 
tail -50 infra/local/.pids/frontend.log

# Database logs
docker logs --tail 50 yourpartycollection-postgres

# Follow logs in real-time
tail -f infra/local/.pids/backend.log
```

### Find Specific Errors
```bash
# Search for errors in backend logs
grep -i error infra/local/.pids/backend.log | tail -10

# Search for database connection issues
grep -i "connect" infra/local/.pids/backend.log

# Check for authentication errors
grep -i "auth\|jwt\|token" infra/local/.pids/backend.log

# Find test failures
grep -i "fail\|error" test-results.xml
```

---

## 🗂️ File Permission Issues

### Fix Common Permission Problems
```bash
# Make scripts executable
chmod +x infra/local/scripts/*.sh
chmod +x infra/remote/tests/*.sh

# Fix node_modules permissions
sudo chown -R $(whoami) node_modules
sudo chown -R $(whoami) ~/.npm

# Reset Docker permissions (Linux)
sudo chown $(whoami):docker /var/run/docker.sock
```

---

## 🌐 Network & Connectivity Issues

### Test Network Connectivity
```bash
# Test external connectivity
ping -c 3 google.com

# Test localhost services
telnet localhost 3000
telnet localhost 3001
telnet localhost 5432

# Check firewall (Linux)
sudo ufw status

# Check network interfaces
ip addr show
```

### DNS Resolution Issues
```bash
# Clear DNS cache (macOS)
sudo dscacheutil -flushcache

# Clear DNS cache (Linux)
sudo systemd-resolve --flush-caches

# Test DNS resolution
nslookup localhost
dig localhost
```

---

## 💾 Data Recovery & Reset

### Reset to Known Good State
```bash
# Complete environment reset
cd infra/local/scripts
./stop-local.sh --clean

# Clean Docker system
docker system prune -a --volumes -f

# Clean Node modules
find . -name node_modules -type d -exec rm -rf {} +
find . -name package-lock.json -delete

# Fresh install
./start-local.sh
cd backend && npm install
cd frontend && npm install
```

### Database Recovery
```bash
# Backup current database
docker exec yourpartycollection-postgres pg_dump -U postgres party_collection > backup-$(date +%Y%m%d).sql

# Reset to clean state
docker exec yourpartycollection-postgres psql -U postgres -c "DROP DATABASE IF EXISTS party_collection;"
docker exec yourpartycollection-postgres psql -U postgres -c "CREATE DATABASE party_collection;"

# Restart backend to recreate schema and default users
cd backend && npm run dev
```

---

## 📱 Platform-Specific Issues

### macOS Issues
```bash
# Increase file watch limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf

# Fix Rosetta issues (M1 Macs)
arch -x86_64 npm install

# Docker Desktop memory issues
# Docker Desktop > Preferences > Resources > Memory: 4GB+
```

### Linux Issues
```bash
# Fix inotify watch limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Fix Docker permissions
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose if missing
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Windows Issues
```cmd
REM PowerShell execution policy
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

REM Kill Node processes
taskkill /f /im node.exe

REM Check port usage
netstat -ano | findstr :3000

REM Docker Desktop restart
net stop com.docker.service
net start com.docker.service
```

---

## 🧪 Test Environment Issues

### Test Data Problems
```bash
# Reset test users
cd backend
node -e "
const db = require('./src/config/database');
db.query('DELETE FROM users WHERE email LIKE \\'test_%\\' OR email = \\'testuser@example.com\\';');
"

# Recreate default users
cd backend && npm run dev
# Backend automatically creates admin@example.com only
```

### Selenium WebDriver Issues
```bash
# Update Chrome WebDriver
npm install chromedriver@latest

# Run tests with verbose output
DEBUG=true HEADLESS=false npm run test:e2e:debug

# Clear Selenium temp files
rm -rf /tmp/.org.chromium.Chromium.*

# Check Chrome/Chromium installation
google-chrome --version
chromium-browser --version
```

---

## 🎯 Performance Issues

### Application Slow to Respond
```bash
# Check system resources
top
htop
free -m

# Check database performance
docker exec yourpartycollection-postgres psql -U postgres -d party_collection -c "
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;"

# Restart services to clear memory
cd infra/local/scripts
./stop-local.sh && ./start-local.sh
```

### Large Log Files
```bash
# Check log sizes
du -sh infra/local/.pids/*.log

# Truncate large logs
> infra/local/.pids/backend.log
> infra/local/.pids/frontend.log

# Rotate logs
mv infra/local/.pids/backend.log infra/local/.pids/backend.log.old
touch infra/local/.pids/backend.log
```

---

## 📋 Troubleshooting Checklist

### Before Asking for Help
- [ ] Tried turning it off and on again (`./stop-local.sh && ./start-local.sh`)
- [ ] Checked logs for error messages (`tail -f infra/local/.pids/*.log`)
- [ ] Verified all containers are running (`docker ps`)
- [ ] Tested basic connectivity (`curl http://localhost:3001/health`)
- [ ] Confirmed no port conflicts (`netstat -an | grep :3000`)

### Information to Gather
- [ ] Operating system and version
- [ ] Node.js version (`node --version`)
- [ ] Docker version (`docker --version`)
- [ ] Error messages from logs
- [ ] Steps that led to the issue
- [ ] Whether it worked before (what changed?)

---

**🔧 Pro Tip**: 90% of issues are resolved by a clean restart. When in doubt, `./stop-local.sh --clean && ./start-local.sh` is your friend!