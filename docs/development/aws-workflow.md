# AWS Development Workflow

> **Navigation**: [Quick Start](../getting-started/quick-start.md) | [Index](../index.md) | [Local Workflow](local-workflow.md)

Complete workflow guide for cloud-based development using AWS infrastructure with cost optimization.

## 📋 What You Need to Know

**⏱️ Time needed**: 5-10 minutes per session  
**🎓 Skill level**: Intermediate (AWS knowledge helpful)  
**💰 Cost**: £0.53/month idle, £17.85/month active  
**💻 Prerequisites**: AWS account, GitHub repository, permissions configured

**🎯 You'll learn**: Cost-optimized cloud development with:
- ✅ Smart scaling between idle and active states
- ✅ Integration testing in cloud environment
- ✅ Production-like infrastructure testing
- ✅ Automated deployment via GitHub Actions

> 💡 **TL;DR**: Use GitHub Actions or local scripts to scale dev environment up/down. Active mode (£17.85/month) for integration testing, idle mode (£0.53/month) between sessions. 85% cost savings vs always-on approach.

## 🚀 Daily AWS Development Routine

### Morning: Activate Environment
```bash
cd infra/remote/tests

# Option 1: Local script (fastest)
./dev-active.sh
# Scales from idle → active (£0.53 → £17.85/month)
# Takes 3-5 minutes to become ready

# Option 2: GitHub Actions
# Go to Actions → "Deploy Development Environment" → Run workflow
# Set desired_count: 1
```

**Wait for Ready Status:**
```bash
# Check deployment status
./dev-status.sh

# Environment ready when you see:
# ✅ Backend: https://your-dev-url.amazonaws.com/health
# ✅ Database: Aurora active
# ✅ Logs: CloudWatch accessible
```

### Development Work
```bash
# Use GitHub Actions for code deployment
git push origin develop
# Automatically triggers deployment to dev environment

# Or manual deployment
./dev-update.sh
# Deploys current local changes to AWS
```

### Integration Testing
```bash
# Test against real AWS infrastructure
# Frontend connects to AWS backend
# Database uses Aurora Serverless
# Real load balancer and networking

# Monitor via AWS Console:
# - ECS service logs
# - CloudWatch metrics
# - RDS performance
```

### Evening: Scale to Idle
```bash
cd infra/remote/tests

# Option 1: Local script
./dev-idle.sh
# Scales from active → idle (£17.85 → £0.53/month)
# Preserves all infrastructure and data

# Option 2: GitHub Actions
# Actions → "Deploy Development Environment" → Run workflow
# Set desired_count: 0
```

## 🔧 Advanced Workflows

### Feature Branch Development
```bash
# 1. Create feature branch
git checkout -b feature/aws-integration

# 2. Activate AWS environment
./dev-active.sh

# 3. Push changes for deployment
git push origin feature/aws-integration
# GitHub Actions deploys to dev environment

# 4. Integration testing
curl https://your-dev-url.amazonaws.com/health
# Test full stack in cloud environment

# 5. Merge when ready
git checkout develop
git merge feature/aws-integration

# 6. Scale down to save costs
./dev-idle.sh
```

### Emergency Procedures
```bash
# If costs are too high
./dev-idle.sh          # Immediate cost reduction

# Complete shutdown (£0.00/month)
./dev-teardown.sh      # Removes all infrastructure
# WARNING: This deletes the environment entirely

# Re-create from scratch
./dev-deploy.sh your-email@example.com
# Takes 8-12 minutes to fully deploy
```

## 💰 Cost Management

### Smart Scaling Strategy
```bash
# Recommended usage pattern:
# Local development: 90% of time (£0.00)
# AWS active: 10% of time (integration testing)
# AWS idle: Nights/weekends (£0.53/month base)

# Annual cost comparison:
# Always active: £214/year
# Smart scaling: £33/year (85% savings)
```

### Cost Monitoring
```bash
# Check current costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost

# Automated alerts are configured at:
# 50% budget: Warning
# 80% budget: Critical
# 95% budget: Auto scale-down
```

### Resource Optimization
```bash
# Development environment uses:
# - ARM64 Fargate (20% cheaper than x86)
# - FARGATE_SPOT pricing (70% cheaper)
# - Aurora auto-pause (£0 when idle)
# - Public subnets (saves £45/month vs NAT gateways)
```

## 📊 Monitoring and Debugging

### AWS Console Access
```bash
# Key AWS resources to monitor:
# ECS → Clusters → party-collection-dev-cluster
# RDS → Aurora → party-collection-dev-aurora
# CloudWatch → Log Groups → /ecs/party-collection-dev
# ALB → Load Balancers → party-collection-dev-alb
```

### Log Analysis
```bash
# Backend application logs
aws logs tail /ecs/party-collection-dev-backend --follow

# Database performance
# RDS Console → Performance Insights
# Monitor connection counts, query performance

# Infrastructure metrics
# CloudWatch → Metrics → ECS/ContainerInsights
# CPU, memory, network utilization
```

### Troubleshooting
```bash
# Service not starting
./dev-status.sh
# Check ECS service events in output

# Database connectivity issues
aws rds describe-db-clusters \
  --db-cluster-identifier party-collection-dev-aurora

# Application errors
aws logs get-log-events \
  --log-group-name /ecs/party-collection-dev-backend \
  --log-stream-name latest
```

## 🧪 Testing in AWS Environment

### Integration Testing Benefits
```bash
# Real infrastructure testing:
# ✅ Load balancer behavior
# ✅ Auto-scaling triggers
# ✅ Database connection pooling
# ✅ Network security groups
# ✅ SSL certificate handling
```

### Production-like Testing
```bash
# Environment mirrors production architecture:
# - ECS Fargate containers
# - Aurora Serverless database
# - Application Load Balancer
# - CloudWatch monitoring
# - VPC networking

# Differences from production:
# - Single AZ vs Multi-AZ
# - Minimal instance sizes
# - Public subnets vs private
# - No custom domain/SSL
```

### Performance Testing
```bash
# Load testing against AWS infrastructure
# Monitor auto-scaling behavior
# Test database performance under load
# Validate monitoring and alerting
```

## 🔄 CI/CD Integration

### Automated Deployment
```yaml
# GitHub Actions automatically:
# 1. Build Docker images
# 2. Push to ECR
# 3. Update ECS services
# 4. Run health checks
# 5. Send notifications
```

### Manual Deployment
```bash
# Deploy specific branch
git checkout feature-branch
./dev-update.sh

# Deploy with custom parameters
./dev-deploy.sh your-email@example.com
```

### Rollback Procedures
```bash
# ECS automatically maintains previous task definition
# Rollback via AWS Console or CLI:
aws ecs update-service \
  --cluster party-collection-dev-cluster \
  --service party-collection-dev-backend-service \
  --task-definition previous-revision
```

## 🔗 Related Workflows

- **[Local Development Workflow](local-workflow.md)** - Free local development
- **[AWS Permissions Setup](../getting-started/aws-permissions.md)** - Initial AWS configuration
- **[Cost Management Guide](../deployment/cost-guide.md)** - Detailed cost optimization
- **[Remote Management](../troubleshooting/remote-management.md)** - Advanced AWS troubleshooting

---

**💡 Pro Tip**: Use local development for daily coding (free) and AWS development for integration testing and team collaboration. The smart scaling approach can save over £180/year compared to always-on development infrastructure.