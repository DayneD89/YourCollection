# Cost Monitoring Workflow

**File**: `cost-monitoring.yml`  
**Purpose**: Automated daily cost tracking, budget alerts, and emergency cost controls

## 💰 Overview

The cost monitoring workflow provides comprehensive financial oversight of AWS infrastructure with automatic reporting, budget enforcement, and emergency cost controls to prevent unexpected charges.

### Key Features
- ✅ **Daily cost reports**: Automated GitHub Issues with cost breakdown
- ✅ **Environment-specific tracking**: Separate dev/prod cost allocation
- ✅ **Budget alerts**: Multi-threshold warning system
- ✅ **Emergency shutdown**: Automatic cost protection at £500/month
- ✅ **Resource inventory**: Track running services and their costs
- ✅ **Historical tracking**: Cost trends and optimization insights

## ⏰ Schedule and Triggers

### Automatic Schedule
```yaml
on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM UTC (10 AM GMT/11 AM BST)
```

### Manual Trigger
```yaml
workflow_dispatch:
  inputs:
    alert_threshold:
      description: 'Alert if monthly cost exceeds (GBP)'
      required: false
      default: '50'
      type: string
```

**Usage**: Manual execution for immediate cost analysis or custom threshold testing

## ⚙️ Workflow Configuration

### Environment Variables
```yaml
env:
  AWS_REGION: eu-west-2

permissions:
  id-token: write    # OIDC authentication
  contents: read     # Repository access
  issues: write      # Create/update GitHub Issues
```

### Required Secrets
```yaml
# Cost monitoring role with Cost Explorer permissions
AWS_ROLE_ARN_COST_MONITORING: "arn:aws:iam::123456789012:role/github-actions-cost"
```

**Required IAM Permissions**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetDimensionValues",
        "budgets:DescribeBudget",
        "budgets:DescribeBudgets",
        "ecs:ListTasks",
        "ecs:ListClusters",
        "rds:DescribeDBClusters",
        "rds:DescribeDBInstances",
        "elbv2:DescribeLoadBalancers",
        "ec2:DescribeNatGateways",
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
```

## 🔄 Workflow Steps

### Step 1: Cost Data Collection
```yaml
- name: Get current month costs
  id: costs
  run: |
    # Get first and last day of current month
    FIRST_DAY=$(date -d "$(date +%Y-%m-01)" +%Y-%m-%d)
    LAST_DAY=$(date -d "$(date +%Y-%m-01) +1 month -1 day" +%Y-%m-%d)
    
    # Get total account cost in USD
    TOTAL_COST=$(aws ce get-cost-and-usage \
      --time-period Start=$FIRST_DAY,End=$LAST_DAY \
      --granularity MONTHLY \
      --metrics BlendedCost \
      --query 'ResultsByTime[0].Total.BlendedCost.Amount' \
      --output text)
    
    # Get cost by environment tag (dev/prod)
    DEV_COST=$(aws ce get-cost-and-usage \
      --time-period Start=$FIRST_DAY,End=$LAST_DAY \
      --granularity MONTHLY \
      --metrics BlendedCost \
      --filter '{"Tags":{"Key":"Environment","Values":["dev"]}}' \
      --query 'ResultsByTime[0].Total.BlendedCost.Amount' \
      --output text 2>/dev/null || echo "0")
    
    PROD_COST=$(aws ce get-cost-and-usage \
      --time-period Start=$FIRST_DAY,End=$LAST_DAY \
      --granularity MONTHLY \
      --metrics BlendedCost \
      --filter '{"Tags":{"Key":"Environment","Values":["prod"]}}' \
      --query 'ResultsByTime[0].Total.BlendedCost.Amount' \
      --output text 2>/dev/null || echo "0")
    
    # Convert USD to GBP (approximate rate)
    USD_TO_GBP=0.79
    TOTAL_COST_GBP=$(echo "$TOTAL_COST * $USD_TO_GBP" | bc -l | xargs printf "%.2f")
    DEV_COST_GBP=$(echo "$DEV_COST * $USD_TO_GBP" | bc -l | xargs printf "%.2f")
    PROD_COST_GBP=$(echo "$PROD_COST * $USD_TO_GBP" | bc -l | xargs printf "%.2f")
