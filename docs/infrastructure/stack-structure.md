# System Architecture & Stack Structure

> **Related**: [Security Guide](security.md) | [Cost Guide](../deployment/cost-guide.md) | [Quick Reference](../quick-reference/commands.md)

Complete system architecture overview for the Party Collection application, covering local development, AWS deployment, and production scaling.

---

## 📊 System Architecture Diagram

```
                    🌐 Party Collection Full-Stack Architecture
    
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                          🖥️  LOCAL DEVELOPMENT                          │
    │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
    │  │   📱 Frontend   │  │   🔧 Backend    │  │     🗄️ PostgreSQL      │  │
    │  │   Next.js 15    │  │   Node.js       │  │      + PgAdmin          │  │
    │  │   React 19      │──│   Express       │──│   Docker Container      │  │
    │  │   PWA Ready     │  │   TypeScript    │  │   localhost:5432        │  │
    │  │  localhost:3000 │  │  localhost:3001 │  │                         │  │
    │  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  │
    └─────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                            ☁️ AWS DEVELOPMENT                           │
    │                                                                         │
    │  ┌─────────────────────────────────────────────────────────────────┐   │
    │  │                      🌐 Application Load Balancer                │   │
    │  └─────────────────────────┬───────────────────┬───────────────────┘   │
    │                            │                   │                       │
    │  ┌─────────────────────────▼───────────┐  ┌────▼────────────────────┐  │
    │  │        📱 Frontend Service         │  │    🔧 Backend Service    │  │
    │  │       ECS Fargate (ARM64)          │  │   ECS Fargate (ARM64)    │  │
    │  │      0.25 vCPU, 512MB RAM          │  │   0.25 vCPU, 512MB RAM   │  │
    │  │    Auto-scale: 0-2 instances       │  │  Auto-scale: 0-2 instances│  │
    │  └─────────────────────────────────────┘  └─────────────┬─────────────┘  │
    │                                                         │               │
    │  ┌─────────────────────────────────────────────────────▼─────────────┐  │
    │  │              🗄️ Aurora Serverless v1 PostgreSQL                  │  │
    │  │             Auto-pause after 5 minutes idle                      │  │
    │  │              Wake time: ~15 seconds                               │  │
    │  │              Min: 1 ACU, Max: 2 ACU                               │  │
    │  └─────────────────────────────────────────────────────────────────┘  │
    │                                                                         │
    │  💰 Costs: Active £17.85/month | Idle £0.53/month | Shutdown £0/month  │
    └─────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                          🚀 AWS PRODUCTION                              │
    │                                                                         │
    │  ┌─────────────────┐  ┌───────────────────────────────────────────────┐ │
    │  │   🔒 CloudFront │  │            🌐 Application Load Balancer       │ │
    │  │   + WAF + SSL   │  │              Blue/Green Target Groups        │ │
    │  └─────────────────┘  └─────────────┬───────────────┬─────────────────┘ │
    │                                     │               │                   │
    │  ┌─────────────────────┬────────────▼──────────┐  ┌▼─────────────────┐ │
    │  │     📱 Frontend     │     🔧 Backend        │  │  🔧 Backend      │ │
    │  │   ECS Service       │    ECS Service        │  │  ECS Service     │ │
    │  │   2-5 instances     │    (Blue Environment) │  │ (Green Env)      │ │
    │  │   Auto-scaling      │    2-10 instances     │  │  2-10 instances  │ │
    │  └─────────────────────┴───────────┬───────────┘  └┬─────────────────┘ │
    │                                    │               │                   │
    │  ┌─────────────────────────────────▼───────────────▼─────────────────┐ │
    │  │                🗄️ Aurora Cluster (Multi-AZ)                      │ │
    │  │              2.5 ACU min, 16 ACU max, Auto-scaling               │ │
    │  │                 Daily backups, 7-day retention                   │ │
    │  │                   Point-in-time recovery                         │ │
    │  └─────────────────────────────────────────────────────────────────┘ │
    │                                                                         │
    │  ┌─────────────────────────────────────────────────────────────────┐   │
    │  │        📊 Monitoring & Logging                                  │   │
    │  │     CloudWatch + Performance Insights + VPC Flow Logs          │   │
    │  │              Cost Alerts + Auto-scaling Metrics                │   │
    │  └─────────────────────────────────────────────────────────────────┘   │
    │                                                                         │
    │  💰 Costs: £222/month standard | £300-400/month peak | Auto cost caps  │
    └─────────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Component Architecture

### Frontend Architecture (Next.js 15 + React 19)
```
📱 Frontend Application
├── 🎨 User Interface Layer
│   ├── src/app/ (App Router)
│   │   ├── page.tsx (Landing)
│   │   ├── auth/ (Login/Register)
│   │   ├── dashboard/ (User Dashboard)
│   │   └── admin/ (Admin Panel)
│   ├── src/components/ 
│   │   ├── ui/ (Reusable components)
│   │   ├── forms/ (Form components)
│   │   └── layout/ (Layout components)
│   └── src/contexts/ (State Management)
│       └── AuthContext.tsx (Global auth state)
│
├── 🔧 Service Layer
│   ├── src/services/
│   │   ├── api.ts (HTTP client)
│   │   ├── auth.ts (Authentication)
│   │   └── storage.ts (Local storage)
│   └── src/utils/ (Helper functions)
│
├── 📱 PWA Features
│   ├── public/manifest.json (PWA manifest)
│   ├── public/sw.js (Service worker)
│   └── Offline-first functionality
│
└── 🧪 Testing
    ├── E2E Tests (Selenium WebDriver)
    ├── 15 test scenarios, 135 steps
    └── Automated user journey testing
