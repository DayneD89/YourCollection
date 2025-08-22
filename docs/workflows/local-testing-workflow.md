# Local Testing Workflow

> **Related**: [Test Commands](../testing/test-commands.md) | [Backend Testing](../testing/backend-testing.md) | [Frontend Testing](../testing/frontend-testing.md)

Comprehensive automated testing workflows for local development, ensuring quality before deployment.

## 🎯 Testing Philosophy

### Test Pyramid Structure
```
        /\
       /  \      E2E Tests (15 scenarios)
      /____\     Integration focus, user journeys
     /      \    
    /  UNIT  \   Unit Tests (13 API tests)
   /  TESTS   \  Fast, isolated, comprehensive
  /__________\
```

### Quality Gates
- **All tests must pass** before commit
- **Coverage targets**: 80% backend, 70% frontend
- **Performance tests** for critical paths
- **Security tests** for authentication flows

---

## 🚀 Quick Testing Commands

### One-Command Test Everything
```bash
# Run all tests across the entire system
node test-runner.js --env=local

# Result: 28 total tests (13 backend + 15 frontend)
# Takes ~3-5 minutes to complete
```

### Individual Component Testing
```bash
# Backend API tests only (fast)
cd backend && npm test

# Frontend E2E tests only (fast subset recommended)
cd frontend && HEADLESS=true PARALLEL=false TAGS="@fast" npm test

# Performance tests
npm run test:performance
```

### Test-Driven Development Flow
```bash
# 1. Start development environment
cd infra/local/scripts && ./start-local.sh

# 2. Run tests in watch mode during development
cd backend && npm run test:watch
cd frontend && npm run test:watch

# 3. Run full test suite before commit
node test-runner.js --env=local --coverage
```

---

## 🔄 Automated Testing Workflows

### Pre-Commit Testing Hook

**setup-git-hooks.sh**
```bash
#!/bin/bash

echo "Setting up Git hooks for automated testing..."

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

echo "🧪 Running pre-commit tests..."

# Check if local environment is running
if ! curl -s http://localhost:3001/health > /dev/null; then
  echo "❌ Local environment not running. Start it first:"
  echo "   cd infra/local/scripts && ./start-local.sh"
  exit 1
fi

# Run quick test suite (critical tests only)
echo "Running critical tests..."
cd backend && npm run test:critical
BACKEND_RESULT=$?

cd ../frontend && npm run test:critical
FRONTEND_RESULT=$?

# Check results
if [ $BACKEND_RESULT -ne 0 ] || [ $FRONTEND_RESULT -ne 0 ]; then
  echo "❌ Critical tests failed. Commit blocked."
  echo "Fix tests before committing or use --no-verify to skip"
  exit 1
fi

echo "✅ Pre-commit tests passed!"
EOF

# Make hook executable
chmod +x .git/hooks/pre-commit

echo "✅ Git hooks configured successfully"
echo "To run tests manually: node test-runner.js --env=local"
```

### Continuous Integration Workflow

**test-workflow.yml** (for GitHub Actions)
```yaml
name: Local Testing Workflow

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  local-tests:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: |
        npm ci --prefix backend
        npm ci --prefix frontend
        
    - name: Start local environment
      run: |
        cd infra/local/scripts
        ./start-local.sh
        
        # Wait for services to be ready
        timeout 300 bash -c 'until curl -s http://localhost:3001/health; do sleep 5; done'
        timeout 300 bash -c 'until curl -s http://localhost:3000; do sleep 5; done'
        
    - name: Run comprehensive test suite
      run: |
        node test-runner.js --env=local --coverage --junit
        
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results
        path: |
          test-results.xml
          coverage/
          
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/lcov.info
```

---

## 🧪 Test Environment Management

### Environment Setup Automation

