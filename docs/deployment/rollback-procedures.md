# Emergency Rollback Procedures

> **Emergency**: [Common Issues](../troubleshooting/common-issues.md) | [Environment Control](../troubleshooting/environment-control.md) | [Blue/Green Strategy](blue-green-strategy.md)

Complete rollback procedures for emergency situations when deployments go wrong or costs spiral out of control.

## 🚨 Emergency Response Priorities

### Level 1: Immediate (< 5 minutes)
- **Production down** → Blue/Green switch back
- **Cost spike** → Scale to idle/shutdown
- **Security breach** → Isolate and assess

### Level 2: Urgent (< 30 minutes) 
- **Performance degradation** → Rollback deployment
- **Data corruption risk** → Stop writes, assess
- **Resource exhaustion** → Scale down/optimize

### Level 3: Important (< 2 hours)
- **Feature issues** → Rollback specific features
- **Configuration errors** → Restore previous config
- **Dependency problems** → Revert versions

---

## 🔄 Rollback Procedures Based on Deployment Type

### Current AWS Development Setup

**⚠️ Important**: The current default AWS development deployment uses:
- **Template**: `templates/minimal-dev-template.yaml` (not the full template)
- **Public subnets only** (no private subnets or NAT Gateway)  
- **No ALB by default** (saves ~£18/month vs ALB-enabled deployments)
- **Direct public IP access** to frontend/backend services
- **True zero scaling** (DesiredCount can be 0 for £0.53/month idle)

**Alternative Templates Available:**
- `template-no-alb.yaml` - Private subnets with optional ALB
- `template-blue-green.yaml` - Full blue/green production setup
- `template-v2.yaml` - Enhanced version with additional features

### Development Environment Rollback

**Option 1: Scale to Previous Version (Current Setup)**
```bash
# The current setup doesn't use blue/green by default
# Rollback is done by redeploying previous version

cd infra/remote/tests

# 1. Get current container images
aws ecs describe-services \
  --cluster party-collection-dev-cluster \
  --services party-collection-dev-backend

# 2. Redeploy with previous image tag
./dev-update.sh  # This rebuilds and deploys current code
```

**Option 2: Enable Blue/Green (Would Need Configuration)**
To enable blue/green deployments, the infrastructure would need:
```yaml
Parameters:
  EnableALB: "true"           # Currently defaults to "false"  
  EnableBlueGreen: "true"     # Currently defaults to "false"
```

**Then** rollback would work as:
```bash
# Switch load balancer target groups
aws elbv2 modify-listener --listener-arn LISTENER_ARN \
  --default-actions Type=forward,TargetGroupArn=BLUE_TARGET_GROUP_ARN
```

**Timeline**: Current rollback via redeployment: 3-5 minutes

### Manual Load Balancer Rollback
If automated tools aren't available:

```bash
# 1. Access AWS Console → EC2 → Load Balancers
# 2. Find your Application Load Balancer
# 3. Go to Listeners tab
# 4. Edit HTTPS:443 listener
# 5. Change Default action Target Group
# 6. Save changes

# Verify change took effect
aws elbv2 describe-target-health --target-group-arn BLUE_TARGET_GROUP_ARN
```

---

## 💰 Cost Emergency Procedures (Actual Current Costs)

### Immediate Cost Control (< 2 minutes)

**Development Environment - Current Costs**
```bash
# Scale development to idle state
cd infra/remote/tests
./dev-idle.sh

# Actual Result: Active (£17.85/month) → Idle (£0.53/month)
# What's preserved: Infrastructure, database auto-pauses, all data
# What's stopped: ECS containers (DesiredCount=0)
```

**Complete Shutdown (< 1 minute)**
```bash
# Full teardown - deletes all infrastructure
./dev-teardown.sh

# Actual Result: Any cost → £0.00/month
# What's lost: All infrastructure deleted
# What's preserved: Docker images in ECR
# To restore: Must run ./dev-deploy.sh again (~8-10 minutes)
```

**Current Cost Structure (from actual scripts)**
- **Active Development**: £17.85/month (1+ containers running)
- **Idle State**: £0.53/month (0 containers, infrastructure preserved)  
- **Completely Deleted**: £0.00/month (requires full redeployment)

