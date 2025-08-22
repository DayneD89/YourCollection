# Cost Management Guide

> **Related**: [Quick Reference Costs](../quick-reference/costs.md) | [Architecture Guide](../infrastructure/stack-structure.md) | [Environment Control](../troubleshooting/environment-control.md)

## 📋 What You Need to Know

**⏱️ Time needed**: 10 minutes to read, ongoing for optimization  
**🎓 Skill level**: Treasurer/organizer-friendly  
**💰 Impact**: Can reduce AWS costs by 85% with smart practices  
**💻 Prerequisites**: 
- Basic understanding of your party's event calendar
- Access to AWS billing dashboard (if using AWS)

**🎯 You'll complete**: Cost optimization strategy with:
- ✅ Understanding of all AWS costs (£0.53-250/month range)
- ✅ Event-based scaling for volunteer campaigns
- ✅ Emergency cost controls and alerts
- ✅ Annual cost planning for party organizations

> 💡 **TL;DR**: Local development is free. AWS costs £0.53/month when idle, £150-250/month during volunteer events. Smart scaling can save £2000+/year compared to always-on infrastructure.

Complete guide to understanding and optimizing costs for the Party Collection infrastructure with detailed cost breakdowns and comparison charts.

## 💰 Cost Overview

### 🏠 Local Development
- **💰 Cost**: £0.00/month  
- **📋 Status**: Always available
- **🎯 Use**: Daily coding work, learning, testing

### ☁️ AWS Development Environment
#### Idle State
- **💰 Cost**: £0.53/month
- **📋 Status**: Preserved but inactive
- **🎯 Use**: Keeping infrastructure ready without running costs

#### Active State  
- **💰 Cost**: £17.85/month
- **📋 Status**: Running and ready for testing
- **🎯 Use**: Integration testing, feature validation

### 🏢 Production Environment
#### Between Events (Idle)
- **💰 Cost**: £6-28/month
- **📋 Status**: Minimal capacity, data preserved
- **🎯 Use**: Between volunteer campaigns

#### During Events (Active)
- **💰 Cost**: £150-250/month  
- **📋 Status**: Scaled for volunteer load
- **🎯 Use**: Live volunteer events and campaigns

---

## 📊 Visual Cost Comparison Charts

### Environment Cost Comparison
```text
Monthly Costs by Environment

Local Development
█ £0.00/month

AWS Development (Idle)
██ £0.53/month

AWS Development (Active)  
████████████████████ £17.85/month

AWS Production (Standard)
████████████████████████████████████████████████████████████████████████████████████████████████████ £222/month

AWS Production (Peak Load)
████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████ £400/month

Scale: Each █ represents £2.5/month
```

### Daily Cost Breakdown
```text
Daily Costs Across Environments

                    Per Day    Per Hour
Local Dev          £0.00      £0.00
AWS Dev (Idle)     £0.02      £0.001
AWS Dev (Active)   £0.58      £0.024
AWS Production     £7.30      £0.304
```

### Annual Cost Projections
```text
12-Month Cost Scenarios

Smart Development (Local + AWS Idle/Active as needed):
├── Local development: 80% of time = £0
├── AWS active: 15% of time = £32
├── AWS idle: 5% of time = £1
└── Total Annual: £33

Always-Active Development:
├── AWS active: 100% of time = £214
└── Total Annual: £214

Production Deployment:
├── Standard load: £2,664/year
├── With smart scaling: £2,000-2,400/year
└── Peak periods: Up to £4,800/year
```

### Cost Optimization Impact
```text
Potential Savings with Smart Practices

Scenario 1: Always-On Development
├── AWS Dev Active: £214/year
├── No optimization
└── Waste: £181/year (vs optimized)

Scenario 2: Smart Development (Recommended)  
├── Local (80%): £0/year
├── AWS Active (15%): £32/year
├── AWS Idle (5%): £1/year
└── Total: £33/year

Savings: £181/year (84% cost reduction)
```

### Regional Cost Comparison
```text
AWS Costs by Region (Monthly, Development Active)

us-east-1 (N. Virginia) - Cheapest
████████████████████ £17.85/month

us-west-2 (Oregon)
██████████████████████ £19.50/month (+9%)

eu-west-1 (Ireland) 
████████████████████████ £21.40/month (+20%)

ap-southeast-1 (Singapore)
███████████████████████████ £24.60/month (+38%)

Note: Production costs scale proportionally
```

