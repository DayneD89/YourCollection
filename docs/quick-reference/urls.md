# Quick Reference - Service URLs & Ports

> **Quick Links**: [Commands](commands.md) | [Costs](costs.md) | [Troubleshooting](troubleshooting.md)

Complete reference of all service URLs, ports, and endpoints for local development and AWS environments.

## 🏠 Local Development URLs

### Primary Application Services
| Service | URL | Port | Purpose |
|---------|-----|------|---------|
| **Frontend (PWA)** | http://localhost:3000 | 3000 | Next.js application |
| **Backend API** | http://localhost:3001 | 3001 | Express REST API |
| **Health Check** | http://localhost:3001/health | 3001 | System status |
| **PgAdmin** | http://localhost:8080 | 8080 | Database management |
| **PostgreSQL** | localhost:5432 | 5432 | Database connection |

### API Endpoints Reference
```
Backend API Base: http://localhost:3001

Authentication:
├── POST /api/auth/login      - User login
├── POST /api/auth/register   - User registration  
├── POST /api/auth/logout     - User logout
├── GET  /api/auth/profile    - Get user profile
└── POST /api/auth/change-password - Change password

User Management (Admin only):
├── GET    /api/users         - List all users
├── POST   /api/users         - Create new user
├── DELETE /api/users/:id     - Delete user
└── POST   /api/users/:id/reset-password - Reset user password

System:
├── GET  /health              - Health check
├── GET  /api/status          - Detailed status
└── GET  /metrics             - Performance metrics
```

---

## ☁️ AWS Development Environment

### Getting Your Environment URLs (Current Setup)
```bash
# Get current development environment URLs (actual method)
cd infra/remote/tests
./dev-status.sh

# Actual output pattern (from current scripts):
# Backend: http://PUBLIC_IP:3001
# Frontend: http://PUBLIC_IP:3000
# Health Check: http://PUBLIC_IP:3001/health
```

### AWS Service Endpoints (Current Implementation)
| Service | Pattern | Example | Purpose |
|---------|---------|---------|---------|
| **Frontend** | http://PUBLIC_IP:3000 | http://18.134.45.67:3000 | Next.js PWA |
| **Backend** | http://PUBLIC_IP:3001 | http://18.134.45.68:3001 | API server |
| **Health** | http://PUBLIC_IP:3001/health | http://18.134.45.68:3001/health | Status check |
| **Database** | CLUSTER_ENDPOINT:5432 | Internal VPC access only | Aurora PostgreSQL |

**⚠️ Important**: Current setup uses **public IP addresses** (not ALB) for cost optimization. Services run in public subnets with direct internet access.

### AWS Console URLs
```bash
# ECS Cluster
https://console.aws.amazon.com/ecs/home?region=us-east-1#/clusters/party-collection-dev-cluster

# RDS Aurora Cluster  
https://console.aws.amazon.com/rds/home?region=us-east-1#database:id=party-collection-dev-aurora

# CloudFormation Stack
https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/stackinfo?stackId=party-collection-dev-minimal

# Load Balancer
https://console.aws.amazon.com/ec2/home?region=us-east-1#LoadBalancers:
```

---

## 🌐 Production Environment URLs

### Production Service Discovery
```bash
# Get production URLs (when deployed)
aws elbv2 describe-load-balancers \
  --names party-collection-prod-alb \
  --query 'LoadBalancers[0].DNSName' --output text

# Example production URLs:
# https://party-collection-prod-alb-123456789.us-east-1.elb.amazonaws.com
# https://your-domain.com (with custom domain)
```

### Production Endpoints
```
Production Base: https://your-domain.com

Public Endpoints:
├── GET  /                    - Frontend application
├── GET  /health              - Public health check
└── POST /api/auth/login      - Authentication

Protected API:
├── GET    /api/users         - User management (admin)
├── POST   /api/users         - Create user (admin)
├── DELETE /api/users/:id     - Delete user (admin)
└── All other /api/* routes   - Require authentication
```

