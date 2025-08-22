# AWS Deployment Guide

> **Navigation**: [Documentation Index](../index.md) | [AWS Permissions](../getting-started/aws-permissions.md) | [Cost Guide](cost-guide.md)

Complete guide for deploying Party Collection to AWS using SAM and GitHub Actions.

## 📋 What You Need to Know

**⏱️ Time needed**: 30-60 minutes (first time), 5 minutes (subsequent deployments)  
**🎓 Skill level**: Intermediate (some AWS knowledge helpful)  
**💰 Cost**: £0.53-250/month depending on usage  
**💻 Prerequisites**: 
- AWS account with billing enabled
- Basic command line familiarity
- Git and Node.js installed

**🎯 You'll complete**: Production-ready AWS infrastructure with:
- ✅ Auto-scaling volunteer management system
- ✅ PostgreSQL database with backups
- ✅ HTTPS with SSL certificates
- ✅ Cost optimization (scales to £0.53/month when idle)
- ✅ Event-based scaling for volunteer campaigns

> 💡 **TL;DR**: This creates AWS infrastructure that costs £0.53/month when idle, scales up for volunteer events (£150-250/month), and includes production-ready features like SSL, backups, and monitoring.

This guide walks you through setting up and deploying the Party Collection application to AWS using infrastructure as code with AWS SAM and automated CI/CD with GitHub Actions.

## Prerequisites

### Required Tools
- **AWS CLI v2** - Configure with appropriate permissions
- **SAM CLI** - AWS Serverless Application Model CLI
- **Docker** - For container builds (GitHub Actions handles this automatically)
- **Node.js 18+** - For local development and testing

### AWS Account Requirements
- AWS Account with administrative access
- GitHub repository with Actions enabled
- Domain name (optional, for production custom domain)

### Repository Secrets Required
```bash
# GitHub repository secrets
AWS_ACCOUNT_ID=123456789012  # Your AWS account ID
```

## Quick Start

### 1. Initial AWS Setup

```bash
# 1. Configure AWS CLI
aws configure
# Enter your Access Key ID, Secret, Region (us-east-1), and output format (json)

# 2. Create ECR repositories for container images
cd infra/remote/shared/scripts
./setup-ecr.sh

# 3. Deploy global infrastructure
cd ../global
sam deploy --guided
# Follow prompts, accept defaults for most options
```

### 2. GitHub Actions Setup

```bash
# 1. Add required secrets to GitHub repository
# Go to GitHub repo > Settings > Secrets and variables > Actions
# Add secret: AWS_ACCOUNT_ID with your AWS account ID

# 2. Update parameters with your GitHub details
# Edit infra/remote/global/parameters/global.json
{
  "ProjectName": "party-collection",
  "GitHubOrg": "your-github-username",
  "GitHubRepo": "yourpartycollection",
  "Environment": "global"
}
```

### 3. Deploy Development Environment

```bash
# Deploy via GitHub Actions (recommended)
# Push to 'develop' branch or create a feature branch

# OR deploy manually
cd infra/remote/environments/dev
sam deploy --guided
```

### 4. Deploy Production Environment

```bash
# Deploy via GitHub Actions (recommended)
# Push to 'main' branch

# OR deploy manually
cd infra/remote/environments/prod
sam deploy --guided
```

---

## Detailed Setup Instructions

### Phase 1: AWS Foundation Setup

#### Step 1: AWS CLI Configuration
```bash
# Install AWS CLI v2 if not already installed
# https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

# Configure with your credentials
aws configure
# AWS Access Key ID: [Your access key]
# AWS Secret Access Key: [Your secret key]
# Default region name: us-east-1
# Default output format: json

# Verify configuration
aws sts get-caller-identity
```

#### Step 2: SAM CLI Installation
```bash
# Install SAM CLI
# https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

# Verify installation
sam --version
```

