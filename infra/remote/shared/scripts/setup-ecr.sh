#!/bin/bash

# ECR Repository Setup Script
# Creates ECR repositories for backend and frontend containers

set -e

# Configuration
PROJECT_NAME="party-collection"
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text)}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to create ECR repository
create_ecr_repo() {
    local repo_name=$1
    local description=$2
    
    log_info "Creating ECR repository: $repo_name"
    
    # Check if repository already exists
    if aws ecr describe-repositories --repository-names "$repo_name" --region "$AWS_REGION" >/dev/null 2>&1; then
        log_warn "Repository $repo_name already exists, skipping..."
        return 0
    fi
    
    # Create repository
    aws ecr create-repository \
        --repository-name "$repo_name" \
        --region "$AWS_REGION" \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256 \
        --tags "Key=Project,Value=$PROJECT_NAME" "Key=Description,Value=$description"
    
    # Set lifecycle policy to manage image versions
    aws ecr put-lifecycle-policy \
        --repository-name "$repo_name" \
        --region "$AWS_REGION" \
        --lifecycle-policy-text '{
            "rules": [
                {
                    "rulePriority": 1,
                    "description": "Keep last 10 prod images",
                    "selection": {
                        "tagStatus": "tagged",
                        "tagPrefixList": ["prod-"],
                        "countType": "imageCountMoreThan",
                        "countNumber": 10
                    },
                    "action": {
                        "type": "expire"
                    }
                },
                {
                    "rulePriority": 2,
                    "description": "Keep last 5 dev images",
                    "selection": {
                        "tagStatus": "tagged",
                        "tagPrefixList": ["dev-"],
                        "countType": "imageCountMoreThan",
                        "countNumber": 5
                    },
                    "action": {
                        "type": "expire"
                    }
                },
                {
                    "rulePriority": 3,
                    "description": "Delete untagged images after 1 day",
                    "selection": {
                        "tagStatus": "untagged",
                        "countType": "sinceImagePushed",
                        "countUnit": "days",
                        "countNumber": 1
                    },
                    "action": {
                        "type": "expire"
                    }
                }
            ]
        }'
    
    log_info "✅ Successfully created repository: $repo_name"
}

# Main execution
main() {
    log_info "Setting up ECR repositories for $PROJECT_NAME"
    log_info "AWS Account ID: $AWS_ACCOUNT_ID"
    log_info "AWS Region: $AWS_REGION"
    
    # Verify AWS credentials
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        log_error "AWS credentials not configured or invalid"
        exit 1
    fi
    
    # Create repositories
    create_ecr_repo "$PROJECT_NAME-backend" "Backend Node.js/Express API container"
    create_ecr_repo "$PROJECT_NAME-frontend" "Frontend Next.js PWA container"
    
    log_info "ECR setup completed successfully!"
    
    # Output repository URIs for reference
    echo ""
    log_info "Repository URIs:"
    echo "Backend:  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME-backend"
    echo "Frontend: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME-frontend"
    echo ""
    
    log_info "Next steps:"
    echo "1. Deploy global infrastructure: cd infra/remote/global && sam deploy --guided"
    echo "2. Deploy dev environment: cd infra/remote/environments/dev && sam deploy --guided"
    echo "3. Push your first images using GitHub Actions or manual docker build/push"
}

# Check if script is being run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi