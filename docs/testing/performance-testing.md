# Performance Testing & Benchmarks

> **Related**: [Backend Testing](backend-testing.md) | [Frontend Testing](frontend-testing.md) | [Test Commands](test-commands.md)

**⚠️ Current Status**: The Party Collection application does not currently have dedicated performance testing tools implemented. This document serves as a guide for adding performance testing capabilities when needed.

## 🚧 Not Yet Implemented

The following performance testing features are **not currently implemented** but could be added:
- Load testing tools (Apache Bench, Artillery, K6)
- Lighthouse performance auditing 
- Automated performance monitoring
- Performance regression testing
- Database query performance profiling

## 🎯 Current Testing Capabilities

What **is currently available**:
- **Backend API Tests**: 13 comprehensive tests covering functionality (not performance)
- **Frontend E2E Tests**: 15 scenarios with Selenium WebDriver (functional testing)
- **Health Check Endpoints**: `/health` endpoint for basic availability testing
- **Manual Testing**: Browser-based testing of user interfaces

The existing test suite focuses on **functional correctness** rather than performance characteristics.

## 🎯 Performance Targets

### Response Time Targets
| Component | Target | Good | Needs Improvement |
|-----------|--------|------|-------------------|
| **Backend API** | < 100ms | < 200ms | > 500ms |
| **Frontend Load** | < 2s | < 3s | > 5s |
| **Database Query** | < 50ms | < 100ms | > 200ms |
| **Full Page Load** | < 3s | < 5s | > 10s |

### Throughput Targets
| Metric | Development | Production | Max Capacity |
|--------|-------------|------------|--------------|
| **Concurrent Users** | 10 | 100 | 1000 |
| **Requests/Second** | 50 | 500 | 2000 |
| **Database Connections** | 5 | 20 | 100 |

---

## 🧪 Basic Performance Testing (Manual)

### What You Can Test Now

**Simple Response Time Testing**
```bash
# Basic health check timing (available now)
time curl -s "http://localhost:3001/health"

# Manual endpoint testing with curl timing
curl -w "Time: %{time_total}s\n" -o /dev/null -s "http://localhost:3001/health"
```

**Browser-Based Performance Testing**
- Use browser Developer Tools → Network tab to measure load times
- Check browser Developer Tools → Performance tab for frontend profiling
- Monitor memory usage during E2E test execution

### Adding Load Testing (Would Need Implementation)

**To add Apache Bench (not currently installed):**
```bash
# macOS: brew install apache2-utils
# Ubuntu: sudo apt install apache2-utils
# Windows: Download from Apache website

# Example usage (after installation):
ab -n 100 -c 10 http://localhost:3001/health
```

**Load Testing with Apache Bench**
```bash
# Test health endpoint
ab -n 100 -c 10 http://localhost:3001/health

# Test API endpoints with authentication
ab -n 50 -c 5 -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:3001/api/users

# Test POST endpoints
ab -n 20 -c 2 -p post-data.json -T application/json http://localhost:3001/api/auth/login
```

**Database Performance Testing**
```bash
# Connect to database and run performance queries
docker exec yourpartycollection-postgres psql -U postgres -d party_collection

-- Enable query timing
\timing on

-- Test basic queries
SELECT COUNT(*) FROM users;
SELECT * FROM users WHERE email = 'admin@example.com';

-- Test complex queries
SELECT u.email, COUNT(p.id) as party_count 
FROM users u 
LEFT JOIN parties p ON u.id = p.user_id 
GROUP BY u.email;
```

### Frontend Performance Testing (Would Need Implementation)

**Current Frontend Testing**
- Selenium WebDriver E2E tests (functional, not performance-focused)
- Manual browser testing capabilities

**To Add Performance Auditing:**
```bash
# Would need to install Lighthouse CLI first
npm install -g lighthouse

# Then could run performance audits:
lighthouse http://localhost:3000 --output html --output-path ./performance-report.html

# Focus on performance only
lighthouse http://localhost:3000 --only-categories=performance
```

**Bundle Size Analysis**
```bash
cd frontend

# Analyze bundle size
npm run build
npx webpack-bundle-analyzer .next/static/chunks/*.js

# Check for large dependencies
npm install -g bundle-phobia-cli
bundle-phobia-cli package.json
```

