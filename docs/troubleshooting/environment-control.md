# Environment Control Guide

## Master Environment On/Off Switch

The parent template now includes a `EnvironmentEnabled` parameter that acts as a master switch to completely disable entire environments.

## Parameter Files Overview

| File | Purpose | Environment State | Cost |
|------|---------|------------------|------|
| **dev.json** | Active development | Enabled, scaled to 0 | £0.00/month idle |
| **dev-disabled.json** | Disabled development | Completely off | £0.00/month |
| **prod.json** | Active production | Enabled, always running | £48.21/month |
| **prod-disabled.json** | Disabled production | Completely off | £0.00/month |

---

## Environment States and Costs

### Development Environment

#### Enabled but Idle (dev.json with DesiredCount=0)
```yaml
EnvironmentEnabled: true
DesiredCount: 0
DatabaseType: aurora-v1 (auto-pause)

Resources Created:
✅ Aurora Serverless v1 (paused after 5min)
✅ ECS Cluster (no running tasks)  
✅ CloudWatch Log Groups (minimal data)
✅ Auto-scaling targets (scaled to 0)

Cost: £0.00/month (true zero scaling)
```

#### Completely Disabled (dev-disabled.json)
```yaml
EnvironmentEnabled: false
DatabaseType: none

Resources Created:
❌ No database
❌ No ECS cluster
❌ No log groups
❌ No secrets
❌ No networking

Cost: £0.00/month (no resources)
```

### Production Environment

#### Enabled and Running (prod.json)
```yaml
EnvironmentEnabled: true
DesiredCount: 2
DatabaseType: aurora-v2
EnableALB: true
EnableBlueGreen: true

Resources Created:
✅ Aurora Serverless v2 (always running)
✅ ECS Services (2 tasks each)
✅ Application Load Balancer
✅ Blue-green deployment capability
✅ RDS Proxy for connection pooling

Cost: £48.21/month (fully operational)
```

#### Completely Disabled (prod-disabled.json)
```yaml
EnvironmentEnabled: false
DatabaseType: none

Resources Created:
❌ No database
❌ No ECS cluster  
❌ No ALB
❌ No blue-green infrastructure

Cost: £0.00/month (complete shutdown)
Savings: £48.21/month when disabled
```

---

## Deployment Commands

### Development Environment

```bash
# Deploy active development (zero-scaled)
aws cloudformation deploy \
  --template-file parent-template.yaml \
  --stack-name party-collection-dev \
  --parameter-overrides file://parameters/dev.json

# Completely disable development
aws cloudformation deploy \
  --template-file parent-template.yaml \
  --stack-name party-collection-dev \
  --parameter-overrides file://parameters/dev-disabled.json

# Quick enable/disable without redeployment
aws cloudformation update-stack \
  --stack-name party-collection-dev \
  --use-previous-template \
  --parameters ParameterKey=EnvironmentEnabled,ParameterValue=false

aws cloudformation update-stack \
  --stack-name party-collection-dev \
  --use-previous-template \
  --parameters ParameterKey=EnvironmentEnabled,ParameterValue=true
```

### Production Environment

```bash
# Deploy active production
aws cloudformation deploy \
  --template-file parent-template.yaml \
  --stack-name party-collection-prod \
  --parameter-overrides file://parameters/prod.json

# Completely disable production (SAVES £48.21/month)
aws cloudformation deploy \
  --template-file parent-template.yaml \
  --stack-name party-collection-prod \
  --parameter-overrides file://parameters/prod-disabled.json

# Quick disable production during development
aws cloudformation update-stack \
  --stack-name party-collection-prod \
  --use-previous-template \
  --parameters ParameterKey=EnvironmentEnabled,ParameterValue=false
```

---

## Use Cases

### 1. **Development Only Mode**
```bash
# Enable dev, disable prod
aws cloudformation update-stack --stack-name party-collection-dev --use-previous-template --parameters ParameterKey=EnvironmentEnabled,ParameterValue=true
aws cloudformation update-stack --stack-name party-collection-prod --use-previous-template --parameters ParameterKey=EnvironmentEnabled,ParameterValue=false

Monthly Cost: £0.00 (dev scales to zero)
Monthly Savings: £48.21 (prod disabled)
```

