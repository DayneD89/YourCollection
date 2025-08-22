# Remote AWS Infrastructure

> **Stack**: AWS ECS + Aurora + ARM64 | **Dev Cost**: £0.53-£17.85/month | **Prod Cost**: £222/month | **Features**: Auto-scaling + Cost optimization

AWS-based remote deployment infrastructure with ultra-low cost ARM64-optimized development options and comprehensive production deployment capabilities.

## 🚀 Quick Start

### Step 1: Setup AWS Permissions (One-time)
```bash
# Automated OIDC and IAM role setup
./setup-aws-permissions.sh YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME

# Validate configuration
./validate-aws-permissions.sh
```
**Result**: All GitHub Actions roles configured with minimal security boundaries.

### Step 2: Deploy Development Environment (£0.53/month idle)
```bash
# Deploy ultra-low cost development environment
aws cloudformation deploy \
  --template-file templates/minimal-dev-template.yaml \
  --stack-name party-collection-dev-minimal \
  --parameter-overrides file://parameters/dev-minimal.json \
  --capabilities CAPABILITY_IAM \
  --region eu-west-2
```

**Result**: Complete ARM64-optimized development environment for **£0.53/month** idle, **£17.85/month** active.

> **💡 For daily management**: Use the scripts in the `tests/` directory for easy environment lifecycle management. See [Daily Operations Guide](../../docs/troubleshooting/remote-management.md) for details.

## 📋 What's Here

This directory contains everything needed for AWS deployment:

- **🔐 Permissions Setup**: Automated IAM roles and OIDC configuration
- **📋 CloudFormation Templates**: Infrastructure as code for all environments
- **🧪 Management Scripts**: Daily development workflow automation  
- **💰 Cost Optimization**: ARM64 and intelligent scaling for minimal costs
- **⚡ GitHub Actions**: Automated CI/CD pipeline integration
- **📊 Monitoring**: Cost tracking and budget alerts

## 🏗️ Infrastructure Components

### Development Environment (Minimal Cost)
- **ECS Fargate Cluster** (ARM64, FARGATE_SPOT)
- **Aurora Serverless v1** (auto-pause after 5 minutes)
- **Public Subnets Only** (no NAT gateway costs)
- **Application Load Balancer** (optional, for SSL)
- **CloudWatch Logging** (7-day retention)

**→ [../../docs/infrastructure/stack-structure.md](../../docs/infrastructure/stack-structure.md)** for development architecture details

### Production Environment (Enterprise Scale)
- **ECS Fargate Cluster** (ARM64, on-demand)
- **Aurora Serverless v1** (production configuration)
- **Private + Public Subnets** (full network isolation)
- **Application Load Balancer** (SSL termination)
- **Auto Scaling** (2-10 tasks based on CPU/memory)
- **Enhanced Monitoring** (CloudWatch, RDS insights)

**→ [../../docs/deployment/aws-deployment.md](../../docs/deployment/aws-deployment.md)** for production architecture and deployment details

## 💰 Cost Structure

| Environment | Configuration | Monthly Cost | Use Case |
|-------------|---------------|--------------|----------|
| **Dev Idle** | 0 tasks, Aurora paused | £0.53 | Infrastructure preserved |
| **Dev Active** | 1 task, Aurora active | £17.85 | Development & testing |
| **Production** | 2-10 tasks, full features | £222.07 | Live production load |

### Cost Breakdown Details
- **ECS Fargate ARM64**: 20% cheaper than x86
- **FARGATE_SPOT**: 70% cheaper than on-demand
- **Aurora Auto-pause**: £0 database cost when idle
- **Public Subnets**: £45/month NAT gateway cost saved
- **Intelligent Scaling**: Auto-scale to 0 when not needed

**→ [../../docs/deployment/cost-guide.md](../../docs/deployment/cost-guide.md)** for detailed cost analysis

## 🔧 Daily Management

The most efficient way to work with remote infrastructure:

```bash
cd tests/

# First-time deployment
./dev-deploy.sh your-email@domain.com     # £0.53 → £17.85/month

# Daily development cycle  
./dev-active.sh                           # Scale up for work
./dev-update.sh                           # Deploy code changes
./dev-idle.sh                             # Scale down to save costs

# Status and cleanup
./dev-status.sh                           # Check current state
./dev-teardown.sh                         # Complete cleanup
```

**→ [../../docs/troubleshooting/remote-management.md](../../docs/troubleshooting/remote-management.md)** for complete management workflow

## 📋 CloudFormation Templates

| Template | Purpose | Cost | Features |
|----------|---------|------|----------|
| **minimal-dev-template.yaml** | Development | £0.53-£17.85/month | ARM64, auto-pause, public subnets |
| **environments/dev/template-v2.yaml** | Enhanced dev | £25-£50/month | Private subnets, enhanced monitoring |
| **environments/prod/template-v2.yaml** | Production | £222/month | Full enterprise features |
| **global/template.yaml** | Shared resources | £0/month | ECR repositories, IAM roles |

**→ [../../docs/infrastructure/stack-structure.md](../../docs/infrastructure/stack-structure.md)** for template structure guide

## ⚡ GitHub Actions Integration

Automated deployment workflows:

### Development Workflow
- **Trigger**: Push to `develop` or `feature/*` branches
- **Process**: Test → Build ARM64 images → Deploy → Scale to 0
- **Result**: £0.53/month idle, ready for manual activation
- **Security**: Limited permissions, dev environments only

### Production Workflow  
- **Trigger**: Manual dispatch from `main` branch only
- **Process**: Global infra → Build → Deploy → Health checks
- **Security**: Requires "PRODUCTION" confirmation, full permissions
- **Result**: £222/month production environment

