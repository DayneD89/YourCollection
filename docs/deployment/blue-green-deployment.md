# Blue/Green Deployment Overview

> Zero-downtime deployment strategy with automatic rollback capabilities

Blue/green deployment provides a robust production deployment strategy that eliminates downtime and reduces deployment risk.

## Quick Reference

| Topic | Guide | Purpose |
|-------|-------|---------|
| **Strategy** | [Blue/Green Strategy](blue-green-strategy.md) | Deployment approach and benefits |
| **Security** | [Production Security](../infrastructure/production-security.md) | Security configuration for prod |
| **Setup** | [Blue/Green Strategy](blue-green-strategy.md) | Technical implementation |
| **Monitoring** | [Production Monitoring](../infrastructure/monitoring.md) | Post-deployment validation |

## When to Use Blue/Green

**✅ Use When:**
- Production deployments require zero downtime
- Quick rollback capability is essential
- You have sufficient infrastructure budget
- Complex applications with multiple dependencies

**❌ Consider Alternatives When:**
- Development/testing deployments (use rolling updates)
- Cost optimization is primary concern
- Simple applications with minimal dependencies

## Implementation Options

### AWS ECS Blue/Green
```bash
# Automated blue/green with ECS
aws deploy create-deployment \
  --application-name party-collection-prod \
  --deployment-group-name blue-green-dg \
  --s3-location bucket=deployments,key=app.zip
```

### AWS CodeDeploy Blue/Green (Recommended)
```bash
# Blue/green deployment is handled automatically by AWS CodeDeploy
# when triggered via GitHub Actions or AWS CLI above
# See GitHub Actions workflow for automated blue/green deployment
```

## Process Overview

1. **[Preparation](blue-green-strategy.md#preparation-phase)** - Deploy to inactive environment
2. **[Validation](../testing/test-commands.md)** - Test inactive environment thoroughly  
3. **[Traffic Switch](blue-green-strategy.md#traffic-switch)** - Route traffic to new version
4. **[Monitoring](../infrastructure/monitoring.md#deployment-monitoring)** - Validate production health
5. **[Cleanup](blue-green-strategy.md#cleanup)** - Decommission old environment

## Related Documentation

- **[Deployment Strategy](blue-green-strategy.md)** - Complete blue/green process
- **[Production Security](../infrastructure/production-security.md)** - Security considerations
- **[Rollback Procedures](rollback-procedures.md)** - Emergency rollback
- **[Cost Analysis](cost-guide.md)** - Blue/green cost implications