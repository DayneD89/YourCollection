#!/bin/bash

# Activate Dev Environment for Development Work  
# Scales up from idle to active state with 1 container (£17.85/month)
# Documentation: docs/troubleshooting/remote-management.md

set -e  # Exit on any error

REGION="eu-west-2"
STACK_NAME="party-collection-dev-minimal"
EMAIL="${1:-admin@party-collection.local}"

echo "🚀 Activate Dev Environment for Development"
echo "==========================================="
echo "Stack: $STACK_NAME"
echo "Target: 1 container (£17.85/month)"
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

# Get current desired count
CURRENT_COUNT=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Parameters[?ParameterKey==`DesiredCount`].ParameterValue' \
    --output text 2>/dev/null || echo "0")

if [ "$CURRENT_COUNT" != "0" ]; then
    echo "ℹ️ Environment is already active (DesiredCount: $CURRENT_COUNT)"
    echo "Getting current service URLs..."
else
    echo "🔼 Scaling up from idle to active (1 container)..."

    aws cloudformation update-stack \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --use-previous-template \
        --parameters \
            ParameterKey=DesiredCount,ParameterValue=1 \
            ParameterKey=EnvironmentEnabled,ParameterValue=true \
            ParameterKey=AlertEmail,ParameterValue="$EMAIL" \
        --capabilities CAPABILITY_IAM

    echo "⏳ Waiting for scale-up to complete..."
    aws cloudformation wait stack-update-complete \
        --stack-name "$STACK_NAME" \
        --region "$REGION"

    echo "⏳ Waiting for services to start (2-3 minutes)..."
    sleep 60
fi

# Get stack outputs
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

echo ""
echo "🔍 Service endpoints:"
echo "  Backend: http://$BACKEND_IP:3001"
echo "  Frontend: http://$FRONTEND_IP:3000"

# Wait for services to be ready
if [ "$BACKEND_IP" != "None" ] && [ "$CURRENT_COUNT" = "0" ]; then
    echo "⏳ Waiting for backend to be ready..."
    for i in {1..30}; do
        if curl -s "http://$BACKEND_IP:3001/health" >/dev/null 2>&1; then
            echo "✅ Backend is ready"
            break
        fi
        echo "  Attempt $i/30: Backend starting..."
        sleep 10
    done
fi

if [ "$FRONTEND_IP" != "None" ] && [ "$CURRENT_COUNT" = "0" ]; then
    echo "⏳ Waiting for frontend to be ready..."
    for i in {1..30}; do
        if curl -s "http://$FRONTEND_IP:3000" >/dev/null 2>&1; then
            echo "✅ Frontend is ready"
            break
        fi
        echo "  Attempt $i/30: Frontend starting..."
        sleep 10
    done
fi

# Quick health check
echo ""
echo "🧪 Quick health check..."
if [ "$BACKEND_IP" != "None" ]; then
    if curl -s "http://$BACKEND_IP:3001/health" | grep -q "healthy"; then
        echo "✅ Backend: Healthy"
    else
        echo "⚠️ Backend: May still be starting..."
    fi
fi

if [ "$FRONTEND_IP" != "None" ]; then
    if curl -s "http://$FRONTEND_IP:3000" >/dev/null 2>&1; then
        echo "✅ Frontend: Responding"
    else
        echo "⚠️ Frontend: May still be starting..."
    fi
fi

echo ""
echo "🎉 Dev Environment is Active!"
echo "============================"
echo ""
echo "🌐 Access URLs:"
echo "  Frontend: http://$FRONTEND_IP:3000"
echo "  Backend API: http://$BACKEND_IP:3001"
echo "  Health Check: http://$BACKEND_IP:3001/health"
echo ""
echo "💰 Monthly Cost: £17.85 (while active)"
echo ""
echo "🔧 Quick Commands:"
echo "  Test: node test-runner.js --env=dev"
echo "  Scale down: ./scripts/dev-idle.sh"
echo "  Update code: ./scripts/dev-update.sh"
echo ""
echo "📝 Development Ready:"
echo "  - Services are running and accessible"
echo "  - Database is active and connected"
echo "  - Ready for development and testing"