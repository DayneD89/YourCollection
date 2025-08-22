#!/bin/bash

# AWS IAM Permissions Setup Script for Party Collection
# This script creates minimal IAM roles and OIDC provider for GitHub Actions deployment

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REGION="${AWS_REGION:-eu-west-2}"
PROJECT_NAME="party-collection"
GITHUB_REPO="${1}"  # Expected format: "username/repository-name"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  INFO:${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ SUCCESS:${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠️  WARNING:${NC} $1"
}

log_error() {
    echo -e "${RED}❌ ERROR:${NC} $1"
}

# Function to check if AWS CLI is configured
check_aws_cli() {
    log_info "Checking AWS CLI configuration..."
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Please install it first."
        exit 1
    fi
    
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        log_error "AWS CLI not configured or no valid credentials. Please run 'aws configure' first."
        exit 1
    fi
    
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    local user_arn=$(aws sts get-caller-identity --query Arn --output text)
    
    log_success "AWS CLI configured for account: $account_id"
    log_info "Current identity: $user_arn"
    
    echo "$account_id"
}

# Function to validate GitHub repository format
validate_github_repo() {
    if [ -z "$GITHUB_REPO" ]; then
        log_error "GitHub repository not specified."
        echo "Usage: $0 <github-username/repository-name>"
        echo "Example: $0 myusername/party-collection"
        exit 1
    fi
    
    if [[ ! "$GITHUB_REPO" =~ ^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$ ]]; then
        log_error "Invalid GitHub repository format: $GITHUB_REPO"
        echo "Expected format: username/repository-name"
        exit 1
    fi
    
    log_success "GitHub repository validated: $GITHUB_REPO"
}

# Function to check if OIDC provider exists
check_oidc_provider() {
    local account_id="$1"
    
    log_info "Checking for GitHub OIDC identity provider..."
    
    local oidc_arn="arn:aws:iam::$account_id:oidc-provider/token.actions.githubusercontent.com"
    
    if aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$oidc_arn" >/dev/null 2>&1; then
        log_success "OIDC provider already exists: $oidc_arn"
        echo "exists"
    else
        log_info "OIDC provider not found, will create it"
        echo "missing"
    fi
}

# Function to create OIDC provider
create_oidc_provider() {
    log_info "Creating GitHub OIDC identity provider..."
    
    aws iam create-open-id-connect-provider \
        --url "https://token.actions.githubusercontent.com" \
        --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1" "1c58a3a8518e8759bf075b76b750d4f2df264fcd" \
        --client-id-list "sts.amazonaws.com" > /dev/null
    
    log_success "OIDC provider created successfully"
}

# Function to check if role exists
check_role_exists() {
    local role_name="$1"
    
    if aws iam get-role --role-name "$role_name" >/dev/null 2>&1; then
        echo "exists"
    else
        echo "missing"
    fi
}

# Function to create trust policy for GitHub Actions
create_trust_policy() {
    local repo="$1"
    local branch_condition="$2"
    local account_id="$3"
    
    cat > /tmp/trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::${account_id}:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "${branch_condition}"
        }
      }
    }
  ]
}
EOF
}