```

### Step 2: Service Cost Breakdown
```yaml
    # Get service breakdown (top 10 services by cost)
    SERVICE_COSTS=$(aws ce get-cost-and-usage \
      --time-period Start=$FIRST_DAY,End=$LAST_DAY \
      --granularity MONTHLY \
      --metrics BlendedCost \
      --group-by Type=DIMENSION,Key=SERVICE \
      --query 'ResultsByTime[0].Groups[?Total.BlendedCost.Amount!=`0`].[Keys[0],Total.BlendedCost.Amount]' \
      --output text | head -10)
```

**Service Breakdown Example**:
```
Amazon Elastic Container Service    45.23
Amazon Relational Database Service 38.91
Amazon Elastic Compute Cloud       22.15
Amazon CloudWatch                   3.47
AWS Secrets Manager                 0.99
```

### Step 3: Budget Status Monitoring
```yaml
- name: Check budget thresholds
  id: budgets
  run: |
    # Get development budget status
    DEV_BUDGET_STATUS=$(aws budgets describe-budget \
      --account-id $(aws sts get-caller-identity --query Account --output text) \
      --budget-name "party-collection-dev-minimal-budget" \
      --query 'Budget.CalculatedSpend.ActualSpend.Amount' \
      --output text 2>/dev/null || echo "0")
    
    # Get production budget status  
    PROD_BUDGET_STATUS=$(aws budgets describe-budget \
      --account-id $(aws sts get-caller-identity --query Account --output text) \
      --budget-name "party-collection-prod-budget" \
      --query 'Budget.CalculatedSpend.ActualSpend.Amount' \
      --output text 2>/dev/null || echo "0")
    
    # Check if costs exceed expected ranges
    DEV_EXPECTED=1.0    # £1 for minimal dev
    PROD_EXPECTED=250.0 # £250 for production
    
    # Set alert flags
    if (( $(echo "$DEV_COST_GBP > $DEV_EXPECTED * 2" | bc -l) )); then
      echo "dev_alert=true" >> $GITHUB_OUTPUT
    else
      echo "dev_alert=false" >> $GITHUB_OUTPUT
    fi
    
    if (( $(echo "$PROD_COST_GBP > $PROD_EXPECTED * 1.2" | bc -l) )); then
      echo "prod_alert=true" >> $GITHUB_OUTPUT
    else
      echo "prod_alert=false" >> $GITHUB_OUTPUT
    fi
```

### Step 4: Resource Inventory
```yaml
- name: Get resource inventory
  id: inventory
  run: |
    # Count running resources across all environments
    ECS_TASKS=$(aws ecs list-tasks --query 'length(taskArns)' --output text 2>/dev/null || echo "0")
    RDS_INSTANCES=$(aws rds describe-db-instances --query 'length(DBInstances)' --output text 2>/dev/null || echo "0")
    ALB_COUNT=$(aws elbv2 describe-load-balancers --query 'length(LoadBalancers)' --output text 2>/dev/null || echo "0")
    NAT_GATEWAYS=$(aws ec2 describe-nat-gateways --query 'length(NatGateways[?State==`available`])' --output text 2>/dev/null || echo "0")
    
    echo "ecs_tasks=$ECS_TASKS" >> $GITHUB_OUTPUT
    echo "rds_instances=$RDS_INSTANCES" >> $GITHUB_OUTPUT
    echo "alb_count=$ALB_COUNT" >> $GITHUB_OUTPUT
    echo "nat_gateways=$NAT_GATEWAYS" >> $GITHUB_OUTPUT
