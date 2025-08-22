# GitHub Actions Workflows

Comprehensive CI/CD pipeline for the Party Collection application with **cost-optimized ARM64 deployment** and **protected branch strategies**.

> **Navigation**: [Documentation Index](../index.md) | [AWS Deployment](../deployment/aws-deployment.md) | [Remote Management](../troubleshooting/remote-management.md)

## 🚀 Overview

This repository uses GitHub Actions for automated deployment with strict cost controls and security protections:

| Workflow | Purpose | Trigger | Cost Impact | Security Level |
|----------|---------|---------|-------------|----------------|
| **deploy-dev.yml** | Development deployment | Push to develop/feature/* | £0.53/month (idle by default) | Standard |
| **deploy-prod.yml** | Production deployment | Manual only | £222.07/month | High (protected) |
| **cost-monitoring.yml** | Daily cost tracking | Schedule + manual | £0/month | Monitoring |

## 📋 Workflow Architecture

### Protected Branch Strategy
```
main branch (PROTECTED)
├── Blocks automatic deployments
├── Requires manual "PRODUCTION" confirmation  
├── Deploys global + production infrastructure
└── Cost: £222.07/month

develop & feature/* branches
├── Automatic deployment on push
├── Scales to 0 by default (£0.53/month)
├── Manual activation for development
└── Auto-cleanup feature branches
```

### ARM64-Optimized Pipeline
```
Code Push → Build ARM64 Images → Deploy Infrastructure → Monitor Costs
     ↓              ↓                    ↓                 ↓
   Tests         Docker Buildx      CloudFormation    Budget Alerts
   Lint          Platform: arm64    Templates         Daily Reports  
   Build         SPOT Pricing       Conditional       Emergency Stop
```

## 🛠️ Quick Setup

### 1. Required GitHub Secrets

#### AWS OIDC Roles
```yaml
# Development Environment
AWS_ROLE_ARN_DEV: "arn:aws:iam::123456789012:role/github-actions-dev"

# Production Environment (requires additional permissions)
AWS_ROLE_ARN_PROD: "arn:aws:iam::123456789012:role/github-actions-prod"

# Global Infrastructure
AWS_ROLE_ARN_GLOBAL: "arn:aws:iam::123456789012:role/github-actions-global"

# Cost Monitoring
AWS_ROLE_ARN_COST_MONITORING: "arn:aws:iam::123456789012:role/github-actions-cost"
```

#### Application Configuration
```yaml
# Required
ALERT_EMAIL: "admin@party-collection.local"

# Optional (Production)
DOMAIN_NAME: "party-collection.com"
CERTIFICATE_ARN: "arn:aws:acm:eu-west-2:123456789012:certificate/abc-123"
```

### 2. Repository Settings

#### Branch Protection Rules
```yaml
# Protect main branch
main:
  required_status_checks: true
  enforce_admins: true
  required_pull_request_reviews:
    required_approving_review_count: 1
  restrictions:
    users: []
    teams: ["admin-team"]
```

#### Environments
```yaml
# GitHub Environments for deployment protection
environments:
  development:
    required_reviewers: []
    deployment_branch_policy: 
      protected_branches: false
      custom_branch_policies: true
      
  production:
    required_reviewers: ["admin-user"]
    deployment_branch_policy:
      protected_branches: true
```

## 🔄 Workflow Details

### Development Workflow (deploy-dev.yml)

**Purpose**: Automatic deployment of development environment with cost optimization

**Triggers**:
- Push to `develop` or `feature/*` branches
- Changes to backend, frontend, or infrastructure
- Manual workflow dispatch

**Default Behavior**:
```yaml
# All branches scale to 0 by default
DesiredCount: 0           # £0.53/month idle
EnvironmentEnabled: true  # Infrastructure exists but inactive
```

**Manual Activation**:
```yaml
# Via GitHub Actions UI
desired_count: "1"        # £17.85/month active
environment_enabled: "true"
```

**Features**:
- ✅ ARM64 Docker image building with buildx
- ✅ Automatic ECR repository creation
- ✅ Cost-optimized minimal infrastructure
- ✅ PR comments with access URLs and costs
- ✅ Health checks for active deployments
- ✅ Auto-cleanup for failed feature deployments

### Production Workflow (deploy-prod.yml)

**Purpose**: Secure production deployment with comprehensive protections

**Triggers**:
- ❌ Push to `main` branch (BLOCKED by security check)
- ✅ Manual workflow dispatch only

**Security Protection**:
```yaml
# Required manual confirmation
confirm_production: "PRODUCTION"  # Must type exactly "PRODUCTION"

# Push events are blocked
if: github.event_name != 'push'
```

**Features**:
- ✅ Global infrastructure deployment
- ✅ Blue-green deployment capability
- ✅ Comprehensive health checks
- ✅ ARM64 production optimization
- ✅ SSL certificate management
- ✅ Deployment status notifications

### Cost Monitoring Workflow (cost-monitoring.yml)

**Purpose**: Daily cost tracking with automatic alerts and emergency controls

**Schedule**: Daily at 9 AM UTC

**Features**:
- ✅ Environment-specific cost tracking
- ✅ GitHub Issues for cost reports
- ✅ Emergency shutdown at £500/month
- ✅ Resource inventory tracking
- ✅ Budget status monitoring

## 💰 Cost Control Integration

### Automatic Budget Management

#### Development Environment
```yaml
Budget Limit: £10/month
Alert Thresholds:
  - 50% (£5): Warning
  - 80% (£8): Critical  
  - 95% (£9.50): Emergency action

Emergency Response:
  - Scale DesiredCount to 0
  - Maintain infrastructure (£0.53/month)
```

#### Production Environment
```yaml
Budget Limit: £250/month
Alert Thresholds:
  - 50% (£125): Warning
  - 80% (£200): Critical
  - 95% (£237.50): Alert only (no auto-shutdown)

Monitoring:
  - Daily cost reports
  - Resource inventory
  - Performance metrics
```

### Manual Cost Controls

#### Scale Development to Idle
```bash
# Via GitHub Actions
gh workflow run deploy-dev.yml \
  -f desired_count=0 \
  -f environment_enabled=true
```

#### Emergency Shutdown
```bash
# Complete environment shutdown
gh workflow run deploy-dev.yml \
  -f desired_count=0 \
  -f environment_enabled=false
```

## 🔧 Workflow Configuration

### Custom Parameters

#### Development Deployment
```yaml
# Workflow dispatch inputs
desired_count:
  description: 'Number of tasks to run (0 for idle)'
  default: '0'
  type: string

environment_enabled:
  description: 'Enable environment (true/false)'
  default: 'true'
  type: string
```

#### Production Deployment
```yaml
# Workflow dispatch inputs
deployment_type:
  description: 'Deployment type'
  required: true
  default: 'standard'
  type: choice
  options: [standard, blue-green, rollback]

confirm_production:
  description: 'Type "PRODUCTION" to confirm deployment'
  required: true
  type: string
```

### Environment Variables

#### Global Settings
```yaml
env:
  AWS_REGION: eu-west-2
  STACK_NAME: party-collection-dev-minimal
  GLOBAL_STACK_NAME: party-collection-global
  PROD_STACK_NAME: party-collection-prod
```

#### Runtime Configuration
```yaml
# Set by workflow logic
DESIRED_COUNT: ${{ github.ref_name == 'develop' ? '1' : '0' }}
ENVIRONMENT_ENABLED: true
ARM64_PLATFORM: linux/arm64
```

## 📊 Monitoring and Observability

### Workflow Outputs

#### Development Deployment
```yaml
outputs:
  deployment_active: true/false
  backend_ip: "1.2.3.4" (public IP for testing)
  frontend_ip: "5.6.7.8" (public IP for testing)
  monthly_cost: "£17.85" or "£0.53"
```

#### Production Deployment
```yaml
outputs:
  application_url: "https://party-collection.com"
  alb_dns: "party-collection-prod-123.eu-west-2.elb.amazonaws.com"
  deployment_status: "success" or "failed"
  health_check_passed: true/false
```

### GitHub Actions Insights

#### Key Metrics to Monitor
- **Deployment frequency**: How often code is deployed
- **Lead time**: Time from commit to production
- **Recovery time**: Time to fix failed deployments
- **Success rate**: Percentage of successful deployments

#### Cost Tracking
- **Daily cost reports**: Via cost-monitoring workflow
- **Budget alerts**: Email notifications at thresholds
- **Resource inventory**: Track running services
- **Emergency shutdowns**: Automatic cost protection

## 🛡️ Security Best Practices

### OIDC Authentication
```yaml
# No long-lived AWS credentials stored
permissions:
  id-token: write    # Required for OIDC
  contents: read     # Repository access only

# Temporary credentials via role assumption
aws-actions/configure-aws-credentials@v4:
  role-to-assume: ${{ secrets.AWS_ROLE_ARN_DEV }}
  role-session-name: GitHubActions-Dev
```

### Principle of Least Privilege
```yaml
# Environment-specific roles
Development:
  - CloudFormation: Limited to dev stacks
  - ECS: Dev clusters only
  - ECR: Read/write access
  
Production:
  - CloudFormation: Prod stacks only
  - Additional permissions for ALB, Certificate Manager
  - No ability to delete production resources
```

### Secret Management
```yaml
# Secrets are environment-scoped
development:
  AWS_ROLE_ARN_DEV: ${{ secrets.AWS_ROLE_ARN_DEV }}
  
production:
  AWS_ROLE_ARN_PROD: ${{ secrets.AWS_ROLE_ARN_PROD }}
  DOMAIN_NAME: ${{ secrets.DOMAIN_NAME }}
```

## 🔄 Workflow Execution Examples

### Development Workflow

#### Automatic Deployment (Push to develop)
```bash
# Developer workflow
git checkout develop
git add .
git commit -m "Add new feature"
git push origin develop

# GitHub Actions automatically:
# 1. Builds and tests code
# 2. Creates ARM64 Docker images  
# 3. Deploys with DesiredCount=0 (£0.53/month)
# 4. Comments on commit with access instructions
```

#### Manual Activation
```bash
# Via GitHub UI or CLI
gh workflow run deploy-dev.yml \
  -f desired_count=1 \
  -f environment_enabled=true

# Result: £0.53 → £17.85/month, active development environment
```

### Production Workflow

#### Secure Production Deployment
```bash
# Must use GitHub UI for security
# Navigate to: Actions → Deploy Production Environment → Run workflow
# Input: deployment_type: "standard" 
# Input: confirm_production: "PRODUCTION"

# GitHub Actions:
# 1. Validates "PRODUCTION" confirmation
# 2. Deploys global infrastructure
# 3. Builds production ARM64 images
# 4. Deploys production environment
# 5. Runs comprehensive health checks
# 6. Sends deployment notifications
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Development Deployment Fails
```yaml
# Check workflow logs for:
Error: Failed to assume role
Solution: Verify AWS_ROLE_ARN_DEV secret

Error: ECR repository does not exist
Solution: Workflow creates ECR repos automatically on first run

Error: CloudFormation stack update failed
Solution: Check AWS CloudFormation console for detailed error
```

#### 2. Production Deployment Blocked
```yaml
Error: "SECURITY: Production deployment blocked for push events"
Solution: Use manual workflow dispatch, not push to main

Error: "Production deployment not confirmed"
Solution: Type exactly "PRODUCTION" in confirmation field

Error: Certificate ARN invalid
Solution: Verify CERTIFICATE_ARN secret points to valid ACM certificate
```

#### 3. Cost Monitoring Issues
```yaml
Error: Unable to fetch cost data
Solution: Verify AWS_ROLE_ARN_COST_MONITORING has Cost Explorer permissions

Warning: Budget threshold exceeded
Action: Check resource usage, scale down if needed

Error: Emergency shutdown failed
Solution: Manual intervention required via AWS console
```

### Recovery Procedures

#### Failed Development Deployment
```bash
# Reset environment
gh workflow run deploy-dev.yml \
  -f desired_count=0 \
  -f environment_enabled=false

# Wait for cleanup, then re-enable
gh workflow run deploy-dev.yml \
  -f desired_count=0 \
  -f environment_enabled=true
```

#### Failed Production Deployment
```bash
# Use rollback deployment type
gh workflow run deploy-prod.yml \
  -f deployment_type=rollback \
  -f confirm_production=PRODUCTION
```

## 📚 Additional Resources

### Workflow Documentation
- [deploy-dev.yml](dev-deployment-workflow.md) - Development deployment details
- [deploy-prod.yml](prod-deployment-workflow.md) - Production deployment details  
- [cost-monitoring.yml](cost-monitoring-workflow.md) - Cost monitoring details

### Related Documentation
- [Infrastructure README](../../infra/remote/README.md) - Complete infrastructure guide
- [Cost Guide](../deployment/cost-guide.md) - Detailed cost analysis
- [Local Development](../../infra/local/README.md) - Local development setup

### GitHub Actions References
- [AWS OIDC Setup](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- [Docker Buildx](https://docs.docker.com/buildx/) - Multi-platform builds
- [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)

---

## 🎯 Best Practices

### Development Workflow
1. **Keep develop idle**: Default DesiredCount=0 saves costs
2. **Use feature branches**: Isolated testing environments
3. **Manual activation**: Only activate when needed for testing
4. **Monitor costs**: Review monthly usage patterns
5. **Clean up**: Remove old feature branches regularly

### Production Workflow
1. **Test thoroughly**: Always validate in development first
2. **Use manual dispatch**: Never allow automatic production deployments
3. **Confirm carefully**: "PRODUCTION" confirmation prevents accidents
4. **Monitor closely**: Set up comprehensive alerting
5. **Plan rollbacks**: Have rollback strategy ready

### Cost Management
1. **Set appropriate budgets**: Match your usage patterns
2. **Monitor daily**: Use cost-monitoring workflow
3. **React to alerts**: Investigate budget threshold breaches
4. **Scale responsibly**: Don't over-provision development
5. **Review regularly**: Monthly cost optimization reviews

**💰 Pro Tip**: The workflows are designed for maximum cost efficiency. Development deployments cost £0.53/month by default, only scaling to £17.85/month when manually activated for testing. This saves £200+/year compared to always-on development environments.

---

## 🔗 What's Next

After setting up these automated workflows, you'll want to use manual scripts for daily development:

- **[Remote Management](../troubleshooting/remote-management.md)** - Scripts for activating, updating, and managing your dev environment
- **[Infrastructure Details](../../infra/remote/README.md)** - Complete technical documentation of the AWS infrastructure these workflows deploy
- **[Cost Optimization Guide](../deployment/cost-guide.md)** - Detailed cost analysis and optimization strategies

The GitHub Actions workflows handle automatic deployments, while the management scripts provide fine-grained control for active development work.