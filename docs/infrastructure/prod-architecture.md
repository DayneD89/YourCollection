# AWS Production Environment Architecture

> **Related**: [System Overview](stack-structure.md) | [Development Architecture](dev-architecture.md) | [Security Guide](production-security.md)

Complete technical architecture reference for the AWS production environment, designed for local party organizations with event-based scaling requirements.

## 🏗️ Production Architecture Overview

The production environment is designed for real volunteer usage with event-based scaling, security, and reliability for local party organizations.

### High-Level Architecture

```
┌───────────────────────────────────────────────────────────────────────────┐
│                        AWS Production Environment                          │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐ │
│  │    Route53      │    │  Application    │    │      CloudFront         │ │
│  │   DNS & SSL     │    │  Load Balancer  │    │    CDN (Optional)       │ │
│  │   Management    │    │   Multi-AZ      │    │   Static Assets         │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘ │
│           │                       │                           │            │
│           ▼                       ▼                           ▼            │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐ │
│  │   Private       │    │   ECS Fargate   │    │      VPC Network        │ │
│  │   Subnets       │    │   ARM64 Tasks   │    │   Private + Public      │ │
│  │   Multi-AZ      │    │   Auto-Scaling  │    │   NAT Gateway           │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘ │
│           │                       │                           │            │
│           ▼                       ▼                           ▼            │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐ │
│  │   Aurora        │    │   Enhanced      │    │     Security            │ │
│  │   Serverless v2 │    │   Monitoring    │    │   WAF + Shield          │ │
│  │   Multi-AZ      │    │   Alerts        │    │   (Optional)            │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘ │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### Event-Based Scaling Model

**Between Events (Idle State)**:
- 1 task each (backend/frontend)
- Aurora at minimum capacity (0.5 ACU)
- Cost: £6-28/month

**During Events (Active State)**:
- 2-3 tasks each (backend/frontend)
- Aurora scaled for volunteer load
- Auto-scaling up to 10-20 tasks
- Cost: £150-250/month

**Peak Events**:
- Auto-scaling triggered by metrics
- Up to maximum configured capacity
- Cost: £300+/month

---

## 🔧 Infrastructure Components

### ECS Fargate Production Cluster

**Service**: `party-collection-prod-cluster`
**Configuration**: Production-optimized with reliability features

```yaml
# CloudFormation Configuration
ProductionECSCluster:
  Type: AWS::ECS::Cluster
  Properties:
    ClusterName: !Sub "${ProjectName}-prod-cluster"
    CapacityProviders:
      - FARGATE        # Primary for reliability
      - FARGATE_SPOT   # Secondary for cost optimization
    DefaultCapacityProviderStrategy:
      - CapacityProvider: FARGATE
        Weight: 70     # 70% reliable capacity
      - CapacityProvider: FARGATE_SPOT
        Weight: 30     # 30% cost-optimized
```

**Production Task Definitions**:
- **Backend Task**: 0.5 vCPU, 1024MB RAM (vs dev: 0.25/512)
- **Frontend Task**: 0.5 vCPU, 1024MB RAM
- **Platform**: linux/arm64 (Graviton2 for cost savings)
- **Health Checks**: Enhanced with multiple retry strategies

#### Auto-Scaling Configuration
```yaml
AutoScalingTarget:
  MinCapacity: 1      # Always at least 1 task running
  MaxCapacity: 20     # Can scale to handle large events
  TargetCPUUtilization: 60%
  TargetMemoryUtilization: 70%
  
ScaleUpPolicy:
  ScaleUpCooldown: 300s    # 5 minutes
  ScaleUpStep: 2 tasks     # Add 2 tasks at a time
  
ScaleDownPolicy:
  ScaleDownCooldown: 900s  # 15 minutes (slower scale-down)
  ScaleDownStep: 1 task    # Remove 1 task at a time
