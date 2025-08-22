#!/bin/bash

# Scale Production Environment to Idle State
# Keeps infrastructure but scales containers to minimum (£6-28/month)
# For use between events/campaigns when no volunteers are active

set -e  # Exit on any error

REGION="eu-west-2"
STACK_NAME="party-collection-prod"
EMAIL="${1:-admin@party-collection.local}"

echo "💤 Scale Production Environment to Idle State"
echo "============================================"
echo "⚠️  PRODUCTION SCALING - USE WITH CAUTION"
echo "Stack: $STACK_NAME"
echo "Target: Minimal containers for idle period (£6-28/month)"
echo ""

# Confirmation prompt
read -p "Are you sure you want to scale PRODUCTION to idle state? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Scaling cancelled"
    exit 1
fi

# Check if stack exists
STACK_STATUS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].StackStatus' \
    --output text 2>/dev/null || echo "STACK_NOT_EXISTS")

if [ "$STACK_STATUS" = "STACK_NOT_EXISTS" ]; then
    echo "❌ No production environment found. Deploy first."
    exit 1
fi

echo "🔽 Scaling production to idle state..."

# Scale ECS services to minimum (1 task each for health checks)
aws ecs update-service \
    --cluster party-collection-prod-cluster \
    --service party-collection-prod-backend \
    --desired-count 1 \
    --region "$REGION"

aws ecs update-service \
    --cluster party-collection-prod-cluster \
    --service party-collection-prod-frontend \
    --desired-count 1 \
    --region "$REGION"

echo "⏳ Waiting for services to scale down..."
sleep 30

# Get service status
BACKEND_RUNNING=$(aws ecs describe-services \
    --cluster party-collection-prod-cluster \
    --services party-collection-prod-backend \
    --region "$REGION" \
    --query 'services[0].runningCount' \
    --output text)

FRONTEND_RUNNING=$(aws ecs describe-services \
    --cluster party-collection-prod-cluster \
    --services party-collection-prod-frontend \
    --region "$REGION" \
    --query 'services[0].runningCount' \
    --output text)

echo ""
echo "✅ Production Environment Now in Idle State"
echo "=========================================="
echo ""
echo "📊 Status:"
echo "  Backend containers: $BACKEND_RUNNING (minimal)"
echo "  Frontend containers: $FRONTEND_RUNNING (minimal)"
echo "  Database: Active but low capacity"
echo "  Infrastructure: Preserved"
echo ""
echo "💰 Estimated Cost: £6-28/month (idle state)"
echo "   - Aurora Serverless v2: £5-8/month (0.5 ACU minimum)"
echo "   - ECS Fargate: £8-15/month (minimal tasks)"
echo "   - Load Balancer: £18/month (if ALB used)"
echo ""
echo "🔧 To scale up for events:"
echo "   ./prod-active.sh"
echo ""
echo "📝 What's Preserved:"
echo "  - All volunteer data and party information"
echo "  - Infrastructure remains fully functional"
echo "  - Can handle small volunteer loads"
echo "  - Ready to scale up quickly for events"
echo ""
echo "⚠️  Note: This is PRODUCTION - monitor volunteer access"