**Production Environment**
```bash
# Scale production to minimum viable
aws ecs update-service \
  --cluster party-collection-prod-cluster \
  --service party-collection-prod-backend-service \
  --desired-count 2

# Disable auto-scaling temporarily
aws application-autoscaling deregister-scalable-target \
  --service-namespace ecs \
  --resource-id service/party-collection-prod-cluster/party-collection-prod-backend-service \
  --scalable-dimension ecs:service:DesiredCount
```

### Cost Spike Investigation
```bash
# Check what's consuming resources
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '3 days ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE

# Check running resources
aws ecs list-tasks --cluster party-collection-prod-cluster
aws rds describe-db-clusters
aws elbv2 describe-load-balancers
```

---

## 🗂️ Database Rollback Procedures

### Point-in-Time Recovery (Production)

**For Aurora Clusters**
```bash
# 1. Find restore point (up to 35 days back)
aws rds describe-db-cluster-snapshots \
  --db-cluster-identifier party-collection-prod-aurora

# 2. Create new cluster from point-in-time
aws rds restore-db-cluster-to-point-in-time \
  --db-cluster-identifier party-collection-prod-aurora-restored \
  --source-db-cluster-identifier party-collection-prod-aurora \
  --restore-to-time 2024-01-01T12:00:00.000Z \
  --engine aurora-postgresql

# 3. Update application to point to restored cluster
# 4. Test thoroughly before switching users
```

**For Development Environment**
```bash
# Development database can be reset from clean state
cd infra/remote/tests
./dev-teardown.sh
./dev-deploy.sh your-email@example.com

# All test data will be regenerated
# Production data is never affected
```

### Local Database Rollback
```bash
# Reset to clean state
cd infra/local/scripts
./stop-local.sh --clean
./start-local.sh

# Restore from backup if available
docker exec yourpartycollection-postgres pg_restore -U postgres -d party_collection /backup/backup.sql
```

---

## 🔧 Application Rollback Procedures

### Git-Based Rollback

**Find last known good version**
```bash
# View recent commits
git log --oneline -10

# Check current deployment
git describe --tags HEAD

# Identify target version
ROLLBACK_COMMIT="abc123def"  # Replace with actual commit
```

**Local Environment Rollback**
```bash
# 1. Stop current environment
cd infra/local/scripts
./stop-local.sh

# 2. Switch to previous version
git checkout $ROLLBACK_COMMIT

# 3. Rebuild with previous version
./start-local.sh

# 4. Verify functionality
npm test  # Run all tests
```

**AWS Development Rollback**
```bash
# 1. Switch to previous version
git checkout $ROLLBACK_COMMIT

# 2. Redeploy development environment
cd infra/remote/tests
./dev-update.sh

# 3. Test rollback version
./dev-status.sh
curl http://$(./dev-status.sh | grep Frontend | cut -d' ' -f2)/health
```

### Container Image Rollback

**For ECS Services**
```bash
# 1. Find previous image versions
aws ecr describe-images --repository-name party-collection-backend

# 2. Update service to use previous image
aws ecs update-service \
  --cluster party-collection-prod-cluster \
  --service party-collection-prod-backend-service \
  --task-definition party-collection-prod-backend:PREVIOUS_VERSION

# 3. Wait for deployment to complete
aws ecs wait services-stable \
  --cluster party-collection-prod-cluster \
  --services party-collection-prod-backend-service
```

---

## 🏗️ Infrastructure Rollback

### CloudFormation Stack Rollback

**Automatic Rollback**
```bash
# CloudFormation can automatically rollback failed updates
aws cloudformation describe-stacks \
  --stack-name party-collection-prod \
  --query 'Stacks[0].StackStatus'

# If status is "UPDATE_ROLLBACK_IN_PROGRESS", wait for completion
aws cloudformation wait stack-update-rollback-complete \
  --stack-name party-collection-prod
```

**Manual Stack Rollback**
```bash
# Cancel current update and rollback
aws cloudformation cancel-update-stack \
  --stack-name party-collection-prod

# Or rollback to previous template version
aws cloudformation update-stack \
  --stack-name party-collection-prod \
  --use-previous-template \
  --parameters file://parameters/prod-rollback.json
```

