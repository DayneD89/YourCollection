#!/bin/bash

# Scale Dev Environment to Idle State
# Keeps infrastructure but scales containers to 0 (£0.53/month)
# Documentation: docs/troubleshooting/remote-management.md

set -e  # Exit on any error

REGION="eu-west-2"
STACK_NAME="party-collection-dev-minimal"
EMAIL="${1:-admin@party-collection.local}"

echo "💤 Scale Dev Environment to Idle State"
echo "======================================"
echo "Stack: $STACK_NAME"
echo "Target: 0 containers (£0.53/month)"
echo ""

# Check if stack exists
STACK_STATUS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].StackStatus' \
    --output text 2>/dev/null || echo "STACK_NOT_EXISTS")

if [ "$STACK_STATUS" = "STACK_NOT_EXISTS" ]; then
    echo "❌ No dev environment found. Deploy first with:"
    echo "   ./scripts/dev-deploy.sh"
    exit 1
fi

echo "🔽 Scaling down to 0 containers..."

aws cloudformation update-stack \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --use-previous-template \
    --parameters \
        ParameterKey=DesiredCount,ParameterValue=0 \
        ParameterKey=EnvironmentEnabled,ParameterValue=true \
        ParameterKey=AlertEmail,ParameterValue="$EMAIL" \
    --capabilities CAPABILITY_IAM

echo "⏳ Waiting for scale-down to complete..."
aws cloudformation wait stack-update-complete \
    --stack-name "$STACK_NAME" \
    --region "$REGION"

echo ""
echo "✅ Dev Environment Now Idle"
echo "=========================="
echo ""
echo "📊 Status:"
echo "  Containers: 0 (stopped)"
echo "  Infrastructure: Active"
echo "  Database: Auto-paused (Aurora Serverless)"
echo ""
echo "💰 Cost: £0.53/month (idle)"
echo ""
echo "🔧 To reactivate for development:"
echo "   ./scripts/dev-active.sh"
echo ""
echo "📝 What's Saved:"
echo "  - All infrastructure remains provisioned"
echo "  - Database auto-pauses to save costs"
echo "  - Can be reactivated in ~2-3 minutes"
echo "  - No data or configuration lost"