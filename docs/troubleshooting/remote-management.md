# Remote Infrastructure Testing & Management

Complete lifecycle management and testing tools for your Party Collection remote infrastructure with intelligent cost optimization.

> **Navigation**: [Documentation Index](../index.md) | [AWS Permissions](../getting-started/aws-permissions.md) | [AWS Deployment](../deployment/aws-deployment.md)

> **📍 Location**: `infra/remote/tests/` - See [Tests README](../../infra/remote/tests/README.md) for detailed script documentation

## 📋 Script Overview

| Script | Purpose | Cost Impact | Duration |
|--------|---------|-------------|----------|
| `dev-deploy.sh` | Initial deployment | £0.53 → £17.85/month | ~8-12 min |
| `dev-active.sh` | Activate for development | £0.53 → £17.85/month | ~3-5 min |
| `dev-idle.sh` | Scale to idle state | £17.85 → £0.53/month | ~2-3 min |
| `dev-update.sh` | Update with latest code | No change | ~5-8 min |
| `dev-status.sh` | Check current status | No change | ~30 sec |
| `dev-teardown.sh` | Complete cleanup | Any → £0.00/month | ~10-15 min |

## ⚡ Prerequisites

Before using these scripts, ensure you have:

- ✅ **AWS CLI configured** with appropriate credentials
- ✅ **IAM permissions setup** - Run `../setup-aws-permissions.sh YOUR_GITHUB_USERNAME/REPO_NAME` first
- ✅ **Docker installed** locally (for image building)
- ✅ **Valid email address** for AWS budget alerts

> **🔐 First-time users**: Start with [AWS Permissions Setup](../getting-started/aws-permissions.md) for automated IAM configuration.

## 🚀 Complete Workflow Example

### Initial Setup and Development Session
```bash
# 1. Deploy dev environment (first time)
cd infra/remote/tests
./dev-deploy.sh your-email@domain.com
# Result: Active development environment (£17.85/month)

# 2. Develop and test your code locally first
cd ../../local/scripts && ./start-local.sh
cd ../../../
node test-runner.js --env=local

# 3. Update remote environment with your changes
cd infra/remote/tests
./dev-update.sh
# Result: Latest code deployed to remote environment

# 4. Test against remote environment  
cd ../../../
node test-runner.js --env=dev

# 5. When done developing, scale to idle
cd infra/remote/tests
./dev-idle.sh
# Result: Infrastructure preserved but idle (£0.53/month)
```

### Daily Development Session
```bash
# Morning: Activate environment
./dev-active.sh
# Result: £0.53 → £17.85/month, ready in 3-5 minutes

# During day: Update code as needed
git add . && git commit -m "Feature updates"
./dev-update.sh
# Result: New code deployed, same cost

# Evening: Scale back to idle
./dev-idle.sh  
# Result: £17.85 → £0.53/month, saves £17.32/month overnight
```

### Project Completion
```bash
# Clean up everything when project is done
./dev-teardown.sh
# Result: All resources deleted, £0.00/month cost
```

## 📊 Cost Management

### Cost States
- **Idle**: £0.53/month - Infrastructure exists, 0 containers
- **Active**: £17.85/month - Infrastructure + 1 backend + 1 frontend container  
- **Deleted**: £0.00/month - No infrastructure

### Smart Cost Optimization
```bash
# Example monthly usage pattern:
# - 8 hours active development per day
# - 16 hours idle per day
# - 22 working days per month

# Without idle management: £17.85 × 24 hours = £17.85/month
# With idle management: (£17.85 × 8 hours) + (£0.53 × 16 hours) = £6.32/month
# Monthly savings: £11.53 (65% reduction)
```

## 🔧 Script Details

### `dev-deploy.sh` - Initial Deployment
**Purpose**: Create complete dev environment from scratch

**First-time setup includes**:
- Creates ECR repositories for Docker images
- Builds ARM64-optimized Docker images  
- Pushes images to ECR
- Deploys CloudFormation infrastructure
- Configures 1 active container for immediate use
- Tests deployment health

**Subsequent runs**:
- Reuses existing ECR repositories
- Updates infrastructure if template changed
- Ensures 1 active container

```bash
# Usage
./dev-deploy.sh [email@domain.com]

# What it creates:
# - VPC with public subnets (cost-optimized)
# - ECS cluster with Fargate ARM64
# - Aurora Serverless v1 database
# - Application Load Balancer
# - Security groups and IAM roles
# - CloudWatch log groups
```

### `dev-active.sh` - Activate Environment
**Purpose**: Scale up from idle to active development

**What it does**:
- Checks current state
- Scales ECS services to DesiredCount=1
- Waits for services to be ready
- Runs health checks
- Provides access URLs

```bash
# Usage
./dev-active.sh

# Intelligent behavior:
# - If already active: Shows current URLs
# - If idle: Scales up and waits for readiness
# - If not deployed: Shows deployment instructions
```

