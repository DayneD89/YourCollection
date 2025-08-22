# Documentation Index

Navigate the Party Collection documentation with this organized index.

> 📍 **Project Overview**: See [Main Project README](../README.md) for high-level project description and getting started.

> 💡 **TL;DR**: 34 documentation files covering local development (free), AWS deployment (low cost), and production volunteer management. Start with [Quick Start](getting-started/quick-start.md) for immediate results. See [Cost Guide](deployment/cost-guide.md) for detailed pricing.

## 🚀 Start Here

### First Time? Choose Your Journey:

**🆕 Complete Beginner** → [Quick Start Guide](getting-started/quick-start.md) (5 minutes)
- Get the app running locally
- See what it does
- No cloud setup needed

**👩‍💻 Developer** → [Development Overview](development/development-overview.md) (15 minutes)  
- Understand the architecture
- Set up development environment
- Start customizing

**🏢 Production User** → [Cost Planning First](deployment/cost-guide.md) (10 minutes)
- Understand all costs
- Then proceed to [AWS Setup](getting-started/aws-permissions.md)

**🚨 Having Problems?** → [Common Issues](troubleshooting/common-issues.md) (Quick fixes)

---

## 🗺️ Complete Documentation Map

### 📚 By Learning Path
- **🔰 Beginner**: Quick Start → Testing → Basic Development
- **🔧 Developer**: Development Overview → Architecture → Advanced Testing  
- **☁️ DevOps**: AWS Setup → Infrastructure → Monitoring → Production
- **💰 Cost-Conscious**: Cost Guide → Environment Control → Scaling

### 🎭 By Role
- **👩‍💻 Developer**: [Development](development/development-overview.md) | [Testing](testing/test-commands.md) | [Architecture](infrastructure/stack-structure.md)
- **🏛️ Party Organizer**: [Quick Start](getting-started/quick-start.md) | [Cost Guide](deployment/cost-guide.md) | [Production](infrastructure/prod-architecture.md)  
- **💼 DevOps**: [AWS Setup](getting-started/aws-permissions.md) | [Infrastructure](infrastructure/stack-structure.md) | [Monitoring](infrastructure/monitoring.md)
- **📊 Treasurer**: [Cost Guide](deployment/cost-guide.md) | [Environment Control](troubleshooting/environment-control.md) | [Quick Costs](quick-reference/costs.md)

### ⚡ By Urgency
- **🚨 Emergency**: [Common Issues](troubleshooting/common-issues.md) | [Quick Troubleshooting](quick-reference/troubleshooting.md) | [Environment Control](troubleshooting/environment-control.md)
- **📋 Daily Tasks**: [Commands](quick-reference/commands.md) | [Remote Management](troubleshooting/remote-management.md) | [Development](development/development-overview.md)
- **📈 Planning**: [Cost Guide](deployment/cost-guide.md) | [Production Architecture](infrastructure/prod-architecture.md) | [Monitoring](infrastructure/monitoring.md)

---

## 🎯 User Pathways

**Choose your path based on what you want to achieve:**

### 🔰 "I just want to see this working" (5 minutes)
1. **[🏠 Run Locally](getting-started/quick-start.md)** - Get it working on your computer  
2. **[🧪 Test It](testing/test-commands.md)** - Verify everything works
3. **[📖 Understand It](development/development-overview.md)** - Learn what you've built

### 👩‍💻 "I want to customize this for my needs" (30 minutes)  
1. **[🚀 Quick Start](getting-started/quick-start.md)** - Setup and first steps
2. **[🏗️ System Overview](infrastructure/stack-structure.md)** - Understand the architecture
3. **[🔧 Development Guide](development/development-overview.md)** - Start making changes
4. **[🧪 Testing Guide](testing/test-commands.md)** - Test your changes properly

### 🏢 "I want to use this for real users" (2-3 hours)
1. **[💰 Cost Planning](deployment/cost-guide.md)** - Understand all costs first
2. **[☁️ AWS Setup](getting-started/aws-permissions.md)** - One-time AWS configuration
3. **[🚀 Production Deployment](deployment/aws-deployment.md)** - Deploy for real users
4. **[📊 Operations Guide](troubleshooting/remote-management.md)** - Daily management