### 2. **Production Only Mode**
```bash
# Disable dev, enable prod
aws cloudformation update-stack --stack-name party-collection-dev --use-previous-template --parameters ParameterKey=EnvironmentEnabled,ParameterValue=false
aws cloudformation update-stack --stack-name party-collection-prod --use-previous-template --parameters ParameterKey=EnvironmentEnabled,ParameterValue=true

Monthly Cost: £48.21 (prod running)
Monthly Savings: £0.00 (dev already zero)
```

### 3. **Complete Shutdown**
```bash
# Disable both environments
aws cloudformation update-stack --stack-name party-collection-dev --use-previous-template --parameters ParameterKey=EnvironmentEnabled,ParameterValue=false
aws cloudformation update-stack --stack-name party-collection-prod --use-previous-template --parameters ParameterKey=EnvironmentEnabled,ParameterValue=false

Monthly Cost: £0.00 (everything disabled)
Monthly Savings: £48.21 (maximum savings)
```

### 4. **Weekend/Holiday Shutdown**
```bash
# Friday evening - disable prod for weekend
aws cloudformation update-stack --stack-name party-collection-prod --use-previous-template --parameters ParameterKey=EnvironmentEnabled,ParameterValue=false

# Monday morning - re-enable prod
aws cloudformation update-stack --stack-name party-collection-prod --use-previous-template --parameters ParameterKey=EnvironmentEnabled,ParameterValue=true

Weekend Savings: ~£12.05 (2.5 days × £1.61/day)
```

---

## Cost Impact Analysis

### Monthly Cost Scenarios

| Scenario | Dev Cost | Prod Cost | Total Cost | Monthly Savings |
|----------|----------|-----------|------------|----------------|
| **Both Enabled** | £0.00 | £48.21 | £48.21 | Baseline |
| **Dev Only** | £0.00 | £0.00 | £0.00 | £48.21 |
| **Prod Only** | £0.00 | £48.21 | £48.21 | £0.00 |
| **Both Disabled** | £0.00 | £0.00 | £0.00 | £48.21 |

### Annual Cost Scenarios

| Scenario | Annual Cost | Annual Savings |
|----------|-------------|----------------|
| **Prod Always On** | £578.52 | Baseline |
| **Prod Weekdays Only** | £417.35 | £161.17 (28%) |
| **Prod 6 Months/Year** | £289.26 | £289.26 (50%) |
| **Dev Only** | £0.00 | £578.52 (100%) |

---

## Automation Scripts

### Environment Toggle Script
```bash
#!/bin/bash
# toggle-environment.sh

ENVIRONMENT=$1
STATE=$2

if [ "$STATE" = "on" ]; then
    VALUE="true"
elif [ "$STATE" = "off" ]; then
    VALUE="false"
else
    echo "Usage: $0 <dev|prod> <on|off>"
    exit 1
fi

aws cloudformation update-stack \
    --stack-name "party-collection-${ENVIRONMENT}" \
    --use-previous-template \
    --parameters "ParameterKey=EnvironmentEnabled,ParameterValue=${VALUE}"

echo "${ENVIRONMENT} environment ${STATE}"
```

### Weekend Shutdown Automation
```bash
#!/bin/bash
# weekend-shutdown.sh (run via cron Friday evening)

echo "Disabling production for weekend..."
aws cloudformation update-stack \
    --stack-name party-collection-prod \
    --use-previous-template \
    --parameters ParameterKey=EnvironmentEnabled,ParameterValue=false

echo "Production disabled. Weekend savings: ~£12.05"
```

---

## Key Benefits

1. **Maximum Cost Control**: Disable expensive prod when not needed
2. **Instant Toggle**: Single parameter change to enable/disable
3. **Zero Residual Costs**: Complete resource deletion when disabled
4. **Development Focus**: Run only dev environment during development
5. **Scheduled Savings**: Automate weekend/holiday shutdowns
6. **Risk Mitigation**: Prevent accidental prod costs during development

**Maximum Potential Savings**: £578.52/year (100% if prod disabled completely)