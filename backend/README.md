# Backend API Server

> **Stack**: Node.js + Express + TypeScript + PostgreSQL + JWT | **Tests**: 13 API scenarios | **Security**: Role-based access + bcrypt

Express API server providing authentication, user management, and secure data access with comprehensive testing.

## 🚀 Quick Start

### Local Development
```bash
# Start with full environment (recommended)
cd ../infra/local/scripts && ./start-local.sh
# Backend runs at: http://localhost:3001

# Or start backend only (requires database running)
npm run dev
```

### Testing
```bash
# Run all backend tests
npm test

# Test specific areas
node -e "const test = require('./test-backend.js'); test.runSingleTest('auth')"
```

**→ Testing Guide:** [../docs/testing/backend-testing.md](../docs/testing/backend-testing.md)

---

## 🏗️ What's Built Here

### Core Features
- **JWT Authentication** with 24-hour tokens and role validation
- **User Management** with admin controls and password policies  
- **PostgreSQL Integration** with connection pooling and migrations
- **Security Hardening** with bcrypt, input validation, and CORS
- **Health Monitoring** with comprehensive status endpoints
- **API Documentation** with structured error responses

### Technology Stack
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express with middleware for auth and validation
- **Database**: PostgreSQL with parameterized queries
- **Security**: JWT + bcrypt + role-based permissions
- **Testing**: Jest with comprehensive API scenario coverage

---

## 🛠️ Development Commands

```bash
# Package management
npm install              # Install dependencies
npm audit               # Security vulnerability check

# Development
npm run dev             # Hot reload development server
npm run build           # Compile TypeScript to dist/
npm start               # Production server (requires build)

# Testing
npm test                # Run all 13 API tests
npm run test:coverage   # Test coverage report (if configured)

# Code quality
npm run lint            # ESLint code checking (if configured)
npm run format          # Prettier code formatting (if configured)
```

**→ Development Setup:** [Development Guide](../docs/development/development-overview.md)

---

## 📊 API Endpoints

### Authentication
| Endpoint | Method | Auth | Purpose | Documentation |
|----------|--------|------|---------|---------------|
| `/health` | GET | None | Service health check | See code examples below |
| `/api/auth/login` | POST | None | User authentication | [Security Guide](../docs/infrastructure/security.md) |
| `/api/auth/register` | POST | None | User registration | [Security Guide](../docs/infrastructure/security.md) |

### User Management (Admin Only)
| Endpoint | Method | Auth | Purpose | Documentation |
|----------|--------|------|---------|---------------|
| `/api/users` | GET | Admin | List all users | See code examples below |
| `/api/users` | POST | Admin | Create new user | See code examples below |
| `/api/users/:id` | DELETE | Admin | Delete user | See code examples below |
| `/api/users/:id/reset` | POST | Admin | Reset user password | See code examples below |

**→ Complete API Reference:** See endpoint examples in the sections below

---

## 🧪 Testing Coverage

**13 Comprehensive API Tests** covering:

### Authentication Tests (4 scenarios)
- User login with valid credentials
- Registration with password validation  
- JWT token generation and validation
- Invalid credentials handling

### User Management Tests (4 scenarios)
- Admin user creation and deletion
- Role-based access control validation
- User listing and filtering
- Database integrity checks

### Security Tests (3 scenarios)
- Password strength enforcement
- SQL injection prevention
- CORS and security headers

### Integration Tests (2 scenarios)
- Database connection and queries
- Health endpoint monitoring

**→ Testing Details:** [../docs/testing/backend-testing.md](../docs/testing/backend-testing.md)