### 👥 "Multiple people need to work on this" (1-2 hours)
1. **[🔧 Team AWS Setup](getting-started/aws-permissions.md)** - Multi-user configuration
2. **[🤖 Automation Setup](workflows/github-actions-overview.md)** - Automated deployments
3. **[🔒 Security Configuration](infrastructure/security.md)** - Team security setup
4. **[📋 Team Workflow](development/development-overview.md)** - Collaborative process

---

## 📚 Quick Access Links

**🚀 Get Started**: [Quick Start Guide](getting-started/quick-start.md)  
**🧪 Run Tests**: [Test Commands](testing/test-commands.md)  
**💰 Manage Costs**: [Cost Guide](deployment/cost-guide.md)  
**🔒 Security Info**: [Security Guide](infrastructure/security.md)

### 📋 Quick Reference (Instant Answers)

**Need something specific right now?** Check our quick reference guides:

- **[📋 Commands](quick-reference/commands.md)** - All essential commands organized by category
- **[💰 Costs](quick-reference/costs.md)** - Cost breakdown, optimization, and controls
- **[🔧 Troubleshooting](quick-reference/troubleshooting.md)** - Common fixes and instant solutions  
- **[🌐 URLs](quick-reference/urls.md)** - All service URLs, ports, and endpoints

---

## 🏗️ Component Documentation

### 🔧 Backend API Server
- **📄 Guide**: [backend/README.md](../backend/README.md)
- **🔑 Features**: API server, JWT authentication, PostgreSQL database
- **🧪 Tests**: 13 comprehensive API test scenarios

### 🎨 Frontend PWA  
- **📄 Guide**: [frontend/README.md](../frontend/README.md)
- **🔑 Features**: Next.js 15, React 19, Progressive Web App
- **🧪 Tests**: 15 E2E test scenarios (135 steps)

### 🐳 Local Infrastructure
- **📄 Guide**: [infra/local/README.md](../infra/local/README.md)  
- **🔑 Features**: Docker development environment, PostgreSQL
- **💰 Cost**: Free - runs entirely on your machine

### ☁️ Remote Infrastructure
- **📄 Guide**: [infra/remote/README.md](../infra/remote/README.md)
- **🔑 Features**: AWS deployment, auto-scaling, cost optimization
- **💰 Cost**: See [Cost Guide](deployment/cost-guide.md) for detailed pricing breakdown

---

## 📖 Detailed Documentation

All detailed guides are organized in the `docs/` directory:

### 🔧 Getting Started
- [Quick Start Guide](getting-started/quick-start.md) - Get running in 5 minutes
- [AWS Permissions Setup](getting-started/aws-permissions.md) - Complete AWS account setup
- [Database Setup](getting-started/database-setup.md) - PostgreSQL configuration
- [Windows Setup](getting-started/windows-setup.md) - Windows-specific installation instructions

### 💻 Development
- [Development Overview](development/development-overview.md) - Complete development workflow

### 🚀 Deployment
- [AWS Deployment](deployment/aws-deployment.md) - Complete AWS infrastructure setup
- [Blue/Green Overview](deployment/blue-green-deployment.md) - Zero-downtime deployment overview
- [Blue/Green Strategy](deployment/blue-green-strategy.md) - Detailed deployment process
- [Cost Management Guide](deployment/cost-guide.md) - Optimize infrastructure costs

### 🏗️ Infrastructure
- [System Architecture](infrastructure/stack-structure.md) - Complete system design
- [Security Architecture](infrastructure/security.md) - Complete security guide
- [Production Security](infrastructure/production-security.md) - Production security configuration
- [Infrastructure Validation](infrastructure/validation.md) - System verification

### 🧪 Testing
- [Test Commands Reference](testing/test-commands.md) - All testing commands
- [Backend Testing](testing/backend-testing.md) - API testing with 13 comprehensive tests
- [Frontend Testing](testing/frontend-testing.md) - E2E testing with 15 scenarios

### ⚡ Workflows & Automation
- [GitHub Actions Overview](workflows/github-actions-overview.md) - CI/CD pipeline setup
- [Development Deployment](workflows/dev-deployment-workflow.md) - Automated dev deployment
- [Production Deployment](workflows/prod-deployment-workflow.md) - Secure prod deployment
- [Cost Monitoring Workflow](workflows/cost-monitoring-workflow.md) - Automated cost tracking