```

### Aurora Serverless v2 Database

**Cluster**: `party-collection-prod-aurora`
**Engine**: PostgreSQL 15.x compatible

```yaml
# Production Database Configuration
ProductionAuroraCluster:
  Type: AWS::RDS::DBCluster
  Properties:
    Engine: aurora-postgresql
    EngineMode: provisioned
    ServerlessV2ScalingConfiguration:
      MinCapacity: 0.5    # Minimum for idle periods
      MaxCapacity: 16     # Can handle large events
    DatabaseName: party_collection
    MultiAZ: true         # High availability
    BackupRetentionPeriod: 30  # 30-day backups
    PreferredBackupWindow: "03:00-04:00"
    PreferredMaintenanceWindow: "sun:04:00-sun:05:00"
```

**Production Database Features**:
- **Multi-AZ**: Automatic failover capability
- **Automated Backups**: 30-day retention
- **Performance Insights**: Enabled for monitoring
- **Enhanced Monitoring**: 60-second granularity
- **No Auto-Pause**: Always available for volunteers

### Network Architecture

**Production VPC**: Private and public subnets with enhanced security

```
Production VPC (10.0.0.0/16)
├── Public Subnet A (10.0.1.0/24) - eu-west-2a
│   ├── Application Load Balancer
│   └── NAT Gateway A
├── Public Subnet B (10.0.2.0/24) - eu-west-2b  
│   ├── Application Load Balancer
│   └── NAT Gateway B
├── Private Subnet A (10.0.3.0/24) - eu-west-2a
│   ├── ECS Tasks (Backend/Frontend)
│   └── Aurora Database
└── Private Subnet B (10.0.4.0/24) - eu-west-2b
    ├── ECS Tasks (Backend/Frontend)  
    └── Aurora Database
```

**Security Groups**:
- **ALB Security Group**: HTTP/HTTPS from internet
- **ECS Security Group**: HTTP from ALB only, all outbound via NAT
- **Database Security Group**: PostgreSQL (5432) from ECS only
- **NAT Gateway Security Group**: Controlled outbound access

### Application Load Balancer

**Configuration**: Multi-AZ with SSL termination

```yaml
ProductionALB:
  Type: AWS::ElasticLoadBalancingV2::LoadBalancer
  Properties:
    Scheme: internet-facing
    Type: application
    Subnets: 
      - !Ref PublicSubnetA
      - !Ref PublicSubnetB
    SecurityGroups:
      - !Ref ALBSecurityGroup
```

**SSL/TLS**:
- **Certificate**: AWS Certificate Manager (ACM)
- **Protocol**: TLS 1.2 minimum
- **Ciphers**: Strong cipher suites only
- **HSTS**: Enabled for security

**Target Groups**:
- **Backend**: Health check on `/health` endpoint
- **Frontend**: Health check on root path
- **Health Check**: 30-second interval, 2 consecutive successes

---

## 🔄 Event-Based Scaling Operations

### Manual Scaling Scripts

**Scale Up for Events**:
```bash
# infra/remote/tests/prod-active.sh
cd infra/remote/tests
./prod-active.sh

# Results:
# - Backend: 1 → 2 tasks
# - Frontend: 1 → 2 tasks  
# - Aurora: Ready for volunteer load
# - Cost: £6-28 → £150-250/month
```

**Scale Down After Events**:
```bash
# infra/remote/tests/prod-idle.sh
cd infra/remote/tests
./prod-idle.sh