---

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/          # Database and app configuration
│   │   ├── database.ts  # PostgreSQL connection setup
│   │   └── config.ts    # Environment variables
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts      # JWT verification
│   │   └── validation.ts # Input validation
│   ├── routes/          # API route handlers
│   │   ├── auth.ts      # Authentication endpoints
│   │   └── users.ts     # User management endpoints
│   ├── types/           # TypeScript type definitions
│   │   └── auth.ts      # User and JWT types
│   └── server.ts        # Main Express server
├── test-backend.js      # Comprehensive API tests
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── Dockerfile          # ARM64-optimized container
└── .env.example        # Environment variables template
```

**→ Architecture Guide:** [Stack Structure](../docs/infrastructure/stack-structure.md)

---

## 🔐 Security Implementation

### Password Security
- **Strength Requirements**: 8+ characters, numbers, special characters
- **Bcrypt Hashing**: Salt rounds 10 for secure storage
- **Email Prevention**: Cannot reuse email prefix as password
- **Admin Reset Flow**: Temporary passwords with forced change

### JWT Authentication
- **Token Expiry**: 24-hour lifetime for security
- **Role Validation**: Server-side role checking on each request  
- **Secure Headers**: CORS, XSS protection, content-type validation
- **Environment Secrets**: JWT signing keys in environment variables

**→ Security Details:** [../docs/infrastructure/security.md](../docs/infrastructure/security.md)

---

## 🗄️ Database Integration

### Connection Management
- **Connection Pooling**: Optimized PostgreSQL connection handling
- **Migration Support**: Database schema versioning (if configured)
- **Query Safety**: Parameterized queries prevent SQL injection
- **Transaction Support**: Atomic operations for data integrity

### Default Users (Development)
```javascript
// Created automatically in development
Admin: { email: "admin@example.com", password: "AdminTest123@" }
User: { email: "user@example.com", password: "UserPass123@" }
TestUser: { email: "testuser@example.com", password: "testuser" }
```

**→ Database Setup:** [Database Guide](../docs/getting-started/database-setup.md)

---

## 🚀 Deployment Options

### Local Deployment
```bash
# Full local stack (recommended)
cd ../infra/local/scripts && ./start-local.sh

# Backend only (requires PostgreSQL)
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname npm run dev
```

### Docker Deployment
```bash
# Build ARM64-optimized container
docker build --platform linux/arm64 -t party-collection-backend .

# Run with environment variables
docker run -p 3001:3001 --env-file .env party-collection-backend
```

### AWS Deployment
```bash
# Via infrastructure automation
cd ../infra/remote/tests
./dev-deploy.sh your-email@example.com

# Via GitHub Actions (automated)
git push origin develop  # Triggers automated deployment
```

**→ Deployment Guide:** [AWS Deployment](../docs/deployment/aws-deployment.md)

---

## 📊 Monitoring & Health

### Health Endpoints
- **`/health`**: Basic service health check
- **`/health/detailed`**: Database connection and system status (if configured)
- **CloudWatch Integration**: AWS deployment includes automated monitoring

### Logging
- **Development**: Console logging with request details
- **Production**: Structured JSON logging to CloudWatch
- **Security Events**: Authentication attempts and errors

**→ Monitoring Setup:** [../docs/infrastructure/monitoring.md](../docs/infrastructure/monitoring.md)

---

## ⚡ Integration Points

### Frontend Integration
- **CORS Configuration**: Allows requests from frontend URL
- **JWT Tokens**: Shared authentication with React frontend
- **Error Handling**: Structured API responses for UI consumption

### Database Integration  
- **Local Development**: Docker PostgreSQL container
- **AWS Development**: Aurora Serverless v1 with auto-pause
- **Production**: Aurora with enhanced monitoring and backup

### Testing Integration
- **Multi-Environment**: Tests run against local, dev, and prod
- **CI/CD Pipeline**: Automated testing in GitHub Actions
- **Test Data**: Automatic test user creation and cleanup

**→ Integration Guide:** [Development Overview](../docs/development/development-overview.md)

---

## 🔗 Related Components

- **[Frontend PWA](../frontend/README.md)** - React interface consuming this API
- **[Local Infrastructure](../infra/local/README.md)** - Development database setup
- **[Remote Infrastructure](../infra/remote/README.md)** - AWS deployment automation
- **[Testing Overview](../docs/testing/test-commands.md)** - Multi-component testing strategy

---

## 📚 Documentation Deep-Dive

- **[System Architecture](../docs/infrastructure/stack-structure.md)** - Complete system design and backend role
- **[Security Architecture](../docs/infrastructure/security.md)** - Security measures and compliance  
- **[Development Workflow](../docs/development/development-overview.md)** - Backend development process
- **[AWS Deployment](../docs/deployment/aws-deployment.md)** - Backend deployment to AWS
- **[Backend Testing Guide](../docs/testing/backend-testing.md)** - API testing approaches and coverage