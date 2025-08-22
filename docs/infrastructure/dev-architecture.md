# AWS Development Environment Architecture

> **Related**: [System Overview](stack-structure.md) | [Cost Guide](../deployment/cost-guide.md) | [AWS Deployment](../deployment/aws-deployment.md)

Complete technical architecture reference for the AWS development environment, optimized for cost-effective development and integration testing.

## 🏗️ Architecture Overview

The development environment is designed for minimal cost with maximum functionality, using AWS best practices for small-scale applications.

### High-Level Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    AWS Development Environment                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   Application   │    │    Database     │    │   Network    │ │
│  │   Load Balancer │    │   Aurora        │    │   Public     │ │
│  │   (Optional)    │    │   Serverless v1 │    │   Subnets    │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│           │                       │                      │      │
│           ▼                       ▼                      ▼      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   ECS Fargate   │    │   RDS Subnet    │    │   Internet   │ │
│  │   ARM64 Tasks   │    │   Group         │    │   Gateway    │ │
│  │   Auto-Scaling  │    │   Multi-AZ      │    │   Route      │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Cost-Optimized Design Decisions

| Component | Standard Approach | Our Approach | Cost Savings |
|-----------|------------------|---------------|--------------|
| **Compute** | x86 on-demand | ARM64 FARGATE_SPOT | 70% reduction |
| **Database** | Always-on RDS | Aurora Serverless auto-pause | 90% when idle |
| **Network** | Private subnets + NAT | Public subnets only | £45/month saved |
| **Load Balancer** | Always-on ALB | Optional, for custom domains only | £18/month optional |

---

## 🔧 Infrastructure Components

### ECS Fargate Cluster

**Service**: `party-collection-dev-cluster`
**Configuration**: ARM64 optimized for cost efficiency

```yaml
# CloudFormation Configuration
ECSCluster:
  Type: AWS::ECS::Cluster
  Properties:
    ClusterName: !Sub "${ProjectName}-${Environment}-cluster"
    CapacityProviders:
      - FARGATE_SPOT  # 70% cost savings
    DefaultCapacityProviderStrategy:
      - CapacityProvider: FARGATE_SPOT
        Weight: 100
```

**Task Definitions**:
- **Backend Task**: 0.25 vCPU, 512MB RAM
- **Frontend Task**: 0.25 vCPU, 512MB RAM
- **Platform**: linux/arm64 (Graviton2 processors)
- **Scaling**: 0-2 tasks (auto-scaling based on CPU)

#### Scaling Behavior
```
Idle State (0 tasks):     £0.00/month
Active State (1-2 tasks): £8-15/month
Peak Load (2+ tasks):     £15+/month (auto-scales)
```

### Aurora Serverless v1 Database

**Cluster**: `party-collection-dev-aurora`
**Engine**: PostgreSQL 13.x compatible

```yaml
# Key Configuration
AuroraCluster:
  Type: AWS::RDS::DBCluster
  Properties:
    Engine: aurora-postgresql
    EngineMode: serverless
    DatabaseName: party_collection
    ScalingConfiguration:
      AutoPause: true
      SecondsUntilAutoPause: 300  # 5 minutes
      MinCapacity: 2
      MaxCapacity: 4
```

**Cost Benefits**:
- **Auto-pause**: Shuts down after 5 minutes of inactivity
- **Automatic scaling**: 2-4 ACUs based on load
- **Cost when idle**: £0.00/month
- **Cost when active**: £3-8/month

### Network Architecture

**VPC**: Public subnets only for cost optimization

```
Development VPC (10.0.0.0/16)
├── Public Subnet A (10.0.1.0/24) - us-east-1a
├── Public Subnet B (10.0.2.0/24) - us-east-1b
└── Internet Gateway (direct routing)
```

**Security Groups**:
- **ECS Security Group**: HTTP/HTTPS inbound, all outbound
- **Database Security Group**: PostgreSQL (5432) from ECS only

**Cost Optimization**:
- No NAT Gateway required (saves £45/month)
- Direct internet access for updates and external APIs
- Database in public subnets with security group restrictions

### Application Load Balancer (Optional)

**When to Use**:
- Custom domain names required
- SSL certificate termination needed
- Multiple service routing

**When to Skip**:
- Direct ECS task access acceptable
- Cost optimization priority
- Simple development testing

**Cost Impact**:
- With ALB: £18/month additional
- Without ALB: Direct access via ECS task IP/DNS

---

## 🔄 Deployment Architecture

### CloudFormation Stack Structure

```
party-collection-dev-minimal/
├── Networking (VPC, Subnets, Security Groups)
├── Database (Aurora Serverless Cluster)
├── Compute (ECS Cluster, Task Definitions)
├── IAM (Task Roles, Execution Roles)
└── Monitoring (CloudWatch Logs)
```

### Container Image Strategy

**Registry**: AWS ECR
**Architecture**: Multi-arch (ARM64 primary)

```dockerfile
# Example ARM64 optimization
FROM node:18-alpine  # ARM64 compatible
RUN apk add --no-cache ...
COPY package*.json ./
RUN npm ci --only=production
```

**Build Process**:
1. Build locally or in GitHub Actions
2. Push to ECR repository
3. Deploy via CloudFormation template
4. ECS pulls and runs containers

### Scaling Strategy