### Service Cost Breakdown (AWS Development Active)
```text
Monthly Cost by AWS Service

ECS Fargate (ARM64)
████████████████ £12.50 (70%)

Aurora Serverless v1  
██████ £4.20 (24%)

Application Load Balancer
█ £1.15 (6%)

Total: £17.85/month
```

### Production Service Breakdown (Standard Load)
```text
Monthly Cost by Service (Production)

ECS Fargate
██████████████████████████████████████████████████████████ £125 (56%)

Aurora Cluster  
█████████████████████████████ £65 (29%)

Application Load Balancer
████████ £18 (8%)

CloudFront CDN
████ £8 (4%)

Monitoring/Backup  
███ £6 (3%)

Total: £222/month
```

### Cost vs. Scale Relationship
```text
User Load vs Monthly Costs

1-10 concurrent users (Development)
Cost: £17.85/month
█████

50-100 users (Light Production)  
Cost: £222/month
████████████████████████████████████████████████████████████████████████████████████████████████████

500+ users (Standard Production)
Cost: £300-400/month  
█████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████

1000+ users (High Load Production)
Cost: £400-600/month
████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████

Scale: Each █ represents ~£2.5/month
```

### ROI Analysis for Different Usage Patterns
```text
Annual Cost vs Usage Patterns

Hobby Developer (Local + occasional AWS testing)
├── Usage: 95% local, 5% AWS active  
├── Annual Cost: £9
└── Cost per productive hour: £0.02

Professional Developer (Smart cloud usage)
├── Usage: 70% local, 20% AWS active, 10% AWS idle
├── Annual Cost: £43  
└── Cost per productive hour: £0.08

Always-Cloud Developer (Wasteful pattern)
├── Usage: 100% AWS active
├── Annual Cost: £214
└── Cost per productive hour: £0.41

Local Party Organization (Production when needed)
├── Production idle: 10 months at £15/month = £150
├── Production events: 2 months at £200/month = £400  
├── Annual Cost: £550 (typical)
└── Cost per volunteer: £1.10-5.50 (100-500 volunteers served annually)
```

---

## 🏠 Local Development (Free)

**Cost**: £0.00/month  
**Resources**: Local Docker containers only

The local development environment has zero AWS costs:
- PostgreSQL runs in Docker container  
- Backend and frontend run as Node.js processes
- No cloud resources consumed
- Perfect for daily development work

**Optimization Strategy**: Use local environment for 90% of development work.

**→ [Local Development Setup](../../infra/local/README.md)**

---

## ☁️ AWS Development Environment

### Idle State (£0.53/month)
When development environment is deployed but scaled down:

| Component | Configuration | Monthly Cost |
|-----------|---------------|--------------|
| **ECS Cluster** | No running tasks | £0.00 |
| **Aurora Serverless** | Auto-paused | £0.00 |
| **Load Balancer** | Basic ALB | £18.90 |
| **VPC Components** | Public subnets only | £0.00 |
| **CloudWatch Logs** | 7-day retention | £0.53 |
| **Total** | Infrastructure preserved | **£0.53** |

### Active State (£17.85/month)
When scaled up for development and testing:

| Component | Configuration | Monthly Cost |
|-----------|---------------|--------------|
| **ECS Fargate** | 1 ARM64 task (256 CPU/512 MB) | £8.23 |
| **Aurora Serverless** | Active with auto-pause | £3.52 |
| **Application Load Balancer** | Standard ALB | £18.90 |
| **Data Transfer** | Minimal outbound | £0.20 |
| **CloudWatch** | Logs and basic monitoring | £0.70 |
| **Total** | Active development | **£17.85** |

### Cost Optimization Features
- **ARM64 Architecture**: 20% cheaper than x86 instances
- **FARGATE_SPOT**: 70% cheaper than on-demand pricing
- **Aurora Auto-pause**: Database costs £0 when idle (5 min timeout)
- **Public Subnets**: Saves £45/month vs NAT gateway setup
- **Smart Scaling**: Automatic scale-to-zero when not in use

**→ [AWS Architecture Details](../infrastructure/dev-architecture.md)**

---

## 🚀 Production Environment

