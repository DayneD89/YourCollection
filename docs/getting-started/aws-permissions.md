# AWS Permissions Setup Guide

Complete guide for setting up minimal IAM permissions for the Party Collection project deployment.

> **Navigation**: [Documentation Index](../index.md) | [Quick Start](quick-start.md) | [AWS Deployment](../deployment/aws-deployment.md)

## 🎯 Overview

This guide provides automated scripts to create the minimal required AWS IAM permissions for deploying the Party Collection application. The setup follows security best practices with least-privilege access and OIDC-based authentication.

## 📋 Prerequisites

Before running the setup scripts:

- ✅ **AWS CLI installed** and configured with credentials
- ✅ **Your AWS user has IAM permissions** to create roles and policies
- ✅ **GitHub repository** forked and ready for deployment
- ✅ **jq installed** (for JSON processing in validation script)

## 🚀 Quick Setup

### 1. Run Permission Setup Script

```bash
# Replace with your actual GitHub username and repository name
./setup-aws-permissions.sh YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME

# Example:
./setup-aws-permissions.sh myusername/party-collection
```

### 2. Validate Configuration

```bash
./validate-aws-permissions.sh
```

### 3. Configure GitHub Secrets

The setup script will output the exact secrets needed. Add them to:
**GitHub Repository → Settings → Secrets and Variables → Actions**

## 🛡️ Security Architecture

### OIDC-Based Authentication

The setup uses OpenID Connect (OIDC) to eliminate long-lived AWS credentials:

- ✅ **No stored AWS keys** in GitHub secrets
- ✅ **Temporary credentials** generated per workflow run
- ✅ **Branch-specific permissions** (dev vs prod)
- ✅ **Repository-specific access** only

### Principle of Least Privilege

Each role has minimal permissions for its specific purpose:

