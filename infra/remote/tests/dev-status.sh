#!/bin/bash

# Dev Environment Status Check
# Shows current state, costs, and available actions

set -e  # Exit on any error

REGION="eu-west-2"
STACK_NAME="party-collection-dev-minimal"

echo "📊 Dev Environment Status"
echo "========================="
echo "Stack: $STACK_NAME"
echo "Region: $REGION"
echo ""

# Check if stack exists
STACK_STATUS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].StackStatus' \
    --output text 2>/dev/null || echo "STACK_NOT_EXISTS")

if [ "$STACK_STATUS" = "STACK_NOT_EXISTS" ]; then
    echo "❌ No dev environment found"
    echo ""
    echo "🚀 To create dev environment:"
    echo "   ./scripts/dev-deploy.sh"
    exit 0
fi

echo "🏗️ Infrastructure Status: $STACK_STATUS"

# Get stack parameters and outputs
DESIRED_COUNT=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Parameters[?ParameterKey==`DesiredCount`].ParameterValue' \
    --output text 2>/dev/null || echo "Unknown")

ENV_ENABLED=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Parameters[?ParameterKey==`EnvironmentEnabled`].ParameterValue' \
    --output text 2>/dev/null || echo "Unknown")

get_stack_output() {
    local output_key="$1"
    aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query "Stacks[0].Outputs[?OutputKey=='$output_key'].OutputValue" \
        --output text 2>/dev/null || echo "None"
}

BACKEND_IP=$(get_stack_output "BackendPublicIP")
FRONTEND_IP=$(get_stack_output "FrontendPublicIP")
CLUSTER_NAME=$(get_stack_output "ClusterName")

echo "🔢 Container Count: $DESIRED_COUNT"
echo "⚡ Environment Enabled: $ENV_ENABLED"
echo ""

# Determine status and cost
if [ "$DESIRED_COUNT" = "0" ]; then
    STATUS="💤 IDLE"
    COST="£0.53/month"
    DESCRIPTION="Infrastructure exists but no containers running"
elif [ "$DESIRED_COUNT" = "1" ]; then
    STATUS="🚀 ACTIVE"
    COST="£17.85/month"
    DESCRIPTION="Development environment ready for use"
else
    STATUS="🏃 SCALED ($DESIRED_COUNT containers)"
    SCALED_COST=$(echo "$DESIRED_COUNT * 17.85" | bc -l)
    COST="£${SCALED_COST}/month"
    DESCRIPTION="Environment scaled up for intensive development"
fi

echo "📊 Status: $STATUS"
echo "💰 Cost: $COST"
echo "📝 Description: $DESCRIPTION"
echo ""

# Show service URLs if active
if [ "$DESIRED_COUNT" != "0" ] && [ "$BACKEND_IP" != "None" ]; then
    echo "🌐 Service URLs:"
    echo "   Frontend: http://$FRONTEND_IP:3000"
    echo "   Backend API: http://$BACKEND_IP:3001"
    echo "   Health Check: http://$BACKEND_IP:3001/health"
    echo ""
    
    # Quick health check if services should be running
    echo "🧪 Quick Health Check:"
    if curl -s "http://$BACKEND_IP:3001/health" >/dev/null 2>&1; then
        echo "   ✅ Backend: Responding"
    else
        echo "   ⚠️ Backend: Not responding (may be starting)"
    fi
    
    if curl -s "http://$FRONTEND_IP:3000" >/dev/null 2>&1; then
        echo "   ✅ Frontend: Responding"
    else
        echo "   ⚠️ Frontend: Not responding (may be starting)"
    fi
    echo ""
fi

# Show ECS service status if cluster exists
if [ "$CLUSTER_NAME" != "None" ] && [ "$DESIRED_COUNT" != "0" ]; then
    echo "📋 ECS Service Status:"
    
    # Get service status
    BACKEND_STATUS=$(aws ecs describe-services \
        --cluster "$CLUSTER_NAME" \
        --services "party-collection-dev-backend" \
        --region "$REGION" \
        --query 'services[0].status' \
        --output text 2>/dev/null || echo "Not Found")
    
    FRONTEND_STATUS=$(aws ecs describe-services \
        --cluster "$CLUSTER_NAME" \
        --services "party-collection-dev-frontend" \
        --region "$REGION" \
        --query 'services[0].status' \
        --output text 2>/dev/null || echo "Not Found")
    
    echo "   Backend Service: $BACKEND_STATUS"
    echo "   Frontend Service: $FRONTEND_STATUS"
    echo ""
fi

# Show available actions based on current state
echo "🔧 Available Actions:"
if [ "$DESIRED_COUNT" = "0" ]; then
    echo "   🚀 Activate: ./scripts/dev-active.sh"
    echo "   🔄 Update Code: ./scripts/dev-update.sh"
    echo "   🗑️ Teardown: ./scripts/dev-teardown.sh"
elif [ "$DESIRED_COUNT" = "1" ]; then
    echo "   💤 Scale to Idle: ./scripts/dev-idle.sh"
    echo "   🔄 Update Code: ./scripts/dev-update.sh"
    echo "   🧪 Run Tests: node test-runner.js --env=dev"
    echo "   🗑️ Teardown: ./scripts/dev-teardown.sh"
else
    echo "   💤 Scale to Idle: ./scripts/dev-idle.sh"
    echo "   🔽 Scale to Normal: ./scripts/dev-active.sh"
    echo "   🔄 Update Code: ./scripts/dev-update.sh"
    echo "   🗑️ Teardown: ./scripts/dev-teardown.sh"
fi

echo ""
echo "📅 Last Updated:"
LAST_UPDATE=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].LastUpdatedTime' \
    --output text 2>/dev/null || aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].CreationTime' \
    --output text)

echo "   $LAST_UPDATE"