**test-env-setup.js**
```javascript
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

class TestEnvironmentManager {
  constructor() {
    this.requiredServices = [
      { name: 'PostgreSQL', port: 5432, healthCheck: 'docker exec yourpartycollection-postgres pg_isready -U postgres' },
      { name: 'Backend', port: 3001, healthCheck: 'curl -s http://localhost:3001/health' },
      { name: 'Frontend', port: 3000, healthCheck: 'curl -s http://localhost:3000' }
    ];
  }

  async checkEnvironment() {
    console.log('🔍 Checking test environment...');
    
    for (const service of this.requiredServices) {
      try {
        execSync(service.healthCheck, { stdio: 'pipe' });
        console.log(`✅ ${service.name} is running on port ${service.port}`);
      } catch (error) {
        console.log(`❌ ${service.name} is not responding on port ${service.port}`);
        return false;
      }
    }
    
    return true;
  }

  async setupTestData() {
    console.log('📊 Setting up test data...');
    
    try {
      // Create test users
      const testUsers = [
        { email: 'test1@example.com', password: 'TestPass123@' },
        { email: 'test2@example.com', password: 'TestPass123@' }
      ];
      
      for (const user of testUsers) {
        execSync(`curl -X POST http://localhost:3001/api/auth/register -H "Content-Type: application/json" -d '${JSON.stringify(user)}'`, { stdio: 'pipe' });
      }
      
      console.log('✅ Test data created successfully');
    } catch (error) {
      console.log('⚠️  Test data setup failed, continuing with existing data');
    }
  }

  async runTestSuite(options = {}) {
    const { coverage = false, parallel = false, suite = 'all' } = options;
    
    console.log(`🧪 Running ${suite} test suite...`);
    
    const commands = {
      backend: 'cd backend && npm test',
      frontend: 'cd frontend && HEADLESS=true PARALLEL=false TAGS="@fast" npm test',
      all: 'node test-runner.js --env=local'
    };
    
    if (coverage) {
      commands.backend += ' -- --coverage';
      commands.frontend += ' -- --coverage';
      commands.all += ' --coverage';
    }
    
    try {
      if (suite === 'all') {
        execSync(commands.all, { stdio: 'inherit' });
      } else {
        execSync(commands[suite], { stdio: 'inherit' });
      }
      
      console.log('✅ All tests passed!');
      return true;
    } catch (error) {
      console.log('❌ Tests failed!');
      return false;
    }
  }

  async cleanupTestData() {
    console.log('🧹 Cleaning up test data...');
    
    try {
      // Remove test users (keep admin and default test users)
      execSync(`docker exec yourpartycollection-postgres psql -U postgres -d party_collection -c "DELETE FROM users WHERE email LIKE 'test%@example.com';"`, { stdio: 'pipe' });
      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.log('⚠️  Test data cleanup failed');
    }
  }

  async generateTestReport() {
    console.log('📊 Generating test report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      environment: 'local',
      services: [],
      testResults: {}
    };
    
    // Check service status
    for (const service of this.requiredServices) {
      try {
        execSync(service.healthCheck, { stdio: 'pipe' });
        report.services.push({ name: service.name, status: 'healthy' });
      } catch (error) {
        report.services.push({ name: service.name, status: 'unhealthy' });
      }
    }
    
    // Save report
    fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
    console.log('✅ Test report saved to test-report.json');
  }
}

// CLI usage
if (require.main === module) {
  const manager = new TestEnvironmentManager();
  
  async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'run';
    
    switch (command) {
      case 'check':
        await manager.checkEnvironment();
        break;
      case 'setup':
        await manager.setupTestData();
        break;
      case 'run':
        const envReady = await manager.checkEnvironment();
        if (!envReady) {
          console.log('Environment not ready. Run: cd infra/local/scripts && ./start-local.sh');
          process.exit(1);
        }
        await manager.setupTestData();
        const success = await manager.runTestSuite({ coverage: args.includes('--coverage') });
        await manager.cleanupTestData();
        await manager.generateTestReport();
        process.exit(success ? 0 : 1);
        break;
      case 'cleanup':
        await manager.cleanupTestData();
        break;
      case 'report':
        await manager.generateTestReport();
        break;
      default:
        console.log('Usage: node test-env-setup.js [check|setup|run|cleanup|report]');
    }
  }
  
  main().catch(console.error);
}

module.exports = TestEnvironmentManager;
```

---

## 🔧 Test Configuration Management

### Dynamic Test Configuration

**test-config.js**
```javascript
const config = {
  environments: {
    local: {
      backend: {
        url: 'http://localhost:3001',
        timeout: 5000,
        retries: 3
      },
      frontend: {
        url: 'http://localhost:3000',
        timeout: 30000,
        headless: true
      },
      database: {
        host: 'localhost',
        port: 5432,
        database: 'party_collection'
      }
    },
    ci: {
      backend: {
        url: 'http://localhost:3001',
        timeout: 10000,
        retries: 5
      },
      frontend: {
        url: 'http://localhost:3000',
        timeout: 60000,
        headless: true
      }
    }
  },
  
  testSuites: {
    smoke: {
      backend: ['health', 'auth'],
      frontend: ['login', 'dashboard'],
      parallel: true,
      timeout: 60000
    },
    critical: {
      backend: ['auth', 'users', 'security'],
      frontend: ['login', 'admin', 'data-management'],
      parallel: false,
      timeout: 180000
    },
    full: {
      backend: 'all',
      frontend: 'all',
      parallel: true,
      timeout: 300000
    }
  },
  
  coverage: {
    threshold: {
      backend: 80,
      frontend: 70
    },
    reports: ['text', 'html', 'lcov']
  }
};

