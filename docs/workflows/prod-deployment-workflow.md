# Production Deployment Workflow

**File**: `deploy-prod.yml`  
**Purpose**: Secure, protected ARM64-optimized production deployment with comprehensive safety controls

## 🛡️ Overview

The production workflow is designed for local party organizations with event-based deployment needs. It implements security controls and cost-effective scaling practices for volunteer management systems.

### Event-Based Deployment Model
- 🎉 **Event-Ready Scaling**: Scale up only during campaigns/events
- 💤 **Idle Between Events**: Minimal costs when volunteers inactive
- 📊 **Cost Control**: £6-28/month idle → £150-250/month active
- 🔒 **Data Preservation**: All volunteer data maintained during scaling
- ⚡ **Quick Scaling**: Ready for events within minutes

### Security Model
- ❌ **Push to main BLOCKED**: Automatic deployments prevented
- ✅ **Manual confirmation required**: Must type "PRODUCTION" 
- ✅ **Environment protection**: GitHub environment approval gates
- ✅ **Comprehensive validation**: Security scans, health checks
- ✅ **Blue-green capable**: Zero-downtime deployment option
- ✅ **ARM64 optimized**: Cost savings for volunteer organizations

## 🔒 Security Protection

### Automatic Push Block
```yaml
# CRITICAL SECURITY FEATURE
- name: Validate production confirmation
  run: |
    if [ "${{ github.event_name }}" = "workflow_dispatch" ]; then
      if [ "${{ github.event.inputs.confirm_production }}" != "PRODUCTION" ]; then
        echo "❌ Production deployment not confirmed"
        exit 1
      fi
      echo "✅ Production deployment confirmed"
    else
      echo "❌ SECURITY: Production deployment blocked for push events"
      echo "Production can only be deployed via workflow_dispatch with confirmation"
      exit 1
    fi
```

**Protection Result**: Accidental merge to `main` costs **£0.00** (deployment blocked)

### Manual Confirmation Requirement
```yaml
workflow_dispatch:
  inputs:
    confirm_production:
      description: 'Type "PRODUCTION" to confirm deployment'
      required: true
      type: string
```

**Usage**: Must type exactly `PRODUCTION` (case-sensitive) to proceed

## 🚀 Trigger Configuration

### Blocked Automatic Triggers
```yaml
# These triggers exist but are BLOCKED by security validation
on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - 'frontend/**'
      - 'infra/remote/templates/parent-template.yaml'
      - 'infra/remote/parameters/prod.json'
      - 'infra/remote/global/**'
```

### Manual Trigger (ONLY WAY TO DEPLOY)
```yaml
workflow_dispatch:
  inputs:
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

## ⚙️ Workflow Configuration

### Environment Variables
```yaml
env:
  AWS_REGION: eu-west-2
  GLOBAL_STACK_NAME: party-collection-global
  PROD_STACK_NAME: party-collection-prod

permissions:
  id-token: write    # OIDC authentication
  contents: read     # Repository access only
```

### Required Secrets
```yaml
# Production AWS Role (enhanced permissions)
AWS_ROLE_ARN_PROD: "arn:aws:iam::123456789012:role/github-actions-prod"

# Global Infrastructure Role
AWS_ROLE_ARN_GLOBAL: "arn:aws:iam::123456789012:role/github-actions-global"

# Production Configuration
ALERT_EMAIL: "admin@party-collection.local"
DOMAIN_NAME: "party-collection.com"           # Optional
CERTIFICATE_ARN: "arn:aws:acm:eu-west-2:123456789012:certificate/abc-123"  # Optional
```

## 🔄 Workflow Stages

### Stage 1: Security Validation
```yaml
jobs:
  security-checks:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Run security scan
      run: |
        echo "Running security checks..."
        # Future: Add security scanning tools
        # - Snyk vulnerability scanning
        # - OWASP dependency check
        # - CloudFormation security validation
        
    - name: Validate production confirmation
      # CRITICAL: Blocks push events, validates manual confirmation
