# Production Security Configuration

> Enhanced security measures for production blue/green deployments

Comprehensive security configuration for production environments with blue/green deployment support.

## Network Security

### VPC Configuration
```yaml
# Private subnet isolation
PrivateSubnets:
  - 10.0.3.0/24 (Blue environment)
  - 10.0.4.0/24 (Green environment)

PublicSubnets:
  - 10.0.1.0/24 (Load balancers only)
  - 10.0.2.0/24 (NAT gateways)
```

### Security Groups
```yaml
# Application tier (Blue/Green)
ApplicationSecurityGroup:
  Ingress:
    - Port: 3001
      Source: LoadBalancerSecurityGroup
    - Port: 3000  
      Source: LoadBalancerSecurityGroup
  Egress:
    - Port: 443 (HTTPS outbound)
    - Port: 5432 (Database access)
```

## SSL/TLS Configuration

### Certificate Management
```bash
# ACM certificate with multiple domains
aws acm request-certificate \
  --domain-name app.yourdomain.com \
  --subject-alternative-names \
    blue.yourdomain.com \
    green.yourdomain.com
```

### Load Balancer SSL
```yaml
# HTTPS listeners for both environments
LoadBalancer:
  Listeners:
    - Port: 443
      Protocol: HTTPS
      Certificates: [ACM Certificate ARN]
      DefaultActions:
        - Type: forward
          TargetGroups: [BlueTargetGroup, GreenTargetGroup]
```

## WAF Integration

### Web Application Firewall
```yaml
# CloudFormation WAF configuration
WebACL:
  Rules:
    - SQLInjectionRule
    - XSSProtectionRule
    - RateLimitRule
    - GeoBlockingRule
```

## Related Security

**→ [Security Architecture](security.md)** - Complete security overview  
**→ [Monitoring Setup](monitoring.md)** - Security event monitoring  
**→ [Common Issues Guide](../troubleshooting/common-issues.md)** - Troubleshooting and incident response