```

### Backend Architecture (Node.js + Express)
```
🔧 Backend API Server
├── 🗂️ Application Structure
│   ├── src/
│   │   ├── routes/ (API endpoints)
│   │   │   ├── auth.ts (Authentication routes)
│   │   │   ├── users.ts (User management)
│   │   │   └── health.ts (Health checks)
│   │   ├── middleware/
│   │   │   ├── auth.ts (JWT verification)
│   │   │   ├── validation.ts (Input validation)
│   │   │   └── error.ts (Error handling)
│   │   ├── config/
│   │   │   ├── database.ts (PostgreSQL connection)
│   │   │   └── jwt.ts (JWT configuration)
│   │   └── utils/ (Helper functions)
│
├── 🔐 Security Layer
│   ├── JWT Authentication
│   ├── Password hashing (bcrypt)
│   ├── Input validation & sanitization
│   └── CORS configuration
│
├── 🗄️ Database Layer
│   ├── PostgreSQL connection pooling
│   ├── SQL injection prevention
│   ├── Transaction support
│   └── Backup & restore capabilities
│
└── 🧪 Testing
    ├── API Integration tests
    ├── 13 comprehensive test scenarios
    └── Authentication & authorization testing
```

---

## 🔧 Proposed Architecture (CloudFormation)</## 📦 Deployment Architecture

### Local Development Stack
```
🐳 Docker Compose Setup
├── yourpartycollection-postgres
│   ├── PostgreSQL 14-alpine
│   ├── Port: 5432
│   ├── Volume: Persistent data storage
│   └── Health checks enabled
│
├── yourpartycollection-pgadmin  
│   ├── PgAdmin 4 web interface
│   ├── Port: 8080
│   ├── Connected to PostgreSQL
│   └── Admin: admin@party-collection.local
│
└── Application Processes
    ├── Backend: npm run dev (nodemon + ts-node)
    ├── Frontend: npm run dev (Next.js + Turbopack)
    └── Test Runner: node test-runner.js
