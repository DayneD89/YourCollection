# Security Architecture

> **Navigation**: [Documentation Index](../index.md) | [Infrastructure Overview](stack-structure.md) | [AWS Permissions](../getting-started/aws-permissions.md)

Complete security implementation guide covering authentication, authorization, infrastructure, and deployment security.

## 📋 What You Need to Know

**⏱️ Time needed**: 15-30 minutes to review  
**🎓 Skill level**: Intermediate (security knowledge helpful)  
**💰 Cost**: No additional cost (security is built-in)  
**💻 Prerequisites**: 
- Basic understanding of authentication concepts
- Familiarity with JWT tokens
- AWS account (for infrastructure security)

**🎯 You'll understand**: Security architecture with:
- ✅ JWT authentication and role-based access
- ✅ Password security and validation
- ✅ AWS infrastructure security
- ✅ API security and input validation

> 💡 **TL;DR**: Comprehensive security covering JWT authentication, bcrypt passwords, AWS OIDC roles, and defense-in-depth practices. All security measures are built-in and require no additional configuration for local development.

## 🔐 Authentication & Authorization

### JWT Token Management
The application uses JSON Web Tokens for secure, stateless authentication:

```javascript
// Token Structure
{
  "sub": "user_id",           // Subject (user identifier)  
  "email": "user@example.com", // User email
  "role": "user|admin",        // Role-based access level
  "iat": 1640995200,          // Issued at timestamp
  "exp": 1641081600           // Expiration timestamp (24 hours)
}
```

**Security Features:**
- **Short Expiration**: 24-hour token lifetime
- **Secure Secret**: Environment-based JWT signing key
- **Role Validation**: Server-side role verification on each request
- **Token Revocation**: Logout invalidates client-side tokens

**→ [Development Overview](../development/development-overview.md)** - Authentication implementation

### Password Security
Multi-layer password protection system:

#### Password Requirements
- **Minimum Length**: 8 characters
- **Complexity**: Must contain numbers and special characters
- **Email Prevention**: Cannot be the same as email prefix
- **Common Password**: Prevents common/weak passwords

#### Password Storage
```javascript
// Bcrypt with salt rounds
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Example stored hash
$2b$10$N9qo8uLOickgx2ZMRZoMye.iINJfLjON5AoJwPXrkfP.XMvKNhKJ.
```

#### Admin Reset Flow
```bash
# Admin creates temporary password
POST /api/admin/users/{id}/reset-password
# Returns: { temporaryPassword: "temp_pass_123" }

# User forced to change on first login
# System validates new password != temporary password
```

**→ [Backend README](../../backend/README.md)** - Password security implementation

### Role-Based Access Control (RBAC)

#### Role Definitions
```typescript
type UserRole = 'user' | 'admin';

interface User {
  id: string;
  email: string;
  role: UserRole;
  passwordHash: string;
  requiresPasswordChange: boolean;
}
```

#### Permission Matrix
| Action | User Role | Admin Role |
|--------|-----------|------------|
| **Login/Logout** | ✅ | ✅ |
| **View Own Profile** | ✅ | ✅ |
| **Change Own Password** | ✅ | ✅ |
| **View All Users** | ❌ | ✅ |
| **Create Users** | ❌ | ✅ |
| **Delete Users** | ❌ | ✅ |
| **Reset User Passwords** | ❌ | ✅ |

#### Middleware Implementation
```javascript
// JWT verification middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Admin-only middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
```

---

## 🛡️ API Security

### Input Validation
All API endpoints implement comprehensive input validation:

```javascript
// Registration endpoint validation
app.post('/api/auth/register', [
  body('email').isEmail().normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[0-9])(?=.*[!@#$%^&*])/),
  body('role').optional().isIn(['user', 'admin'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process registration
});
```

### SQL Injection Prevention
All database queries use parameterized statements:

```javascript
// Safe parameterized query
const user = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// NOT: Unsafe string concatenation
// const query = `SELECT * FROM users WHERE email = '${email}'`;
```

### Rate Limiting
```javascript
// Express rate limiting
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.'
});

app.use('/api/auth', authLimiter);
```