Production infrastructure designed for local party organizations with event-based scaling:

### Idle State (£6-28/month)
When scaled to minimal capacity between events:

| Component | Configuration | Monthly Cost |
|-----------|---------------|--------------|
| **ECS Fargate** | 1 task each (backend/frontend) | £8-15 |
| **Aurora Serverless v2** | 0.5 ACU minimum | £5-8 |
| **Application Load Balancer** | Basic ALB (if used) | £18 |
| **CloudWatch** | Basic monitoring | £1-2 |
| **Data Transfer** | Minimal | £1-3 |
| **Total (no ALB)** | Minimal production | **£6-15** |
| **Total (with ALB)** | Standard production | **£28** |

### Event-Active State (£150-250/month)
When scaled up for party events and campaigns:

| Component | Configuration | Monthly Cost |
|-----------|---------------|--------------|
| **ECS Fargate** | 2-3 tasks each, auto-scaling | £80-150 |
| **Aurora Serverless v2** | Scaled for volunteer load | £25-50 |
| **Application Load Balancer** | With SSL termination | £18 |
| **CloudWatch** | Enhanced monitoring | £10-15 |
| **Data Transfer** | Volunteer activity | £5-15 |
| **Route53** | DNS hosting | £3 |
| **Total** | Event-ready capacity | **£150-250** |

### Production Features Included
- **High Availability**: Multi-AZ deployment
- **Auto Scaling**: 2-10 tasks based on load  
- **Network Security**: Private subnets with NAT gateway
- **SSL/TLS**: Custom domain with certificate management
- **Enhanced Monitoring**: CloudWatch insights, longer log retention
- **Backup & Recovery**: Automated RDS backups
- **Performance Monitoring**: RDS Performance Insights

**→ [Production Architecture](../infrastructure/prod-architecture.md)**

---

## 🎯 Cost Control Strategies

### Daily Development Workflow
```bash
cd infra/remote/tests

# Morning: Activate for development work
./dev-active.sh                    # £0.53 → £17.85/month

# Work on features, test integration
# (Use local development for most coding)

# Evening: Scale back to save costs  
./dev-idle.sh                      # £17.85 → £0.53/month
```

**Annual Savings**: Using idle/active workflow saves **£4,800/year** vs always-active development.

### Cost Monitoring Automation
The infrastructure includes automated cost controls:

```bash
# Automatic budget alerts at:
# - 50% of budget: Warning notification
# - 80% of budget: Critical alert
# - 95% of budget: Emergency scale-down (dev only)

# Daily cost reporting via GitHub Issues
# Emergency shutdown capabilities for runaway costs
```

### Emergency Cost Controls
```bash
# Immediate cost reduction
cd infra/remote/tests
./dev-idle.sh                      # Active → Idle

# Emergency shutdown (saves all costs)
./dev-teardown.sh                  # Any → £0.00/month

# Production scaling (when implemented)
# ./prod-idle.sh                     # Scale production to idle
# ./prod-active.sh                   # Scale production for events
```

**→ [Environment Control](../troubleshooting/environment-control.md)** - Emergency cost controls and procedures

---

## 📊 Cost Comparison with Alternatives

### vs. Always-On Development
| Approach | Monthly Cost | Annual Cost | Savings |
|----------|--------------|-------------|---------|
| **Always-On Dev** | £89.64 | £1,075.68 | - |
| **Smart Scaling** | £0.53-£17.85 | £255.12 | **£820.56** |
| **Percentage Saved** | 80-99% | 76% | - |

### vs. Traditional Infrastructure
| Feature | Traditional | Party Collection | Savings |
|---------|-------------|------------------|---------|
| **Compute** | x86 instances | ARM64 Fargate | 20% |
| **Pricing** | On-demand | FARGATE_SPOT | 70% |
| **Database** | Always-on RDS | Auto-pause Aurora | 90% idle |
| **Network** | NAT gateways everywhere | Public subnets for dev | £45/month |
| **Total Savings** | - | Combined approach | **85% for dev** |

### Production Scaling for Party Events

| Event State | Monthly Cost | Volunteers | Configuration |
|-------------|-------------|------------|---------------|
| **Between Events** | £6-28 | 0-5 | Minimal containers (1 each) |
| **Event Preparation** | £150-250 | 50-300 | Event-ready (2-3 containers) |
| **Peak Events** | £300+ | 300+ | Auto-scaled (up to 10-20 containers) |

