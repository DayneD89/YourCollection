# Development Deployment Workflow

> **Related**: [GitHub Actions Overview](github-actions-overview.md) | [Remote Management](../troubleshooting/remote-management.md) | [Cost Guide](../deployment/cost-guide.md)

**File**: `deploy-dev.yml`  
**Purpose**: Automated ARM64-optimized development environment deployment with cost controls

## 🎯 Overview

The development workflow provides automatic deployment of cost-optimized development environments with intelligent scaling based on usage patterns.

### Key Features
- ✅ **Ultra-low cost**: £0.53/month idle by default
- ✅ **ARM64 optimization**: 76% cost reduction vs standard x86
- ✅ **Auto-scaling**: Scale to 0 when not needed
- ✅ **Public subnet architecture**: No NAT gateway costs
- ✅ **Manual activation**: On-demand development environment
- ✅ **PR integration**: Automatic comments with access URLs

## 🚀 Trigger Conditions

### Automatic Triggers
```yaml
on:
  push:
    branches: [develop, 'feature/*']
    paths:
      - 'backend/**'
      - 'frontend/**'
      - 'infra/remote/templates/minimal-dev-template.yaml'
      - 'infra/remote/parameters/dev-minimal.json'
  
  pull_request:
    branches: [develop]
    # Same path filters
```

### Manual Trigger
```yaml
workflow_dispatch:
  inputs:
    desired_count:
      description: 'Number of tasks to run (0 for idle)'
      required: false
      default: '0'
      type: string
    environment_enabled:
      description: 'Enable environment (true/false)'
      required: false
      default: 'true'
      type: string
```

## ⚙️ Workflow Configuration

### Environment Variables
```yaml
env:
  AWS_REGION: eu-west-2
  STACK_NAME: party-collection-dev-minimal

permissions:
  id-token: write    # OIDC authentication
  contents: read     # Repository access
```

### Required Secrets
```yaml
# AWS OIDC Role for development deployments
AWS_ROLE_ARN_DEV: "arn:aws:iam::123456789012:role/github-actions-dev"

# Email for cost alerts and notifications
ALERT_EMAIL: "admin@party-collection.local"
```

## 🔄 Workflow Steps

### Step 1: Parameter Resolution
```yaml
# Intelligent scaling logic
if workflow_dispatch:
  desired_count = input.desired_count
  environment_enabled = input.environment_enabled
else:
  # All branches default to idle (cost optimization)
  desired_count = 0
  environment_enabled = true
```

**Branch Behavior**:
- **All branches**: Default to `DesiredCount=0` (£0.53/month)
- **Manual activation**: Use workflow dispatch to scale up
- **Cost efficiency**: Prevents accidental high costs

### Step 2: Code Validation
```yaml
# Backend validation
- name: Build Backend
  run: |
    cd backend
    npm ci           # Clean install
    npm run build    # TypeScript compilation
    npm test         # Run test suite

# Frontend validation  
- name: Build Frontend
  run: |
    cd frontend
    npm ci           # Clean install
    npm run build    # Next.js production build
    npm run lint     # ESLint validation
```

### Step 3: ARM64 Docker Image Building
```yaml
# Set up buildx for multi-platform builds
- name: Set up Docker Buildx for ARM64
  uses: docker/setup-buildx-action@v3

# ECR repository creation (if needed)
- name: Create ECR repositories if they don't exist
  run: |
    aws ecr describe-repositories --repository-names party-collection-backend || \
      aws ecr create-repository --repository-name party-collection-backend
    aws ecr describe-repositories --repository-names party-collection-frontend || \
      aws ecr create-repository --repository-name party-collection-frontend

# Build and push ARM64 images
- name: Build and push Backend Docker image (ARM64)
  run: |
    cd backend
    docker buildx build --platform linux/arm64 \
      -t ${{ steps.login-ecr.outputs.registry }}/party-collection-backend:${{ github.sha }} \
      -t ${{ steps.login-ecr.outputs.registry }}/party-collection-backend:latest \
      --push .
```

