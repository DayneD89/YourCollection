#!/bin/bash

# AWS IAM Permissions Validation Script for Party Collection
# This script validates that all required roles and permissions are correctly configured

set -e  # Exit on any error

# Configuration
REGION="${AWS_REGION:-eu-west-2}"
PROJECT_NAME="party-collection"

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
    log_success "AWS CLI configured for account: $account_id"
    
    echo "$account_id"
}

# Function to validate OIDC provider
validate_oidc_provider() {
    local account_id="$1"
    
    log_info "Validating GitHub OIDC identity provider..."
    
    local oidc_arn="arn:aws:iam::$account_id:oidc-provider/token.actions.githubusercontent.com"
    
    if aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$oidc_arn" >/dev/null 2>&1; then
        log_success "OIDC provider exists and is accessible"
    else
        log_error "OIDC provider not found: $oidc_arn"
        return 1
    fi
}

# Function to validate role exists and policies
validate_role() {
    local role_name="$1"
    local description="$2"
    
    log_info "Validating role: $role_name ($description)"
    
    # Check if role exists
    if ! aws iam get-role --role-name "$role_name" >/dev/null 2>&1; then
        log_error "Role not found: $role_name"
        return 1
    fi
    
    # Check trust policy
    local trust_policy=$(aws iam get-role --role-name "$role_name" --query 'Role.AssumeRolePolicyDocument' --output json)
    
    if echo "$trust_policy" | grep -q "token.actions.githubusercontent.com"; then
        log_success "Role $role_name has correct OIDC trust policy"
    else
        log_error "Role $role_name missing OIDC trust policy"
        return 1
    fi
    
    # Check attached policies
    local attached_policies=$(aws iam list-role-policies --role-name "$role_name" --query 'PolicyNames' --output text)
    
    if [ -n "$attached_policies" ]; then
        log_success "Role $role_name has custom policies: $attached_policies"
    else
        log_warning "Role $role_name has no custom policies attached"
    fi
    
    return 0
}

# Function to test role assumption (simulation)
test_role_assumption() {
    local role_name="$1"
    local account_id="$2"
    
    log_info "Testing role assumption for: $role_name"
    
    local role_arn="arn:aws:iam::$account_id:role/$role_name"
    
    # We can't actually assume the role from CLI (requires GitHub OIDC token)
    # But we can check if the role is assumable by checking its trust policy structure
    local trust_policy=$(aws iam get-role --role-name "$role_name" --query 'Role.AssumeRolePolicyDocument' --output json 2>/dev/null)
    
    if echo "$trust_policy" | jq -e '.Statement[].Principal.Federated | select(contains("oidc-provider/token.actions.githubusercontent.com"))' >/dev/null 2>&1; then
        log_success "Role $role_name is configured for GitHub OIDC assumption"
    else
        log_error "Role $role_name trust policy may not be configured correctly for GitHub Actions"
        return 1
    fi
}

# Function to validate ECR permissions
validate_ecr_permissions() {
    log_info "Validating ECR repository access..."
    
    # Try to list repositories (should work with dev/prod roles)
    if aws ecr describe-repositories --region "$REGION" >/dev/null 2>&1; then
        log_success "ECR access working"
    else
        log_warning "ECR access may be limited (this is normal if no repositories exist)"
    fi
}

# Function to validate CloudFormation permissions
validate_cloudformation_permissions() {
    log_info "Validating CloudFormation access..."
    
    # Try to list stacks (should work)
    if aws cloudformation list-stacks --region "$REGION" >/dev/null 2>&1; then
        log_success "CloudFormation access working"
    else
        log_error "CloudFormation access not working"
        return 1
    fi
}

# Function to validate Cost Explorer permissions  
validate_cost_permissions() {
    log_info "Validating Cost Explorer access..."
    
    # Try to get cost data (this requires Cost Monitoring role to test properly)
    local end_date=$(date +%Y-%m-%d)
    local start_date=$(date -d '7 days ago' +%Y-%m-%d)
    
    if aws ce get-cost-and-usage \
        --time-period Start="$start_date",End="$end_date" \
        --granularity DAILY \
        --metrics BlendedCost \
        >/dev/null 2>&1; then
        log_success "Cost Explorer access working"
    else
        log_warning "Cost Explorer access may be limited (requires specific role for full access)"
    fi
}

# Function to output validation summary
output_validation_summary() {
    local account_id="$1"
    local failed_checks="$2"
    
    echo ""
    echo "================================================================"
    log_info "Validation Summary"
    echo "================================================================"
    echo ""
    echo "Account ID: $account_id"
    echo "Region: $REGION"
    echo ""
    
    if [ "$failed_checks" -eq 0 ]; then
        log_success "All validations passed! Your AWS permissions are correctly configured."
        echo ""
        echo "You can now:"
        echo "  ✅ Deploy development environment via GitHub Actions"
        echo "  ✅ Deploy production environment via GitHub Actions"
        echo "  ✅ Monitor costs automatically"
        echo "  ✅ Manage infrastructure lifecycle"
    else
        log_error "$failed_checks validation(s) failed. Please review the errors above."
        echo ""
        echo "Common fixes:"
        echo "  1. Run './setup-aws-permissions.sh username/repo-name' to create missing roles"
        echo "  2. Check that your AWS CLI has sufficient permissions"
        echo "  3. Verify GitHub repository name format is correct"
    fi
    
    echo ""
    echo "================================================================"
}

# Main execution
main() {
    echo ""
    log_info "AWS IAM Permissions Validation for Party Collection"
    echo "=================================================="
    echo ""
    
    local failed_checks=0
    
    # Get account info
    local account_id=$(check_aws_cli)
    
    echo ""
    log_info "Validating IAM configuration..."
    echo ""
    
    # Validate OIDC provider
    if ! validate_oidc_provider "$account_id"; then
        ((failed_checks++))
    fi
    
    echo ""
    
    # Validate all required roles
    local roles=(
        "github-actions-dev:Development Environment"
        "github-actions-prod:Production Environment" 
        "github-actions-global:Global Infrastructure"
        "github-actions-cost:Cost Monitoring"
    )
    
    for role_info in "${roles[@]}"; do
        IFS=':' read -r role_name description <<< "$role_info"
        if ! validate_role "$role_name" "$description"; then
            ((failed_checks++))
        fi
        echo ""
    done
    
    # Test role assumptions
    log_info "Testing role configurations..."
    echo ""
    
    for role_info in "${roles[@]}"; do
        IFS=':' read -r role_name description <<< "$role_info"
        if ! test_role_assumption "$role_name" "$account_id"; then
            ((failed_checks++))
        fi
    done
    
    echo ""
    
    # Validate service permissions
    log_info "Validating service permissions..."
    echo ""
    
    if ! validate_ecr_permissions; then
        ((failed_checks++))
    fi
    
    if ! validate_cloudformation_permissions; then
        ((failed_checks++))
    fi
    
    if ! validate_cost_permissions; then
        ((failed_checks++))
    fi
    
    # Output summary
    output_validation_summary "$account_id" "$failed_checks"
    
    if [ "$failed_checks" -gt 0 ]; then
        exit 1
    fi
}

# Run main function
main "$@"