# Function to create development role
create_dev_role() {
    local account_id="$1"
    local role_name="github-actions-dev"
    
    log_info "Creating development deployment role..."
    
    # Create trust policy for develop and feature branches
    create_trust_policy "$GITHUB_REPO" "repo:${GITHUB_REPO}:ref:refs/heads/develop" "$account_id"
    
    # Create role
    aws iam create-role \
        --role-name "$role_name" \
        --assume-role-policy-document file:///tmp/trust-policy.json \
        --description "GitHub Actions role for development environment deployment" > /dev/null
    
    # Create minimal development policy
    cat > /tmp/dev-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:CreateStack",
        "cloudformation:UpdateStack",
        "cloudformation:DeleteStack",
        "cloudformation:DescribeStacks",
        "cloudformation:DescribeStackEvents",
        "cloudformation:DescribeStackResources",
        "cloudformation:GetTemplate",
        "cloudformation:ListStacks",
        "cloudformation:ValidateTemplate"
      ],
      "Resource": [
        "arn:aws:cloudformation:*:*:stack/party-collection-dev-*/*",
        "arn:aws:cloudformation:*:*:stack/party-collection-*-dev/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:BatchGetImage",
        "ecr:CreateRepository",
        "ecr:DescribeImages",
        "ecr:DescribeRepositories",
        "ecr:GetAuthorizationToken",
        "ecr:GetDownloadUrlForLayer",
        "ecr:ListImages",
        "ecr:PutImage",
        "ecr:UploadLayerPart",
        "ecr:InitiateLayerUpload",
        "ecr:CompleteLayerUpload",
        "ecr:PutImageScanningConfiguration",
        "ecr:BatchDeleteImage"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:CreateCluster",
        "ecs:CreateService",
        "ecs:UpdateService",
        "ecs:DeleteService",
        "ecs:DescribeClusters",
        "ecs:DescribeServices",
        "ecs:DescribeTasks",
        "ecs:ListClusters",
        "ecs:ListServices",
        "ecs:ListTasks",
        "ecs:RegisterTaskDefinition",
        "ecs:DeregisterTaskDefinition",
        "ecs:DescribeTaskDefinition",
        "ecs:RunTask",
        "ecs:StopTask",
        "ecs:TagResource",
        "ecs:UntagResource",
        "ecs:ListTagsForResource"
      ],
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "aws:RequestedRegion": "eu-west-2"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "rds:CreateDBCluster",
        "rds:DeleteDBCluster",
        "rds:DescribeDBClusters",
        "rds:ModifyDBCluster",
        "rds:StartDBCluster",
        "rds:StopDBCluster",
        "rds:AddTagsToResource",
        "rds:RemoveTagsFromResource",
        "rds:ListTagsForResource",
        "rds:CreateDBSubnetGroup",
        "rds:DeleteDBSubnetGroup",
        "rds:DescribeDBSubnetGroups",
        "rds:ModifyDBSubnetGroup"
      ],
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "aws:RequestedRegion": "eu-west-2"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateVpc",
        "ec2:DeleteVpc",
        "ec2:DescribeVpcs",
        "ec2:ModifyVpcAttribute",
        "ec2:CreateSubnet",
        "ec2:DeleteSubnet",
        "ec2:DescribeSubnets",
        "ec2:ModifySubnetAttribute",
        "ec2:CreateInternetGateway",
        "ec2:DeleteInternetGateway",
        "ec2:AttachInternetGateway",
        "ec2:DetachInternetGateway",
        "ec2:DescribeInternetGateways",
        "ec2:CreateRouteTable",
        "ec2:DeleteRouteTable",
        "ec2:DescribeRouteTables",
        "ec2:CreateRoute",
        "ec2:DeleteRoute",
        "ec2:AssociateRouteTable",
        "ec2:DisassociateRouteTable",
        "ec2:CreateSecurityGroup",
        "ec2:DeleteSecurityGroup",
        "ec2:DescribeSecurityGroups",
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:AuthorizeSecurityGroupEgress",
        "ec2:RevokeSecurityGroupIngress",
        "ec2:RevokeSecurityGroupEgress",
        "ec2:CreateTags",
        "ec2:DeleteTags",
        "ec2:DescribeTags",
        "ec2:DescribeAvailabilityZones"
      ],
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "aws:RequestedRegion": "eu-west-2"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:DeleteLogGroup",
        "logs:DescribeLogGroups",
        "logs:PutRetentionPolicy",
        "logs:TagLogGroup",
        "logs:UntagLogGroup"
      ],
      "Resource": "arn:aws:logs:eu-west-2:*:log-group:/ecs/party-collection-dev-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "budgets:CreateBudget",
        "budgets:DeleteBudget",
        "budgets:DescribeBudget",
        "budgets:DescribeBudgets",
        "budgets:ModifyBudget"
      ],
      "Resource": "arn:aws:budgets::*:budget/party-collection-dev-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PassRole",
        "iam:TagRole",
        "iam:UntagRole"
      ],
      "Resource": [
        "arn:aws:iam::*:role/party-collection-dev-*",
        "arn:aws:iam::*:role/*TaskExecutionRole*",
        "arn:aws:iam::*:role/*TaskRole*"
      ]
    }
  ]
}
EOF
    
    # Attach custom policy
    aws iam put-role-policy \
        --role-name "$role_name" \
        --policy-name "DevEnvironmentDeployment" \
        --policy-document file:///tmp/dev-policy.json
    
    log_success "Development role created: $role_name"
}