---

## 🗂️ Database Connection Details

### Local PostgreSQL
```bash
# Connection parameters
Host: localhost
Port: 5432
Database: party_collection
Username: postgres
Password: password

# Connection string
postgresql://postgres:password@localhost:5432/party_collection

# Connect via Docker
docker exec -it yourpartycollection-postgres psql -U postgres -d party_collection
```

### Local PgAdmin Access
```bash
# PgAdmin Web Interface
URL: http://localhost:8080
Email: admin@party-collection.local
Password: admin123

# Add server in PgAdmin:
Name: Local PostgreSQL
Host: postgres (Docker network)
Port: 5432
Database: party_collection
Username: postgres
Password: password
```

### AWS Database Connection
```bash
# Aurora Serverless connection (requires VPN/bastion host)
# Get endpoint from AWS console or CLI:
aws rds describe-db-clusters \
  --db-cluster-identifier party-collection-dev-aurora \
  --query 'DBClusters[0].Endpoint' --output text

# Connection parameters:
Host: party-collection-dev-aurora.cluster-xyz.us-east-1.rds.amazonaws.com
Port: 5432
Database: party_collection
Username: postgres
Password: [from environment secrets]
```

---

## 🔧 Development Tools & Monitoring

### Testing Endpoints
```bash
# Test runner endpoints
POST http://localhost:3001/api/test/reset-database    # Reset test data
GET  http://localhost:3001/api/test/health            # Test environment status
POST http://localhost:3001/api/test/create-user       # Create test user
```

### Performance Monitoring
```bash
# Performance dashboard (if running)
GET http://localhost:3002/performance    # Performance metrics
GET http://localhost:3002/metrics        # Prometheus metrics
```

### Development Utilities
| Tool | URL | Purpose |
|------|-----|---------|
| **Webpack Dev Server** | http://localhost:3000 | Hot reload |
| **API Documentation** | http://localhost:3001/api-docs | Swagger/OpenAPI |
| **Performance Dashboard** | http://localhost:3002/performance | Real-time metrics |

---

## 📱 PWA & Mobile Access

### Progressive Web App
```bash
# PWA manifest
GET http://localhost:3000/manifest.json

# Service worker
GET http://localhost:3000/sw.js

# PWA installation available on:
# - Chrome/Edge: Install button in address bar
# - iOS Safari: Share > Add to Home Screen
# - Android Chrome: Add to Home Screen prompt
```

### Mobile Testing URLs
```bash
# Find your local IP for mobile testing
# macOS/Linux
ifconfig | grep 'inet ' | grep -v 127.0.0.1

# Windows  
ipconfig | findstr IPv4

# Access from mobile on same network:
# http://YOUR_LOCAL_IP:3000 (frontend)
# http://YOUR_LOCAL_IP:3001 (backend)
```

---

## 🚀 CI/CD & Deployment URLs

### GitHub Actions
```bash
# Actions workflow URLs
https://github.com/YOUR_USERNAME/yourpartycollection/actions

# Workflow files:
├── .github/workflows/test.yml           - Test automation
├── .github/workflows/deploy-dev.yml     - Development deployment  
├── .github/workflows/deploy-prod.yml    - Production deployment
└── .github/workflows/performance.yml    - Performance testing
```

### Container Registry
```bash
# Docker Hub (if used)
https://hub.docker.com/r/YOUR_USERNAME/party-collection-backend
https://hub.docker.com/r/YOUR_USERNAME/party-collection-frontend

# AWS ECR
https://console.aws.amazon.com/ecr/repositories
# Repository URIs:
# 123456789012.dkr.ecr.us-east-1.amazonaws.com/party-collection-backend
# 123456789012.dkr.ecr.us-east-1.amazonaws.com/party-collection-frontend
```

---

## 🔍 Monitoring & Observability

