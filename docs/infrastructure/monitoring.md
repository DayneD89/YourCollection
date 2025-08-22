# Monitoring and Observability Guide

> **Related**: [Cost Guide](../deployment/cost-guide.md) | [Production Architecture](prod-architecture.md) | [Remote Management](../troubleshooting/remote-management.md)

Complete monitoring setup for both cost optimization and performance tracking in the Party Collection infrastructure.

## 🎯 Monitoring Overview

The monitoring strategy focuses on three key areas for local party organizations:

1. **Cost Monitoring**: Prevent budget overruns and optimize expenses
2. **Performance Monitoring**: Ensure volunteers have smooth experience
3. **Operational Monitoring**: Maintain system health during events

### Monitoring Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Monitoring Architecture                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐    ┌─────────────────┐    ┌────────────────────┐   │
│  │   CloudWatch    │    │   Cost Explorer │    │   GitHub Actions   │   │
│  │   Logs & Metrics│    │   Billing Alerts│    │   Workflow Alerts  │   │
│  │   Custom Dashboards   │   Budget Tracking    │   Deploy Status    │   │
│  └─────────────────┘    └─────────────────┘    └────────────────────┘   │
│           │                       │                         │           │
│           ▼                       ▼                         ▼           │
│  ┌─────────────────┐    ┌─────────────────┐    ┌────────────────────┐   │
│  │   Application   │    │   Infrastructure │    │   Business Logic   │   │
│  │   Metrics       │    │   Costs         │    │   Event Tracking   │   │
│  │   Response Times│    │   Service Usage │    │   Volunteer Metrics   │
│  └─────────────────┘    └─────────────────┘    └────────────────────┘   │
│           │                       │                         │           │
│           ▼                       ▼                         ▼           │
│  ┌─────────────────┐    ┌─────────────────┐    ┌────────────────────┐   │
│  │   Alerts &      │    │   Daily Cost    │    │   Event Reports    │   │
│  │   Notifications │    │   Reports       │    │   Usage Analytics  │   │
│  │   Slack/Email   │    │   Trend Analysis│    │   Volunteer Stats  │   │
│  └─────────────────┘    └─────────────────┘    └────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 💰 Cost Monitoring

### AWS Cost Management Setup

**Cost Allocation Tags**:
```yaml
# Standard tags for cost tracking
StandardTags:
  Project: party-collection
  Environment: dev|prod
  Owner: local-party-organization
  Purpose: volunteer-management
  CostCenter: technology
```

**Budget Configuration**:
```yaml
# Development Environment Budget
DevBudget:
  Amount: 25          # £25/month
  AlertThresholds:
    - 50%: Warning    # £12.50
    - 80%: Critical   # £20.00
    - 95%: Emergency  # £23.75

# Production Environment Budget  
ProdBudget:
  Amount: 300         # £300/month
  AlertThresholds:
    - 50%: Info       # £150
    - 80%: Warning    # £240
    - 95%: Critical   # £285
    - 100%: Emergency # £300
```

### Daily Cost Tracking

**Automated Cost Reports**:
```bash
#!/bin/bash
# daily-cost-report.sh

# Get yesterday's costs
YESTERDAY=$(date -d "yesterday" +%Y-%m-%d)
TODAY=$(date +%Y-%m-%d)

DEV_COST=$(aws ce get-cost-and-usage \
  --time-period Start=$YESTERDAY,End=$TODAY \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --filter file://cost-filter-dev.json)

PROD_COST=$(aws ce get-cost-and-usage \
  --time-period Start=$YESTERDAY,End=$TODAY \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --filter file://cost-filter-prod.json)

# Generate report
echo "Daily Cost Report - $YESTERDAY"
echo "================================"
echo "Development: £$(echo $DEV_COST | jq -r '.ResultsByTime[0].Total.BlendedCost.Amount')"
echo "Production: £$(echo $PROD_COST | jq -r '.ResultsByTime[0].Total.BlendedCost.Amount')"
```

**Cost Trend Analysis**:
```bash
# weekly-cost-trends.sh
# Analyze cost trends and predict monthly spend

WEEK_AGO=$(date -d "7 days ago" +%Y-%m-%d)
TODAY=$(date +%Y-%m-%d)

WEEKLY_COSTS=$(aws ce get-cost-and-usage \
  --time-period Start=$WEEK_AGO,End=$TODAY \
  --granularity DAILY \
  --metrics BlendedCost)

# Calculate trend and project monthly cost
echo "Weekly Cost Trend Analysis"
echo "=========================="
# Processing and projection logic here
```