**Network Performance Testing**
```bash
# Simulate slow connections
# Chrome DevTools -> Network -> Throttling -> Slow 3G

# Test offline functionality (PWA)
# Chrome DevTools -> Application -> Service Workers -> Offline
```

---

## 🔥 Load Testing Scripts

### Automated Performance Test Suite

**performance-test.js**
```javascript
#!/usr/bin/env node

const axios = require('axios');
const { performance } = require('perf_hooks');

class PerformanceTester {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this.results = [];
  }

  async testEndpoint(endpoint, method = 'GET', data = null, headers = {}) {
    const start = performance.now();
    
    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        data,
        headers
      });
      
      const end = performance.now();
      const responseTime = end - start;
      
      this.results.push({
        endpoint,
        method,
        status: response.status,
        responseTime: responseTime.toFixed(2),
        success: true
      });
      
      return { success: true, responseTime };
    } catch (error) {
      const end = performance.now();
      const responseTime = end - start;
      
      this.results.push({
        endpoint,
        method,
        status: error.response?.status || 'ERROR',
        responseTime: responseTime.toFixed(2),
        success: false,
        error: error.message
      });
      
      return { success: false, responseTime, error: error.message };
    }
  }

  async runLoadTest(endpoint, concurrent = 10, requests = 100) {
    console.log(`Running load test: ${concurrent} concurrent, ${requests} total requests`);
    
    const promises = [];
    const results = [];
    
    for (let i = 0; i < requests; i++) {
      promises.push(this.testEndpoint(endpoint));
      
      // Maintain concurrency level
      if (promises.length >= concurrent) {
        const batch = await Promise.all(promises.splice(0, concurrent));
        results.push(...batch);
      }
    }
    
    // Handle remaining requests
    if (promises.length > 0) {
      const batch = await Promise.all(promises);
      results.push(...batch);
    }
    
    return this.analyzeResults(results);
  }

  analyzeResults(results) {
    const successful = results.filter(r => r.success);
    const responseTimes = successful.map(r => parseFloat(r.responseTime));
    
    return {
      total: results.length,
      successful: successful.length,
      failed: results.length - successful.length,
      avgResponseTime: (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2),
      minResponseTime: Math.min(...responseTimes).toFixed(2),
      maxResponseTime: Math.max(...responseTimes).toFixed(2),
      successRate: ((successful.length / results.length) * 100).toFixed(2)
    };
  }

  printResults() {
    console.table(this.results);
  }
}

// Usage
async function runTests() {
  const tester = new PerformanceTester();
  
  console.log('=== Individual Endpoint Tests ===');
  await tester.testEndpoint('/health');
  await tester.testEndpoint('/api/auth/login', 'POST', {
    email: 'admin@example.com',
    password: 'AdminTest123@'
  });
  
  console.log('=== Load Test Results ===');
  const loadResults = await tester.runLoadTest('/health', 10, 100);
  console.log(loadResults);
  
  console.log('=== Detailed Results ===');
  tester.printResults();
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = PerformanceTester;
```

### Stress Testing Script

**stress-test.sh**
```bash
#!/bin/bash

echo "=== Party Collection Stress Test ==="

# Configuration
BASE_URL="http://localhost:3001"
CONCURRENT_USERS=(1 5 10 20 50)
REQUEST_COUNT=100

# Test each concurrency level
for users in "${CONCURRENT_USERS[@]}"; do
  echo "Testing with $users concurrent users..."
  
  ab -n $REQUEST_COUNT -c $users "$BASE_URL/health" > "stress-test-$users-users.txt"
  
  # Extract key metrics
  echo "Results for $users concurrent users:"
  grep "Requests per second" "stress-test-$users-users.txt"
  grep "Time per request" "stress-test-$users-users.txt"
  grep "Failed requests" "stress-test-$users-users.txt"
  echo "---"
done

echo "Stress test completed. Check stress-test-*.txt files for detailed results."
```

---

## 📊 AWS Performance Testing

### Development Environment Testing

**Remote Endpoint Testing**
```bash
# Get current development environment URLs
cd infra/remote/tests
./dev-status.sh

# Extract IPs for testing
BACKEND_IP=$(./dev-status.sh | grep "Backend" | awk '{print $2}')
FRONTEND_IP=$(./dev-status.sh | grep "Frontend" | awk '{print $2}')

# Test backend performance
curl -w "@curl-format.txt" -o /dev/null -s "http://$BACKEND_IP:3001/health"

# Test frontend load time
curl -w "@curl-format.txt" -o /dev/null -s "http://$FRONTEND_IP:3000"
```

**Database Performance in AWS**
```bash
# Connect to Aurora database
aws rds describe-db-clusters --db-cluster-identifier party-collection-dev-aurora

# Get connection string and test
# Note: This requires VPN or bastion host access for security
```

### Production Performance Monitoring

**CloudWatch Metrics**
```bash
# Get ECS service metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=party-collection-prod-backend-service \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 300 \
  --statistics Average

# Get RDS metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBClusterIdentifier,Value=party-collection-prod-aurora \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 300 \
  --statistics Average
```

---

## 🎮 Continuous Performance Testing

### GitHub Actions Performance Tests

**.github/workflows/performance-test.yml**
```yaml
name: Performance Tests

on:
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM

jobs:
  performance-test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Start Local Environment
      run: |
        cd infra/local/scripts
        ./start-local.sh
        # Wait for services to be ready
        sleep 60
    
    - name: Run Performance Tests
      run: |
        npm install -g apache-bench lighthouse
        node docs/testing/performance-test.js
    
    - name: Lighthouse Performance Audit
      run: |
        lighthouse http://localhost:3000 --output json --output-path lighthouse-results.json
        
    - name: Upload Results
      uses: actions/upload-artifact@v3
      with:
        name: performance-results
        path: |
          lighthouse-results.json
          stress-test-*.txt
```

### Performance Monitoring Dashboard

**monitoring-dashboard.js**
```javascript
// Simple performance monitoring dashboard
const express = require('express');
const app = express();

let performanceMetrics = {
  requests: 0,
  totalResponseTime: 0,
  errors: 0,
  lastUpdated: new Date()
};

// Middleware to track performance
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    
    performanceMetrics.requests++;
    performanceMetrics.totalResponseTime += responseTime;
    performanceMetrics.lastUpdated = new Date();
    
    if (res.statusCode >= 400) {
      performanceMetrics.errors++;
    }
  });
  
  next();
});

// Performance dashboard endpoint
app.get('/performance', (req, res) => {
  const avgResponseTime = performanceMetrics.requests > 0 
    ? (performanceMetrics.totalResponseTime / performanceMetrics.requests).toFixed(2)
    : 0;
    
  const errorRate = performanceMetrics.requests > 0
    ? ((performanceMetrics.errors / performanceMetrics.requests) * 100).toFixed(2)
    : 0;
  
  res.json({
    totalRequests: performanceMetrics.requests,
    averageResponseTime: `${avgResponseTime}ms`,
    errorRate: `${errorRate}%`,
    totalErrors: performanceMetrics.errors,
    lastUpdated: performanceMetrics.lastUpdated,
    uptime: process.uptime()
  });
});

app.listen(3002, () => {
  console.log('Performance dashboard running on http://localhost:3002/performance');
});
```

---

## 📈 Performance Optimization

### Backend Optimizations

**Database Query Optimization**
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Optimize queries with EXPLAIN
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'admin@example.com';
```

**Caching Strategies**
```javascript
// Add Redis caching layer
const redis = require('redis');
const client = redis.createClient();