### Step 4: Infrastructure Deployment
```yaml
# Deploy minimal development template
- name: Deploy Infrastructure
  run: |
    cd infra/remote
    aws cloudformation deploy \
      --template-file templates/minimal-dev-template.yaml \
      --stack-name ${{ env.STACK_NAME }} \
      --parameter-overrides \
        ParameterKey=DesiredCount,ParameterValue=${{ steps.params.outputs.desired_count }} \
        ParameterKey=EnvironmentEnabled,ParameterValue=${{ steps.params.outputs.environment_enabled }} \
        ParameterKey=AlertEmail,ParameterValue=${{ secrets.ALERT_EMAIL }} \
        file://parameters/dev-minimal.json \
      --capabilities CAPABILITY_IAM \
      --no-fail-on-empty-changeset
```

### Step 5: Health Checks (If Active)
```yaml
# Only run health checks if environment is active
- name: Run health checks
  if: steps.status.outputs.deployment_active == 'true'
  run: |
    echo "Waiting for services to be healthy..."
    sleep 60
    
    # Check backend health
    if [ "${{ steps.status.outputs.backend_ip }}" != "None" ]; then
      curl -f http://${{ steps.status.outputs.backend_ip }}:3001/health || exit 1
    fi
    
    # Check frontend accessibility
    if [ "${{ steps.status.outputs.frontend_ip }}" != "None" ]; then
      curl -f http://${{ steps.status.outputs.frontend_ip }}:3000 || exit 1
    fi
```

### Step 6: PR Comments and Notifications
```yaml
# Automatic PR comments with environment details
- name: Comment on PR
  if: github.event_name == 'pull_request'
  uses: actions/github-script@v7
  with:
    script: |
      const { deployment_active, backend_ip, frontend_ip } = ${{ toJson(steps.status.outputs) }};
      
      let comment = `## 🚀 Development Environment Deployed\n\n`;
      comment += `**Branch**: \`${{ github.ref_name }}\`\n`;
      comment += `**Commit**: \`${{ github.sha }}\`\n\n`;
      
      if (deployment_active === 'true') {
        comment += `### 🌐 Access URLs\n`;
        if (backend_ip && backend_ip !== 'None') {
          comment += `- **Backend API**: http://${backend_ip}:3001\n`;
          comment += `- **Health Check**: http://${backend_ip}:3001/health\n`;
        }
        if (frontend_ip && frontend_ip !== 'None') {
          comment += `- **Frontend**: http://${frontend_ip}:3000\n`;
        }
        comment += `\n### 💰 Current Cost\n`;
        comment += `- **Monthly**: £17.85 (active development)\n`;
      } else {
        comment += `### 💤 Environment Status\n`;
        comment += `Environment deployed but scaled to zero (idle state) for maximum cost efficiency.\n`;
        comment += `**Cost**: £0.53/month\n\n`;
        comment += `**To activate for development:**\n`;
        comment += `- Use GitHub Actions > Deploy Development Environment > Run workflow\n`;
        comment += `- Set DesiredCount=1, EnvironmentEnabled=true\n`;
      }
```

## 💰 Cost Management

### Default Cost Behavior
```yaml
# All deployments start in idle state
Idle State (DesiredCount=0):
  - Monthly Cost: £0.53
  - Aurora Serverless v1: Auto-paused
  - ECS Services: 0 running tasks
  - Infrastructure: Exists but inactive

Active State (DesiredCount=1):
  - Monthly Cost: £17.85 (8h/day weekdays)
  - Aurora Serverless v1: Active when accessed
  - ECS Services: 1 backend + 1 frontend task
  - Public IPs: Direct access for testing
```

### Manual Cost Controls
```bash
# Activate development environment
gh workflow run deploy-dev.yml \
  -f desired_count=1 \
  -f environment_enabled=true

# Return to idle state
gh workflow run deploy-dev.yml \
  -f desired_count=0 \
  -f environment_enabled=true

# Emergency shutdown (£0.00/month)
gh workflow run deploy-dev.yml \
  -f desired_count=0 \
  -f environment_enabled=false
```

### Budget Integration
```yaml
# Automatic budget alerts configured via parameters
MonthlyBudgetLimit: £10
AlertThresholds: [50%, 80%, 95%]  # £5, £8, £9.50
EmergencyAction: Scale to idle at 95%
```

## 🌐 Network Architecture

### Public Subnet Design (Cost Optimized)
```
Internet Gateway
├── Public Subnet 1a (eu-west-2a)
│   ├── ECS Backend Task (ARM64)
│   │   ├── Public IP: Auto-assigned
│   │   ├── Port 3001: Backend API
│   │   └── Security Group: Backend-only access
│   └── ECS Frontend Task (ARM64)
│       ├── Public IP: Auto-assigned
│       ├── Port 3000: Frontend app
│       └── Security Group: Internet access
├── Public Subnet 1b (eu-west-2b)
│   └── Aurora Serverless v1
│       ├── Private via security groups
│       ├── Port 5432: PostgreSQL
│       └── Backend access only
└── Cost Savings vs Private Subnets
    ├── No NAT Gateways: £45.36/month saved
    └── No VPC Endpoints: £15.82/month saved