# Function to create production role  
create_prod_role() {
    local account_id="$1"
    local role_name="github-actions-prod"
    
    log_info "Creating production deployment role..."
    
    # Create trust policy for main branch only
    create_trust_policy "$GITHUB_REPO" "repo:${GITHUB_REPO}:ref:refs/heads/main" "$account_id"
    
    # Create role
    aws iam create-role \
        --role-name "$role_name" \
        --assume-role-policy-document file:///tmp/trust-policy.json \
        --description "GitHub Actions role for production environment deployment" > /dev/null
    
    # Attach AWS managed policies with conditions
    cat > /tmp/prod-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*"
      ],
      "Resource": [
        "arn:aws:cloudformation:*:*:stack/party-collection-prod-*/*",
        "arn:aws:cloudformation:*:*:stack/party-collection-*-prod/*",
        "arn:aws:cloudformation:*:*:stack/party-collection-global/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:*"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:*"
      ],
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "aws:RequestedRegion": "eu-west-2"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "rds:*"
      ],
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "aws:RequestedRegion": "eu-west-2"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:*"
      ],
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "aws:RequestedRegion": "eu-west-2"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:*"
      ],
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "aws:RequestedRegion": "eu-west-2"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:*"
      ],
      "Resource": [
        "arn:aws:logs:eu-west-2:*:log-group:/ecs/party-collection-prod-*",
        "arn:aws:logs:eu-west-2:*:log-group:/ecs/party-collection-*-prod"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "acm:DescribeCertificate",
        "acm:ListCertificates",
        "acm:RequestCertificate",
        "acm:AddTagsToCertificate",
        "acm:RemoveTagsFromCertificate"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "route53:GetHostedZone",
        "route53:ChangeResourceRecordSets",
        "route53:GetChange",
        "route53:ListResourceRecordSets"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "budgets:*"
      ],
      "Resource": "arn:aws:budgets::*:budget/party-collection-prod-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PassRole",
        "iam:TagRole",
        "iam:UntagRole",
        "iam:CreateInstanceProfile",
        "iam:DeleteInstanceProfile",
        "iam:AddRoleToInstanceProfile",
        "iam:RemoveRoleFromInstanceProfile"
      ],
      "Resource": [
        "arn:aws:iam::*:role/party-collection-prod-*",
        "arn:aws:iam::*:role/party-collection-*-prod/*",
        "arn:aws:iam::*:role/*TaskExecutionRole*",
        "arn:aws:iam::*:role/*TaskRole*",
        "arn:aws:iam::*:instance-profile/party-collection-prod-*"
      ]
    }
  ]
}
EOF
    
    # Attach custom policy
    aws iam put-role-policy \
        --role-name "$role_name" \
        --policy-name "ProdEnvironmentDeployment" \
        --policy-document file:///tmp/prod-policy.json
    
    log_success "Production role created: $role_name"
}

# Function to create global infrastructure role
create_global_role() {
    local account_id="$1"
    local role_name="github-actions-global"
    
    log_info "Creating global infrastructure role..."
    
    # Create trust policy for main branch only
    create_trust_policy "$GITHUB_REPO" "repo:${GITHUB_REPO}:ref:refs/heads/main" "$account_id"
    
    # Create role
    aws iam create-role \
        --role-name "$role_name" \
        --assume-role-policy-document file:///tmp/trust-policy.json \
        --description "GitHub Actions role for global infrastructure deployment" > /dev/null
    
    # Create global policy
    cat > /tmp/global-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*"
      ],
      "Resource": [
        "arn:aws:cloudformation:*:*:stack/party-collection-global/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:CreateRepository",
        "ecr:DeleteRepository",
        "ecr:DescribeRepositories",
        "ecr:PutImageScanningConfiguration",
        "ecr:PutLifecyclePolicy",
        "ecr:TagResource",
        "ecr:UntagResource"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PassRole",
        "iam:TagRole",
        "iam:UntagRole",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:GetRolePolicy",
        "iam:CreateOpenIDConnectProvider",
        "iam:DeleteOpenIDConnectProvider",
        "iam:GetOpenIDConnectProvider",
        "iam:UpdateOpenIDConnectProviderThumbprint"
      ],
      "Resource": "*"
    }
  ]
}
EOF
    
    # Attach custom policy
    aws iam put-role-policy \
        --role-name "$role_name" \
        --policy-name "GlobalInfrastructureDeployment" \
        --policy-document file:///tmp/global-policy.json
    
    log_success "Global infrastructure role created: $role_name"
}

