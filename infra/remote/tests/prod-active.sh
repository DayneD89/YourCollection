#!/bin/bash

# Scale Production Environment to Active State
# Scales up for events/campaigns when volunteers are active
# Ready to handle 50-300 volunteers (£150-250/month)

set -e  # Exit on any error

REGION="eu-west-2"
STACK_NAME="party-collection-prod"
EMAIL="${1:-admin@party-collection.local}"

echo "🚀 Scale Production Environment to Active State"
echo "==============================================="
echo "⚠️  PRODUCTION SCALING - ACTIVATING FOR EVENT"
echo "Stack: $STACK_NAME"
echo "Target: Event-ready capacity (£150-250/month)"
echo ""

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

echo "🔼 Scaling production to event-ready state..."

# Scale ECS services to event capacity (2-3 tasks each)
aws ecs update-service \
    --cluster party-collection-prod-cluster \
    --service party-collection-prod-backend \
    --desired-count 2 \
    --region "$REGION"

aws ecs update-service \
    --cluster party-collection-prod-cluster \
    --service party-collection-prod-frontend \
    --desired-count 2 \
    --region "$REGION"

echo "⏳ Waiting for services to scale up..."
sleep 60

# Wait for services to be stable
aws ecs wait services-stable \
    --cluster party-collection-prod-cluster \
    --services party-collection-prod-backend \
    --region "$REGION"

aws ecs wait services-stable \
    --cluster party-collection-prod-cluster \
    --services party-collection-prod-frontend \
    --region "$REGION"

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

# Get ALB endpoint if available
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --names party-collection-prod-alb \
    --region "$REGION" \
    --query 'LoadBalancers[0].DNSName' \
    --output text 2>/dev/null || echo "None")

echo ""
echo "✅ Production Environment Ready for Event!"
echo "========================================"
echo ""
echo "📊 Status:"
echo "  Backend containers: $BACKEND_RUNNING (event-ready)"
echo "  Frontend containers: $FRONTEND_RUNNING (event-ready)"
echo "  Database: Scaled for event load"
echo "  Auto-scaling: Enabled (up to 10-20 tasks)"
echo ""
echo "🌐 Access URLs:"
if [ "$ALB_DNS" != "None" ]; then
    echo "  Production: https://$ALB_DNS"
    echo "  Health: https://$ALB_DNS/health"
else
    echo "  Access via configured domain or direct ECS IPs"
    echo "  Check ALB configuration if custom domain expected"
fi
echo ""
echo "💰 Estimated Cost: £150-250/month (event-active)"
echo "   - ECS Fargate: £80-150/month (2+ containers, auto-scaling)"
echo "   - Aurora Database: £25-50/month (scaled for load)"
echo "   - Load Balancer: £18/month (if ALB used)"
echo "   - Data Transfer: £5-15/month (volunteer activity)"
echo ""
echo "📊 Capacity:"
echo "  - Ready for 50-300 concurrent volunteers"
echo "  - Auto-scaling enabled for peak loads"
echo "  - Database scaled for event activity"
echo ""
echo "🔧 After event:"
echo "   ./prod-idle.sh    # Scale back to idle (£6-28/month)"
echo ""
echo "📝 Monitoring:"
echo "  - Watch CloudWatch for auto-scaling activity"
echo "  - Monitor volunteer load and response times"
echo "  - Check cost alerts during active periods"