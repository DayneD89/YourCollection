# Quick Start Guide

> **Navigation**: [Documentation Index](../index.md) | [AWS Permissions](aws-permissions.md) | [Database Setup](database-setup.md)

Get the Party Collection application running in 5 minutes.

## 📋 What You Need to Know

**⏱️ Time needed**: 5-15 minutes  
**🎓 Skill level**: Beginner-friendly  
**💻 Prerequisites**: 
- Git installed on your computer
- Node.js 18+ installed
- Docker installed (for local development)

**🎯 You'll complete**: Working volunteer management system with:
- ✅ User authentication and admin panel
- ✅ Progressive web app (works on phones)
- ✅ Complete test suite (28 automated tests)
- ✅ Either local (free) or AWS deployment

> 💡 **TL;DR**: Choose local development (free, 5 minutes) to start immediately, or AWS development (low cost, 15 minutes) for cloud integration testing. See [Cost Guide](../deployment/cost-guide.md) for detailed pricing.

> **🔰 Complete Beginner?** Start with **Local Development** below - it's free and gets you running immediately! You can always deploy to AWS later.

## Choose Your Path

**🏠 Local Development (Free)** - Best for daily coding  
**☁️ AWS Development (£0.53/month)** - Best for integration testing

---

## 🏠 Local Development (Recommended)

Complete development environment on your machine:

```bash
# 1. Start everything
cd infra/local/scripts
./start-local.sh

# 2. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# Database Admin: http://localhost:8080

# 3. Run tests
cd ../..
node test-runner.js --env=local
```

**Default Accounts Created:**
- **Admin**: `admin@example.com` / `AdminTest123@`
- **User**: `user@example.com` / `UserPass123@`

**→ Continue with [Local Development Workflow](../development/local-workflow.md)**

---

## ☁️ AWS Development

Deploy to AWS for integration testing:

### Prerequisites
- AWS account with billing enabled
- AWS CLI installed and configured
- GitHub repository (fork of this project)

### Step 1: Setup AWS Permissions
```bash
cd infra/remote
./setup-aws-permissions.sh YOUR_GITHUB_USERNAME/YOUR_REPO_NAME

# Example:
./setup-aws-permissions.sh myusername/party-collection
```

### Step 2: Deploy Development Environment  
```bash
cd tests
./dev-deploy.sh your-email@example.com

# Wait 8-12 minutes for deployment
# Result: Active development environment (£17.85/month)
```

### Step 3: Scale to Idle (Save Costs)
```bash
./dev-idle.sh

# Result: Infrastructure preserved but inactive (£0.53/month)
```

**→ Continue with [AWS Development Workflow](../development/aws-workflow.md)**

---

## 🧪 Verify Installation

Test that everything works:

```bash
# Backend API health check
curl http://localhost:3001/health
# Should return: {"status": "healthy"}

# Run comprehensive test suite
node test-runner.js --env=local
# Should show: ✅ All tests passed
```

---

## 🚨 Troubleshooting

**Common Issues:**

```bash
# Ports already in use (3000, 3001, 5432, 8080)
lsof -i :3000  # Find what's using port 3000
kill -9 PID    # Kill the process

# Docker containers won't start
cd infra/local/scripts
./stop-local.sh --clean
./start-local.sh

# Permission denied on scripts
chmod +x infra/local/scripts/*.sh
chmod +x infra/remote/tests/*.sh
```

**→ More help: [Troubleshooting Guide](../troubleshooting/common-issues.md)**

---

## 📚 What's Next?

**For Local Development:**
- [Development Overview](../development/development-overview.md) - Daily coding routine
- [Testing Guide](../testing/test-commands.md) - Run and write tests  
- [Backend README](../../backend/README.md) - Backend API documentation

**For AWS Development:**
- [AWS Deployment](../deployment/aws-deployment.md) - Cost-optimized cloud development
- [Cost Guide](../deployment/cost-guide.md) - Development to production costs
- [Cost Management](../deployment/cost-guide.md) - Keep costs under control

**For Team Setup:**
- [GitHub Actions Overview](../workflows/github-actions-overview.md) - Multi-developer setup and automated deployment
- [Production Architecture](../infrastructure/prod-architecture.md) - Go live checklist