#### Step 3: Create ECR Repositories
```bash
# Run the ECR setup script
cd infra/remote/shared/scripts
chmod +x setup-ecr.sh
./setup-ecr.sh

# This creates:
# - party-collection-backend repository
# - party-collection-frontend repository
# - Lifecycle policies for image management
```

### Phase 2: Global Infrastructure Deployment

#### Step 1: Review Global Configuration
```bash
# Edit global parameters
vi infra/remote/global/parameters/global.json

# Update with your details:
{
  "ProjectName": "party-collection",
  "GitHubOrg": "your-github-username",        # Change this
  "GitHubRepo": "yourpartycollection",        # Change this
  "Environment": "global"
}
```

#### Step 2: Deploy Global Stack
```bash
cd infra/remote/global

# First-time deployment with guided setup
sam deploy --guided
# Stack Name: party-collection-global
# AWS Region: us-east-1
# Confirm changes before deploy: Y
# Allow SAM to create IAM roles: Y
# Save parameters to configuration file: Y
# SAM configuration file: samconfig.toml

# Subsequent deployments
sam deploy
```

#### Step 3: Verify Global Resources
```bash
# Check stack status
aws cloudformation describe-stacks --stack-name party-collection-global

# Verify S3 buckets were created
aws s3 ls | grep party-collection

# Verify OIDC provider
aws iam list-open-id-connect-providers
```

### Phase 3: GitHub Actions Configuration

#### Step 1: Repository Secrets
Navigate to your GitHub repository and add these secrets:

**Settings > Secrets and variables > Actions > New repository secret**

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `AWS_ACCOUNT_ID` | `123456789012` | Your AWS account ID |

#### Step 2: Test OIDC Connection
```bash
# Trigger the global deployment workflow manually
# GitHub repo > Actions > Deploy Global Infrastructure > Run workflow

# This verifies:
# - OIDC provider is working
# - GitHub Actions can assume AWS roles
# - S3 buckets are accessible
```

### Phase 4: Environment Deployments

#### Development Environment

**Automatic Deployment (Recommended):**
```bash
# Create and push to develop branch
git checkout -b develop
git push origin develop

# Or push feature branches
git checkout -b feature/my-feature
git push origin feature/my-feature
```

**Manual Deployment:**
```bash
cd infra/remote/environments/dev

# Review dev parameters
vi parameters/dev.json

# Deploy
sam deploy --guided
# Stack Name: party-collection-dev
# Use global stack outputs for dependencies
```

#### Production Environment

**Automatic Deployment (Recommended):**
```bash
# Push to main branch
git checkout main
git push origin main

# Or use manual workflow trigger with confirmation
# GitHub repo > Actions > Deploy Production Environment > Run workflow
# Type "deploy-to-production" in confirmation field
```

**Manual Deployment:**
```bash
cd infra/remote/environments/prod

# Review prod parameters
vi parameters/prod.json

# Add SSL certificate ARN if using custom domain
{
  "CertificateArn": "arn:aws:acm:us-east-1:123456789012:certificate/abcd1234-..."
}

# Deploy
sam deploy --guided
# Stack Name: party-collection-prod
```

---

## Configuration Reference

### Global Stack Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `ProjectName` | `party-collection` | Base name for all resources |
| `GitHubOrg` | `yourusername` | GitHub organization/username |
| `GitHubRepo` | `yourpartycollection` | GitHub repository name |
| `Environment` | `global` | Environment identifier |

### Development Environment Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `Environment` | `dev` | Environment identifier |
| `DBInstanceClass` | `db.t3.micro` | RDS instance size |
| `ECSTaskCPU` | `256` | ECS task CPU units |
| `ECSTaskMemory` | `512` | ECS task memory (MB) |
| `DomainName` | `""` | Custom domain (optional) |

### Production Environment Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `Environment` | `prod` | Environment identifier |
| `DBInstanceClass` | `db.t3.small` | RDS instance size |
| `ECSTaskCPU` | `512` | ECS task CPU units |
| `ECSTaskMemory` | `1024` | ECS task memory (MB) |
| `DomainName` | `party-collection.com` | Custom domain |
| `CertificateArn` | `""` | SSL certificate ARN |
| `MinCapacity` | `2` | Minimum ECS tasks |
| `MaxCapacity` | `10` | Maximum ECS tasks |