```

### Security Groups
```yaml
# Backend Security Group
BackendSecurityGroup:
  Ingress:
    - Port 3001: From Frontend Security Group
    - Port 3001: From Internet (for testing)
  Egress:
    - All traffic: To Internet (for ECR, etc.)

# Frontend Security Group  
FrontendSecurityGroup:
  Ingress:
    - Port 3000: From Internet (0.0.0.0/0)
  Egress:
    - All traffic: To Internet

# Database Security Group
DatabaseSecurityGroup:
  Ingress:
    - Port 5432: From Backend Security Group only
  Egress:
    - None required
```

## 🔧 ARM64 Optimization

### Docker Image Building
```yaml
# Multi-platform buildx setup
- name: Set up Docker Buildx for ARM64
  uses: docker/setup-buildx-action@v3

# ARM64-specific build
- name: Build and push Backend Docker image (ARM64)
  run: |
    docker buildx build --platform linux/arm64 \
      -t registry/backend:${{ github.sha }} \
      -t registry/backend:latest \
      --push .
```

### ECS Task Definition
```yaml
# ARM64 runtime platform in CloudFormation
RuntimePlatform:
  CpuArchitecture: ARM64
  OperatingSystemFamily: LINUX

# Cost benefits
FARGATE_SPOT ARM64:
  - Base ARM64 discount: 20% vs x86
  - SPOT discount: 70% vs on-demand
  - Combined discount: 76% vs standard x86
  - Hourly cost: £0.0079 vs £0.0318 (256 CPU, 512 MB)
```

## 📊 Monitoring and Outputs

### Workflow Outputs
```yaml
outputs:
  deployment_active: ${{ steps.status.outputs.deployment_active }}
  backend_ip: ${{ steps.status.outputs.backend_ip }}
  frontend_ip: ${{ steps.status.outputs.frontend_ip }}
  monthly_cost: £17.85 (active) or £0.53 (idle)
  stack_status: ${{ steps.deploy.outputs.stack_status }}
```

### Health Check Endpoints
```bash
# Backend health check
curl http://${BACKEND_IP}:3001/health
# Response: {"status": "healthy", "database": "connected"}

# Frontend accessibility
curl http://${FRONTEND_IP}:3000/
# Response: Frontend application homepage

# Database connectivity (via backend)
curl http://${BACKEND_IP}:3001/api/status
# Response: {"status": "ok", "database": "connected"}
```

### CloudWatch Integration
```yaml
# Automatic log groups created
LogGroups:
  - party-collection-dev-backend-logs (3-day retention)
  - party-collection-dev-frontend-logs (3-day retention)

# Key metrics to monitor
Metrics:
  - ECS CPU/Memory utilization
  - Aurora connection count
  - Task health status
  - Cost accumulation
```

## 🚨 Error Handling

### Automatic Cleanup on Failure
```yaml
# Feature branch cleanup on deployment failure
- name: Cleanup on failure
  if: failure() && github.ref_name != 'develop'
  run: |
    echo "Cleaning up failed deployment..."
    aws cloudformation update-stack \
      --stack-name ${{ env.STACK_NAME }} \
      --use-previous-template \
      --parameters ParameterKey=EnvironmentEnabled,ParameterValue=false \
      --capabilities CAPABILITY_IAM || true
```

### Common Error Scenarios
```yaml
1. ECR Repository Missing:
   Solution: Workflow auto-creates repositories

2. ARM64 Image Build Fails:
   Check: Docker base image supports ARM64
   Fix: Use multi-arch base images (node:18)

3. Health Check Timeouts:
   Cause: Aurora auto-pause delay
   Solution: Wait 60 seconds for database wake-up

4. Cost Budget Exceeded:
   Action: Auto-scale to DesiredCount=0
   Alert: Email notification to ALERT_EMAIL