module.exports = config;
```

### Test Data Management

**test-data-manager.js**
```javascript
class TestDataManager {
  constructor() {
    this.testUsers = [
      { email: 'admin@example.com', password: 'AdminTest123@', role: 'admin' },
      { email: 'user@example.com', password: 'UserPass123@', role: 'user' },
      { email: 'testuser@example.com', password: 'testuser', role: 'user' }
    ];
  }

  async resetToCleanState() {
    console.log('🔄 Resetting database to clean state...');
    
    try {
      // Stop and restart with clean database
      const { execSync } = require('child_process');
      execSync('cd infra/local/scripts && ./stop-local.sh --clean && ./start-local.sh', { stdio: 'pipe' });
      
      // Wait for services to be ready
      await this.waitForServices();
      
      console.log('✅ Database reset complete');
    } catch (error) {
      console.error('❌ Database reset failed:', error.message);
      throw error;
    }
  }

  async waitForServices(timeout = 60000) {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      try {
        const { execSync } = require('child_process');
        execSync('curl -s http://localhost:3001/health', { stdio: 'pipe' });
        execSync('curl -s http://localhost:3000', { stdio: 'pipe' });
        return;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw new Error('Services did not start within timeout');
  }

  async createTestUser(email, password, role = 'user') {
    const axios = require('axios');
    
    try {
      await axios.post('http://localhost:3001/api/auth/register', {
        email,
        password,
        role
      });
      
      console.log(`✅ Test user created: ${email}`);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`⚠️  Test user already exists: ${email}`);
      } else {
        throw error;
      }
    }
  }

  async loginAsUser(email, password) {
    const axios = require('axios');
    
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email,
      password
    });
    
    return response.data.token;
  }

  async cleanupTestUsers() {
    console.log('🧹 Cleaning up temporary test users...');
    
    try {
      const { execSync } = require('child_process');
      execSync(`docker exec yourpartycollection-postgres psql -U postgres -d party_collection -c "DELETE FROM users WHERE email LIKE 'temp-test-%';"`, { stdio: 'pipe' });
    } catch (error) {
      console.log('⚠️  Test user cleanup failed');
    }
  }
}

module.exports = TestDataManager;
```

---

## 📊 Test Reporting & Analytics

### Automated Test Reports

**test-reporter.js**
```javascript
class TestReporter {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      environment: 'local',
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0
      },
      suites: [],
      coverage: {},
      performance: {}
    };
  }

  addSuiteResult(suite, results) {
    this.results.suites.push({
      name: suite,
      ...results,
      timestamp: new Date().toISOString()
    });
    
    this.results.summary.total += results.total || 0;
    this.results.summary.passed += results.passed || 0;
    this.results.summary.failed += results.failed || 0;
    this.results.summary.skipped += results.skipped || 0;
    this.results.summary.duration += results.duration || 0;
  }

  generateHTMLReport() {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Report - Party Collection</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .suite { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <h1>Test Report - Party Collection</h1>
      <p><strong>Generated:</strong> ${this.results.timestamp}</p>
      <p><strong>Environment:</strong> ${this.results.environment}</p>
      
      <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Tests:</strong> ${this.results.summary.total}</p>
        <p><strong class="passed">Passed:</strong> ${this.results.summary.passed}</p>
        <p><strong class="failed">Failed:</strong> ${this.results.summary.failed}</p>
        <p><strong>Duration:</strong> ${(this.results.summary.duration / 1000).toFixed(2)}s</p>
        <p><strong>Success Rate:</strong> ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(2)}%</p>
      </div>
      
      <h2>Test Suites</h2>
      ${this.results.suites.map(suite => `
        <div class="suite">
          <h3>${suite.name}</h3>
          <p><strong>Status:</strong> <span class="${suite.failed > 0 ? 'failed' : 'passed'}">${suite.failed > 0 ? 'FAILED' : 'PASSED'}</span></p>
          <p><strong>Tests:</strong> ${suite.total} total, ${suite.passed} passed, ${suite.failed} failed</p>
          <p><strong>Duration:</strong> ${(suite.duration / 1000).toFixed(2)}s</p>
        </div>
      `).join('')}
      
    </body>
    </html>
    `;
    
    require('fs').writeFileSync('test-report.html', html);
    console.log('📊 HTML report generated: test-report.html');
  }

  generateJUnitXML() {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <testsuites tests="${this.results.summary.total}" failures="${this.results.summary.failed}" time="${this.results.summary.duration / 1000}">
      ${this.results.suites.map(suite => `
        <testsuite name="${suite.name}" tests="${suite.total}" failures="${suite.failed}" time="${suite.duration / 1000}">
          <!-- Test cases would be added here -->
        </testsuite>
      `).join('')}
    </testsuites>`;
    
    require('fs').writeFileSync('test-results.xml', xml);
    console.log('📊 JUnit XML report generated: test-results.xml');
  }
}