```

### Step 5: GitHub Issue Report Generation
```yaml
- name: Create cost report issue
  if: steps.budgets.outputs.dev_alert == 'true' || steps.budgets.outputs.prod_alert == 'true' || github.event_name == 'workflow_dispatch'
  uses: actions/github-script@v7
  with:
    script: |
      const today = new Date().toISOString().split('T')[0];
      const title = `💰 AWS Cost Report - ${today}`;
      
      let alertBadge = '';
      if (dev_alert === 'true' || prod_alert === 'true') {
        alertBadge = '🚨 **COST ALERT** 🚨\n\n';
      }
      
      const body = `${alertBadge}## Monthly Cost Summary
      
| Environment | Current Cost | Status |
|-------------|--------------|--------|
| **Development** | £${dev_cost_gbp} | ${dev_alert === 'true' ? '🚨 Over expected' : '✅ Normal'} |
| **Production** | £${prod_cost_gbp} | ${prod_alert === 'true' ? '🚨 Over expected' : '✅ Normal'} |
| **Total Account** | £${total_cost_gbp} | - |

## Resource Inventory

| Resource Type | Count | Cost Impact |
|---------------|-------|-------------|
| **ECS Tasks** | ${ecs_tasks} | ${ecs_tasks > 0 ? 'Active compute costs' : 'No compute costs'} |
| **RDS Instances** | ${rds_instances} | ${rds_instances > 0 ? 'Database costs active' : 'No database costs'} |
| **Load Balancers** | ${alb_count} | ${alb_count > 0 ? '~£18.90/month each' : 'No ALB costs'} |
| **NAT Gateways** | ${nat_gateways} | ${nat_gateways > 0 ? '~£22.68/month each' : 'No NAT costs'} |

## Cost Optimization Recommendations

${dev_alert === 'true' ? '### 🚨 Development Environment Alert\n- Development costs are higher than expected\n- Consider scaling down or disabling when not in use\n- Expected: ~£1/month, Actual: £' + dev_cost_gbp + '\n\n' : ''}

${prod_alert === 'true' ? '### 🚨 Production Environment Alert\n- Production costs are higher than expected\n- Review resource utilization and scaling policies\n- Expected: ~£250/month, Actual: £' + prod_cost_gbp + '\n\n' : ''}

### Quick Cost Reduction Commands

\`\`\`bash
# Scale development to idle (£0.53/month)
aws cloudformation update-stack \\
  --stack-name party-collection-dev-minimal \\
  --use-previous-template \\
  --parameters ParameterKey=DesiredCount,ParameterValue=0

# Completely disable development (£0/month)
aws cloudformation update-stack \\
  --stack-name party-collection-dev-minimal \\
  --use-previous-template \\
  --parameters ParameterKey=EnvironmentEnabled,ParameterValue=false
\`\`\`

---
*Report generated automatically by GitHub Actions*
*Next report: Tomorrow at 9 AM UTC*`;

      // Check for existing cost report today
      const existingIssues = await github.rest.issues.listForRepo({
        owner: context.repo.owner,
        repo: context.repo.repo,
        labels: ['cost-report'],
        state: 'open'
      });
      
      const todayIssue = existingIssues.data.find(issue => 
        issue.title.includes(today)
      );
      
      if (todayIssue) {
        // Update existing issue
        await github.rest.issues.update({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: todayIssue.number,
          body: body
        });
      } else {
        // Create new issue
        await github.rest.issues.create({
          owner: context.repo.owner,
          repo: context.repo.repo,
          title: title,
          body: body,
          labels: ['cost-report', 'monitoring']
        });
      }
```

### Step 6: Emergency Cost Protection
```yaml
- name: Emergency shutdown if costs too high
  if: steps.costs.outputs.total_cost_gbp > 500
  run: |
    echo "🚨 EMERGENCY: Monthly costs exceed £500"
    echo "Triggering emergency shutdown of non-production resources"
    
    # Scale down development environment
    aws cloudformation update-stack \
      --stack-name party-collection-dev-minimal \
      --use-previous-template \
      --parameters ParameterKey=EnvironmentEnabled,ParameterValue=false \
      --capabilities CAPABILITY_IAM || true
    
    # Send emergency notification
    echo "Emergency shutdown triggered due to high costs: £${{ steps.costs.outputs.total_cost_gbp }}"
```

**Emergency Threshold**: £500/month total account cost triggers automatic development environment shutdown

## 📊 Cost Tracking and Analysis

### Environment-Specific Tracking

#### Development Environment Expected Costs
```yaml
Minimal Development:
  Idle: £0.53/month (DesiredCount=0)
  Active: £17.85/month (8h/day weekdays)
  Always-on: £49.92/month (24/7)

Alert Thresholds:
  Warning: £2.00/month (200% of expected)
  Critical: £5.00/month (500% of expected)
  Action: Scale to idle automatically
```

#### Production Environment Expected Costs
```yaml
Production (ARM64 Optimized):
  Baseline: £222.07/month
  High load: £300-400/month (auto-scaling)
  Maximum: £500/month (emergency threshold)