# Results:
# - Backend: 2+ → 1 task
# - Frontend: 2+ → 1 task
# - Aurora: Minimum capacity
# - Cost: £150-250 → £6-28/month
```

### Automated Scaling Triggers

**Scale-Up Triggers**:
- CPU utilization > 60% for 5 minutes
- Memory utilization > 70% for 5 minutes
- Request count > threshold for volunteer load
- Custom metrics (e.g., active volunteer count)

**Scale-Down Triggers**:
- CPU utilization < 30% for 15 minutes
- Memory utilization < 40% for 15 minutes
- Low request rate for extended period
- Scheduled scale-down after events

### Party Event Timeline Integration

**Pre-Event (T-24 hours)**:
```bash
# Scale up in preparation
./prod-active.sh
# Monitor services
./check-production-status.sh
```

**During Event (T+0 to T+6 hours)**:
- Auto-scaling handles volunteer traffic
- Monitor dashboards for performance
- Alert on any issues

**Post-Event (T+24 hours)**:
```bash
# Scale back down
./prod-idle.sh
# Verify data integrity
./verify-volunteer-data.sh
```

---

## 💰 Production Cost Analysis

### Monthly Cost Breakdown

#### Idle State (Between Events)
| Component | Configuration | Monthly Cost |
|-----------|---------------|--------------|
| **ECS Fargate** | 1 task each (ARM64) | £8-15 |
| **Aurora Serverless v2** | 0.5 ACU minimum | £5-8 |
| **Application Load Balancer** | Standard ALB | £18 |
| **NAT Gateway** | 2 AZ (HA setup) | £45 |
| **Data Transfer** | Minimal volunteer usage | £2-3 |
| **CloudWatch** | Enhanced monitoring | £3-5 |
| **Route53** | DNS hosting | £0.50 |
| **Total Idle** | **Minimal production** | **£81.50-94.50** |

#### Active State (During Events)
| Component | Configuration | Monthly Cost |
|-----------|---------------|--------------|
| **ECS Fargate** | 2-3 tasks each, auto-scaling | £80-150 |
| **Aurora Serverless v2** | Scaled for volunteer load | £25-50 |
| **Application Load Balancer** | With SSL termination | £18 |
| **NAT Gateway** | 2 AZ with event traffic | £45-60 |
| **Data Transfer** | Active volunteer usage | £10-20 |
| **CloudWatch** | Enhanced monitoring | £10-15 |
| **Route53** | DNS with health checks | £3 |
| **Total Active** | **Event-ready capacity** | **£191-316** |

### Annual Cost Projections

**Typical Local Party Usage**:
```
Event Calendar:
- 2 major events per year (2 weeks each)
- 4 smaller campaigns (1 week each)  
- 46 weeks idle/minimal activity

Cost Calculation:
- Active: 6 weeks × £250/week = £375
- Idle: 46 weeks × £22/week = £253
- Annual Total: £628

Cost per volunteer served: £1.26-6.28 (100-500 volunteers annually)
```

---

## 🔍 Monitoring and Observability

### Enhanced CloudWatch Configuration

**Log Groups**:
- `/aws/ecs/party-collection-prod-backend` (30-day retention)
- `/aws/ecs/party-collection-prod-frontend` (30-day retention)
- `/aws/rds/cluster/party-collection-prod-aurora/postgresql` (14-day retention)

**Custom Metrics**:
- Active volunteer count
- Database connection pool usage
- Application response times
- Event-specific metrics

**Dashboards**:
- **Operations Dashboard**: System health, scaling status
- **Volunteer Dashboard**: Active users, response times
- **Cost Dashboard**: Real-time cost tracking
- **Event Dashboard**: Event-specific metrics

### Alerting Strategy

**Critical Alerts** (Immediate Response):
- Service unavailable (any task crashes)
- Database connectivity issues
- SSL certificate expiration warnings
- High error rates (>5%)

**Warning Alerts** (Next Business Day):
- High CPU/memory utilization
- Scaling events triggered
- Cost budget thresholds exceeded
- Backup failures

**Info Notifications**:
- Daily cost reports
- Weekly usage summaries
- Scheduled maintenance notifications

### Performance Monitoring

**Application Performance**:
```yaml
# Example CloudWatch custom metrics
CustomMetrics:
  - MetricName: ActiveVolunteers
    Dimensions:
      - Name: Environment
        Value: production
  - MetricName: ResponseTime
    Unit: Milliseconds
  - MetricName: DatabaseConnections
    Unit: Count
```

**Database Performance Insights**:
- Query performance analysis
- Connection monitoring
- Wait event analysis
- Top SQL statements tracking

---

## 🔒 Security Architecture

### Network Security

**Multi-Layer Security**:
1. **CloudFront** (optional): DDoS protection, geographic filtering
2. **AWS WAF** (optional): Application firewall rules
3. **ALB Security Groups**: Allow only HTTP/HTTPS
4. **Private Subnets**: ECS tasks not directly internet-accessible
5. **Database Security Groups**: Database access from ECS only

**Security Group Rules**:
```yaml
# ALB Security Group
ALBSecurityGroup:
  SecurityGroupIngress:
    - IpProtocol: tcp
      FromPort: 80
      ToPort: 80
      CidrIp: 0.0.0.0/0
    - IpProtocol: tcp
      FromPort: 443
      ToPort: 443
      CidrIp: 0.0.0.0/0

