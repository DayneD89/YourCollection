# Frontend PWA

> **Stack**: Next.js 15 + React 19 + TypeScript + Tailwind CSS | **Tests**: 15 E2E scenarios | **Features**: PWA + Offline + Mobile

Next.js 15 Progressive Web App with React 19, TypeScript, and comprehensive E2E testing.

## 🚀 Quick Start

```bash
# Development server (with backend & database)
cd ../infra/local/scripts && ./start-local.sh
# Frontend runs at http://localhost:3000

# Or run frontend only (requires backend running)
npm run dev
```

## 📋 What's Here

- **Next.js 15 PWA** with App Router and Turbopack
- **React 19** with Server Components
- **Progressive Web App** with offline capabilities
- **TypeScript** for type safety throughout
- **Tailwind CSS** for responsive styling
- **Comprehensive E2E tests** (15 test scenarios, 135 steps)

## 🧪 Testing

```bash
# Run E2E tests (various modes)
npm test                    # Standard headless
npm run test:e2e:headed     # With browser visible
npm run test:e2e:debug      # Debug mode with console output
npm run test:comprehensive  # Full system integration

# Test specific scenarios
npm run test:e2e -- --tags "@admin"     # Admin functionality
npm run test:e2e -- --tags "@password"  # Password features
```

**→ [E2E Testing Guide](../docs/testing/frontend-testing.md)** for detailed testing guide

## 🛠️ Development

```bash
# Install dependencies
npm install

# Development with Turbopack
npm run dev

# Production build
npm run build

# Production server
npm start

# Linting
npm run lint
```

## 🎨 UI Components

| Feature | Components | Purpose |
|---------|------------|---------|
| **Authentication** | LoginForm, RegisterForm | User login/registration |
| **Dashboard** | UserDashboard, AdminDashboard | Role-based interfaces |
| **Admin Panel** | UserManagement, CreateUser | Admin user operations |
| **Layout** | Navigation, ProtectedRoute | App structure |
| **PWA** | ServiceWorker, Manifest | Offline capabilities |

See component examples in the sections above

## 📱 PWA Features

- **Offline Support**: Service worker for offline functionality
- **App Install**: Installable on mobile and desktop
- **Responsive Design**: Mobile-first responsive layout
- **Performance**: Optimized with Next.js 15 and Turbopack
- **SEO**: Server-side rendering for search engines

See PWA configuration details in the sections above

## 🔐 Authentication & State

- **Global Auth State**: AuthContext provides user data and auth functions
- **JWT Token Management**: Stored in localStorage, managed by context
- **Protected Routes**: ProtectedRoute component wraps authenticated pages
- **Role-Based Access**: Different UI for user vs admin roles
- **Real-time Updates**: Dynamic user management interface

**→ [Security Guide](../docs/infrastructure/security.md)** for auth implementation

## 🧪 E2E Test Scenarios

The frontend includes comprehensive E2E testing covering:

- **Authentication Flow**: Login, registration, logout (3 scenarios)
- **User Dashboard**: Protected access, user interface (2 scenarios)
- **Admin Functions**: User management, creation, deletion (4 scenarios)
- **Password Management**: Password changes, validations (3 scenarios)
- **Navigation & UI**: Responsive design, PWA features (3 scenarios)

**→ [E2E Testing Guide](../docs/testing/frontend-testing.md)** for complete test coverage

## 📁 Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── admin/           # Admin-only pages
│   │   ├── dashboard/       # User dashboard
│   │   ├── auth/            # Authentication pages
│   │   └── layout.tsx       # Root layout
│   ├── components/          # Reusable UI components
│   ├── contexts/            # React contexts (Auth)
│   ├── lib/                 # Utility functions
│   └── utils/               # Helper utilities
├── public/                  # Static assets, PWA manifest
├── tests/                   # E2E test specifications
├── next.config.ts           # Next.js configuration
└── Dockerfile              # ARM64-optimized container
```

## 🔗 Integration Points

- **Backend API**: Consumes REST API at http://localhost:3001
- **Authentication**: JWT token management with backend
- **Testing**: Selenium WebDriver for comprehensive E2E testing
- **PWA**: Service worker and manifest for app-like experience
- **Deployment**: ARM64 Docker container for AWS ECS

**→ [Development Guide](../docs/development/development-overview.md)** for integration details

## ⚙️ Configuration

Key configuration files:

- **`next.config.ts`**: Next.js configuration with PWA settings
- **`tailwind.config.ts`**: Tailwind CSS customization
- **`tsconfig.json`**: TypeScript configuration
- **Test configuration**: Environment-specific test configs in `../test-runner.js`

**→ [../docs/getting-started/quick-start.md](../docs/getting-started/quick-start.md)** for setup and configuration details

---

## 🔗 Related Components

- **[Backend API](../backend/README.md)** - Express server providing data and authentication
- **[Local Infrastructure](../infra/local/README.md)** - Development environment setup
- **[Remote Infrastructure](../infra/remote/README.md)** - AWS cloud deployment
- **[Complete Documentation](../docs/index.md)** - Full documentation index

## 📚 Documentation Deep-Dive

- **[System Architecture](../docs/infrastructure/stack-structure.md)** - How frontend fits in the system
- **[Frontend Testing Guide](../docs/testing/frontend-testing.md)** - E2E testing with Selenium
- **[Development Workflow](../docs/development/development-overview.md)** - Frontend development process
- **[AWS Deployment](../docs/deployment/aws-deployment.md)** - Frontend deployment to AWS
- **[Security Implementation](../docs/infrastructure/security.md)** - Authentication and security features