Alert Thresholds:
  Warning: £266.48/month (120% of baseline)
  Critical: £333.10/month (150% of baseline)
  Action: Alert only (no auto-shutdown)
```

### Cost Optimization Insights
```yaml
# Service cost analysis patterns
High_Cost_Services:
  - Amazon ECS: Check task count and sizing
  - Amazon RDS: Review Aurora scaling settings
  - Amazon EC2: Investigate NAT gateway usage
  - CloudWatch: Optimize log retention

Cost_Reduction_Opportunities:
  - Scale ECS to 0 when not needed
  - Use Aurora auto-pause for development
  - Implement ARM64 for compute savings
  - Optimize log retention periods
```

## 🚨 Alert System

### Multi-Level Alert Thresholds

#### Development Alerts
```yaml
Budget: £10/month
Thresholds:
  - 50% (£5): Email warning
  - 80% (£8): Critical email + GitHub Issue
  - 95% (£9.50): Emergency action (scale to idle)
  - 100% (£10): Block additional spending

Expected vs Actual:
  Normal: £0.53-£17.85/month
  Alert: >£20/month
  Action: Investigate resource usage
```

#### Production Alerts
```yaml
Budget: £250/month
Thresholds:
  - 50% (£125): Email warning
  - 80% (£200): Critical email + GitHub Issue
  - 95% (£237.50): Executive alert
  - 100% (£250): Budget exceeded notification

Expected vs Actual:
  Normal: £220-£280/month
  Alert: >£300/month
  Action: Review scaling policies
```

#### Account-Level Protection
```yaml
Emergency Threshold: £500/month
Actions:
  1. Immediate GitHub Issue creation
  2. Development environment shutdown
  3. Emergency notification
  4. Manual investigation required

Protection Strategy:
  - Preserve production workloads
  - Shutdown non-critical development
  - Alert team for manual review
  - Prevent runaway costs
```

### GitHub Issue Integration

#### Daily Cost Reports
```yaml
Title: "💰 AWS Cost Report - 2024-01-15"
Labels: ["cost-report", "monitoring"]
Content:
  - Environment-specific cost breakdown
  - Resource inventory with cost impact
  - Optimization recommendations
  - Quick action commands
  - Historical trend analysis
```

#### Cost Alert Issues
```yaml
Title: "🚨 COST ALERT - Development Environment - 2024-01-15"
Labels: ["cost-alert", "urgent"]
Content:
  - Alert threshold exceeded details
  - Current vs expected cost analysis
  - Recommended immediate actions
  - Resource usage investigation
  - Budget adjustment options
```

## 📈 Historical Analysis

### Monthly Cost Trends
```bash
# Cost trend analysis (manual)
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-12-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

### Optimization Tracking
```yaml
# Track optimization impact
ARM64_Migration_Savings:
  Before: £95.04/month (x86 compute)
  After: £76.04/month (ARM64 compute)
  Savings: £19/month (20% reduction)

Auto_Scaling_Savings:
  Development_Idle: £17.85 → £0.53/month
  Savings: £17.32/month when not in use
  Annual_Impact: £207.84/year

Public_Subnet_Savings:
  NAT_Gateways: £45.36/month saved
  VPC_Endpoints: £15.82/month saved
  Total_Network: £61.18/month saved
```

## 🔧 Configuration and Customization

### Custom Alert Thresholds
```bash
# Manual execution with custom threshold
gh workflow run cost-monitoring.yml \
  -f alert_threshold=100

# Different thresholds for different environments
Development_Custom: £5/month
Production_Custom: £300/month
Account_Emergency: £750/month
```

### Budget Customization
```yaml
# Modify budget limits in CloudFormation parameters
dev-minimal.json:
  MonthlyBudgetLimit: "10"  # £10/month

prod.json:
  MonthlyBudgetLimit: "250" # £250/month

# Custom budget for specific projects
project-staging.json:
  MonthlyBudgetLimit: "50"  # £50/month
```

### Notification Channels
```yaml
# Current: GitHub Issues
Future_Integrations:
  - Slack webhook notifications
  - Email alerts via SNS
  - PagerDuty for critical alerts
  - Microsoft Teams integration
  - Custom webhook endpoints
```

## 🎯 Usage Examples