---

## Deployment Workflows

### GitHub Actions Triggers

#### Global Infrastructure
- **Manual trigger:** Always available via workflow dispatch
- **Automatic trigger:** Changes to `infra/remote/global/**`

#### Development Environment
- **Branches:** `develop`, `feature/**`
- **Pull Requests:** Build and test only (no deployment)
- **Paths:** Application code or dev infrastructure changes

#### Production Environment
- **Branch:** `main` only
- **Manual trigger:** With confirmation required
- **Security:** Additional manual approval required

### Deployment Process Flow

#### Development Deployment
1. **Build & Test** - Compile and test application
2. **Container Build** - Build and push Docker images to ECR
3. **Infrastructure Deploy** - Update AWS resources via SAM
4. **Health Check** - Verify application is running
5. **E2E Tests** - Run full test suite against deployed environment

#### Production Deployment
1. **Validation** - Confirm production deployment intent
2. **Build & Test** - Full test suite including linting
3. **Security Scan** - ECR vulnerability scanning
4. **Container Build** - Optimized production images
5. **Infrastructure Deploy** - Blue/green deployment strategy
6. **Health Check** - Extended health verification
7. **Smoke Tests** - Critical functionality verification

---

## Monitoring and Operations

### CloudWatch Resources

#### Log Groups
- `/ecs/party-collection-dev-backend`
- `/ecs/party-collection-dev-frontend`
- `/ecs/party-collection-prod-backend`
- `/ecs/party-collection-prod-frontend`

#### Metrics and Alarms
- **ECS CPU Utilization** - Auto-scaling trigger
- **Database Connections** - Performance monitoring
- **ALB Response Times** - Application performance
- **Error Rates** - Application health

### Accessing Deployed Applications

#### Development Environment
```bash
# Get application URL
aws cloudformation describe-stacks \
  --stack-name party-collection-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' \
  --output text
```

#### Production Environment
```bash
# Get application URL
aws cloudformation describe-stacks \
  --stack-name party-collection-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' \
  --output text
```

### Database Access

#### Connect to RDS via Session Manager
```bash
# Get database endpoint
DB_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name party-collection-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
  --output text)

# Get database password from Secrets Manager
DB_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id party-collection-prod-db-password \
  --query SecretString --output text | jq -r .password)

# Connect via psql (requires VPN or bastion host)
psql -h $DB_ENDPOINT -U postgres -d party_collection
```

---

## Troubleshooting

### Common Issues

#### OIDC Authentication Failures
```bash
# Verify OIDC provider exists
aws iam list-open-id-connect-providers

# Check IAM role trust policy
aws iam get-role --role-name party-collection-github-actions-role

# Verify GitHub repository settings match parameters
```

#### ECR Permission Issues
```bash
# Verify ECR repositories exist
aws ecr describe-repositories --repository-names party-collection-backend party-collection-frontend

# Check ECR permissions
aws ecr get-authorization-token
```

#### Stack Deployment Failures
```bash
# Check CloudFormation events
aws cloudformation describe-stack-events --stack-name party-collection-dev

# Validate SAM template
cd infra/remote/environments/dev
sam validate --lint

# Check parameter values
cat parameters/dev.json
```

#### Application Health Check Failures
```bash
# Check ECS service status
aws ecs describe-services \
  --cluster party-collection-dev-cluster \
  --services party-collection-dev-service

# Check container logs
aws logs tail /ecs/party-collection-dev-backend --follow
aws logs tail /ecs/party-collection-dev-frontend --follow

# Test health endpoint directly
curl http://your-alb-dns-name/health
```

### Recovery Procedures

