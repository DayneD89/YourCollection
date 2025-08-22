# Infrastructure Management Scripts

This directory contains scripts for managing AWS development and production environments with cost optimization and event-based scaling.

## 🚀 Development Environment Scripts

### Core Management Scripts

**Deploy Development Environment**:
```bash
./dev-deploy.sh your-email@example.com
```
- Creates complete AWS development stack
- Deploys latest application code
- Sets up monitoring and alerts
- **Cost**: £0.53-£17.85/month depending on usage

**Scale to Active State**:
```bash
./dev-active.sh
```
- Scales ECS services to 1 task each
- Activates Aurora database
- Ready for integration testing
- **Cost**: £17.85/month when active

**Scale to Idle State**:
```bash
./dev-idle.sh
```
- Scales ECS services to 0 tasks
- Allows Aurora to auto-pause
- Preserves infrastructure
- **Cost**: £0.53/month when idle

**Update Application Code**:
```bash
./dev-update.sh
```
- Deploys latest code from main branch
- Maintains current scaling configuration
- Zero-downtime deployment

**Check Environment Status**:
```bash
./dev-status.sh
```
- Shows current resource status
- Displays cost information
- Reports health check results

**Complete Teardown**:
```bash
./dev-teardown.sh
```
- Deletes entire AWS stack
- Removes all resources
- **Cost**: £0.00/month after teardown

## 🏢 Production Environment Scripts

### Event-Based Scaling Scripts

**Scale Production for Events**:
```bash
./prod-active.sh
```
- Scales production services for volunteer events
- Backend: 1 → 2-3 tasks
- Frontend: 1 → 2-3 tasks
- Aurora: Optimized for volunteer load
- **Cost**: £6-28 → £150-250/month

**Scale Production to Idle**:
```bash
./prod-idle.sh
```
- Scales production services to minimum
- Backend: 2+ → 1 task
- Frontend: 2+ → 1 task
- Aurora: Minimum capacity (0.5 ACU)
- **Cost**: £150-250 → £6-28/month
- ⚠️ **Requires confirmation** - production environment

### Production Management Workflow

**Before Party Events/Campaigns**:
1. Scale up production: `./prod-active.sh`
2. Monitor volunteer activity
3. Auto-scaling handles peak loads

**After Events**:
1. Scale back down: `./prod-idle.sh`
2. Verify data integrity
3. Review cost reports

## 💰 Cost Management

### Development Cost Control

| State | Monthly Cost | Use Case |
|-------|-------------|----------|
| **Teardown** | £0.00 | Extended breaks, holidays |
| **Idle** | £0.53 | Evenings, weekends, preserved environment |
| **Active** | £17.85 | Active development, integration testing |

**Daily Development Workflow**:
```bash
# Morning: Start development work
./dev-active.sh      # £0.53 → £17.85

# Evening: Scale back to save costs
./dev-idle.sh        # £17.85 → £0.53
```

### Production Cost Control

| State | Monthly Cost | Volunteer Load | Use Case |
|-------|-------------|----------------|----------|
| **Idle** | £6-28 | 0-5 volunteers | Between events |
| **Event-Ready** | £150-250 | 50-300 volunteers | During campaigns |
| **Peak Events** | £300+ | 300+ volunteers | Major events |

**Annual Cost Optimization**:
- Idle 10 months: £150-280
- Active 2 months: £300-500
- **Total**: £450-780/year for local party

## 🔧 Script Configuration

### Environment Variables

**Required for all scripts**:
```bash
export AWS_REGION="eu-west-2"
export AWS_PROFILE="your-aws-profile"  # Optional
```

**Development-specific**:
```bash
export STACK_NAME="party-collection-dev"
export ENVIRONMENT="dev"
```

**Production-specific**:
```bash
export STACK_NAME="party-collection-prod"
export ENVIRONMENT="prod"
```

### Prerequisites

**AWS CLI and Permissions**:
- AWS CLI v2 installed and configured
- Appropriate IAM permissions (see [AWS Permissions Guide](../../../docs/getting-started/aws-permissions.md))
- CloudFormation, ECS, RDS, and ECR permissions required

**Docker and Build Tools**:
- Docker for building container images
- Node.js and npm for application builds
- Git for source code access

## 🔍 Monitoring and Troubleshooting

### Health Check Commands

**Check ECS Service Status**:
```bash
aws ecs describe-services \
  --cluster party-collection-dev-cluster \
  --services party-collection-dev-backend-service
```

**Check Aurora Status**:
```bash
aws rds describe-db-clusters \
  --db-cluster-identifier party-collection-dev-aurora
```

**View Application Logs**:
```bash
aws logs tail /aws/ecs/party-collection-dev-backend --follow
```

### Common Issues and Solutions

**Script Permission Denied**:
```bash
chmod +x *.sh
```

**AWS Permissions Error**:
```bash
# Validate AWS permissions
../validate-aws-permissions.sh
```

**Deployment Timeout**:
- Check AWS CloudFormation console for stack events
- Verify container images exist in ECR
- Check security group and network configuration

**Cost Budget Alerts**:
- Use `./dev-idle.sh` or `./dev-teardown.sh` for immediate cost reduction
- Check AWS Cost Explorer for detailed cost breakdown
- Review [Cost Management Guide](../../../docs/deployment/cost-guide.md)

## 🚨 Emergency Procedures

### Cost Emergency (Budget Exceeded)

**Immediate Actions**:
```bash
# Scale development to minimum cost
./dev-idle.sh

# Or complete shutdown if necessary
./dev-teardown.sh

# Scale production to minimum (if safe)
./prod-idle.sh
```

### Service Outage

**Development Environment**:
```bash
# Check status and attempt restart
./dev-status.sh
./dev-update.sh

# If issues persist, redeploy
./dev-teardown.sh
./dev-deploy.sh your-email@example.com
```

**Production Environment**:
1. Check ECS service health in AWS Console
2. Review CloudWatch logs for errors
3. Scale up if capacity issue: ensure production is in active state
4. Contact technical support if infrastructure issue

## 📚 Related Documentation

**Infrastructure**:
- **[Infrastructure Overview](../README.md)** - Complete AWS infrastructure guide
- **[Development Architecture](../../../docs/infrastructure/dev-architecture.md)** - Development environment details
- **[Production Architecture](../../../docs/infrastructure/prod-architecture.md)** - Production environment details

**Cost Management**:
- **[Cost Guide](../../../docs/deployment/cost-guide.md)** - Comprehensive cost analysis
- **[Cost Monitoring](../../../docs/workflows/cost-monitoring-workflow.md)** - Automated cost tracking

**Operations**:
- **[Remote Management](../../../docs/troubleshooting/remote-management.md)** - Daily AWS operations
- **[Environment Control](../../../docs/troubleshooting/environment-control.md)** - Infrastructure management

**Getting Started**:
- **[AWS Permissions Setup](../../../docs/getting-started/aws-permissions.md)** - Initial AWS configuration
- **[AWS Deployment Guide](../../../docs/deployment/aws-deployment.md)** - Complete deployment process

---

*These scripts provide cost-effective infrastructure management for local party organizations, with event-based scaling to optimize costs while maintaining volunteer system availability.*