```

### AWS Development Stack (Current Default Implementation)

**⚠️ Current Deployment**: Uses `templates/minimal-dev-template.yaml` by default

```
☁️ AWS Development Environment (Minimal Template)
├── 🌐 Networking (Ultra Cost-Optimized)
│   ├── VPC with **PUBLIC SUBNETS ONLY** (no NAT Gateway costs)
│   ├── Internet Gateway (direct internet access)
│   ├── Security Groups (port-specific rules)
│   └── **NO ALB by default** (saves ~£18/month)
│
├── 🖥️ Compute (ECS Fargate ARM64)
│   ├── ECS Cluster: party-collection-dev-cluster
│   ├── Backend Service: ARM64, 256 CPU, 512MB (public IP)
│   ├── Frontend Service: ARM64, 256 CPU, 512MB (public IP)  
│   ├── **Direct IP Access**: http://PUBLIC_IP:3000 and :3001
│   ├── **True Zero Scaling**: DesiredCount can be 0
│   └── FARGATE_SPOT: 70% weight for additional savings
│
├── 🗄️ Database (Aurora Serverless v1 - Legacy)
│   ├── Aurora PostgreSQL 15.4 compatible
│   ├── **True Auto-pause**: £0 cost when completely idle
│   ├── Capacity: 1-2 ACUs (old serverless v1 API)
│   └── 1-day backup retention (cost optimized)
│
└── 📊 Monitoring (Minimal)
    ├── CloudWatch Logs (3-day retention only)
    ├── Basic ECS metrics
    └── Budget alerts at £25/month
```

**Key Cost Optimizations in Current Setup:**
- Public subnets eliminate NAT Gateway (~£30/month savings)
- No ALB by default (~£18/month savings)  
- Aurora Serverless v1 can truly pause (vs v2 0.5 ACU minimum)
- 3-day log retention vs default 30+ days
- FARGATE_SPOT for 70% of capacity

### Alternative AWS Deployment Options

**Available Templates** (not currently used by default):

1. **`template-no-alb.yaml`** - Private subnets with conditional ALB
   - Uses private subnets (requires NAT Gateway: +£30/month)
   - Optional ALB (can be enabled: +£18/month)
   - Blue/green deployment capability when ALB enabled
   - More secure but higher cost

2. **`template-blue-green.yaml`** - Full production template  
   - Complete blue/green deployment setup
   - Private subnets with ALB required
   - Higher cost but zero-downtime deployments

3. **`template-v2.yaml`** - Enhanced features
   - Additional monitoring and alerting
   - More sophisticated scaling policies
   - Enhanced security configurations

### AWS Production Stack (High Availability)
```
🚀 AWS Production Environment  
├── 🌐 Edge & Security
│   ├── CloudFront CDN (global distribution)
│   ├── WAF (Web Application Firewall)  
│   ├── SSL/TLS certificates (ACM)
│   └── Route 53 DNS (custom domains)
│
├── ⚖️ Load Balancing & Traffic
│   ├── Application Load Balancer (Multi-AZ)
│   ├── Blue/Green Target Groups
│   ├── Health check endpoints
│   └── Zero-downtime deployments
│
├── 🖥️ Compute Layer (ECS Fargate)
│   ├── Frontend Service: 2-5 instances
│   ├── Backend Service (Blue): 2-10 instances  
│   ├── Backend Service (Green): 2-10 instances
│   └── Auto Scaling based on CPU/memory/requests
│
├── 🗄️ Database Layer (Aurora Cluster)
│   ├── Multi-AZ Aurora PostgreSQL
│   ├── Read replicas for scaling
│   ├── Automatic failover
│   ├── Point-in-time recovery (35 days)
│   ├── Daily automated backups
│   └── Performance Insights enabled
│
├── 🔐 Security & Compliance
│   ├── IAM roles (least privilege)
│   ├── VPC endpoints (private communication)
│   ├── Secrets Manager (database credentials)
│   ├── Parameter Store (application config)
│   └── Security Groups (network isolation)
│
└── 📊 Observability
    ├── CloudWatch (metrics, logs, alarms)
    ├── Performance Insights (database)
    ├── VPC Flow Logs (network monitoring)
    ├── Cost Explorer (cost optimization)
    └── AWS Config (compliance monitoring)
```

---

## 💰 Cost Architecture by Environment

### Development Cost Optimization (Actual Current Setup)
```
💰 Development Environment Costs (from actual scripts)

