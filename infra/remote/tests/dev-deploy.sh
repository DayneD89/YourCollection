#!/bin/bash

# Deploy Dev Environment - Initial Setup for Development Work
# Deploys with minimum 1 container (£17.85/month) ready for active development
# Documentation: docs/troubleshooting/remote-management.md

set -e  # Exit on any error

REGION="eu-west-2"
STACK_NAME="party-collection-dev-minimal"
EMAIL="${1:-admin@party-collection.local}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "🚀 Deploy Dev Environment for Active Development"
echo "================================================"
echo "Account ID: $ACCOUNT_ID"
echo "Region: $REGION"
echo "Stack: $STACK_NAME"
echo "Email: $EMAIL"
echo "Target: Minimum 1 container (£17.85/month)"
echo ""

# Check if stack exists
STACK_EXISTS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].StackStatus' \
    --output text 2>/dev/null || echo "STACK_NOT_EXISTS")

if [ "$STACK_EXISTS" = "STACK_NOT_EXISTS" ]; then
    echo "📦 Creating ECR repositories..."
    
    # Create ECR repositories
    aws ecr create-repository \
        --repository-name party-collection-backend \
        --region "$REGION" \
        --image-scanning-configuration scanOnPush=true \
        2>/dev/null || echo "Backend repository already exists"

    aws ecr create-repository \
        --repository-name party-collection-frontend \
        --region "$REGION" \
        --image-scanning-configuration scanOnPush=true \
        2>/dev/null || echo "Frontend repository already exists"

    echo "🐳 Building and pushing Docker images..."
    
    # Login to ECR
    aws ecr get-login-password --region "$REGION" | \
        docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

    # Build and push backend
    echo "Building backend (ARM64)..."
    cd backend
    docker build --platform linux/arm64 \
        -t "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/party-collection-backend:latest" \
        -t "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/party-collection-backend:dev" \
        .
    
    docker push "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/party-collection-backend:latest"
    docker push "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/party-collection-backend:dev"

    # Build and push frontend
    echo "Building frontend (ARM64)..."
    cd ../frontend
    docker build --platform linux/arm64 \
        -t "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/party-collection-frontend:latest" \
        -t "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/party-collection-frontend:dev" \
        .
    
    docker push "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/party-collection-frontend:latest"
    docker push "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/party-collection-frontend:dev"
    
    cd ..
    echo "✅ Docker images pushed to ECR"
fi

echo "🏗️ Deploying infrastructure with 1 active container..."
cd infra/remote

aws cloudformation deploy \
    --template-file templates/minimal-dev-template.yaml \
    --stack-name "$STACK_NAME" \
    --parameter-overrides \
        ProjectName=party-collection \
        Environment=dev \
        DesiredCount=1 \
        EnvironmentEnabled=true \
        AlertEmail="$EMAIL" \
        DatabaseType=aurora-v1 \
        BackendCPU=256 \
        BackendMemory=512 \
        FrontendCPU=256 \
        FrontendMemory=512 \
        MonthlyBudgetLimit=25 \
    --capabilities CAPABILITY_IAM \
    --region "$REGION"

cd ../..

echo "⏳ Waiting for services to be ready..."
sleep 60

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

echo "🔍 Service endpoints:"
echo "  Backend: http://$BACKEND_IP:3001"
echo "  Frontend: http://$FRONTEND_IP:3000"

# Wait for services to be ready
if [ "$BACKEND_IP" != "None" ]; then
    echo "⏳ Waiting for backend to be ready..."
    timeout 300 bash -c "until curl -s http://$BACKEND_IP:3001/health >/dev/null 2>&1; do echo 'Waiting...'; sleep 10; done" || {
        echo "⚠️ Backend took longer than expected to start"
        echo "Check ECS console: https://console.aws.amazon.com/ecs/"
    }
fi

if [ "$FRONTEND_IP" != "None" ]; then
    echo "⏳ Waiting for frontend to be ready..."
    timeout 300 bash -c "until curl -s http://$FRONTEND_IP:3000 >/dev/null 2>&1; do echo 'Waiting...'; sleep 10; done" || {
        echo "⚠️ Frontend took longer than expected to start"
        echo "Check ECS console: https://console.aws.amazon.com/ecs/"
    }
fi

# Test endpoints
echo ""
echo "🧪 Testing deployment..."
if [ "$BACKEND_IP" != "None" ]; then
    if curl -s "http://$BACKEND_IP:3001/health" | grep -q "healthy"; then
        echo "✅ Backend: Health check passed"
    else
        echo "❌ Backend: Health check failed"
    fi
fi

if [ "$FRONTEND_IP" != "None" ]; then
    if curl -s "http://$FRONTEND_IP:3000" | grep -q "Party Collection\|Next.js\|<html"; then
        echo "✅ Frontend: Responding correctly"
    else
        echo "❌ Frontend: Not responding correctly"
    fi
fi

echo ""
echo "🎉 Dev Environment Deployed Successfully!"
echo "========================================"
echo ""
echo "🌐 Access URLs:"
echo "  Frontend: http://$FRONTEND_IP:3000"
echo "  Backend API: http://$BACKEND_IP:3001"
echo "  Health Check: http://$BACKEND_IP:3001/health"
echo ""
echo "💰 Monthly Cost: £17.85 (active development)"
echo ""
echo "🔧 Management Commands:"
echo "  Scale down: ./scripts/dev-idle.sh"
echo "  Scale up: ./scripts/dev-active.sh" 
echo "  Update code: ./scripts/dev-update.sh"
echo "  Tear down: ./scripts/dev-teardown.sh"
echo ""
echo "📝 Next Steps:"
echo "  1. Test the URLs above in your browser"
echo "  2. Run comprehensive tests: node test-runner.js --env=dev"
echo "  3. When done developing: ./scripts/dev-idle.sh"