### CORS Configuration
```javascript
// Restrictive CORS policy
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

---

## 🔐 Infrastructure Security

### AWS Security Architecture

#### OIDC-Based Authentication
GitHub Actions uses OpenID Connect for secure, temporary AWS access:

```yaml
# No stored AWS keys in GitHub secrets
permissions:
  id-token: write    # Required for OIDC
  contents: read     # Repository access only

# Temporary credentials via role assumption  
- uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_ARN_DEV }}
    role-session-name: GitHubActions-Dev
```

#### IAM Role Boundaries
Each role has minimal permissions for its specific purpose:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:CreateStack",
        "cloudformation:UpdateStack",
        "cloudformation:DeleteStack"
      ],
      "Resource": [
        "arn:aws:cloudformation:*:*:stack/party-collection-dev-*/*"
      ]
    }
  ]
}
```

#### Network Security
```yaml
# Development Environment (Public Subnets)
VPC:
  CIDR: 10.0.0.0/16
  
PublicSubnets:
  - 10.0.1.0/24 (eu-west-2a)
  - 10.0.2.0/24 (eu-west-2b)
  
SecurityGroups:
  BackendSG:
    Ingress:
      - Port: 3001
        Source: LoadBalancerSG
  LoadBalancerSG:
    Ingress:
      - Port: 80
        Source: 0.0.0.0/0
      - Port: 443  
        Source: 0.0.0.0/0
```

```yaml
# Production Environment (Private Subnets)
VPC:
  CIDR: 10.0.0.0/16
  
PrivateSubnets:
  - 10.0.3.0/24 (eu-west-2a)
  - 10.0.4.0/24 (eu-west-2b)
  
PublicSubnets:
  - 10.0.1.0/24 (eu-west-2a) 
  - 10.0.2.0/24 (eu-west-2b)

NATGateway: 
  # Provides internet access for private subnets
```

### Container Security
```dockerfile
# Multi-stage builds to minimize attack surface
FROM node:18-alpine AS builder
# Build application

FROM node:18-alpine AS production
# Security hardening
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy only necessary files
COPY --from=builder --chown=nextjs:nodejs /app ./

# Run as non-root user
USER nextjs
```

### Database Security
```yaml
# Aurora Serverless v1 Configuration
AuroraCluster:
  Engine: aurora-postgresql
  EngineMode: serverless
  
  # Network isolation
  DBSubnetGroup: 
    Subnets: [PrivateSubnet1, PrivateSubnet2]
  
  VpcSecurityGroups:
    - DatabaseSecurityGroup  # Port 5432 from ECS only
  
  # Encryption
  StorageEncrypted: true
  KmsKeyId: AWS::KMS::Alias/aws/rds
  
  # Backup and recovery  
  BackupRetentionPeriod: 7
  PreferredBackupWindow: "03:00-04:00"
  PreferredMaintenanceWindow: "sun:04:00-sun:05:00"
```

---

## 📊 Security Monitoring

### Application Security Logging
```javascript
// Security event logging
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ 
      filename: 'security.log',
      level: 'warn'
    })
  ]
});

// Log authentication events
app.post('/api/auth/login', async (req, res) => {
  try {
    const result = await authenticateUser(email, password);
    securityLogger.info('Login successful', { 
      email: email, 
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    securityLogger.warn('Login failed', {
      email: email,
      ip: req.ip,
      error: error.message
    });
  }
});
```

### Infrastructure Security Monitoring
```yaml
# CloudWatch Security Metrics
CloudWatchAlarms:
  - HighLoginFailures:
      MetricName: LoginFailures
      Threshold: 10
      Period: 300  # 5 minutes
      
  - UnauthorizedAPIAccess:
      MetricName: 401Responses  
      Threshold: 50
      Period: 60   # 1 minute
      
  - DatabaseConnectionFailures:
      MetricName: DatabaseErrors
      Threshold: 5
      Period: 300
```

### AWS Security Best Practices
- **CloudTrail**: All API calls logged and monitored
- **VPC Flow Logs**: Network traffic analysis
- **GuardDuty**: Threat detection service (optional)
- **Config Rules**: Compliance monitoring
- **Systems Manager**: Patch management

---

## 🔒 Secrets Management

### Environment Variables
```bash
# Backend (.env)  
JWT_SECRET=your_super_secure_jwt_key_change_in_production
DB_PASSWORD=secure_database_password
ADMIN_DEFAULT_PASSWORD=secure_admin_default

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001
# Note: NEXT_PUBLIC_ variables are exposed to browser
```

### GitHub Secrets
```yaml
# Repository secrets (encrypted at rest)
AWS_ROLE_ARN_DEV: "arn:aws:iam::123456789:role/github-actions-dev"
AWS_ROLE_ARN_PROD: "arn:aws:iam::123456789:role/github-actions-prod" 
ALERT_EMAIL: "admin@example.com"

# Environment-specific secrets
DOMAIN_NAME: "yourdomain.com"          # Production only
CERTIFICATE_ARN: "arn:aws:acm:..."     # Production only
```

### AWS Secrets Manager (Production)
```yaml
# For production secrets management
DatabaseSecret:
  Type: AWS::SecretsManager::Secret
  Properties:
    Description: RDS database credentials
    GenerateSecretString:
      SecretStringTemplate: '{"username": "postgres"}'
      GenerateStringKey: "password"
      PasswordLength: 32
      ExcludeCharacters: '"@/\'
```

---

## 🛡️ Security Compliance

### Security Headers
```javascript
// Express security headers
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content type sniffing prevention
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Strict transport security (HTTPS only)
  res.setHeader('Strict-Transport-Security', 
    'max-age=31536000; includeSubDomains; preload');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'");
  
  next();
});
```

### Data Protection
- **Encryption at Rest**: All database and file storage encrypted
- **Encryption in Transit**: HTTPS/TLS for all communications
- **Data Minimization**: Collect only necessary user information
- **Right to Deletion**: User data can be completely removed
- **Access Controls**: Role-based access to personal data

### Security Testing
```bash
# Automated security scanning
npm audit                    # Dependency vulnerability scanning
npm audit fix               # Automatic security fixes

# Docker security scanning  
docker scan image:tag       # Container vulnerability assessment

# Infrastructure security testing
# AWS Config rules for compliance checking
# CloudFormation drift detection
```

---

## 🚨 Incident Response

### Security Incident Categories
1. **Authentication Breach**: Unauthorized access attempts
2. **Data Breach**: Unauthorized data access/exposure  
3. **Infrastructure Compromise**: AWS resource manipulation
4. **Application Vulnerability**: Code-level security issues

### Response Procedures
```bash
# Immediate Response
1. Identify and isolate affected systems
2. Preserve evidence and logs
3. Assess scope and impact
4. Contain the incident

# Recovery Actions  
1. Apply security patches/fixes
2. Reset compromised credentials
3. Update security configurations
4. Monitor for additional threats

# Post-Incident
1. Document lessons learned
2. Update security procedures  
3. Conduct security training
4. Implement preventive measures
```

### Emergency Security Controls
```bash
# Disable compromised user account
aws cognito-idp admin-disable-user \
  --user-pool-id POOL_ID \
  --username COMPROMISED_USER

# Revoke AWS credentials
aws iam delete-access-key \
  --access-key-id COMPROMISED_KEY \
  --user-name COMPROMISED_USER

# Scale down infrastructure (if necessary)
cd infra/remote/tests
./dev-teardown.sh  # Emergency shutdown
```

---

## 🔗 Security Resources

### Internal Documentation
- **[Development Overview](../development/development-overview.md)** - Authentication implementation details
- **[Backend README](../../backend/README.md)** - Password security implementation
- **[AWS Permissions Setup](../getting-started/aws-permissions.md)** - Infrastructure security
- **[Common Issues](../troubleshooting/common-issues.md)** - Troubleshooting and incident response

### External References
- **[OWASP Top 10](https://owasp.org/www-project-top-ten/)** - Web application security risks
- **[JWT Best Practices](https://tools.ietf.org/html/rfc8725)** - JSON Web Token security
- **[AWS Security Best Practices](https://aws.amazon.com/architecture/security-identity-compliance/)** - Cloud security
- **[Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)** - Backend security

### Security Tools
- **[npm audit](https://docs.npmjs.com/cli/v7/commands/npm-audit)** - Dependency scanning
- **[Snyk](https://snyk.io/)** - Vulnerability management
- **[OWASP ZAP](https://www.zaproxy.org/)** - Security testing
- **[AWS Security Hub](https://aws.amazon.com/security-hub/)** - Security posture management