**Development Usage Patterns**:
```
Daily Pattern:
09:00 - Scale up (1-2 tasks)
18:00 - Scale down (0 tasks)
Weekend - Idle (0 tasks)

Cost Result:
Active 8 hours/day = £0.40/day
Idle 16 hours/day = £0.00/day
Total = £8.80/month vs £60/month always-on
```

---

## 🔍 Monitoring and Observability

### CloudWatch Integration

**Log Groups**:
- `/aws/ecs/party-collection-dev-backend`
- `/aws/ecs/party-collection-dev-frontend`

**Retention**: 7 days (cost optimization)

**Metrics Tracked**:
- ECS task CPU/memory utilization
- Aurora connection count and CPU
- Application-specific metrics via custom logs

### Health Checks

**ECS Health Checks**:
```yaml
HealthCheck:
  Command: 
    - CMD-SHELL
    - "curl -f http://localhost:3001/health || exit 1"
  Interval: 30
  Timeout: 5
  Retries: 3
```

**Database Health**:
- Aurora cluster status monitoring
- Auto-pause/resume tracking
- Connection pool monitoring

### Development Debugging

**Local Access**:
```bash
# Connect to running task
aws ecs execute-command \
  --cluster party-collection-dev-cluster \
  --task <task-id> \
  --interactive \
  --command "/bin/sh"

# View real-time logs
aws logs tail /aws/ecs/party-collection-dev-backend --follow
```

---

## 💰 Cost Breakdown Analysis

### Monthly Cost Components

| Component | Idle Cost | Active Cost | Notes |
|-----------|-----------|-------------|--------|
| **ECS Fargate** | £0.00 | £8.23 | ARM64 FARGATE_SPOT pricing |
| **Aurora Serverless** | £0.00 | £3.52 | Auto-pause enabled |
| **Data Transfer** | £0.10 | £0.20 | Minimal outbound |
| **CloudWatch** | £0.43 | £0.90 | 7-day log retention |
| **Total** | **£0.53** | **£12.85** | Without ALB |
| **With ALB** | **£18.53** | **£30.85** | Add £18 for load balancer |

### Regional Cost Variations

```
Cost by AWS Region (Monthly Active):
us-east-1 (N. Virginia): £12.85 (baseline)
us-west-2 (Oregon): £14.14 (+10%)
eu-west-1 (Ireland): £15.42 (+20%)
eu-west-2 (London): £16.99 (+32%)
```

**Recommendation**: Use us-east-1 for cost optimization unless data residency requirements dictate otherwise.

---

## 🚀 Deployment Strategies

### Development Workflow Integration

**GitHub Actions Integration**:
```yaml
# .github/workflows/deploy-dev.yml
- name: Deploy to Development
  run: |
    aws cloudformation deploy \
      --template-file templates/minimal-dev-template.yaml \
      --stack-name party-collection-dev-minimal \
      --parameter-overrides \
        DesiredCount=1 \
        Environment=dev
```

**Manual Deployment**:
```bash
cd infra/remote/tests
./dev-deploy.sh your-email@example.com
```

**Scaling Operations**:
```bash
# Scale to active
./dev-active.sh    # Sets DesiredCount=1

# Scale to idle  
./dev-idle.sh      # Sets DesiredCount=0

# Complete teardown
./dev-teardown.sh  # Deletes entire stack
```

### Environment Promotion

**Development → Staging**:
1. Export development configuration
2. Apply production security enhancements
3. Enable private subnets and NAT Gateway
4. Add Application Load Balancer
5. Enable enhanced monitoring

**Key Differences from Production**:
- Single AZ deployment (vs Multi-AZ)
- Smaller instance sizes (0.25 vCPU vs 0.5 vCPU)
- Auto-pause database (vs always-on)
- Public subnets (vs private)
- Basic monitoring (vs enhanced)

---

## 🔗 Integration Points

### External Dependencies

**GitHub Actions**:
- Deployment automation
- Cost monitoring workflows
- Security scanning

**AWS Services**:
- ECR for container images
- CloudWatch for monitoring
- IAM for access control
- Route53 for DNS (optional)

### Local Development Integration

**Development Flow**:
1. **Local Development**: Docker containers for daily work
2. **Integration Testing**: Deploy to AWS dev environment
3. **Feature Validation**: Test with real AWS services
4. **Cost Control**: Auto-scale down when not needed

**Connection Methods**:
```bash
# Direct database access (via bastion or VPN)
psql -h dev-aurora-endpoint -U postgres -d party_collection

# Application access
curl https://dev-ecs-task-ip:3001/health
```

---

## 📚 Related Documentation

**Infrastructure**:
- **[System Architecture](stack-structure.md)** - Complete system overview
- **[Production Architecture](prod-architecture.md)** - Production environment details
- **[Security Guide](security.md)** - Security implementation

**Deployment**:
- **[AWS Deployment](../deployment/aws-deployment.md)** - Complete deployment guide
- **[Cost Management](../deployment/cost-guide.md)** - Cost optimization strategies

**Operations**:
- **[Environment Control](../troubleshooting/environment-control.md)** - Daily management
- **[Monitoring Setup](monitoring.md)** - Monitoring and alerting configuration
- **[Remote Management](../troubleshooting/remote-management.md)** - AWS operations guide

**Getting Started**:
- **[AWS Permissions](../getting-started/aws-permissions.md)** - Initial AWS setup
- **[Quick Start](../getting-started/quick-start.md)** - Getting up and running

---

*This development environment architecture balances cost efficiency with full AWS service integration, providing a realistic testing environment at minimal cost for local party organizations.*