Idle State (£0.53/month):
├── ECS Services: £0.00 (DesiredCount=0, containers stopped)
├── Aurora Database: £0.00 (auto-pauses after idle period)  
├── VPC/Networking: £0.53/month (minimal public subnet costs)
└── CloudWatch Logs: £0.00 (3-day retention, minimal usage)

Active State (£17.85/month):
├── ECS Fargate: ~£15-16/month
│   ├── Backend: 0.25 vCPU × 512MB × 24h (ARM64 cost optimized)
│   └── Frontend: 0.25 vCPU × 512MB × 24h (ARM64 cost optimized)
├── Aurora Serverless v1: ~£1-2/month when active
├── **No ALB by default**: Saves ~£18/month vs ALB setup
├── Public Subnets: No NAT Gateway costs
└── Data Transfer: £0.00 (within free tier limits)

Cost Control Commands (actual scripts):
├── ./dev-deploy.sh → Deploy active (£17.85/month)
├── ./dev-idle.sh → Scale to idle (£0.53/month)  
├── ./dev-active.sh → Reactivate from idle
└── ./dev-teardown.sh → Delete everything (£0.00/month)
```

### Production Cost Structure
```  
💰 Production Environment Costs

Standard Load (£222/month):
├── ECS Fargate: £125/month
│   ├── Frontend: 2 × (0.5 vCPU, 1GB) × 24h
│   └── Backend: 2 × (0.5 vCPU, 1GB) × 24h
├── Aurora Cluster: £65/month (2.5 ACU baseline)
├── Load Balancer: £18/month (with rules)
├── CloudFront CDN: £8/month
└── Monitoring/Backup: £6/month

Peak Load (£300-400/month):
├── ECS Auto-scaling: Up to 10 instances
├── Aurora scaling: Up to 16 ACUs
├── Increased data transfer costs
└── Auto scale-down during quiet periods

Cost Protection:
├── Billing alerts at £30, £50, £100
├── Auto-scaling limits prevent runaway costs
└── Emergency shutdown procedures
```

---

## 🔄 Deployment Flow Architecture

### Local Development Flow
```
🏠 Local Development Workflow

Developer Machine:
├── 1. Code changes in IDE
├── 2. Hot reload (frontend/backend)
├── 3. Run tests locally
└── 4. Commit to Git branch

Docker Environment:
├── PostgreSQL container (persistent data)
├── Development servers (nodemon/turbopack)
└── Test suite execution (28 tests)

Daily Workflow:
├── ./start-local.sh (morning)
├── Development & testing
└── ./stop-local.sh (evening)
```

### CI/CD Pipeline Architecture
```
🤖 Automated Deployment Pipeline

GitHub Repository:
├── Feature branch → Pull Request
├── GitHub Actions triggered
└── Automated testing & validation

CI/CD Stages:
├── 1. Code Quality
│   ├── Lint (ESLint, TypeScript)
│   ├── Security scan
│   └── Dependency audit
├── 2. Testing
│   ├── Unit tests (Jest)
│   ├── Integration tests (API)
│   └── E2E tests (Selenium)
├── 3. Build & Package
│   ├── Docker image build
│   ├── Multi-arch (ARM64/AMD64)
│   └── Push to ECR registry
└── 4. Deploy
    ├── Development: Auto-deploy
    ├── Production: Manual approval
    └── Blue/green deployment

Deployment Verification:
├── Health check validation
├── Automated rollback on failure
└── Monitoring alert setup
```

---

## 📊 Data Flow Architecture

### Authentication Flow
```
🔐 User Authentication Architecture

Client Side (Next.js):
├── 1. User enters credentials
├── 2. Form validation (client-side)
├── 3. POST /api/auth/login
├── 4. Store JWT in localStorage
└── 5. Redirect to dashboard

Server Side (Express):
├── 1. Receive credentials
├── 2. Validate input format
├── 3. Hash & compare password (bcrypt)
├── 4. Query user in PostgreSQL
├── 5. Generate JWT token
└── 6. Return user data + token