### `dev-idle.sh` - Scale to Idle
**Purpose**: Minimize costs while preserving infrastructure

**What it does**:
- Scales ECS services to DesiredCount=0
- Aurora database auto-pauses after 5 minutes
- All infrastructure remains provisioned
- Can be reactivated quickly

```bash
# Usage
./dev-idle.sh

# Cost savings:
# - No ECS task costs
# - No ALB target costs
# - Database pauses automatically
# - Only infrastructure costs remain
```

### `dev-update.sh` - Code Updates
**Purpose**: Deploy latest code changes

**Update process**:
- Runs local tests before deployment
- Builds new Docker images with timestamp tags
- Pushes to ECR with multiple tags (latest, dev, timestamp)
- Forces ECS services to redeploy with new images
- Waits for deployment completion
- Tests updated services

```bash
# Usage
./dev-update.sh

# Smart behavior:
# - If environment idle: Builds images but doesn't activate
# - If environment active: Builds and immediately deploys
# - Preserves current scaling state
# - Rollback capability via timestamp tags
```

### `dev-status.sh` - Status Check
**Purpose**: Show current state and available actions

**Information provided**:
- Infrastructure status
- Container count and state
- Current monthly cost
- Service URLs (if active)
- Health check results
- Available management actions
- Last update timestamp

```bash
# Usage
./dev-status.sh

# Example output:
# 📊 Dev Environment Status
# 🏗️ Infrastructure Status: UPDATE_COMPLETE
# 🔢 Container Count: 1
# 📊 Status: 🚀 ACTIVE
# 💰 Cost: £17.85/month
# 🌐 Service URLs: [URLs shown]
# 🧪 Quick Health Check: ✅ All services responding
```

### `dev-teardown.sh` - Complete Cleanup
**Purpose**: Delete all infrastructure and resources

**Safety features**:
- Multiple confirmation prompts
- Clear warning of data loss
- Lists all resources being deleted
- Option to preserve ECR repositories
- Progress monitoring during deletion

```bash
# Usage
./dev-teardown.sh

# Cleanup includes:
# - CloudFormation stack deletion
# - All AWS resources removed
# - Database and data permanently deleted
# - Optional ECR repository cleanup
# - Cost becomes £0.00/month
```

## 🧪 Testing Integration

### Test Against Different Environments
```bash
# Test locally (free)
node test-runner.js --env=local

# Test against dev environment (requires active environment)
./dev-active.sh
node test-runner.js --env=dev
./dev-idle.sh

# Test against production (with confirmation)
node test-runner.js --env=prod
```

### Comprehensive Test Workflow
```bash
# Complete testing cycle
./dev-active.sh              # Activate environment
node test-runner.js --env=dev        # Run comprehensive tests
curl http://BACKEND_IP:3001/health   # Manual health check
./dev-idle.sh                # Return to idle
```

## ⚡ Quick Reference

### Most Common Commands
```bash
# Check what's running
./dev-status.sh

# Start development session
./dev-active.sh

# End development session  
./dev-idle.sh

# Update with latest code
./dev-update.sh

# Emergency cleanup
./dev-teardown.sh
```

### Cost-Conscious Development
```bash
# Best practice daily workflow:

# Morning
./dev-active.sh     # £0.53 → £17.85/month

# During development
git add . && git commit -m "Changes"
./dev-update.sh     # Deploy updates

# Evening
./dev-idle.sh       # £17.85 → £0.53/month

# Result: Pay £17.85 only for active hours
```

## 🚨 Troubleshooting

### Common Issues

**"Stack does not exist"**
```bash
# Solution: Deploy first
./dev-deploy.sh
```

**"Services not responding"**
```bash
# Check status and wait longer
./dev-status.sh
# Services can take 5-10 minutes to fully start
```

**"Docker build fails"**
```bash
# Ensure Docker is running
docker info
# Check disk space
df -h
```

**"ECR push fails"**
```bash
# Re-login to ECR
aws ecr get-login-password --region eu-west-2 | \
    docker login --username AWS --password-stdin ACCOUNT.dkr.ecr.eu-west-2.amazonaws.com
```

**"High costs"**
```bash
# Check current status
./dev-status.sh
# Scale to idle if not actively developing
./dev-idle.sh
```

### Recovery Commands
```bash
# Force stack update if stuck
aws cloudformation cancel-update-stack --stack-name party-collection-dev-minimal --region eu-west-2

# Check AWS console for detailed logs
# CloudFormation: https://console.aws.amazon.com/cloudformation/
# ECS: https://console.aws.amazon.com/ecs/
```

## 💡 Best Practices

1. **Always use `dev-idle.sh` when not actively developing**
2. **Use `dev-status.sh` regularly to monitor costs**
3. **Test locally first with `start-local.sh` before remote deployment**
4. **Use `dev-update.sh` for code changes, not manual deployments**
5. **Use `dev-teardown.sh` when project is complete**

**Monthly cost with good practices: £0.53-£8 instead of £17.85**