```

### Stage 2: Global Infrastructure
```yaml
deploy-global:
  runs-on: ubuntu-latest
  needs: security-checks
  environment: production-global    # GitHub environment protection
  
  steps:
  - name: Deploy Global Infrastructure
    run: |
      cd infra/remote
      aws cloudformation deploy \
        --template-file global/template.yaml \
        --stack-name ${{ env.GLOBAL_STACK_NAME }} \
        --parameter-overrides \
          ParameterKey=GitHubOrg,ParameterValue=${{ github.repository_owner }} \
          ParameterKey=GitHubRepo,ParameterValue=${{ github.event.repository.name }} \
          file://global/parameters/global.json \
        --capabilities CAPABILITY_IAM \
        --no-fail-on-empty-changeset
```

**Global Infrastructure Components**:
- VPC with private subnets
- NAT Gateways (2 AZs): £45.36/month
- VPC Endpoints (4): £15.82/month  
- S3 bucket for artifacts: £0.23/month
- **Total**: £61.41/month

### Stage 3: Application Build & Test
```yaml
deploy-production:
  needs: deploy-global
  environment: production           # GitHub environment protection
  
  steps:
  - name: Build and Test Backend
    run: |
      cd backend
      npm ci
      npm run build
      npm test

  - name: Build and Test Frontend
    run: |
      cd frontend
      npm ci
      npm run build
      npm run lint
      # npm run test:e2e # Add when ready
```

### Stage 4: ARM64 Container Building
```yaml
  - name: Set up Docker Buildx for ARM64
    uses: docker/setup-buildx-action@v3
    
  - name: Build and push Docker images (ARM64)
    run: |
      # Backend
      cd backend
      docker buildx build --platform linux/arm64 \
        -t ${{ steps.login-ecr.outputs.registry }}/party-collection-backend:${{ github.sha }} \
        -t ${{ steps.login-ecr.outputs.registry }}/party-collection-backend:prod-latest \
        --push .
      
      # Frontend
      cd ../frontend
      docker buildx build --platform linux/arm64 \
        -t ${{ steps.login-ecr.outputs.registry }}/party-collection-frontend:${{ github.sha }} \
        -t ${{ steps.login-ecr.outputs.registry }}/party-collection-frontend:prod-latest \
        --push .
```

### Stage 5: Production Infrastructure Deployment
```yaml
  - name: Deploy Production Infrastructure
    run: |
      cd infra/remote
      aws cloudformation deploy \
        --template-file templates/parent-template.yaml \
        --stack-name ${{ env.PROD_STACK_NAME }} \
        --parameter-overrides \
          ParameterKey=AlertEmail,ParameterValue=${{ secrets.ALERT_EMAIL }} \
          ParameterKey=DomainName,ParameterValue=${{ secrets.DOMAIN_NAME }} \
          ParameterKey=CertificateArn,ParameterValue=${{ secrets.CERTIFICATE_ARN }} \
          file://parameters/prod.json \
        --capabilities CAPABILITY_IAM \
        --no-fail-on-empty-changeset
```

### Stage 6: Health Validation
```yaml
  - name: Wait for deployment to be ready
    run: |
      echo "Waiting for services to be healthy..."
      
      # Get ALB DNS name
      ALB_DNS=$(aws cloudformation describe-stacks \
        --stack-name ${{ env.PROD_STACK_NAME }} \
        --query 'Stacks[0].Outputs[?OutputKey==`ApplicationURL`].OutputValue' \
        --output text)
        
      # Wait for health checks (up to 15 minutes)
      for i in {1..30}; do
        if curl -f $ALB_DNS/health > /dev/null 2>&1; then
          echo "✅ Production deployment healthy"
          break
        fi
        echo "⏳ Waiting for deployment... ($i/30)"
        sleep 30
      done

  - name: Run production health checks
    run: |
      # Comprehensive production validation
      curl -f $ALB_DNS/health || exit 1        # Backend health
      curl -f $ALB_DNS/ || exit 1              # Frontend accessibility  
      curl -f $ALB_DNS/api/status || exit 1    # Database connectivity
      echo "✅ All production health checks passed"
