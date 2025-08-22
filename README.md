# Party Collection - Political Campaigning PWA

> **Status**: ✅ Production Ready | **Local**: Free | **AWS Dev**: £0.53/month | **AWS Prod**: £222/month  
> **Stack**: Next.js 15 + Node.js + PostgreSQL + AWS | **Tests**: 28 comprehensive scenarios

A Progressive Web Application designed for party members to collect information from the public through YAML-configurable dynamic forms for political campaigning purposes. Runs locally for free development, or deploys to AWS with automatic cost optimization.

## 🎯 For Non-Technical Users

**Want to see this running?** Follow these simple steps:

1. **🏠 [Run Locally (Free)](#-local-development---free)** - See it working on your computer in 2 minutes
2. **🧪 [Verify Everything Works](#-testing--quality)** - Run automated tests to confirm it's all working  
3. **☁️ [Deploy to AWS (Optional)](#-aws-deployment---053month)** - Put it on the internet for others to use
4. **🚀 [Scale for Production](#-production-deployment---222month)** - Handle real users with automatic scaling

**Need help?** Every step links to detailed guides written for beginners.

## 🚀 Quick Start Options

| Option | Monthly Cost | Setup Time | What You Get | Best For |
|--------|-------------|------------|--------------|----------|
| **[🏠 Local Development](#-local-development---free)** | £0.00 | 2 minutes | Full app on your computer | Learning, development, testing changes |
| **[☁️ AWS Development](#-aws-deployment---053month)** | £0.53 | 10 minutes | App on the internet (dev mode) | Sharing with others, integration testing |
| **[🚀 Production Deployment](#-production-deployment---222month)** | £222.07 | 30 minutes | Full production system | Real users, business use |

---

## 🏠 Local Development - Free

**Run the complete application on your computer for free development and testing.**

**What you get:**
- Full Party Collection app with dynamic YAML-configured forms at http://localhost:3000
- Admin panel for managing form configurations and collected public data at http://localhost:8080  
- API server for data collection and processing at http://localhost:3001
- All collected public data stored securely on your computer
- No internet required after initial setup

**Quick Start:**
```bash
# Start everything (database, backend, frontend)
cd infra/local/scripts
./start-local.sh

# Open in browser: http://localhost:3000
# Test admin login: admin@example.com / AdminTest123@
```

**Verify it's working:**
```bash
# Run all 28 automated tests
node ../../test-runner.js --env=local
```

**When you're done:**
```bash
# Stop everything
./stop-local.sh
```

**Data Persistence:** Your data is automatically saved and will be there when you restart.

**→ Complete Guide:** [infra/local/README.md](infra/local/README.md) - Docker setup, troubleshooting, and advanced features

---

## ☁️ AWS Development - £0.53/month

**Deploy your app to the internet with automatic cost optimization.**

**What you get:**
- Your app accessible from anywhere on the internet
- Automatic scaling: active when you're working (£17.85/month), idle when you're not (£0.53/month)
- AWS cloud database that preserves your data even when scaled down
- Professional URLs for sharing with others
- Same functionality as local, but accessible worldwide

**First-time Setup (one-time only):**
```bash
# 1. Setup AWS permissions - you'll need an AWS account
cd infra/remote
./setup-aws-permissions.sh YOUR_GITHUB_USERNAME/YOUR_REPO_NAME
```

**Deploy your app:**
```bash
# 2. Deploy to the internet (takes ~8-12 minutes)
cd tests
./dev-deploy.sh your-email@example.com

# You'll get URLs like:
# Frontend: http://your-ip:3000 (for users)  
# Backend: http://your-ip:3001 (for API)
```

**Daily Cost Management:**
```bash
# When you're done working - scale to idle (saves £17/month)
./dev-idle.sh                    # Cost: £0.53/month

# When you want to work again - scale to active
./dev-active.sh                  # Cost: £17.85/month

# Check current status and costs
./dev-status.sh
```

**Data Safety:** Your data is ALWAYS preserved in the cloud database, even when scaled to idle.

**→ Complete Guide:** [infra/remote/README.md](infra/remote/README.md) - AWS setup, troubleshooting, and advanced management  
**→ Daily Operations:** [docs/troubleshooting/remote-management.md](docs/troubleshooting/remote-management.md) - Detailed script usage and cost optimization

---

## 🚀 Production Deployment - £222/month

**Deploy a production-ready system that can handle real users with automatic scaling.**

**What you get:**
- High-availability system across multiple data centers
- Auto-scaling from 2-10 servers based on user load
- Blue/green deployment for zero-downtime updates
- Professional SSL certificates and custom domain support  
- Enhanced monitoring, backups, and security
- Can handle thousands of concurrent users

**Production Features:**
- **Zero Downtime Updates:** Update your app without any user interruption
- **Auto Scaling:** Automatically adds more servers when busy, removes them when quiet
- **Data Backup:** Automatic daily backups with 7-day retention
- **Security:** Production-grade security with WAF, SSL, and network isolation
- **Monitoring:** Real-time alerts and performance monitoring

**Cost Breakdown:**
- **Base Cost:** £222/month for standard load (2 servers, database, networking)
- **Peak Load:** Up to £400/month during high traffic (auto-scales back down)
- **Emergency Control:** Automatic cost protection prevents runaway charges

**Deployment Process:**
```bash
# 1. First, ensure AWS development environment is working
./dev-status.sh

# 2. Deploy production (more complex, see full guide)
# This requires additional manual steps for security
```

**Production Scaling:**
- **Peak Hours:** System automatically scales UP to handle more users
- **Quiet Hours:** System automatically scales DOWN to save costs  
- **Maintenance Mode:** Can temporarily scale down for updates (with user notification)
- **Data Always Safe:** All user data preserved regardless of scaling

**→ Complete Production Guide:** [docs/deployment/aws-deployment.md](docs/deployment/aws-deployment.md) - Full production setup process  
**→ Blue/Green Deployment:** [docs/deployment/blue-green-strategy.md](docs/deployment/blue-green-strategy.md) - Zero-downtime updates  
**→ Cost Management:** [docs/deployment/cost-guide.md](docs/deployment/cost-guide.md) - Optimize production costs

---

## 🏗️ Architecture Overview

| Component | Technology Stack | Guide | Purpose |
|-----------|-----------------|-------|---------|
| **Frontend** | Next.js 15, React 19, PWA, TypeScript | [frontend/README.md](frontend/README.md) | User interface & offline experience |
| **Backend** | Node.js, Express, JWT, PostgreSQL | [backend/README.md](backend/README.md) | API server & authentication |
| **Local Infra** | Docker, PostgreSQL, Scripts | [infra/local/README.md](infra/local/README.md) | Development environment |
| **Remote Infra** | AWS ECS, Aurora, ARM64 | [infra/remote/README.md](infra/remote/README.md) | Cloud deployment |

**→ System Architecture Details:** [docs/infrastructure/stack-structure.md](docs/infrastructure/stack-structure.md) - Technical implementation overview

---

## 🧪 Testing & Quality

**Comprehensive automated testing ensures everything works correctly.**

**What gets tested:**
- **Backend API (13 tests):** All server functions, authentication, database operations
- **Frontend E2E (15 scenarios):** User interface, login flows, data management
- **Total: 28 comprehensive test scenarios** covering the entire application

**Run all tests:**
```bash
# Test everything locally (recommended first step)
node test-runner.js --env=local

# Test individual components  
cd backend && npm test      # Server and API tests
cd frontend && npm test     # User interface tests
```

**Test against different environments:**
```bash
node test-runner.js --env=local    # Test local development setup
node test-runner.js --env=dev      # Test AWS development deployment
node test-runner.js --env=prod     # Test production deployment (with confirmation)
```

**What successful tests prove:**
- Your setup is working correctly
- All features are functional
- Authentication and security are working
- Data is being saved and retrieved properly
- The app is ready for users

**→ Complete Testing Guide:** [docs/testing/test-commands.md](docs/testing/test-commands.md) - All testing commands and scenarios  
**→ Backend Testing Details:** [docs/testing/backend-testing.md](docs/testing/backend-testing.md) - API and server testing  
**→ Frontend Testing Details:** [docs/testing/frontend-testing.md](docs/testing/frontend-testing.md) - User interface testing

---

## 💰 Cost Structure

**Transparent pricing with automatic optimization to minimize costs.**

| Environment | Status | Monthly Cost | What You Get | Data Safety |
|-------------|--------|--------------|--------------|-------------|
| **Local** | Development | £0.00 | Full app on your computer | Stored locally |
| **AWS Dev** | Idle | £0.53 | Infrastructure ready, scaled down | Always preserved |
| **AWS Dev** | Active | £17.85 | Full internet-accessible app | Always preserved |
| **AWS Prod** | Standard | £222.07 | Production system, 2-10 servers | Backed up daily |
| **AWS Prod** | Peak Load | £300-400 | Auto-scaled for high traffic | Backed up daily |

**Cost Optimization Features:**
- **Auto-scaling:** Only pay for what you use
- **Development idle mode:** Scale to £0.53 when not working
- **Emergency controls:** Automatic cost protection at £500/month
- **Data preservation:** Your data is NEVER lost when scaling down

**→ Complete Cost Guide:** [docs/deployment/cost-guide.md](docs/deployment/cost-guide.md) - Optimization strategies and detailed breakdown  
**→ Environment Control:** [docs/troubleshooting/environment-control.md](docs/troubleshooting/environment-control.md) - Scale up/down commands

---

## 📚 Complete Documentation

### 📖 Start Here - Component Guides
Each component has a summary guide that explains what it does and how to use it:

- **[Backend API](backend/README.md)** - Server, authentication, database (Node.js + Express + PostgreSQL)
- **[Frontend PWA](frontend/README.md)** - User interface, PWA features, mobile support (Next.js + React)
- **[Local Development](infra/local/README.md)** - Run everything on your computer (Docker + scripts)
- **[AWS Infrastructure](infra/remote/README.md)** - Deploy to the cloud (AWS + cost optimization)

### 🚀 Getting Started Guides
- **[Quick Start Guide](docs/getting-started/quick-start.md)** - Get running in 5 minutes
- **[AWS Permissions Setup](docs/getting-started/aws-permissions.md)** - One-time AWS account configuration
- **[Database Setup](docs/getting-started/database-setup.md)** - Database configuration and management

### 🔧 Advanced Guides
- **[Development Workflow](docs/development/development-overview.md)** - Daily development process
- **[AWS Deployment](docs/deployment/aws-deployment.md)** - Complete AWS deployment guide
- **[Cost Optimization](docs/deployment/cost-guide.md)** - Save money with smart scaling
- **[Testing Strategy](docs/testing/test-commands.md)** - Run and understand all tests
- **[System Architecture](docs/infrastructure/stack-structure.md)** - How everything fits together
- **[Security Guide](docs/infrastructure/security.md)** - Authentication and security features

### 🛠️ Operations & Troubleshooting
- **[Remote Management](docs/troubleshooting/remote-management.md)** - Daily AWS operations and scripts
- **[Environment Control](docs/troubleshooting/environment-control.md)** - Scale up/down and cost control
- **[GitHub Actions](docs/workflows/github-actions-overview.md)** - Automated deployment workflows

### 📋 Complete Index
**[📑 Full Documentation Index](docs/index.md)** - Every guide organized by topic and task

---

## ⚡ Quick Reference Commands

| What You Want To Do | Command | Where To Learn More |
|---------------------|---------|---------------------|
| **🏠 Start local development** | `cd infra/local/scripts && ./start-local.sh` | [Local Guide](infra/local/README.md) |
| **🧪 Run all tests** | `node test-runner.js --env=local` | [Testing Guide](docs/testing/test-commands.md) |
| **☁️ Deploy to AWS development** | `cd infra/remote/tests && ./dev-deploy.sh EMAIL` | [AWS Guide](infra/remote/README.md) |
| **💰 Save money (scale to idle)** | `./dev-idle.sh` | [Cost Control](docs/troubleshooting/environment-control.md) |
| **🚀 Resume work (scale to active)** | `./dev-active.sh` | [Daily Operations](docs/troubleshooting/remote-management.md) |
| **📊 Check status and costs** | `./dev-status.sh` | [Remote Management](docs/troubleshooting/remote-management.md) |

### 📋 Quick Reference Guides

**Need instant answers?** Check our quick reference guides:

- **[📋 Commands](docs/quick-reference/commands.md)** - All essential commands in one place
- **[💰 Costs](docs/quick-reference/costs.md)** - Cost optimization at a glance
- **[🔧 Troubleshooting](docs/quick-reference/troubleshooting.md)** - Common fixes and solutions
- **[🌐 URLs](docs/quick-reference/urls.md)** - All service URLs and ports

---

## 🎯 Step-by-Step User Journeys

### 🔰 Complete Beginner - "I want to see this working"
1. **🏠 [Run Locally](#-local-development---free)** → Get it working on your computer (2 minutes)
2. **🧪 [Run Tests](#-testing--quality)** → Verify everything works properly (1 minute)  
3. **📖 [Explore Features](docs/development/development-overview.md)** → Understand what you've built
4. **☁️ [Deploy to AWS](#-aws-deployment---053month)** → Put it on the internet (optional)

### 👩‍💻 Developer - "I want to customize this"
1. **🚀 [Quick Start Guide](docs/getting-started/quick-start.md)** → Choose local or AWS development
2. **🏗️ [Architecture Guide](docs/infrastructure/stack-structure.md)** → Understand the system design
3. **🔧 [Development Workflow](docs/development/development-overview.md)** → Start coding effectively
4. **🧪 [Testing Strategy](docs/testing/test-commands.md)** → Test your changes properly

### 🏢 Business - "I want to use this for real users"
1. **☁️ [AWS Development](#-aws-deployment---053month)** → Start with development deployment
2. **💰 [Cost Planning](docs/deployment/cost-guide.md)** → Understand all costs involved
3. **🚀 [Production Setup](#-production-deployment---222month)** → Deploy for real users
4. **📊 [Operations Guide](docs/troubleshooting/remote-management.md)** → Daily management and scaling

### 👥 Team - "Multiple people need to work on this"
1. **🔧 [AWS Permissions Setup](docs/getting-started/aws-permissions.md)** → Configure team access
2. **🤖 [GitHub Actions](docs/workflows/github-actions-overview.md)** → Automated deployments
3. **🔒 [Security Guide](docs/infrastructure/security.md)** → Team security best practices
4. **📋 [Team Workflow](docs/development/development-overview.md)** → Collaborative development

---

## 🚀 Ready to Start?

**For beginners:** Start with [🏠 Local Development](#-local-development---free) - it's free and gets you running in 2 minutes!

**For developers:** Check the [📑 Complete Documentation Index](docs/index.md) to find exactly what you need.

**Need help?** Every guide is written for beginners with step-by-step instructions and troubleshooting.