#### Rollback Production Deployment
```bash
# Get previous task definition
aws ecs list-task-definitions \
  --family-prefix party-collection-prod-tasks \
  --status ACTIVE --sort DESC

# Update service to previous revision
aws ecs update-service \
  --cluster party-collection-prod-cluster \
  --service party-collection-prod-service \
  --task-definition party-collection-prod-tasks:PREVIOUS_REVISION
```

#### Emergency Database Recovery
```bash
# List available backups
aws rds describe-db-snapshots \
  --db-instance-identifier party-collection-prod-db

# Restore from snapshot (creates new instance)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier party-collection-prod-db-restored \
  --db-snapshot-identifier your-snapshot-id
```

---

## Cost Optimization

### Development Environment
- Uses `db.t3.micro` for RDS (free tier eligible)
- Single AZ deployment
- Minimal backup retention
- FARGATE_SPOT capacity provider for cost savings

### Production Environment
- Right-sized instances based on usage
- Multi-AZ RDS for high availability
- Auto-scaling to match demand
- Reserved instances for predictable workloads

### Estimated Monthly Costs (US East 1)

#### Development Environment
- **RDS db.t3.micro:** ~$15-20
- **ECS Fargate (minimal usage):** ~$10-15
- **ALB:** ~$18
- **Data Transfer:** ~$5
- **Total:** ~$50-60/month

#### Production Environment
- **RDS db.t3.small Multi-AZ:** ~$60-80
- **ECS Fargate (2-10 tasks):** ~$50-250
- **ALB:** ~$18
- **CloudFront:** ~$1-10
- **Data Transfer:** ~$10-50
- **Total:** ~$140-410/month

---

## Security Best Practices

### IAM Security
- ✅ OIDC-based authentication (no long-term credentials)
- ✅ Least privilege IAM policies
- ✅ Environment-specific role isolation
- ✅ Regular credential rotation

### Network Security
- ✅ VPC isolation with private subnets
- ✅ Security groups with minimal access
- ✅ WAF protection for production ALB
- ✅ HTTPS enforcement in production

### Data Security
- ✅ Encryption at rest (RDS, S3, ECS volumes)
- ✅ Encryption in transit (HTTPS/TLS)
- ✅ Secrets Manager for sensitive data
- ✅ Database in private subnets

### Container Security
- ✅ ECR vulnerability scanning
- ✅ Non-root container users
- ✅ Minimal base images
- ✅ Regular image updates

---

## Next Steps

After successful deployment, consider these enhancements:

1. **Custom Domain Setup**
   - Purchase domain and configure Route 53
   - Request SSL certificate in ACM
   - Update production parameters

2. **Enhanced Monitoring**
   - Custom CloudWatch dashboards
   - Application-specific metrics
   - Slack/email notifications

3. **Performance Optimization**
   - CloudFront distribution for frontend
   - Database query optimization
   - Application-level caching

4. **Disaster Recovery**
   - Cross-region backups
   - Multi-region deployment
   - Automated failover procedures

5. **Advanced Security**
   - AWS Config compliance rules
   - GuardDuty threat detection
   - Security Hub aggregation

---

## Blue/Green Deployment

For production environments, consider implementing blue/green deployment for zero-downtime updates:

- **[Blue/Green Overview](blue-green-deployment.md)** - Introduction to blue/green deployment strategy
- **[Blue/Green Implementation](blue-green-strategy.md)** - Detailed implementation guide  
- **[Production Security](../infrastructure/production-security.md)** - Security considerations for production

## Related Documentation

- **[Cost Optimization Guide](cost-guide.md)** - Detailed cost analysis and optimization
- **[Environment Control](../troubleshooting/environment-control.md)** - Infrastructure management
- **[Remote Management](../troubleshooting/remote-management.md)** - Daily operations and testing
- **[GitHub Actions Workflows](../workflows/github-actions-overview.md)** - Automated deployment
- **[System Architecture](../infrastructure/stack-structure.md)** - Technical infrastructure details
- **[Getting Started](../getting-started/aws-permissions.md)** - AWS permissions setup