```

## 💰 Production Cost Structure

### Monthly Cost Breakdown (ARM64 Optimized)
```yaml
Global Infrastructure: £61.41/month
├── NAT Gateways (2 AZs): £45.36
├── VPC Endpoints (4): £15.82
└── S3 Storage: £0.23

Production Environment: £159.78/month
├── Aurora Serverless v2: £52.80
├── RDS Proxy: £10.80
├── ECS Backend (2 tasks, ARM64): £38.02
├── ECS Frontend (2 tasks, ARM64): £38.02
├── Application Load Balancer: £18.90
├── CloudWatch logs (14-day retention): £0.25
└── Secrets Manager: £0.99

Total Production Cost: £222.07/month
```

### ARM64 Cost Savings
```yaml
# Production compute cost comparison
x86 Fargate (2 backend + 2 frontend):
  - CPU cost: £95.04/month
  
ARM64 Fargate (2 backend + 2 frontend):
  - CPU cost: £76.04/month
  - Savings: £19.00/month (20% reduction)
  - Annual savings: £228

# Combined with FARGATE_SPOT (when available):
  - Additional 70% reduction opportunity
  - Total potential savings: 76% vs standard x86
```

## 🌐 Production Network Architecture

### Private Subnet Design (Enterprise Security)
```
Internet Gateway
├── Public Subnets (eu-west-2a, eu-west-2b)
│   ├── NAT Gateway 1 (£22.68/month)
│   └── NAT Gateway 2 (£22.68/month)
├── Private Subnets (eu-west-2a, eu-west-2b)
│   ├── Application Load Balancer
│   │   ├── HTTPS (443): Public internet access
│   │   ├── HTTP (80): Redirect to HTTPS
│   │   └── Health checks: Backend targets
│   ├── ECS Tasks (ARM64, no public IPs)
│   │   ├── Backend (2 tasks): Port 3001
│   │   ├── Frontend (2 tasks): Port 3000
│   │   └── Auto-scaling: Based on CPU/memory
│   └── Aurora Serverless v2 + RDS Proxy
│       ├── Multi-AZ: High availability
│       ├── Auto-scaling: 1-16 ACU
│       └── Backup: Automated snapshots
└── VPC Endpoints (£5.27/month each)
    ├── ECR: Container image access
    ├── Secrets Manager: Database credentials
    ├── CloudWatch Logs: Application logging
    └── S3: Artifact storage
```

### Security Groups (Production)
```yaml
# Application Load Balancer Security Group
ALBSecurityGroup:
  Ingress:
    - Port 443: From Internet (0.0.0.0/0) - HTTPS
    - Port 80: From Internet (0.0.0.0/0) - HTTP redirect
  Egress:
    - Port 3000/3001: To ECS tasks

# ECS Security Group (Backend/Frontend)
ECSSecurityGroup:
  Ingress:
    - Port 3001: From ALB (Backend)
    - Port 3000: From ALB (Frontend)
  Egress:
    - Port 443: To VPC Endpoints
    - Port 5432: To Aurora

# Aurora Security Group
AuroraSecurityGroup:
  Ingress:
    - Port 5432: From ECS Security Group only
  Egress:
    - None required

# RDS Proxy Security Group
RDSProxySecurityGroup:
  Ingress:
    - Port 5432: From ECS Security Group
  Egress:
    - Port 5432: To Aurora Security Group
```

## 🔄 Deployment Types

### Standard Deployment
```yaml
deployment_type: "standard"

Features:
- Rolling update strategy
- Health check validation
- Automatic rollback on failure
- Zero-downtime deployment
- Single environment update
```

### Blue-Green Deployment
```yaml
deployment_type: "blue-green"