### Daily Monitoring Routine
```bash
# Automatic daily execution at 9 AM UTC
# Manual check for immediate analysis
gh workflow run cost-monitoring.yml

# Review GitHub Issues for cost reports
gh issue list --label "cost-report"

# Check for active cost alerts
gh issue list --label "cost-alert" --state open
```

### Budget Investigation Workflow
```bash
# 1. Receive cost alert notification
# 2. Review GitHub Issue for details
# 3. Check resource inventory

# Investigate high development costs
aws ecs list-tasks --cluster party-collection-dev-cluster
aws rds describe-db-clusters --query 'DBClusters[?Status==`available`]'

# Quick cost reduction
aws cloudformation update-stack \
  --stack-name party-collection-dev-minimal \
  --use-previous-template \
  --parameters ParameterKey=DesiredCount,ParameterValue=0
```

### Monthly Cost Review
```bash
# Generate comprehensive monthly report
gh workflow run cost-monitoring.yml

# Analyze cost trends
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity DAILY \
  --metrics BlendedCost

# Review optimization opportunities
# - Check for unused resources
# - Analyze scaling patterns
# - Identify cost anomalies
# - Plan budget adjustments
```

## 🛠️ Troubleshooting

### Common Issues

#### Cost Data Collection Failures
```yaml
Issue: "Access denied to Cost Explorer"
Solution: 
  - Verify AWS_ROLE_ARN_COST_MONITORING has ce:GetCostAndUsage permission
  - Check role trust policy allows GitHub OIDC
  - Ensure Cost Explorer is enabled in AWS account

Issue: "Budget not found"
Solution:
  - Verify budget exists with exact name
  - Check budget is in correct AWS account
  - Ensure budget name matches CloudFormation resource
```

#### GitHub Issue Creation Problems
```yaml
Issue: "Permission denied to create issues"
Solution:
  - Verify workflow has issues: write permission
  - Check GitHub token has repository access
  - Ensure repository allows issue creation

Issue: "Issue already exists for today"
Behavior: Updates existing issue instead of creating new one
Expected: Daily cost reports update throughout the day
```

#### Emergency Shutdown Failures
```yaml
Issue: "CloudFormation update failed"
Solution:
  - Check stack is not already updating
  - Verify IAM permissions for stack updates
  - Review CloudFormation events for specific errors

Issue: "Emergency threshold too low"
Solution:
  - Current threshold: £500/month
  - Adjust based on production requirements
  - Consider different thresholds for different accounts
```

### Recovery Procedures

#### Reset Cost Monitoring
```bash
# Re-run cost monitoring manually
gh workflow run cost-monitoring.yml

# Check workflow logs for errors
gh run list --workflow=cost-monitoring.yml
gh run view RUN_ID --log

# Verify AWS permissions
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

#### Handle False Alerts
```bash
# If development costs appear high due to testing
# Check actual resource usage
aws ecs describe-services \
  --cluster party-collection-dev-cluster \
  --services party-collection-dev-backend

# Verify if costs are justified
# - Extended testing period
# - Multiple developers active
# - Performance testing in progress

# Adjust budget if needed (temporary)
gh workflow run cost-monitoring.yml \
  -f alert_threshold=50  # Increase threshold temporarily
```

---

## 💡 Best Practices

### Daily Monitoring
1. **Review daily reports**: Check GitHub Issues each morning
2. **Investigate anomalies**: Look into unexpected cost increases
3. **Track trends**: Monitor month-over-month changes
4. **Optimize regularly**: Act on cost optimization recommendations
5. **Set appropriate budgets**: Match budgets to actual usage patterns

### Cost Optimization
1. **Scale development to idle**: Default to DesiredCount=0
2. **Use Aurora auto-pause**: Let database hibernate when not used
3. **Monitor ARM64 savings**: Verify 20% compute cost reduction
4. **Clean up resources**: Remove unused infrastructure regularly
5. **Right-size services**: Match capacity to actual demand

### Alert Management
1. **Respond quickly**: Investigate alerts within 24 hours
2. **Update budgets**: Adjust limits based on usage patterns
3. **Document decisions**: Record why costs increased or budgets changed
4. **Plan for spikes**: Expect higher costs during development sprints
5. **Review monthly**: Comprehensive cost analysis and budget planning

**💰 Pro Tip**: The cost monitoring workflow prevents expensive surprises by providing daily visibility and automatic protection. The £500 emergency threshold protects against runaway costs while preserving critical production workloads.