### 🚨 Troubleshooting
- [Common Issues](troubleshooting/common-issues.md) - FAQ for typical problems and solutions
- [Environment Control](troubleshooting/environment-control.md) - Infrastructure management and cost control
- [Remote Management](troubleshooting/remote-management.md) - AWS infrastructure operations and testing

### 📋 Quick Reference
- [Commands Reference](quick-reference/commands.md) - All essential commands organized by category
- [Cost Optimization](quick-reference/costs.md) - Cost breakdowns, controls, and optimization strategies
- [Troubleshooting Guide](quick-reference/troubleshooting.md) - Common fixes and instant solutions
- [URLs & Endpoints](quick-reference/urls.md) - All service URLs, ports, and API endpoints

---

## 🗺️ Navigation Flows

### New User Journey
1. **[Quick Start](getting-started/quick-start.md)** - Choose local or AWS
2. **[Development Overview](development/development-overview.md)** - Start developing
3. **[Testing Guide](testing/test-commands.md)** - Verify everything works
4. **[Cost Control](deployment/cost-guide.md)** - Manage AWS costs

### Production Deployment Journey  
1. **[AWS Permissions](getting-started/aws-permissions.md)** - Complete AWS configuration
2. **[AWS Deployment](deployment/aws-deployment.md)** - Deploy to AWS
3. **[Blue/Green Strategy](deployment/blue-green-strategy.md)** - Zero-downtime deployment
4. **[Production Security](infrastructure/production-security.md)** - Secure production

### Operations Journey
1. **[Remote Management](troubleshooting/remote-management.md)** - Daily operations  
2. **[Environment Control](troubleshooting/environment-control.md)** - Cost control
3. **[Cost Monitoring](workflows/cost-monitoring-workflow.md)** - Automated tracking
4. **[Security Architecture](infrastructure/security.md)** - Security best practices

---

## 🔍 Find What You Need

### By Task
| I Want To... | Go To |
|--------------|-------|
| **Get started quickly** | [Quick Start](getting-started/quick-start.md) |
| **Run tests** | [Test Commands](testing/test-commands.md) |  
| **Deploy to AWS** | [AWS Deployment](deployment/aws-deployment.md) |
| **Control costs** | [Cost Guide](deployment/cost-guide.md) |
| **Manage infrastructure** | [Remote Management](troubleshooting/remote-management.md) |
| **Set up blue/green** | [Blue/Green Strategy](deployment/blue-green-strategy.md) |
| **Debug issues** | [Common Issues](troubleshooting/common-issues.md) |
| **Fix problems quickly** | [Quick Troubleshooting](quick-reference/troubleshooting.md) |
| **Find all commands** | [Commands Reference](quick-reference/commands.md) |
| **Understand security** | [Security Guide](infrastructure/security.md) |

### By Technology
| Technology | Documentation |
|------------|---------------|
| **Next.js/React** | [Frontend README](../frontend/README.md) |
| **Node.js/Express** | [Backend README](../backend/README.md) |
| **PostgreSQL** | [Database Setup](getting-started/database-setup.md) |
| **Docker** | [Local Infra](../infra/local/README.md) |
| **AWS/CloudFormation** | [Remote Infra](../infra/remote/README.md), [AWS Permissions](getting-started/aws-permissions.md) |
| **GitHub Actions** | [Workflows Overview](workflows/github-actions-overview.md) |
| **Testing** | [Test Commands](testing/test-commands.md), [Backend Tests](testing/backend-testing.md) |

---

## 📱 Mobile-Friendly Quick Reference

For quick access on mobile devices:

**Essential Links:**
- 🚀 [Quick Start](getting-started/quick-start.md)
- 🧪 [Test Commands](testing/test-commands.md)  
- 💰 [Cost Control](deployment/cost-guide.md)
- 🚨 [Troubleshooting](troubleshooting/common-issues.md)

**Quick Reference Guides:**
- [📋 Commands](quick-reference/commands.md) | [💰 Costs](quick-reference/costs.md) | [🔧 Fixes](quick-reference/troubleshooting.md) | [🌐 URLs](quick-reference/urls.md)

**Component Summaries:**
- [Backend](../backend/README.md) | [Frontend](../frontend/README.md) | [Local](../infra/local/README.md) | [Remote](../infra/remote/README.md)

---

**💡 Tip**: Each documentation file includes cross-references to related topics, so you can easily navigate between connected concepts without returning to this index.