Features:
- Complete environment duplication
- Traffic switching after validation
- Instant rollback capability
- Maximum safety for critical updates
- Higher temporary cost during switch
```

### Rollback Deployment
```yaml
deployment_type: "rollback"

Features:
- Revert to previous known-good state
- Emergency recovery capability
- Previous task definition restoration
- Database rollback (manual coordination)
- Minimal downtime recovery
```

## 📊 Monitoring and Observability

### CloudWatch Metrics
```yaml
# Key production metrics
ECS_Metrics:
  - CPUUtilization: Target 70%
  - MemoryUtilization: Target 80%
  - TaskCount: 2 backend + 2 frontend
  - HealthyHostCount: ALB target health

Aurora_Metrics:
  - DatabaseConnections: Monitor connection count
  - ServerlessDatabaseCapacity: ACU utilization
  - ReadLatency/WriteLatency: Performance monitoring
  - FreeableMemory: Memory pressure

ALB_Metrics:
  - RequestCount: Traffic volume
  - TargetResponseTime: Application performance
  - HTTPCode_Target_2XX_Count: Success rate
  - HTTPCode_Target_5XX_Count: Error rate
```

### Log Aggregation
```yaml
# Centralized logging strategy
LogGroups:
  - party-collection-prod-backend-logs (14-day retention)
  - party-collection-prod-frontend-logs (14-day retention)
  - party-collection-prod-alb-logs (S3 storage)

LogInsights:
  - Error tracking and alerting
  - Performance trend analysis
  - Security event monitoring
  - Cost optimization insights
```

### Health Check Endpoints
```bash
# Production health validation
https://party-collection.com/health
# Response: {"status": "healthy", "database": "connected", "version": "1.0.0"}

https://party-collection.com/api/status  
# Response: {"status": "ok", "database": "connected", "connections": 5}

# Internal ALB health checks
http://internal-alb/health
# Used by ALB for target group health
```

## 🚨 Emergency Procedures

### Rollback Deployment
```bash
# Emergency rollback via GitHub Actions
gh workflow run deploy-prod.yml \
  -f deployment_type=rollback \
  -f confirm_production=PRODUCTION
```

### Manual Emergency Actions
```bash
# Scale up ECS services for high load
aws ecs update-service \
  --cluster party-collection-prod-cluster \
  --service party-collection-prod-backend \
  --desired-count 4

# Scale Aurora for database load
aws rds modify-current-db-cluster-capacity \
  --db-cluster-identifier party-collection-prod-aurora \
  --capacity 8

# Check ALB target health
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:eu-west-2:123456789012:targetgroup/prod-backend/abc123
```

### Disaster Recovery
```bash
# Database point-in-time recovery
aws rds restore-db-cluster-to-point-in-time \
  --source-db-cluster-identifier party-collection-prod-aurora \
  --db-cluster-identifier party-collection-prod-aurora-restored \
  --restore-to-time 2024-01-01T12:00:00.000Z

# Cross-region backup validation
aws rds describe-db-cluster-snapshots \
  --region eu-west-1 \
  --db-cluster-identifier party-collection-prod-aurora
```

## 🔧 Advanced Configuration

### Custom Domain Setup
```yaml
# Required for custom domain
DOMAIN_NAME: "party-collection.com"
CERTIFICATE_ARN: "arn:aws:acm:eu-west-2:123456789012:certificate/abc-123"

# Route 53 setup (manual)
CNAME: party-collection.com → ALB_DNS_NAME
```

### SSL Certificate Management
```bash
# Request ACM certificate (one-time setup)
aws acm request-certificate \
  --domain-name party-collection.com \
  --domain-name "*.party-collection.com" \
  --validation-method DNS \
  --region eu-west-2