| Role | Purpose | Key Permissions | Branch Access |
|------|---------|----------------|---------------|
| **github-actions-dev** | Development deployment | ECS, RDS, CloudFormation (dev stacks only) | develop, feature/* |
| **github-actions-prod** | Production deployment | Full infrastructure, ALB, ACM | main only |
| **github-actions-global** | Global infrastructure | ECR repositories, OIDC roles | main only |
| **github-actions-cost** | Cost monitoring | Cost Explorer, Budget alerts | any branch |

## 📊 Detailed Role Breakdown

### Development Role (`github-actions-dev`)

**Purpose**: Deploy and manage development environment (£0.53-£17.85/month)

**Key Permissions**:
- CloudFormation: Create/update/delete dev stacks only
- ECS: Manage tasks and services
- RDS: Aurora Serverless v1 management  
- ECR: Push/pull Docker images
- VPC: Create minimal networking (public subnets only)
- Logs: CloudWatch log groups for dev environment

**Security Boundaries**:
- ❌ Cannot access production stacks
- ❌ Cannot create expensive resources (NAT gateways, large instances)
- ❌ Limited to eu-west-2 region only
- ✅ Auto-scaling limited by CloudFormation templates

### Production Role (`github-actions-prod`)

**Purpose**: Deploy and manage production environment (£222/month)

**Key Permissions**:
- CloudFormation: Full production stack management
- ECS: Complete container orchestration
- RDS: Production database with enhanced monitoring
- ALB: Application Load Balancer management
- ACM: SSL certificate management
- Route53: DNS record management
- VPC: Full networking including private subnets

**Security Boundaries**:
- ✅ Only accessible from main branch
- ✅ Manual workflow dispatch required
- ✅ Production confirmation required in workflows

### Global Infrastructure Role (`github-actions-global`)

**Purpose**: Manage shared resources (ECR repositories, IAM roles)

**Key Permissions**:
- ECR: Create and manage container repositories
- IAM: Create application-specific roles
- CloudFormation: Global infrastructure stacks

**Security Boundaries**:
- ✅ Cannot access environment-specific resources
- ✅ Only for shared/global infrastructure

### Cost Monitoring Role (`github-actions-cost`)

**Purpose**: Daily cost tracking and budget alerts

**Key Permissions**:
- Cost Explorer: Read cost and usage data
- Budgets: View budget status
- CloudFormation: Describe stacks for inventory
- ECS/RDS: Describe resources for cost attribution
- Emergency: Scale down dev environment if costs exceed limits

**Security Boundaries**:
- ❌ Cannot modify production resources
- ❌ Read-only access except for emergency dev scaling

## 🔧 Manual Setup (Alternative)

If you prefer manual setup, here are the key components:

### 1. Create OIDC Identity Provider

```bash
aws iam create-open-id-connect-provider \
  --url "https://token.actions.githubusercontent.com" \
  --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1" "1c58a3a8518e8759bf075b76b750d4f2df264fcd" \
  --client-id-list "sts.amazonaws.com"
```

### 2. Create Trust Policy Template

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:USERNAME/REPO:ref:refs/heads/BRANCH"
        }
      }
    }
  ]
}
```

### 3. Create Roles with Policies

Use the automated script for complete policy definitions, as manual setup requires extensive JSON policy documents.

## 🧪 Testing Your Setup

### Automated Validation

```bash
# Run comprehensive validation
./validate-aws-permissions.sh

# Check specific role
aws iam get-role --role-name github-actions-dev

# Verify OIDC provider
aws iam get-open-id-connect-provider \
  --open-id-connect-provider-arn "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
```

### GitHub Actions Test

1. Push to `develop` branch → Should trigger dev deployment
2. Check GitHub Actions logs for successful role assumption
3. Verify infrastructure deployment in AWS console

## 🚨 Troubleshooting

### Common Issues

#### 1. Permission Denied During Setup

```bash
# Error: User not authorized to create OIDC provider
# Solution: Ensure your AWS user has IAM admin permissions
aws iam attach-user-policy \
  --user-name YOUR_USERNAME \
  --policy-arn arn:aws:iam::aws:policy/IAMFullAccess
```

#### 2. Role Assumption Failed in GitHub Actions

```yaml
# Error: "An error occurred (AccessDenied) when calling the AssumeRoleWithWebIdentity"
# Solution: Check GitHub repository name matches exactly
# Correct format: "username/repository-name"
```

#### 3. CloudFormation Permission Denied

```bash
# Error: User not authorized to perform cloudformation:CreateStack
# Solution: Role may need additional resource permissions
# Check specific resource ARNs in error message
```

#### 4. Cost Explorer Access Denied

```bash
# Error: "An error occurred (AccessDeniedException) when calling the GetCostAndUsage"
# Solution: Cost Explorer requires specific account settings
# Enable Cost Explorer in AWS Console → Cost Management → Cost Explorer
```

### Validation Failures

If validation script fails:

1. **Re-run setup script** to ensure all roles exist
2. **Check AWS CLI permissions** - ensure you can create IAM roles
3. **Verify repository name format** - must be exact match
4. **Wait for propagation** - IAM changes can take up to 10 minutes

## 💰 Cost Impact

The permission setup itself has **zero cost**. The roles and policies don't incur charges until they're used to deploy infrastructure.

**Monthly Infrastructure Costs** (when deployed):
- Development (idle): £0.53/month
- Development (active): £17.85/month  
- Production: £222.07/month

## 📚 Related Documentation

- [AWS Deployment Guide](../deployment/aws-deployment.md) - Complete infrastructure deployment
- [Cost Management Guide](../deployment/cost-guide.md) - Detailed cost analysis
- [Infrastructure Stack Structure](../infrastructure/stack-structure.md) - Technical architecture details
- [GitHub Actions Overview](../workflows/github-actions-overview.md) - CI/CD pipeline documentation

## 🔐 Security Best Practices

### Regular Security Audit

```bash
# Review role trust relationships
aws iam list-roles --query 'Roles[?contains(RoleName,`github-actions`)].{Role:RoleName,Created:CreateDate}'

# Check for unused roles
aws iam generate-service-last-accessed-details \
  --arn arn:aws:iam::ACCOUNT_ID:role/github-actions-dev

# Review attached policies
aws iam list-role-policies --role-name github-actions-dev
```

### Access Monitoring

- **CloudTrail**: Monitor role assumption events
- **CloudWatch**: Set up alerts for unusual activity
- **Budget Alerts**: Catch unexpected cost increases

### Periodic Cleanup

- Remove old or unused roles
- Rotate OIDC provider thumbprints if needed
- Review and minimize permissions quarterly

---

**💡 Pro Tip**: Use the validation script after any manual changes to ensure your permissions remain correctly configured. The automated setup follows AWS security best practices and provides the minimal permissions needed for successful deployment.