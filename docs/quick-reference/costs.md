# Quick Reference - Cost Optimization

> **Navigation**: [Documentation Index](../index.md) | [Commands](commands.md) | [Troubleshooting](troubleshooting.md)

Complete cost breakdown and optimization strategies for the Party Collection application at a glance.

## 💰 Cost Summary Overview

### 🔧 Development Environment Costs

#### Active State
- **💰 Monthly**: £17.85 | **📅 Daily**: £0.58
- **🎯 Use**: Full development work, integration testing

#### Idle State  
- **💰 Monthly**: £0.53 | **📅 Daily**: £0.02
- **🎯 Use**: Weekends, evenings, preserved infrastructure

#### Shutdown State
- **💰 Monthly**: £0.00 | **📅 Daily**: £0.00  
- **🎯 Use**: Extended breaks, holidays, complete cleanup

### 🏢 Production Environment Costs

#### Idle (Between Events)
- **💰 Cost**: £6-28/month
- **👥 Volunteers**: 0-5 active
- **🎯 Use**: Between volunteer campaigns

#### Event Active
- **💰 Cost**: £150-250/month
- **👥 Volunteers**: 50-300 concurrent  
- **🎯 Use**: During active campaigns

#### Peak Events
- **💰 Cost**: £300+/month
- **👥 Volunteers**: 300+ concurrent
- **🎯 Use**: Large volunteer events, major campaigns

---

## 🚀 Instant Cost Controls

### Emergency Cost Reduction (< 30 seconds)
```bash
# Development environment - scale to minimum
cd infra/remote/tests
./dev-idle.sh
# Result: £17.85 → £0.53/month

# Emergency shutdown
./dev-teardown.sh
# Result: All costs → £0/month
```

### Production Cost Controls
```bash
# Scale down production services
aws ecs update-service \
  --cluster party-collection-prod-cluster \
  --service party-collection-prod-backend-service \
  --desired-count 2
```

---

## 📊 Detailed Cost Breakdown

### AWS Development Environment

**Active State (£17.85/month)**
- ECS Fargate Tasks: £12.50
  - Backend: 0.25 vCPU, 512MB RAM
  - Frontend: 0.25 vCPU, 512MB RAM
- Aurora Serverless v1: £4.20
  - 1 ACU minimum, auto-pause enabled
- Application Load Balancer: £1.15
  - Basic ALB with minimal rules

**Idle State (£0.53/month)**
- ECS Services: £0.00 (scaled to 0)
- Aurora: £0.00 (auto-paused)
- Load Balancer: £0.53 (always runs)
- Storage: £0.00 (minimal)

**Architecture Optimizations**
```bash
# ARM64 Graviton2 processors (20% cost saving)
"platformVersion": "1.4.0",
"runtimePlatform": {
  "cpuArchitecture": "ARM64"
}

# Auto-pause database (saves 90% when idle)
"EnableHttpEndpoint": true,
"DatabaseName": "party_collection",
"AutoPause": true,
"SecondsUntilAutoPause": 300
```

### Local Development (Free)
- Docker containers on local machine
- PostgreSQL + PgAdmin locally
- No cloud costs during development

---

## ⚡ Cost Optimization Strategies

### Development Environment

**Time-Based Scaling**
```bash
# Morning startup routine
./dev-active.sh    # £0.53 → £17.85

# Evening shutdown routine  
./dev-idle.sh      # £17.85 → £0.53

# Weekend/holiday shutdown
./dev-teardown.sh  # Any cost → £0.00
```

**Smart Development Practices**
- Use local environment for initial development (£0)
- Deploy to AWS only for integration testing
- Auto-idle after 30 minutes of inactivity
- Shutdown completely for holidays/weekends

### Production Environment

**Right-Sizing Strategy**
```bash
# Monitor actual usage
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization

# Adjust resources based on usage
# Start small: 0.25 vCPU → Scale up as needed
```

**Storage Optimization**
```sql
-- Minimize database storage costs
-- Regular cleanup of old data
DELETE FROM logs WHERE created_at < NOW() - INTERVAL '30 days';

-- Compress old data
VACUUM FULL;
ANALYZE;
```

### Multi-Environment Strategy
| Environment | Usage Pattern | Cost Strategy |
|------------|---------------|---------------|
| **Local** | Daily development | Free (Docker) |
| **Development** | Integration testing | Auto-idle (£0.53-£17.85) |
| **Staging** | Pre-production testing | On-demand (£65/month) |
| **Production** | Live users | Always-on (£222/month) |

---

## 📈 Cost Monitoring & Alerts

### AWS Cost Monitoring
```bash
# Daily cost check
aws ce get-cost-and-usage \
  --time-period Start=$(date -d 'yesterday' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost

# Monthly projection
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '1 month ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost
```

### Cost Alerts Setup
```bash
# Create billing alert (AWS CLI)
aws cloudwatch put-metric-alarm \
  --alarm-name "PartyCollection-BillingAlert" \
  --alarm-description "Alert when monthly costs exceed £30" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 30 \
  --comparison-operator GreaterThanThreshold
```

### Cost Tracking Dashboard
```javascript
// Simple cost tracking script
const aws = require('aws-sdk');
const cloudwatch = new aws.CloudWatch();

async function getDailyCost() {
  const params = {
    TimePeriod: {
      Start: new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0],
      End: new Date().toISOString().split('T')[0]
    },
    Granularity: 'DAILY',
    Metrics: ['BlendedCost']
  };
  
  const result = await new aws.CostExplorer().getCostAndUsage(params).promise();
  return result.ResultsByTime[0].Total.BlendedCost.Amount;
}
```

