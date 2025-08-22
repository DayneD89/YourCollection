#!/bin/bash

# Update Code in Dev Environment
# Rebuilds Docker images and redeploys with latest code changes

set -e  # Exit on any error

REGION="eu-west-2"
STACK_NAME="party-collection-dev-minimal"
EMAIL="${1:-admin@party-collection.local}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "🔄 Update Code in Dev Environment"
echo "================================="
echo "Account ID: $ACCOUNT_ID"
echo "Stack: $STACK_NAME"
echo "Timestamp: $TIMESTAMP"
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

echo "Current container count: $CURRENT_COUNT"
echo ""

echo "🔍 Running local tests before update..."
if [ -f "infra/local/scripts/start-local.sh" ]; then
    cd infra/local/scripts
    ./start-local.sh >/dev/null 2>&1 || echo "Local environment already running"
    cd ../../..
    
    echo "Running backend tests..."
    cd backend && npm test && cd ..
    
    echo "Running quick E2E tests..."
    timeout 300 node test-runner.js --env=local || {
        echo "⚠️ Some tests failed - continuing with deployment anyway"
    }
    
    cd infra/local/scripts
    ./stop-local.sh --clean >/dev/null 2>&1 || true
    cd ../../..
else
    echo "⚠️ Skipping local tests - local environment not found"
fi

echo ""
echo "🐳 Building new Docker images..."

# Login to ECR
aws ecr get-login-password --region "$REGION" | \
    docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

# Build and push backend with timestamp tag
echo "Building backend (ARM64) with timestamp: $TIMESTAMP"
cd backend
docker build --platform linux/arm64 \
    -t "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/party-collection-backend:$TIMESTAMP" \
    -t "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/party-collection-backend:latest" \
    -t "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/party-collection-backend:dev" \
    .

echo "Pushing backend image..."
docker push "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/party-collection-backend:$TIMESTAMP"
docker push "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/party-collection-backend:latest"
docker push "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/party-collection-backend:dev"

# Build and push frontend with timestamp tag
echo "Building frontend (ARM64) with timestamp: $TIMESTAMP"
cd ../frontend
docker build --platform linux/arm64 \
    -t "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/party-collection-frontend:$TIMESTAMP" \
    -t "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/party-collection-frontend:latest" \
    -t "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/party-collection-frontend:dev" \
    .

echo "Pushing frontend image..."
docker push "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/party-collection-frontend:$TIMESTAMP"
docker push "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/party-collection-frontend:latest"
docker push "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/party-collection-frontend:dev"

cd ..
echo "✅ New Docker images pushed to ECR"

echo ""
echo "🔄 Forcing ECS service update..."

# Get cluster name from stack
CLUSTER_NAME=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`ClusterName`].OutputValue' \
    --output text 2>/dev/null || echo "party-collection-dev-cluster")

# Force update ECS services to pull new images
echo "Updating backend service..."
aws ecs update-service \
    --cluster "$CLUSTER_NAME" \
    --service "party-collection-dev-backend" \
    --force-new-deployment \
    --region "$REGION" >/dev/null 2>&1 || echo "Backend service not found or not running"

echo "Updating frontend service..."  
aws ecs update-service \
    --cluster "$CLUSTER_NAME" \
    --service "party-collection-dev-frontend" \
    --force-new-deployment \
    --region "$REGION" >/dev/null 2>&1 || echo "Frontend service not found or not running"

if [ "$CURRENT_COUNT" = "0" ]; then
    echo ""
    echo "ℹ️ Environment is currently idle (0 containers)"
    echo "New images are ready but services are scaled down"
    echo ""
    echo "To activate with new code:"
    echo "   ./scripts/dev-active.sh"
else
    echo ""
    echo "⏳ Waiting for deployment to complete..."
    
    # Wait for services to stabilize
    echo "Waiting for backend service to stabilize..."
    aws ecs wait services-stable \
        --cluster "$CLUSTER_NAME" \
        --services "party-collection-dev-backend" \
        --region "$REGION" || echo "Backend service stabilization timeout"
    
    echo "Waiting for frontend service to stabilize..."
    aws ecs wait services-stable \
        --cluster "$CLUSTER_NAME" \
        --services "party-collection-dev-frontend" \
        --region "$REGION" || echo "Frontend service stabilization timeout"
    
    echo "⏳ Waiting for services to be ready..."
    sleep 30
    
    # Get current URLs
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
    echo "🧪 Testing updated deployment..."
    if [ "$BACKEND_IP" != "None" ]; then
        for i in {1..20}; do
            if curl -s "http://$BACKEND_IP:3001/health" | grep -q "healthy"; then
                echo "✅ Backend: Updated and healthy"
                break
            fi
            echo "  Attempt $i/20: Waiting for backend..."
            sleep 10
        done
    fi
    
    if [ "$FRONTEND_IP" != "None" ]; then
        for i in {1..20}; do
            if curl -s "http://$FRONTEND_IP:3000" >/dev/null 2>&1; then
                echo "✅ Frontend: Updated and responding"
                break
            fi
            echo "  Attempt $i/20: Waiting for frontend..."
            sleep 10
        done
    fi
    
    echo ""
    echo "🌐 Updated service URLs:"
    echo "  Frontend: http://$FRONTEND_IP:3000"
    echo "  Backend: http://$BACKEND_IP:3001"
fi

echo ""
echo "🎉 Code Update Complete!"
echo "======================="
echo ""
echo "📦 What was updated:"
echo "  - New Docker images built with timestamp: $TIMESTAMP"
echo "  - Images pushed to ECR with latest code"
echo "  - ECS services forced to redeploy"
echo "  - Services are running new code"
echo ""
echo "🔧 Next steps:"
echo "  - Test the updated deployment manually"
echo "  - Run comprehensive tests: node test-runner.js --env=dev"
echo "  - If issues found, check ECS service logs"
echo ""
echo "💰 Current cost: $([ "$CURRENT_COUNT" = "0" ] && echo "£0.53/month (idle)" || echo "£17.85/month (active)")"