### Cost Alert Automation

**CloudWatch Billing Alarms**:
```yaml
# CloudFormation template
DevelopmentBillingAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: "Party-Collection-Dev-Cost-Alert"
    AlarmDescription: "Development environment cost alert"
    MetricName: EstimatedCharges
    Namespace: AWS/Billing
    Statistic: Maximum
    Period: 86400
    EvaluationPeriods: 1
    Threshold: 25.00
    ComparisonOperator: GreaterThanThreshold
    Dimensions:
      - Name: Currency
        Value: GBP
    AlarmActions:
      - !Ref CostAlertTopic
```

**Emergency Cost Controls**:
```bash
# emergency-cost-shutdown.sh
# Triggered when costs exceed critical thresholds

echo "EMERGENCY: Cost threshold exceeded"
echo "Initiating emergency shutdown procedures..."

# Scale down development to zero
cd infra/remote/tests
./dev-idle.sh

# Scale down production to minimum (if safe)
if [ "$ENVIRONMENT" == "dev" ] || [ "$EMERGENCY_PROD_SCALE" == "true" ]; then
    ./prod-idle.sh
    echo "Production scaled to minimum capacity"
fi

# Send emergency notifications
aws sns publish \
  --topic-arn $EMERGENCY_TOPIC \
  --message "Emergency cost controls activated. Environments scaled down."
```

---

## 📊 Performance Monitoring

### Application Metrics

**Custom CloudWatch Metrics**:
```javascript
// Backend monitoring implementation
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

class ApplicationMonitoring {
  async recordVolunteerActivity(volunteerId, activity) {
    // Record volunteer-specific metrics
    await this.putMetric('VolunteersActive', 1, 'Count');
    await this.putMetric('ActivityRate', 1, 'Count', [
      { Name: 'ActivityType', Value: activity }
    ]);
  }

  async recordResponseTime(endpoint, duration) {
    await this.putMetric('ResponseTime', duration, 'Milliseconds', [
      { Name: 'Endpoint', Value: endpoint }
    ]);
  }

  async recordDatabaseQuery(queryType, duration) {
    await this.putMetric('DatabaseQueryTime', duration, 'Milliseconds', [
      { Name: 'QueryType', Value: queryType }
    ]);
  }

  async putMetric(metricName, value, unit, dimensions = []) {
    const params = {
      Namespace: 'PartyCollection/Application',
      MetricData: [{
        MetricName: metricName,
        Value: value,
        Unit: unit,
        Dimensions: dimensions,
        Timestamp: new Date()
      }]
    };
    
    await cloudwatch.putMetricData(params).promise();
  }
}
```

**Database Performance Monitoring**:
```sql
-- Custom database monitoring queries
-- Monitor connection pool usage
SELECT 
  count(*) as active_connections,
  current_timestamp as recorded_at
FROM pg_stat_activity 
WHERE state = 'active';

-- Monitor slow queries
SELECT 
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements 
WHERE mean_exec_time > 1000  -- > 1 second
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### System Health Monitoring

**ECS Service Health**:
```yaml
# CloudWatch Dashboard Configuration
ECSHealthDashboard:
  Widgets:
    - Type: Metric
      Properties:
        Metrics:
          - ["AWS/ECS", "CPUUtilization", "ServiceName", "party-collection-prod-backend"]
          - [".", "MemoryUtilization", ".", "."]
          - [".", "RunningTaskCount", ".", "."]
        Period: 300
        Stat: Average
        Region: eu-west-2
        Title: "ECS Service Health"
```

**Database Health Checks**:
```bash
#!/bin/bash
# database-health-check.sh

DB_ENDPOINT=$1
DB_NAME="party_collection"

# Check database connectivity
pg_isready -h $DB_ENDPOINT -p 5432 -d $DB_NAME