Protected Route Access:
├── Client sends JWT in Authorization header
├── Server validates JWT signature
├── Extract user info from token
├── Check user permissions (role-based)
└── Allow/deny access to resource
```

### Data Persistence Architecture
```
🗄️ Data Storage & Management

PostgreSQL Database Schema:
├── users table
│   ├── id (primary key)
│   ├── email (unique, indexed)  
│   ├── password_hash (bcrypt)
│   ├── role (user/admin)
│   ├── created_at, updated_at
│   └── password_change_required (boolean)
│
└── Additional tables (extensible)
    └── (parties, events, etc.)

Data Backup Strategy:
├── Local: Docker volume persistence
├── Development: Aurora automatic snapshots
└── Production: Daily backups + point-in-time recovery

Data Security:
├── Password hashing (bcrypt + salt)
├── SQL injection prevention (parameterized queries)
├── Input validation & sanitization
└── Database connection encryption
```

---

## 📱 Progressive Web App Architecture

### PWA Features
```
📱 Progressive Web App Implementation

Service Worker Strategy:
├── Cache-first for static assets
├── Network-first for API calls
├── Offline fallback pages
└── Background sync for failed requests

PWA Manifest Features:
├── App name & description
├── Icons (multiple sizes)
├── Theme colors
├── Display mode (standalone)
├── Start URL
└── Scope definition

Offline Capabilities:
├── Cached pages work offline
├── Local data storage (IndexedDB)
├── Offline indicator UI
└── Sync when connection restored

Mobile Optimization:
├── Responsive design (Tailwind CSS)
├── Touch-friendly interfaces
├── Fast loading (< 3 seconds)
├── App-like navigation
└── Push notifications (future)
```

---

## 🔧 Technology Stack Summary

| Layer | Technology | Purpose | Key Features |
|-------|------------|---------|--------------|
| **Frontend** | Next.js 15 + React 19 | User Interface | PWA, SSR, App Router, TypeScript |
| **Backend** | Node.js + Express | API Server | JWT auth, TypeScript, REST API |
| **Database** | PostgreSQL 14 | Data Persistence | ACID compliance, JSON support |
| **Local Dev** | Docker Compose | Development Environment | Isolated, reproducible setup |
| **Cloud Compute** | AWS ECS Fargate | Container Orchestration | Serverless, auto-scaling, ARM64 |
| **Cloud Database** | Aurora Serverless/Cluster | Managed Database | Auto-pause, backup, scaling |
| **Load Balancer** | AWS ALB | Traffic Distribution | Health checks, SSL termination |
| **CDN** | CloudFront | Global Content Delivery | Edge caching, DDoS protection |
| **CI/CD** | GitHub Actions | Automated Deployment | OIDC auth, multi-environment |
| **Monitoring** | CloudWatch | Observability | Logs, metrics, alerts |
| **Security** | WAF + Security Groups | Protection | Network isolation, firewall |

---

---

## 📚 Related Documentation

**Deployment & Operations:**
- **[AWS Deployment](../deployment/aws-deployment.md)** - Complete deployment procedures
- **[Environment Control](../troubleshooting/environment-control.md)** - Daily scaling and cost controls
- **[Remote Management](../troubleshooting/remote-management.md)** - AWS operations and troubleshooting
- **[Rollback Procedures](../deployment/rollback-procedures.md)** - Emergency rollback strategies

**Cost & Optimization:**
- **[Cost Guide](../deployment/cost-guide.md)** - Detailed cost breakdowns and charts
- **[Quick Reference Costs](../quick-reference/costs.md)** - Cost optimization at a glance

**Development:**
- **[Development Overview](../development/development-overview.md)** - Local development workflows
- **[Quick Start](../getting-started/quick-start.md)** - Getting started guide

**Security & Compliance:**
- **[Security Guide](security.md)** - Complete security architecture
- **[Production Security](production-security.md)** - Production-specific security

---

**🏗️ Architecture Benefits**: This design provides cost-effective scaling from £0 (local) to £222+ (production) while maintaining data integrity, security, and zero-downtime deployments throughout the entire stack.