**Event-Based Cost Model**: Local party organizations can scale production up only when hosting events or campaigns, keeping costs minimal between activities while preserving all volunteer and party data.

---

## 🔧 Manual Cost Management

### Scale Development Environment
```bash
cd infra/remote/tests

# Check current status and costs
./dev-status.sh

# Scale to different configurations
./dev-idle.sh          # 0 tasks (£0.53/month)
./dev-active.sh         # 1 task (£17.85/month)  

# Update with latest code (maintains current scale)
./dev-update.sh

# Complete cleanup (£0.00/month)
./dev-teardown.sh
```

### GitHub Actions Cost Controls
```bash
# Via GitHub Actions UI:
# Actions → Deploy Development Environment → Run workflow

# Set desired_count: 0 for idle
# Set desired_count: 1 for active
# Set environment_enabled: false for complete shutdown
```

### AWS Console Manual Controls
```bash
# ECS Service scaling
aws ecs update-service \
  --cluster party-collection-dev-cluster \
  --service party-collection-dev-backend-service \
  --desired-count 0

# Aurora cluster pause (if supported)
aws rds stop-db-cluster \
  --db-cluster-identifier party-collection-dev-aurora

# CloudFormation stack updates
aws cloudformation update-stack \
  --stack-name party-collection-dev-minimal \
  --parameters ParameterKey=DesiredCount,ParameterValue=0
```

---

## 📈 Cost Monitoring and Alerts

### Automated Monitoring
The infrastructure includes comprehensive cost monitoring:

- **Daily Cost Reports**: GitHub Issues with current spending
- **Budget Alerts**: Email notifications at 50%, 80%, 95% thresholds
- **Resource Inventory**: Track running services and configurations
- **Trend Analysis**: Monthly cost pattern analysis
- **Emergency Controls**: Automatic scale-down at budget limits

### Manual Cost Tracking
```bash
# AWS CLI cost analysis
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost

# CloudWatch cost metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Billing \
  --metric-name EstimatedCharges \
  --dimensions Name=Currency,Value=USD \
  --statistics Maximum
```

### Cost Optimization Tools
- **AWS Cost Explorer**: Detailed cost breakdowns
- **AWS Budgets**: Automatic spending alerts  
- **CloudWatch Billing**: Real-time cost monitoring
- **Resource Tagging**: Track costs by environment/feature

**→ [Monitoring Setup](../infrastructure/monitoring.md)**

---

## 🎯 Best Practices for Cost Optimization

### Development Workflow
1. **Use Local First**: 90% of development work locally (£0 cost)
2. **Smart Remote Usage**: Only activate AWS for integration testing
3. **Daily Scaling**: Active during work hours, idle overnight/weekends
4. **Feature Branches**: Use GitHub Actions for automatic scaling
5. **Regular Cleanup**: Remove unused environments and resources

### Production Optimization
1. **Right-sizing**: Monitor actual usage and adjust instance sizes
2. **Auto Scaling**: Let traffic patterns determine resource needs
3. **Reserved Capacity**: Consider Reserved Instances for predictable workloads
4. **Data Transfer**: Optimize API calls and static asset delivery
5. **Monitoring**: Regular cost analysis and optimization reviews

### Long-term Strategy
1. **Capacity Planning**: Predict growth and plan resource scaling
2. **Architecture Evolution**: Consider serverless for sporadic workloads
3. **Multi-region**: Plan for global deployment cost implications
4. **Vendor Comparison**: Regular evaluation of AWS vs alternatives

---

## 🔗 Related Documentation

- **[Development Architecture](../infrastructure/dev-architecture.md)** - Development infrastructure cost drivers
- **[Production Architecture](../infrastructure/prod-architecture.md)** - Production infrastructure costs
- **[Production Scaling Scripts](../../infra/remote/tests/)** - Cost control automation (prod-active.sh, prod-idle.sh)
- **[Environment Control](../troubleshooting/environment-control.md)** - Cost emergency response
- **[Monitoring Setup](../infrastructure/monitoring.md)** - Cost tracking implementation
- **[AWS Deployment Guide](aws-deployment.md)** - Production deployment considerations