if [ $? -eq 0 ]; then
    echo "Database is accessible"
    
    # Check query performance
    SLOW_QUERIES=$(psql -h $DB_ENDPOINT -d $DB_NAME -t -c "
        SELECT count(*) FROM pg_stat_activity 
        WHERE state = 'active' AND query_start < now() - interval '30 seconds'
    ")
    
    if [ $SLOW_QUERIES -gt 5 ]; then
        echo "WARNING: $SLOW_QUERIES slow queries detected"
        # Send alert
    fi
else
    echo "CRITICAL: Database not accessible"
    # Send critical alert
fi
```

---

## 🚨 Alerting Strategy

### Alert Hierarchy

**Critical Alerts** (Immediate Action Required):
- Service completely unavailable
- Database connection failures
- SSL certificate expiration (< 7 days)
- Cost budget exceeded by 100%

**Warning Alerts** (Action Required Within 24 Hours):
- High error rates (> 5%)
- Performance degradation (response time > 2 seconds)
- Auto-scaling events triggered
- Cost budget exceeded by 80%

**Info Alerts** (Monitoring/Trending):
- Daily cost reports
- Usage statistics
- Performance trends
- Capacity planning metrics

### Notification Channels

**Slack Integration**:
```yaml
# GitHub Actions workflow for Slack notifications
- name: Send Slack Alert
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    channel: '#party-tech-alerts'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
    fields: repo,message,commit,author,action,eventName,ref,workflow
```

**Email Notifications**:
```yaml
# CloudFormation SNS topic for email alerts
AlertTopic:
  Type: AWS::SNS::Topic
  Properties:
    TopicName: party-collection-alerts
    Subscription:
      - Protocol: email
        Endpoint: tech@local-party.org
      - Protocol: email
        Endpoint: treasurer@local-party.org  # For cost alerts
```

### Alert Runbooks

**Service Unavailable Response**:
```markdown
# Service Unavailable Alert Response

## Immediate Actions (0-5 minutes)
1. Check ECS service status in AWS Console
2. Verify task health via CloudWatch logs
3. Check database connectivity
4. Review recent deployments

## Investigation Steps (5-15 minutes)
1. Check application logs for errors
2. Verify network connectivity
3. Check resource utilization
4. Review security group changes

## Resolution Steps
1. Restart unhealthy tasks if needed
2. Scale up if capacity issue
3. Rollback if deployment related
4. Contact AWS support if infrastructure issue

## Post-Incident
1. Document root cause
2. Update monitoring if gaps found
3. Review and improve runbook
```

---

## 📈 Event-Specific Monitoring

### Volunteer Activity Tracking

**Pre-Event Monitoring Setup**:
```bash
#!/bin/bash
# setup-event-monitoring.sh

EVENT_NAME="$1"
START_DATE="$2"
END_DATE="$3"

# Create event-specific dashboard
aws cloudwatch put-dashboard \
  --dashboard-name "Event-$EVENT_NAME" \
  --dashboard-body file://event-dashboard-template.json

# Set up temporary cost alerts for the event period
aws cloudwatch put-metric-alarm \
  --alarm-name "Event-$EVENT_NAME-Cost-Alert" \
  --alarm-description "Cost monitoring for $EVENT_NAME" \
  --threshold 200.00 \
  --comparison-operator GreaterThanThreshold
```

**Real-Time Volunteer Metrics**:
```javascript
// Frontend volunteer tracking
class VolunteerMetrics {
  constructor() {
    this.startTime = Date.now();
    this.activityCount = 0;
  }

  trackVolunteerLogin(volunteerId) {
    this.sendMetric('VolunteerLogin', 1, {
      volunteerId,
      timestamp: new Date().toISOString()
    });
  }

  trackVolunteerActivity(volunteerId, activity) {
    this.activityCount++;
    this.sendMetric('VolunteerActivity', 1, {
      volunteerId,
      activity,
      sessionDuration: Date.now() - this.startTime
    });
  }

  async sendMetric(metricName, value, metadata) {
    // Send to backend for CloudWatch forwarding
    await fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metricName,
        value,
        metadata,
        timestamp: new Date().toISOString()
      })
    });
  }
}
```

### Event Performance Analysis

**Post-Event Reports**:
```bash
#!/bin/bash
# generate-event-report.sh

EVENT_NAME="$1"
START_DATE="$2"
END_DATE="$3"

echo "Event Performance Report: $EVENT_NAME"
echo "======================================"
echo "Period: $START_DATE to $END_DATE"
echo ""