5. CloudFormation Stack Locked:
   Cause: Previous deployment still in progress
   Solution: Wait or cancel previous deployment
```

## 🎯 Usage Examples

### Development Testing Workflow
```bash
# 1. Create feature branch
git checkout -b feature/new-api-endpoint
git push origin feature/new-api-endpoint

# 2. Automatic deployment (£0.53/month idle)
# GitHub Actions deploys infrastructure but scales to 0

# 3. Activate for testing (£0.53 → £17.85/month)
gh workflow run deploy-dev.yml \
  -f desired_count=1 \
  -f environment_enabled=true

# 4. Test API endpoints using public IPs from workflow output
curl http://${BACKEND_IP}:3001/api/new-endpoint

# 5. Return to idle when done (£17.85 → £0.53/month)
gh workflow run deploy-dev.yml \
  -f desired_count=0 \
  -f environment_enabled=true

# 6. Merge to develop (auto-cleanup feature branch)
git checkout develop
git merge feature/new-api-endpoint
git push origin develop
```

### Long-term Development
```bash
# Keep environment active for extended development
gh workflow run deploy-dev.yml \
  -f desired_count=2 \
  -f environment_enabled=true

# Scale based on team size
# 1 developer: DesiredCount=1 (£17.85/month)
# 2-3 developers: DesiredCount=2 (£35.70/month)

# Always return to idle when not actively developing
# Saves £17.32/month vs always-on
```

### Emergency Procedures
```bash
# Emergency shutdown (budget exceeded)
gh workflow run deploy-dev.yml \
  -f desired_count=0 \
  -f environment_enabled=false
# Result: £0.00/month

# Re-enable after budget reset
gh workflow run deploy-dev.yml \
  -f desired_count=0 \
  -f environment_enabled=true
# Result: £0.53/month (idle)
```

## 📚 Troubleshooting

### Debugging Workflow Issues

#### Check Workflow Logs
```bash
# Via GitHub CLI
gh run list --workflow=deploy-dev.yml
gh run view RUN_ID --log

# Via GitHub UI
# Navigate to Actions → Deploy Development Environment → Select run
```

#### Common Solutions
```yaml
Issue: "Failed to assume role"
Solution: 
  - Verify AWS_ROLE_ARN_DEV secret exists
  - Check OIDC role trust policy
  - Ensure role has required permissions

Issue: "Docker buildx command not found"
Solution:
  - docker/setup-buildx-action@v3 should handle this
  - Check runner has Docker daemon running

Issue: "Aurora connection timeout"
Solution:
  - Aurora Serverless v1 has 5-minute auto-pause
  - Wait up to 30 seconds for cold start
  - Health checks include appropriate delays

Issue: "Public IP not accessible"
Solution:
  - Check security group rules
  - Verify task is in RUNNING state
  - Confirm public subnet has internet gateway route
```

### Manual Recovery
```bash
# Reset environment state
aws cloudformation describe-stacks \
  --stack-name party-collection-dev-minimal

# Force stack update if stuck
aws cloudformation cancel-update-stack \
  --stack-name party-collection-dev-minimal

# Complete manual cleanup if needed
aws cloudformation delete-stack \
  --stack-name party-collection-dev-minimal
```

---

## 💡 Best Practices

### Cost Optimization
1. **Default to idle**: Let DesiredCount=0 be your default
2. **Activate on demand**: Only scale up when actively testing
3. **Monitor usage**: Check monthly cost patterns
4. **Set budgets**: Use appropriate limits for your usage
5. **Clean up**: Remove unused feature branch deployments

### Development Efficiency
1. **Use local first**: `./start-local.sh` for daily development
2. **Remote for integration**: Activate remote for API testing
3. **PR testing**: Let automatic deployment validate PRs
4. **Team coordination**: Communicate when scaling up shared environments
5. **Document IPs**: Save workflow output IPs for team access

### Security Considerations
1. **Public IPs**: Development only - not for production data
2. **Security groups**: Restrict access appropriately
3. **Credentials**: Never store secrets in code
4. **Network access**: Consider VPN for sensitive testing
5. **Data handling**: Use test data only in development environment

**💰 Pro Tip**: This workflow saves £200+/year vs always-on development environments while providing the same functionality. The ARM64 optimization provides an additional 20% compute cost reduction on top of FARGATE_SPOT pricing.