---

## 🎯 Cost Optimization Checklist

### Daily Habits
- [ ] Check if development environment is needed today
- [ ] Scale to idle when finishing development work
- [ ] Monitor cost alerts in email/Slack

### Weekly Reviews
- [ ] Review actual vs projected costs
- [ ] Cleanup unused resources and old snapshots
- [ ] Optimize resource allocation based on usage

### Monthly Optimization
- [ ] Analyze cost trends and usage patterns
- [ ] Right-size production resources
- [ ] Review and update cost alerts
- [ ] Plan capacity for upcoming month

---

## 🔄 Cost-Effective Workflows

### Development Workflow
```bash
# Cost-optimized development day
./dev-active.sh              # Start: £0.53 → £17.85
# ... do development work ...
./dev-idle.sh                # End: £17.85 → £0.53

# Multi-day development
./dev-active.sh              # Monday morning
# ... work all week ...
./dev-idle.sh                # Friday evening

# Extended break
./dev-teardown.sh            # Before vacation: → £0.00
./dev-deploy.sh email        # After vacation: Deploy fresh
```

### Party Event Workflow (Production)
```bash
# Before event/campaign (scale up production)
# ./prod-active.sh             # Idle → Event-ready (£6-28 → £150-250)

# During event
# Monitor volunteer usage and auto-scaling

# After event (scale back down) 
# ./prod-idle.sh               # Event-ready → Idle (£150-250 → £6-28)

# Between seasons (long idle periods)
# Production stays at idle - data preserved, minimal costs
```

### Testing Strategy
```bash
# Cost-effective testing approach
# 1. Local tests first (free)
node test-runner.js --env=local

# 2. Deploy for integration tests only
./dev-active.sh
node test-runner.js --env=dev
./dev-idle.sh

# 3. Production testing scheduled
# Run production tests during off-peak hours
```

---

## 💡 Advanced Cost Savings

### Reserved Capacity (Production)
```bash
# Consider Reserved Instances for production
# 1-year term: 20% savings
# 3-year term: 40% savings
aws ec2 describe-reserved-instances-offerings \
  --instance-type t4g.micro \
  --availability-zone us-east-1a
```

### Spot Instances (Development)
```bash
# Use Spot Instances for non-critical workloads
# 50-70% cost reduction possible
# Good for batch processing, CI/CD
```

### Multi-Region Strategy
```bash
# Choose cheapest regions for development
# us-east-1 (N. Virginia): Cheapest
# us-west-2 (Oregon): Good alternative
# eu-west-1 (Ireland): EU compliance
```

### Container Optimization
```dockerfile
# Multi-stage builds reduce image size
FROM node:18-alpine AS builder
# ... build steps ...
FROM node:18-alpine AS runtime
COPY --from=builder /app/dist ./dist
# Smaller images = faster deployments = lower costs
```

---

## 📊 Cost Comparison Charts

### Development Environment States
```
Active    ████████████████████ £17.85/month
Idle      ██                   £0.53/month  
Shutdown  ▌                    £0.00/month

          0    5    10   15   20 £/month
```

### Production Scaling Options
```
Minimal   ████████████████████████████████████ £65/month
Standard  ████████████████████████████████████████████████████████████████████████████████████████████████████████████ £222/month
Scaled    ████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████ £500+/month

          0    100   200   300   400   500 £/month
```

### Annual Cost Projections
| Usage Pattern | Annual Cost | Daily Average |
|---------------|-------------|---------------|
| **Smart Dev** | £150 | £0.41 |
| **Always Active** | £214 | £0.59 |
| **Production** | £2,664 | £7.30 |

---

## 🚨 Cost Emergency Procedures

### When Costs Spike Unexpectedly
```bash
# 1. Immediate assessment (30 seconds)
aws ce get-cost-and-usage --time-period Start=$(date -d '2 days ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) --granularity DAILY --metrics BlendedCost

# 2. Emergency shutdown (1 minute)
./dev-teardown.sh

# 3. Identify cause
aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=RunTask

# 4. Prevent recurrence
# Review and update cost alerts
# Audit resource creation permissions
```

### Cost Alert Response
1. **£20/month alert** → Review usage patterns
2. **£30/month alert** → Scale down non-essential services  
3. **£50/month alert** → Emergency shutdown and investigation

---

---

## 📚 Detailed Guides

**For complete information, see:**
- **[Cost Guide](../deployment/cost-guide.md)** - Detailed cost analysis with visual charts
- **[Environment Control](../troubleshooting/environment-control.md)** - Daily cost management operations
- **[AWS Deployment](../deployment/aws-deployment.md)** - Infrastructure costs and deployment options
- **[Architecture Guide](../infrastructure/stack-structure.md)** - Technical implementation affecting costs

**Related Quick References:**
- **[Commands](commands.md)** - All scaling and deployment commands
- **[URLs](urls.md)** - Service endpoints and monitoring dashboards  
- **[Troubleshooting](troubleshooting.md)** - Cost-related issue fixes

---

**💰 Remember**: The most cost-effective approach is to right-size from the start and automate scaling based on actual usage patterns!