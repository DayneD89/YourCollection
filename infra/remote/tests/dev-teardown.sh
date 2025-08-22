#!/bin/bash

# Teardown Dev Environment - Complete Cleanup
# Deletes all infrastructure and resources (cost becomes £0.00/month)

set -e  # Exit on any error

REGION="eu-west-2"
STACK_NAME="party-collection-dev-minimal"

echo "🗑️ Teardown Dev Environment - Complete Cleanup"
echo "=============================================="
echo "Stack: $STACK_NAME"
echo "Region: $REGION"
echo "⚠️  WARNING: This will DELETE ALL dev infrastructure and data!"
echo ""

# Check if stack exists
STACK_STATUS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].StackStatus' \
    --output text 2>/dev/null || echo "STACK_NOT_EXISTS")

if [ "$STACK_STATUS" = "STACK_NOT_EXISTS" ]; then
    echo "ℹ️ No dev environment found - nothing to tear down"
    exit 0
fi

echo "📋 Current stack status: $STACK_STATUS"
echo ""
echo "🗂️ Resources that will be DELETED:"
echo "  ❌ ECS Cluster and Services"
echo "  ❌ Aurora Serverless Database (including all data)"
echo "  ❌ VPC, Subnets, Security Groups"
echo "  ❌ Load Balancers and Target Groups"
echo "  ❌ CloudWatch Logs"
echo "  ❌ IAM Roles and Policies"
echo "  ❌ All CloudFormation stack resources"
echo ""
echo "💾 ECR repositories will be PRESERVED (Docker images)"
echo ""

# Confirmation prompt
read -p "❓ Are you sure you want to DELETE the entire dev environment? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Teardown cancelled"
    exit 0
fi

echo ""
read -p "❓ Type 'DELETE' to confirm complete destruction: " -r
echo
if [ "$REPLY" != "DELETE" ]; then
    echo "❌ Teardown cancelled - confirmation not matched"
    exit 0
fi

echo ""
echo "🚨 Final Warning - Starting irreversible teardown in 5 seconds..."
for i in 5 4 3 2 1; do
    echo "  $i..."
    sleep 1
done

echo ""
echo "🗑️ Deleting CloudFormation stack..."
aws cloudformation delete-stack \
    --stack-name "$STACK_NAME" \
    --region "$REGION"

echo "⏳ Waiting for stack deletion to complete (this may take 10-15 minutes)..."
echo "   You can monitor progress in AWS Console:"
echo "   https://console.aws.amazon.com/cloudformation/"
echo ""

# Wait for stack deletion with progress updates
WAIT_COUNT=0
MAX_WAIT=90  # 90 * 10 seconds = 15 minutes max

while true; do
    CURRENT_STATUS=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].StackStatus' \
        --output text 2>/dev/null || echo "DELETE_COMPLETE")
    
    if [ "$CURRENT_STATUS" = "DELETE_COMPLETE" ]; then
        break
    elif [ "$CURRENT_STATUS" = "DELETE_FAILED" ]; then
        echo "❌ Stack deletion failed!"
        echo "Check AWS Console for details and manual cleanup may be required"
        exit 1
    fi
    
    WAIT_COUNT=$((WAIT_COUNT + 1))
    if [ $WAIT_COUNT -gt $MAX_WAIT ]; then
        echo "⚠️ Deletion is taking longer than expected"
        echo "Check AWS Console for progress: https://console.aws.amazon.com/cloudformation/"
        exit 1
    fi
    
    echo "  Status: $CURRENT_STATUS (waited $((WAIT_COUNT * 10)) seconds)"
    sleep 10
done

# Optional: Clean up ECR images (ask user)
echo ""
echo "🐳 ECR Repository Cleanup (Optional)"
echo "=================================="
echo "Docker images are still stored in ECR repositories."
echo "These have minimal storage costs but can be cleaned up."
echo ""
read -p "❓ Delete ECR repositories and all Docker images? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️ Deleting ECR repositories..."
    
    aws ecr delete-repository \
        --repository-name party-collection-backend \
        --region "$REGION" \
        --force 2>/dev/null || echo "Backend repository not found"
    
    aws ecr delete-repository \
        --repository-name party-collection-frontend \
        --region "$REGION" \
        --force 2>/dev/null || echo "Frontend repository not found"
    
    echo "✅ ECR repositories deleted"
else
    echo "ℹ️ ECR repositories preserved with Docker images"
fi

echo ""
echo "🎉 Teardown Complete!"
echo "===================="
echo ""
echo "✅ What was cleaned up:"
echo "  - CloudFormation stack deleted"
echo "  - All AWS resources removed"
echo "  - Database and all data deleted"
echo "  - No ongoing AWS costs from this environment"
echo ""
echo "💰 New monthly cost: £0.00"
echo ""
echo "🔄 To recreate the environment:"
echo "   ./scripts/dev-deploy.sh"
echo ""
echo "📝 Note: You'll need to rebuild and redeploy code"
echo "     All data has been permanently deleted"