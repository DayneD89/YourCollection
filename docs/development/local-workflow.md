# Local Development Workflow

> **Navigation**: [Quick Start](../getting-started/quick-start.md) | [Index](../index.md) | [Development Overview](development-overview.md)

Complete daily workflow guide for local development with the Party Collection application.

## 📋 What You Need to Know

**⏱️ Time needed**: 2-3 minutes per session  
**🎓 Skill level**: Beginner-friendly  
**💰 Cost**: £0.00 (completely free)  
**💻 Prerequisites**: Docker installed, project cloned

**🎯 You'll learn**: Efficient daily development routine with:
- ✅ Quick startup and shutdown commands
- ✅ Database management and reset procedures
- ✅ Testing workflow integration
- ✅ Debugging and troubleshooting techniques

> 💡 **TL;DR**: Use `./start-local.sh` to begin, work normally with hot reload, run `npm test` for validation, use `./stop-local.sh` when done. Reset database with `./stop-local.sh --clean && ./start-local.sh` if needed.

## 🚀 Daily Development Routine

### Start Your Day
```bash
cd infra/local/scripts
./start-local.sh

# Wait for startup (30-60 seconds)
# ✅ PostgreSQL: http://localhost:5432
# ✅ PgAdmin: http://localhost:8080
# ✅ Backend API: http://localhost:3001
# ✅ Frontend PWA: http://localhost:3000
```

**Default Accounts Available:**
- **Admin**: `admin@example.com` / `AdminTest123@`
- **User**: `user@example.com` / `UserPass123@`

### Development Work
```bash
# Backend changes auto-reload via nodemon
# Frontend changes auto-reload via Turbopack
# Database persists between sessions

# Quick health check
curl http://localhost:3001/health
# Should return: {"status": "healthy"}
```

### Testing During Development
```bash
# Backend API tests (13 tests)
cd backend
npm test

# Frontend E2E tests (15 scenarios)
cd test
npm test

# Full system integration
cd test
node runner.js --env=local
```

### End Your Day
```bash
cd infra/local/scripts
./stop-local.sh
# Stops all containers, preserves database
```

## 🔧 Common Workflows

### Database Reset
```bash
# When you need fresh data
./stop-local.sh --clean
./start-local.sh
# Creates fresh database with default accounts
```

### Feature Development
```bash
# 1. Start environment
./start-local.sh

# 2. Create feature branch
git checkout -b feature/new-feature

# 3. Develop with hot reload
# Edit backend files → auto-restart
# Edit frontend files → auto-refresh

# 4. Test changes
cd backend && npm test
cd test && HEADLESS=true PARALLEL=false TAGS="@fast" npm test  # Fast tests for development

# 5. Commit when tests pass
git add .
git commit -m "Add new feature"

# 6. Cleanup
./stop-local.sh
```

### Debugging Issues

#### Port Conflicts
```bash
# Find what's using ports
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
lsof -i :5432  # Database
lsof -i :8080  # PgAdmin

# Kill conflicting processes
kill -9 PID
```

#### Database Issues
```bash
# View database directly
cd infra/local/docker
docker-compose exec postgres psql -U postgres -d party_collection

# Reset specific user password
docker-compose exec postgres psql -U postgres -d party_collection -c \
  "UPDATE users SET password_hash = crypt('AdminTest123@', gen_salt('bf')) WHERE email = 'admin@example.com';"
```

#### Container Issues
```bash
# View container status
cd infra/local/docker
docker-compose ps

# View logs
docker-compose logs postgres
docker-compose logs pgadmin

# Complete cleanup and restart
./stop-local.sh --clean
docker system prune -f
./start-local.sh
```

## 📊 Development Monitoring

### Real-time Logs
```bash
# Backend API logs
tail -f infra/local/.pids/backend.log

# Frontend build logs
tail -f infra/local/.pids/frontend.log

# Database queries (if enabled)
docker-compose logs -f postgres
```

### Performance Monitoring
```bash
# API response times
curl -w "@curl-format.txt" http://localhost:3001/health

# Frontend build times displayed in terminal
# Database query performance via PgAdmin
```

### Status Checking
```bash
# Quick status check
cd infra/local/scripts
./status-local.sh

# Manual verification
curl http://localhost:3001/health    # Backend
curl http://localhost:3000           # Frontend
```

## 🧪 Testing Integration

### Development Testing Cycle
```bash
# 1. Write code with hot reload
# 2. Manual testing in browser
# 3. Backend API tests
cd backend && npm test

# 4. Frontend E2E tests (fast subset)
cd test && HEADLESS=true PARALLEL=false TAGS="@fast" npm test

# 5. Full integration (optional)
cd test && node runner.js --env=local
```

### Test-Driven Development
```bash
# 1. Write failing test first
# 2. Run specific test
cd test
TAGS="@auth" npm test

# 3. Implement feature
# 4. Verify test passes
# 5. Run full suite
npm test
```

## 🔗 Related Workflows

- **[AWS Development Workflow](aws-workflow.md)** - Cloud development process
- **[Development Overview](development-overview.md)** - Architecture and setup details
- **[Test Commands](../testing/test-commands.md)** - Complete testing guide
- **[Quick Start](../getting-started/quick-start.md)** - Initial setup instructions

---

**💡 Pro Tip**: Keep the local environment running during active development days. The hot reload saves significant time, and database persistence means you don't lose test data between sessions.