### Network Configuration Rollback

**Security Group Changes**
```bash
# Revert security group rules
aws ec2 revoke-security-group-ingress \
  --group-id sg-12345678 \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

# Restore previous rules
aws ec2 authorize-security-group-ingress \
  --group-id sg-12345678 \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

---

## 📊 Rollback Verification Procedures

### Automated Health Checks
```bash
#!/bin/bash
# rollback-verification.sh

echo "=== Rollback Verification ==="

# Check application health
if curl -f http://localhost:3001/health; then
  echo "✅ Backend health check passed"
else
  echo "❌ Backend health check failed"
  exit 1
fi

if curl -f http://localhost:3000; then
  echo "✅ Frontend health check passed"
else
  echo "❌ Frontend health check failed"
  exit 1
fi

# Run critical tests
cd backend && npm test --testNamePattern="critical"
if [ $? -eq 0 ]; then
  echo "✅ Critical tests passed"
else
  echo "❌ Critical tests failed"
  exit 1
fi

echo "✅ Rollback verification completed successfully"
```

### Production Verification Checklist
- [ ] Application responds to health checks
- [ ] Database connections working
- [ ] Authentication flow functional
- [ ] Critical user journeys working
- [ ] No error spikes in logs
- [ ] Performance metrics normal
- [ ] Cost metrics within expected range

---

## 📝 Post-Rollback Procedures

### Incident Documentation
1. **Document timeline** of events leading to rollback
2. **Record rollback steps** taken and their effectiveness
3. **Identify root cause** of original issue
4. **Plan prevention** measures for future
5. **Schedule post-mortem** with team

### Environment Cleanup
```bash
# Clean up failed deployment artifacts
docker system prune -f
docker volume prune -f

# Clean up AWS resources from failed deployment
aws cloudformation delete-stack --stack-name party-collection-failed-deploy
aws ecr batch-delete-image --repository-name party-collection-backend --image-ids imageTag=failed-version
```

### Team Communication
```markdown
## Rollback Notification Template

**Subject**: [RESOLVED] Production Rollback Completed - Party Collection

**Issue**: Brief description of what went wrong
**Impact**: What users experienced
**Resolution**: Rollback to version X.Y.Z completed at [TIME]
**Status**: Systems fully operational
**Next Steps**: Investigation ongoing, post-mortem scheduled

**Timeline**:
- [TIME] Issue detected
- [TIME] Rollback initiated  
- [TIME] Rollback completed
- [TIME] Systems verified healthy
```

---

## 🔄 Recovery Planning

### Rollback Testing
```bash
# Regularly test rollback procedures in development
cd infra/remote/tests

# 1. Deploy current version
./dev-deploy.sh

# 2. Make a change and deploy
# ... make changes ...
./dev-update.sh

# 3. Practice rollback
git checkout HEAD~1
./dev-update.sh

# 4. Verify rollback worked
./dev-status.sh
```

### Rollback Documentation Maintenance
- **Review procedures monthly** - Ensure commands are current
- **Test rollback paths quarterly** - Verify procedures work
- **Update automation annually** - Improve rollback tools
- **Train team regularly** - Ensure everyone knows procedures

---

## 🆘 Emergency Contacts & Resources

### During Rollback Emergency
1. **Stay calm** - Follow procedures step by step
2. **Document actions** - Log what you do for review
3. **Communicate status** - Keep stakeholders informed
4. **Verify success** - Run health checks after each step

### Key Resources
- **[Environment Control](../troubleshooting/environment-control.md)** - Daily AWS scaling and cost controls
- **[Remote Management](../troubleshooting/remote-management.md)** - Complete AWS operation procedures  
- **[Common Issues](../troubleshooting/common-issues.md)** - Quick fixes and diagnostic commands
- **[Cost Guide](../deployment/cost-guide.md)** - Detailed cost breakdown and optimization
- **[AWS Deployment](aws-deployment.md)** - Complete deployment procedures
- **[Blue/Green Strategy](blue-green-strategy.md)** - Advanced zero-downtime deployments

---

**⚠️ Remember**: The best rollback is the one you never need. Invest in testing, monitoring, and gradual rollouts to prevent emergencies!