module.exports = TestReporter;
```

---

## 🎮 Interactive Testing Tools

### Test Runner with Interactive Menu

**interactive-test-runner.js**
```javascript
#!/usr/bin/env node

const readline = require('readline');
const TestEnvironmentManager = require('./test-env-setup');
const TestReporter = require('./test-reporter');

class InteractiveTestRunner {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.envManager = new TestEnvironmentManager();
    this.reporter = new TestReporter();
  }

  showMenu() {
    console.log('\n🧪 Party Collection Test Runner');
    console.log('================================');
    console.log('1. Check environment status');
    console.log('2. Run smoke tests (quick)');
    console.log('3. Run critical tests');
    console.log('4. Run full test suite');
    console.log('5. Run specific test suite');
    console.log('6. Reset test environment');
    console.log('7. Generate test report');
    console.log('8. Exit');
    console.log('');
  }

  async promptUser(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  async handleChoice(choice) {
    switch (choice) {
      case '1':
        await this.envManager.checkEnvironment();
        break;
      case '2':
        await this.envManager.runTestSuite({ suite: 'smoke' });
        break;
      case '3':
        await this.envManager.runTestSuite({ suite: 'critical' });
        break;
      case '4':
        await this.envManager.runTestSuite({ suite: 'all', coverage: true });
        break;
      case '5':
        const suite = await this.promptUser('Enter test suite (backend/frontend/smoke/critical): ');
        await this.envManager.runTestSuite({ suite });
        break;
      case '6':
        console.log('⚠️  This will reset all test data. Continue? (y/N)');
        const confirm = await this.promptUser('');
        if (confirm.toLowerCase() === 'y') {
          await this.envManager.cleanupTestData();
          await this.envManager.setupTestData();
        }
        break;
      case '7':
        await this.envManager.generateTestReport();
        this.reporter.generateHTMLReport();
        break;
      case '8':
        console.log('👋 Goodbye!');
        this.rl.close();
        return false;
      default:
        console.log('Invalid choice. Please try again.');
    }
    return true;
  }

  async run() {
    let running = true;
    
    while (running) {
      this.showMenu();
      const choice = await this.promptUser('Choose an option (1-8): ');
      running = await this.handleChoice(choice);
    }
  }
}

if (require.main === module) {
  const runner = new InteractiveTestRunner();
  runner.run().catch(console.error);
}
```

---

## 📋 Testing Best Practices

### Test Organization
- **Group related tests** in describe blocks
- **Use meaningful test names** that describe behavior
- **Keep tests independent** - each test should work in isolation
- **Clean up after tests** - restore initial state

### Test Data Strategy
- **Use factory functions** for creating test data
- **Isolate test data** - each test uses its own data
- **Clean slate principle** - start each test with known state
- **Avoid test interdependencies** - tests shouldn't rely on each other

### Performance Testing
- **Set realistic targets** based on user expectations
- **Test with realistic data** volumes
- **Monitor trends** - track performance over time
- **Test edge cases** - maximum load, minimum resources

### Debugging Failed Tests
```bash
# Run single test with debug output
cd backend && npm test -- --testNamePattern="auth login"

# Run frontend tests with browser visible
cd frontend && HEADLESS=false DEBUG=true PARALLEL=false TAGS="@tagname" npm test

# Check logs for failures
tail -f infra/local/.pids/backend.log
tail -f infra/local/.pids/frontend.log
```

---

## 🔗 Integration with Development Workflow

### VS Code Integration

**.vscode/tasks.json**
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Run All Tests",
      "type": "shell",
      "command": "node test-runner.js --env=local",
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "Run Backend Tests",
      "type": "shell",
      "command": "npm test",
      "options": {
        "cwd": "${workspaceFolder}/backend"
      },
      "group": "test"
    }
  ]
}
```

### Package.json Scripts
```json
{
  "scripts": {
    "test": "node test-runner.js --env=local",
    "test:quick": "node test-runner.js --env=local --suite=smoke",
    "test:watch": "nodemon --exec 'HEADLESS=true PARALLEL=false TAGS=@fast npm test' --watch backend --watch frontend",
    "test:coverage": "node test-runner.js --env=local --coverage",
    "test:debug": "node --inspect test-runner.js --env=local"
  }
}
```

---

**🎯 Remember**: Good tests are your safety net. They give you confidence to refactor, deploy, and iterate quickly while maintaining quality!