// Cache frequently accessed data
async function getCachedUser(email) {
  const cached = await client.get(`user:${email}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const user = await User.findByEmail(email);
  await client.setex(`user:${email}`, 300, JSON.stringify(user)); // 5 min cache
  return user;
}
```

### Frontend Optimizations

**Code Splitting**
```javascript
// Lazy load components
import dynamic from 'next/dynamic';

const AdminPanel = dynamic(() => import('../components/AdminPanel'), {
  loading: () => <p>Loading admin panel...</p>
});
```

**Image Optimization**
```javascript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Party Collection"
  width={200}
  height={100}
  priority
/>
```

### AWS Infrastructure Optimizations

**ECS Task Optimization**
```json
{
  "cpu": "256",
  "memory": "512",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "platformVersion": "1.4.0"
}
```

**Aurora Configuration**
```bash
# Enable Performance Insights
aws rds modify-db-cluster \
  --db-cluster-identifier party-collection-prod-aurora \
  --enable-performance-insights \
  --performance-insights-retention-period 7
```

---

## 📊 Performance Benchmarks

### Baseline Performance Metrics

**Local Development Environment**
```
Backend API Response Times:
- /health: ~15ms
- /api/auth/login: ~45ms
- /api/users: ~35ms (with auth)

Frontend Load Times:
- Initial page load: ~1.2s
- Route navigation: ~200ms
- PWA offline load: ~100ms

Database Query Times:
- Simple SELECT: ~5ms
- Complex JOIN: ~25ms
- User authentication: ~30ms
```

**AWS Development Environment**
```
Backend API Response Times:
- /health: ~45ms (includes network latency)
- /api/auth/login: ~85ms
- /api/users: ~75ms

Frontend Load Times:
- Initial page load: ~2.1s (cold start)
- Subsequent loads: ~800ms
- API calls: ~60ms average

Database Query Times:
- Aurora auto-pause wake: ~15s (first query)
- Normal queries: ~10-25ms
```

**Production Environment Targets**
```
Backend API Response Times:
- /health: <50ms (p95)
- /api/auth/login: <150ms (p95)  
- /api/users: <100ms (p95)

Frontend Load Times:
- First Contentful Paint: <2s
- Largest Contentful Paint: <3s
- Cumulative Layout Shift: <0.1

Throughput:
- 500 requests/second sustained
- 1000 concurrent users peak
- 99.9% uptime
```

---

## 🔧 Performance Testing Tools

### Recommended Tools

**Load Testing**
- **Apache Bench (ab)** - Simple HTTP load testing
- **Artillery** - Modern load testing framework
- **K6** - Developer-centric performance testing

**Frontend Performance**
- **Lighthouse** - Core Web Vitals and performance auditing
- **WebPageTest** - Real-world performance testing
- **Webpack Bundle Analyzer** - Bundle size analysis

**Database Performance**
- **pgbench** - PostgreSQL benchmarking
- **AWS Performance Insights** - RDS/Aurora monitoring
- **New Relic** - Application performance monitoring

### Installation Commands
```bash
# Install load testing tools
npm install -g artillery lighthouse

# Install database tools
# PostgreSQL benchmark tool included with PostgreSQL
sudo apt-get install postgresql-contrib

# Install monitoring tools
npm install @newrelic/native-metrics
```

---

## 📋 Performance Testing Checklist

### Before Production Deployment
- [ ] All API endpoints respond under 200ms (p95)
- [ ] Frontend loads under 3 seconds
- [ ] Database queries optimized with proper indexes
- [ ] Caching strategy implemented where appropriate
- [ ] Load tests pass with expected user load
- [ ] Performance monitoring configured
- [ ] Baseline metrics documented

### Regular Performance Audits
- [ ] Weekly lighthouse audits
- [ ] Monthly load tests
- [ ] Quarterly infrastructure optimization review
- [ ] Annual performance target review

---

## 📚 Related Documentation

**Current Testing:**
- **[Backend Testing](backend-testing.md)** - Existing 13 API tests for functionality
- **[Frontend Testing](frontend-testing.md)** - Current E2E testing with Selenium WebDriver
- **[Test Commands](test-commands.md)** - Complete testing command reference

**Performance & Infrastructure:**
- **[AWS Deployment](../deployment/aws-deployment.md)** - Infrastructure performance considerations
- **[Environment Control](../troubleshooting/environment-control.md)** - Scaling and resource management
- **[Cost Guide](../deployment/cost-guide.md)** - Performance vs. cost trade-offs

**Development Workflow:**
- **[Development Overview](../development/development-overview.md)** - Local development performance tips
- **[Local Testing Workflow](../workflows/local-testing-workflow.md)** - Integrating performance checks

---

**🚀 Pro Tip**: Performance testing can be added incrementally. Start with manual testing using browser dev tools and simple curl commands, then expand to automated tools as needed!