# ECS Security Group  
ECSSecurityGroup:
  SecurityGroupIngress:
    - IpProtocol: tcp
      FromPort: 3000
      ToPort: 3001
      SourceSecurityGroupId: !Ref ALBSecurityGroup
```

### Data Protection

**Encryption at Rest**:
- **Aurora**: AES-256 encryption enabled
- **EBS Volumes**: Encrypted with AWS managed keys
- **CloudWatch Logs**: Encrypted log streams

**Encryption in Transit**:
- **HTTPS**: TLS 1.2+ for all external communication
- **Database**: SSL connections required
- **Inter-service**: Private network communication

**Backup Strategy**:
- **Database**: Automated daily backups, 30-day retention
- **Point-in-time Recovery**: Available for volunteer data
- **Cross-region Replication**: Optional for disaster recovery

### IAM Security

**Principle of Least Privilege**:
- **ECS Task Role**: Minimal permissions for application functionality
- **ECS Execution Role**: Container lifecycle management only
- **Auto Scaling Role**: Scaling operations only

**Access Control**:
- **Database Access**: Through application only, no direct access
- **Container Access**: AWS Session Manager for debugging
- **Log Access**: CloudWatch permissions for monitoring

---

## 🚀 Deployment and CI/CD

### Production Deployment Pipeline

**GitHub Actions Workflow**:
```yaml
# .github/workflows/deploy-prod.yml
Production_Deployment:
  environment: production
  steps:
    - name: Security Scan
      # Container vulnerability scanning
    - name: Integration Tests
      # Full test suite execution
    - name: Deploy to Production
      # Blue/green deployment capability
    - name: Health Verification
      # Post-deployment health checks
```

**Blue/Green Deployment Support**:
- **Target Groups**: Switch traffic between blue/green environments
- **Health Checks**: Automated verification before traffic switch
- **Rollback**: Immediate rollback capability if issues detected

### Disaster Recovery

**RTO (Recovery Time Objective)**: 15 minutes
**RPO (Recovery Point Objective)**: 5 minutes

**Recovery Procedures**:
1. **Database**: Point-in-time recovery from automated backups
2. **Application**: Redeploy from last known good configuration
3. **DNS**: Route53 health checks with automatic failover
4. **Data**: Cross-region backup replication (optional)

**Testing Schedule**:
- **Monthly**: Backup restoration testing
- **Quarterly**: Full disaster recovery simulation
- **Annual**: Cross-region failover testing

---

## 📚 Related Documentation

**Architecture & Infrastructure**:
- **[System Overview](stack-structure.md)** - Complete system architecture
- **[Development Architecture](dev-architecture.md)** - Development environment details
- **[Security Guide](production-security.md)** - Production security implementation
- **[Monitoring Guide](monitoring.md)** - Comprehensive monitoring setup

**Deployment & Operations**:
- **[AWS Deployment](../deployment/aws-deployment.md)** - Complete deployment guide
- **[Cost Management](../deployment/cost-guide.md)** - Cost optimization for production
- **[Remote Management](../troubleshooting/remote-management.md)** - Daily operations guide
- **[Environment Control](../troubleshooting/environment-control.md)** - Scaling operations

**Security & Compliance**:
- **[Security Architecture](security.md)** - Security implementation details
- **[AWS Permissions](../getting-started/aws-permissions.md)** - IAM setup guide

**Workflows**:
- **[Production Deployment Workflow](../workflows/prod-deployment-workflow.md)** - CI/CD pipeline details
- **[Cost Monitoring Workflow](../workflows/cost-monitoring-workflow.md)** - Cost tracking automation

---

*This production architecture provides a robust, cost-effective platform for local party organizations to manage volunteers during events while maintaining minimal costs between activities.*