**→ [GitHub Actions Guide](../../docs/workflows/github-actions-overview.md)** for complete CI/CD documentation

## 🔐 Security & Permissions

The infrastructure uses OIDC-based authentication with minimal permissions:

### Role Structure
- **github-actions-dev**: Development deployment only
- **github-actions-prod**: Production deployment (main branch)  
- **github-actions-global**: Shared infrastructure management
- **github-actions-cost**: Cost monitoring and emergency controls

### Security Features
- **No stored AWS keys**: OIDC temporary credentials only
- **Branch restrictions**: Role permissions tied to Git branches
- **Least privilege**: Each role has minimal required permissions
- **Resource boundaries**: Cannot access unauthorized AWS resources

**→ [AWS Permissions Setup](../../docs/getting-started/aws-permissions.md)** for complete permissions documentation

## 🏁 Getting Started Paths

### For New Users
1. **Prerequisites**: AWS account, GitHub repository, AWS CLI configured
2. **Setup Permissions**: Run `./setup-aws-permissions.sh` with your GitHub details
3. **Deploy Dev Environment**: Use minimal template for £0.53/month
4. **Test Integration**: Use management scripts in `tests/` directory
5. **Scale to Production**: Deploy global + production templates when ready

**→ [../../docs/getting-started/aws-permissions.md](../../docs/getting-started/aws-permissions.md)** for step-by-step AWS setup

### For Development Teams
1. **Use Local First**: Develop with `infra/local` for zero cost
2. **Remote Integration**: Deploy dev environment for API integration testing
3. **Cost Management**: Use idle/active scripts to control spending
4. **GitHub Actions**: Push to develop branch for automated deployment
5. **Production Ready**: Manual production deployment when features complete

**→ [../../docs/development/development-overview.md](../../docs/development/development-overview.md)** for team development guide

### For Production Deployment
1. **Global Infrastructure**: Deploy shared resources (ECR, roles)
2. **SSL Certificates**: Set up ACM certificates for custom domains
3. **Production Template**: Deploy with production parameters
4. **Monitoring Setup**: Configure CloudWatch alerts and budget notifications
5. **CI/CD Integration**: Set up protected branch workflows

**→ [../../docs/deployment/aws-deployment.md](../../docs/deployment/aws-deployment.md)** for production deployment

## 📁 Directory Structure

```
infra/remote/
├── templates/                    # CloudFormation templates
│   ├── minimal-dev-template.yaml # Ultra-low cost development
│   └── substacks/               # Reusable template components
├── environments/                 # Environment-specific templates
│   ├── dev/                     # Development configurations
│   └── prod/                    # Production configurations  
├── global/                      # Shared infrastructure
│   └── template.yaml            # ECR repos, IAM roles
├── parameters/                  # Parameter files for templates
├── tests/                       # Management and deployment scripts
├── setup-aws-permissions.sh     # Automated IAM setup
├── validate-aws-permissions.sh  # Permission validation
├── AWS_PERMISSIONS_SETUP.md     # Complete permissions guide
└── COST_BREAKDOWN.md            # Detailed cost analysis
```

## 🔗 Integration Points

- **Local Development**: Templates reference Docker images built locally
- **GitHub Actions**: Workflows use these templates for automated deployment
- **Cost Monitoring**: Budget alerts integrate with management scripts
- **Multi-Environment**: Support for local, dev, and prod environment testing

## 🚨 Emergency Procedures

### Cost Control
```bash
# Immediate cost reduction
cd tests && ./dev-idle.sh              # £17.85 → £0.53/month

# Emergency shutdown  
./dev-teardown.sh                      # All costs → £0/month

# Production cost alerts configured at £250/month threshold
```

### Recovery Procedures
```bash
# Redeploy from clean state
./dev-teardown.sh && ./dev-deploy.sh EMAIL

# Fix corrupted deployment
aws cloudformation delete-stack --stack-name party-collection-dev-minimal
# Wait for deletion, then redeploy
```

**→ [../../docs/troubleshooting/environment-control.md](../../docs/troubleshooting/environment-control.md)** for complete environment control procedures

---

## 🔗 Related Components

- **[Backend API](../../backend/README.md)** - API server deployed to AWS ECS
- **[Frontend PWA](../../frontend/README.md)** - React app deployed to AWS containers
- **[Local Infrastructure](../local/README.md)** - Test everything locally first (free)
- **[Complete Documentation](../../docs/index.md)** - Full documentation index

## 📚 Documentation Deep-Dive

- **[AWS Deployment Guide](../../docs/deployment/aws-deployment.md)** - Complete AWS setup from scratch
- **[Cost Optimization](../../docs/deployment/cost-guide.md)** - Detailed cost analysis and strategies
- **[Daily Operations](../../docs/troubleshooting/remote-management.md)** - Scripts and daily management
- **[System Architecture](../../docs/infrastructure/stack-structure.md)** - How AWS infrastructure works
- **[Security Guide](../../docs/infrastructure/security.md)** - AWS security implementation
- **[GitHub Actions](../../docs/workflows/github-actions-overview.md)** - CI/CD automation

## 🚀 Getting Started

**New to AWS?** Start with [AWS Permissions Setup](../../docs/getting-started/aws-permissions.md) for automated configuration.

**Want to save money?** Check [Cost Control Guide](../../docs/troubleshooting/environment-control.md) for scaling strategies.

**Ready for production?** See [Production Deployment](../../docs/deployment/aws-deployment.md) for the complete process.