# Get volunteer activity metrics
VOLUNTEER_LOGINS=$(aws cloudwatch get-metric-statistics \
  --namespace "PartyCollection/Application" \
  --metric-name "VolunteerLogin" \
  --start-time "$START_DATE" \
  --end-time "$END_DATE" \
  --period 3600 \
  --statistics Sum)

# Get performance metrics
RESPONSE_TIMES=$(aws cloudwatch get-metric-statistics \
  --namespace "PartyCollection/Application" \
  --metric-name "ResponseTime" \
  --start-time "$START_DATE" \
  --end-time "$END_DATE" \
  --period 3600 \
  --statistics Average)

# Get cost data
EVENT_COSTS=$(aws ce get-cost-and-usage \
  --time-period Start="$START_DATE",End="$END_DATE" \
  --granularity DAILY \
  --metrics BlendedCost)

echo "Summary:"
echo "- Total volunteer logins: $(echo $VOLUNTEER_LOGINS | jq '.Datapoints | length')"
echo "- Average response time: $(echo $RESPONSE_TIMES | jq '.Datapoints | map(.Average) | add / length')"
echo "- Total event cost: £$(echo $EVENT_COSTS | jq '.ResultsByTime[].Total.BlendedCost.Amount | tonumber | . * 100 | round / 100')"
```

---

## 🔧 Monitoring Tools Setup

### CloudWatch Dashboards

**Operations Dashboard**:
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ECS", "CPUUtilization", "ServiceName", "party-collection-prod-backend"],
          [".", "MemoryUtilization", ".", "."],
          ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", "party-collection-prod-alb"],
          [".", "ResponseTime", ".", "."]
        ],
        "period": 300,
        "stat": "Average",
        "region": "eu-west-2",
        "title": "System Performance",
        "yAxis": {
          "left": {
            "min": 0,
            "max": 100
          }
        }
      }
    },
    {
      "type": "log",
      "properties": {
        "query": "SOURCE '/aws/ecs/party-collection-prod-backend'\n| fields @timestamp, @message\n| filter @message like /ERROR/\n| sort @timestamp desc\n| limit 20",
        "region": "eu-west-2",
        "title": "Recent Errors",
        "view": "table"
      }
    }
  ]
}
```

**Cost Dashboard**:
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Billing", "EstimatedCharges", "Currency", "GBP", "ServiceName", "AmazonECS"],
          [".", ".", ".", ".", ".", "AmazonRDS"],
          [".", ".", ".", ".", ".", "AmazonEC2"]
        ],
        "period": 86400,
        "stat": "Maximum",
        "region": "us-east-1",
        "title": "Daily Costs by Service"
      }
    }
  ]
}
```

### Automated Monitoring Setup

**Infrastructure as Code**:
```yaml
# monitoring-stack.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Monitoring infrastructure for Party Collection'

Resources:
  # Cost monitoring
  CostAlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${ProjectName}-cost-alerts'
      
  DevelopmentCostAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-dev-cost-alarm'
      MetricName: EstimatedCharges
      Threshold: 25.00
      AlarmActions:
        - !Ref CostAlertTopic

  # Performance monitoring
  PerformanceDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub '${ProjectName}-performance'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/ECS", "CPUUtilization", "ServiceName", "${ProjectName}-prod-backend"]
                ],
                "region": "${AWS::Region}",
                "title": "ECS Performance"
              }
            }
          ]
        }
```

---

## 📚 Related Documentation

**Infrastructure**:
- **[Production Architecture](prod-architecture.md)** - Complete production setup
- **[Development Architecture](dev-architecture.md)** - Development monitoring
- **[System Architecture](stack-structure.md)** - Overall system design

**Operations**:
- **[Cost Management Guide](../deployment/cost-guide.md)** - Cost optimization strategies
- **[Remote Management](../troubleshooting/remote-management.md)** - Daily operations guide
- **[Environment Control](../troubleshooting/environment-control.md)** - Infrastructure management

**Workflows**:
- **[Cost Monitoring Workflow](../workflows/cost-monitoring-workflow.md)** - Automated cost tracking
- **[Production Deployment Workflow](../workflows/prod-deployment-workflow.md)** - Deployment monitoring

**Security**:
- **[Security Guide](security.md)** - Security monitoring
- **[Production Security](production-security.md)** - Production security monitoring

---

*This monitoring setup provides comprehensive visibility into costs, performance, and operations for local party organizations managing volunteer systems.*