### AWS CloudWatch
```bash
# CloudWatch dashboards
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:

# Log groups:
/aws/ecs/party-collection-dev-backend     # Backend logs
/aws/ecs/party-collection-dev-frontend    # Frontend logs  
/aws/rds/cluster/party-collection-dev-aurora/error  # Database error logs
```

### Health Check Monitoring
```bash
# Automated health check URLs for monitoring tools
GET http://localhost:3001/health          # Local backend health
GET http://BACKEND_IP:3001/health         # AWS backend health
GET https://your-domain.com/health        # Production health

# Health check response format:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "database": "connected",
  "uptime": 3600
}
```

---

## 🌐 External Service Integrations

### Third-Party Services
| Service | URL Pattern | Purpose |
|---------|-------------|---------|
| **AWS Console** | https://console.aws.amazon.com | Cloud management |
| **GitHub** | https://github.com/YOUR_USERNAME/yourpartycollection | Code repository |
| **Docker Hub** | https://hub.docker.com/r/YOUR_USERNAME/ | Container registry |

### API Documentation
```bash
# API documentation endpoints (if implemented)
GET http://localhost:3001/api-docs        # Swagger UI
GET http://localhost:3001/api-docs.json   # OpenAPI spec
GET http://localhost:3001/api/schema      # GraphQL schema (if used)
```

---

## 🔧 Network Configuration

### Port Mappings
```bash
# Docker container port mappings
Container Name              | Internal Port | External Port | Protocol
yourpartycollection-postgres      5432           5432          TCP
yourpartycollection-pgadmin       80             8080          TCP
party-collection-backend          3001           3001          TCP  
party-collection-frontend         3000           3000          TCP
```

### Firewall Rules
```bash
# Required inbound ports for local development
3000/tcp  # Frontend Next.js server
3001/tcp  # Backend Express server  
5432/tcp  # PostgreSQL database
8080/tcp  # PgAdmin web interface

# For mobile testing, also allow:
# All ports from local network subnet (e.g., 192.168.1.0/24)
```

---

## 📋 URL Testing Commands

### Quick URL Health Check
```bash
# Test all local services
echo "Frontend: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000)"
echo "Backend:  $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/health)"  
echo "PgAdmin:  $(curl -s -o /dev/null -w '%{http_code}' http://localhost:8080)"
echo "Database: $(docker exec yourpartycollection-postgres pg_isready -U postgres)"
```

### AWS Environment URL Test
```bash
# Test AWS development environment
cd infra/remote/tests
FRONTEND_IP=$(./dev-status.sh | grep "Frontend" | awk '{print $2}' | cut -d: -f1)
BACKEND_IP=$(./dev-status.sh | grep "Backend" | awk '{print $2}' | cut -d: -f1)

curl -s -o /dev/null -w '%{http_code}' http://$FRONTEND_IP:3000
curl -s -o /dev/null -w '%{http_code}' http://$BACKEND_IP:3001/health
```

---

## 🆘 URL Troubleshooting

### Common URL Issues
```bash
# Connection refused
curl: (7) Failed to connect to localhost port 3000: Connection refused
# Solution: Check if service is running with `docker ps`

# Timeout  
curl: (28) Operation timed out after 60 seconds
# Solution: Check firewall rules and network connectivity

# 404 Not Found
HTTP/1.1 404 Not Found
# Solution: Verify endpoint exists and service is fully started

# 502 Bad Gateway (AWS)
HTTP/1.1 502 Bad Gateway  
# Solution: Check ECS task health and security groups
```

### URL Validation Script
```bash
#!/bin/bash
# validate-urls.sh

echo "=== URL Validation ==="

URLS=(
  "http://localhost:3000"
  "http://localhost:3001/health" 
  "http://localhost:8080"
)

for url in "${URLS[@]}"; do
  if curl -f -s "$url" >/dev/null; then
    echo "✅ $url"
  else
    echo "❌ $url"  
  fi
done

echo "=== Validation Complete ==="
```

---

**🌐 Pro Tip**: Bookmark the health check URL (`http://localhost:3001/health`) for quick system status verification during development!