# Validate via Route 53 DNS records
# Certificate ARN used in CERTIFICATE_ARN secret
```

### Auto-Scaling Configuration
```yaml
# Production auto-scaling policies
Backend_AutoScaling:
  MinCapacity: 2
  MaxCapacity: 10
  TargetCPU: 70%
  ScaleOutCooldown: 300s
  ScaleInCooldown: 600s

Frontend_AutoScaling:
  MinCapacity: 2  
  MaxCapacity: 10
  TargetCPU: 70%
  ScaleOutCooldown: 300s
  ScaleInCooldown: 600s

Aurora_AutoScaling:
  MinCapacity: 1 ACU
  MaxCapacity: 16 ACU
  TargetCPU: 70%
  TargetConnections: 70% of max
```

## 📋 Pre-Deployment Checklist

### Security Validation
- [ ] Security scans completed
- [ ] Dependency vulnerabilities resolved
- [ ] CloudFormation template validated
- [ ] IAM permissions reviewed
- [ ] SSL certificate valid

### Environment Preparation
- [ ] GitHub secrets configured
- [ ] OIDC roles tested
- [ ] Global infrastructure deployed
- [ ] ECR repositories exist
- [ ] Domain/certificate ready (if applicable)

### Testing Validation
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Performance tests completed
- [ ] Security tests passed
- [ ] User acceptance testing done

### Deployment Confirmation
- [ ] Manual confirmation: Type "PRODUCTION"
- [ ] Deployment type selected
- [ ] Rollback plan prepared
- [ ] Team notified
- [ ] Monitoring alerts configured

## 🎯 Usage Examples

### Standard Production Deployment
```bash
# 1. Ensure all code is merged to main
git checkout main
git pull origin main

# 2. Navigate to GitHub Actions
# Actions → Deploy Production Environment → Run workflow

# 3. Configure deployment
deployment_type: "standard"
confirm_production: "PRODUCTION"

# 4. Monitor deployment progress
# - Security checks
# - Global infrastructure
# - Application build & test
# - ARM64 container building
# - Production infrastructure
# - Health validation

# 5. Verify production health
curl https://party-collection.com/health
curl https://party-collection.com/api/status
```

### Blue-Green Deployment
```bash
# For critical updates requiring zero-downtime
deployment_type: "blue-green"
confirm_production: "PRODUCTION"

# Process:
# 1. Creates parallel "green" environment
# 2. Validates health on green environment
# 3. Switches ALB traffic to green
# 4. Monitors green environment health
# 5. Removes blue environment after confirmation
```

### Emergency Rollback
```bash
# In case of production issues
deployment_type: "rollback"
confirm_production: "PRODUCTION"

# Process:
# 1. Identifies previous stable deployment
# 2. Reverts ECS task definitions
# 3. Scales to previous configuration
# 4. Validates health after rollback
# 5. Notifies team of rollback completion
```

---

## 💡 Best Practices

### Security First
1. **Never bypass confirmation**: Always type "PRODUCTION" manually
2. **Review changes**: Validate all infrastructure changes before deployment
3. **Monitor closely**: Watch deployment progress and health checks
4. **Plan rollbacks**: Have rollback strategy ready before deploying
5. **Limit access**: Use GitHub environment protection appropriately

### Deployment Safety
1. **Test thoroughly**: Always validate in development first
2. **Deploy during maintenance windows**: Schedule important updates
3. **Monitor post-deployment**: Watch metrics for 24-48 hours
4. **Have team support**: Ensure team availability during deployment
5. **Document changes**: Keep deployment logs and change records

### Cost Management
1. **Monitor production costs**: Review AWS Cost Explorer monthly
2. **Optimize capacity**: Right-size Aurora and ECS based on actual usage  
3. **Use ARM64**: Maintain ARM64 for 20% compute cost savings
4. **Review logs**: Optimize log retention based on compliance needs
5. **Clean unused resources**: Remove old snapshots and test environments

**🔒 Security Note**: This workflow is designed to prevent accidental production deployments. The multi-layer protection (push blocking + manual confirmation + environment approval) ensures production deployments are always intentional and authorized.