# Function to create cost monitoring role
create_cost_monitoring_role() {
    local account_id="$1"
    local role_name="github-actions-cost"
    
    log_info "Creating cost monitoring role..."
    
    # Create trust policy for any branch (cost monitoring can run from any branch)
    create_trust_policy "$GITHUB_REPO" "repo:${GITHUB_REPO}:*" "$account_id"
    
    # Create role
    aws iam create-role \
        --role-name "$role_name" \
        --assume-role-policy-document file:///tmp/trust-policy.json \
        --description "GitHub Actions role for cost monitoring and budget management" > /dev/null
    
    # Create cost monitoring policy
    cat > /tmp/cost-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetUsageReport",
        "ce:GetDimensionValues",
        "ce:GetMetricValues"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "budgets:ViewBudget",
        "budgets:DescribeBudget",
        "budgets:DescribeBudgets",
        "budgets:DescribeBudgetAction",
        "budgets:DescribeBudgetActionsForBudget",
        "budgets:DescribeBudgetActionsForAccount"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:DescribeStacks",
        "cloudformation:ListStacks",
        "cloudformation:DescribeStackResources"
      ],
      "Resource": [
        "arn:aws:cloudformation:*:*:stack/party-collection-*/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:DescribeServices",
        "ecs:DescribeClusters",
        "ecs:DescribeTasks",
        "ecs:ListClusters",
        "ecs:ListServices"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBClusters",
        "rds:DescribeDBInstances"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:DescribeLoadBalancers",
        "elasticloadbalancing:DescribeTargetGroups"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:UpdateStack"
      ],
      "Resource": [
        "arn:aws:cloudformation:*:*:stack/party-collection-dev-*/*"
      ],
      "Condition": {
        "StringEquals": {
          "cloudformation:template-url": "*emergency-scale-down*"
        }
      }
    }
  ]
}
EOF
    
    # Attach custom policy
    aws iam put-role-policy \
        --role-name "$role_name" \
        --policy-name "CostMonitoringAccess" \
        --policy-document file:///tmp/cost-policy.json
    
    log_success "Cost monitoring role created: $role_name"
}

# Function to output GitHub secrets
output_github_secrets() {
    local account_id="$1"
    
    echo ""
    log_info "GitHub Secrets Configuration"
    echo "================================================================"
    echo ""
    echo "Add these secrets to your GitHub repository:"
    echo "Repository → Settings → Secrets and Variables → Actions"
    echo ""
    echo "# AWS OIDC Roles"
    echo "AWS_ROLE_ARN_DEV=arn:aws:iam::$account_id:role/github-actions-dev"
    echo "AWS_ROLE_ARN_PROD=arn:aws:iam::$account_id:role/github-actions-prod"
    echo "AWS_ROLE_ARN_GLOBAL=arn:aws:iam::$account_id:role/github-actions-global"
    echo "AWS_ROLE_ARN_COST_MONITORING=arn:aws:iam::$account_id:role/github-actions-cost"
    echo ""
    echo "# Application Configuration"
    echo "ALERT_EMAIL=your-email@example.com"
    echo ""
    echo "# Optional (for production with custom domain)"
    echo "DOMAIN_NAME=yourdomain.com"
    echo "CERTIFICATE_ARN=arn:aws:acm:eu-west-2:$account_id:certificate/YOUR-CERT-ID"
    echo ""
    echo "================================================================"
}

# Function to cleanup temporary files
cleanup() {
    rm -f /tmp/trust-policy.json /tmp/dev-policy.json /tmp/prod-policy.json /tmp/global-policy.json /tmp/cost-policy.json
}

# Main execution
main() {
    echo ""
    log_info "AWS IAM Permissions Setup for Party Collection"
    echo "=============================================="
    echo ""
    
    # Validate inputs
    validate_github_repo
    local account_id=$(check_aws_cli)
    
    # Check/Create OIDC provider
    local oidc_status=$(check_oidc_provider "$account_id")
    if [ "$oidc_status" = "missing" ]; then
        create_oidc_provider
    fi
    
    # Create roles
    log_info "Creating IAM roles for GitHub Actions..."
    echo ""
    
    # Development role
    if [ "$(check_role_exists 'github-actions-dev')" = "missing" ]; then
        create_dev_role "$account_id"
    else
        log_warning "Development role already exists: github-actions-dev"
    fi
    
    # Production role
    if [ "$(check_role_exists 'github-actions-prod')" = "missing" ]; then
        create_prod_role "$account_id"
    else
        log_warning "Production role already exists: github-actions-prod"
    fi
    
    # Global role
    if [ "$(check_role_exists 'github-actions-global')" = "missing" ]; then
        create_global_role "$account_id"
    else
        log_warning "Global role already exists: github-actions-global"
    fi
    
    # Cost monitoring role
    if [ "$(check_role_exists 'github-actions-cost')" = "missing" ]; then
        create_cost_monitoring_role "$account_id"
    else
        log_warning "Cost monitoring role already exists: github-actions-cost"
    fi
    
    echo ""
    log_success "All IAM roles and permissions configured successfully!"
    
    # Output GitHub secrets
    output_github_secrets "$account_id"
    
    # Cleanup
    cleanup
    
    echo ""
    log_success "Setup complete! You can now use GitHub Actions to deploy your infrastructure."
    log_info "Next steps:"
    echo "  1. Add the secrets above to your GitHub repository"
    echo "  2. Push to the 'develop' branch to trigger dev deployment"
    echo "  3. Use manual workflow dispatch for production deployment"
    echo ""
}

# Trap to cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"