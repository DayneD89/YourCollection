# Test Architecture Guide

## Overview

This guide documents the refactored test architecture implemented to improve code organization, reliability, and maintainability. The architecture consists of several abstraction layers that work together to provide robust test execution.

## Core Components

### WebDriverFactory

**Location**: `test/support/core/WebDriverFactory.js`

The WebDriverFactory provides centralized WebDriver creation with configurable options and automatic retry logic.

#### Key Features:
- **Programmatic Configuration Override**: Options parameter takes precedence over environment variables
- **Environment Variable Fallbacks**: Supports `HEADLESS` and `DEBUG` environment variables
- **Automatic Retry Logic**: Creates drivers with configurable retry attempts and random delays
- **Parallel Execution Support**: Built-in session identification and cleanup

#### Usage Patterns:

```javascript
// Basic usage with environment variables
const driver = await WebDriverFactory.createDriver();

// Override environment with programmatic options
const driver = await WebDriverFactory.createDriver({
  headless: true,      // Force headless regardless of HEADLESS env var
  debug: false,        // Force no debug regardless of DEBUG env var
  maxRetries: 5        // Custom retry count
});

// Additional Chrome arguments
const driver = await WebDriverFactory.createDriver({
  additionalArgs: ['--custom-flag', '--another-option']
});

// Always clean up properly
await WebDriverFactory.cleanupDriver(driver);
```

#### Configuration Priority:
1. **Options Parameter** (highest priority)
2. **Environment Variables** (fallback)
3. **Defaults** (lowest priority)

### CommonSteps

**Location**: `test/step-definitions/CommonSteps.js`

CommonSteps provides shared step functionality with proper lifecycle management and initialization guards.

#### Key Features:
- **Single Initialization Per Scenario**: Guards against double initialization
- **Driver Instance Comparison**: Prevents conflicts in parallel execution  
- **Per-Scenario Instances**: Each scenario gets its own CommonSteps instance
- **Automatic Cleanup**: Proper reset between scenarios

#### Usage Patterns:

```javascript
const { commonSteps } = require('./CommonSteps');

// In step definition files - initialize once per scenario
Given('I am logged in as {string} with password {string}', async function(email, password) {
    // This will only initialize once, subsequent calls are ignored
    commonSteps.initializeForScenario(this);
    await commonSteps.performStandardLogin(email, password);
});

// Access shared functionality
await commonSteps.waitForPageTransition('dashboard');
await commonSteps.pages.login.enterEmail('test@example.com');
```

#### Lifecycle Management:
1. **Initialization**: `initializeForScenario(context)` - called once per scenario
2. **Usage**: Access `pages` and `stepUtils` properties
3. **Cleanup**: Automatic reset between scenarios via hooks

### BasePage

**Location**: `test/support/page-objects/BasePage.js`

BasePage provides common page object functionality with proper inheritance support.

#### Key Features:
- **Selector Management**: Centralized selector definition and fallback handling
- **Timing Integration**: Built-in access to timing utilities
- **Context Passing**: Scenario context available to all page objects
- **Safe Initialization**: Handles constructor dependency order correctly

#### Usage Patterns:

```javascript
// Extending BasePage
class LoginPage extends BasePage {
    constructor(driver, context = {}) {
        super(driver, context);
    }
    
    getUrl() {
        return 'http://localhost:3000/login';
    }
    
    getSelectors() {
        return {
            emailField: [
                'input[type="email"]',
                'input[autocomplete="username"]',
                'input[name="email"]'
            ]
        };
    }
    
    async enterEmail(email) {
        const element = await this.findElement(this.selectors.emailField);
        await element.clear();
        await element.sendKeys(email);
    }
}
```

### StepUtilities

**Location**: `test/support/core/StepUtilities.js`

StepUtilities provides enhanced timing, element finding, and environment-aware configuration.

#### Key Features:
- **Environment-Aware Timeouts**: Automatic scaling for CI and parallel execution
- **Smart Retry Logic**: Exponential backoff for timeouts, linear for other errors
- **Enhanced Selector Monitoring**: Performance tracking and statistics
- **Context Integration**: Access to scenario information for logging

#### Usage Patterns:

```javascript
// Accessing through CommonSteps
await commonSteps.stepUtils.timing.waitForPageLoad([
    { selector: 'input[type="email"]', text: null }
]);

// Custom retry operations
await commonSteps.stepUtils.timing.retryOperation(async () => {
    const element = await driver.findElement(By.css('.dynamic-element'));
    return await element.getText();
});
```

## Integration Patterns

### Step Definition Integration

**Recommended Pattern**:
```javascript
const { commonSteps } = require('./CommonSteps');

Given('some step', async function() {
    // 1. Initialize once per scenario
    commonSteps.initializeForScenario(this);
    
    // 2. Use shared functionality
    await commonSteps.pages.login.navigateTo();
    
    // 3. Access utilities as needed
    await commonSteps.stepUtils.timing.sleep(1000);
});
```

### Page Object Integration

**Constructor Pattern**:
```javascript
class MyPage extends BasePage {
    constructor(driver, context = {}) {
        // Call super first - handles initialization order
        super(driver, context);
    }
    
    getSelectors() {
        // Define selectors with fallback priority
        return {
            primaryButton: [
                'button[data-testid="primary"]',  // Most specific
                'button.btn-primary',             // Class-based
                'button[type="submit"]'           // Generic fallback
            ]
        };
    }
}
```

### Timing and Environment Configuration

**Environment Detection**:
- **CI Environment**: 1.5x timeout multiplier
- **Parallel Execution**: Additional 1.3x multiplier  
- **Local Development**: Base timeouts

**Timeout Values**:
- Default: 8000ms (improved from original 10000ms)
- Short: 2500ms (improved from original 3000ms)
- Long: 25000ms (improved from original 30000ms)

## Best Practices

### WebDriver Management
- Always use `WebDriverFactory.createDriver()` for driver creation
- Always call `WebDriverFactory.cleanupDriver()` in cleanup hooks
- Use programmatic options for test-specific configuration
- Rely on environment variables for global defaults

### Initialization Management
- Call `commonSteps.initializeForScenario(this)` once per scenario
- Access page objects through `commonSteps.pages`
- Don't create duplicate CommonSteps instances
- Trust the initialization guard to prevent double initialization

### Selector Strategy
- Use generic selectors first (more reliable)
- Include specific selectors as fallbacks
- Monitor selector performance through built-in logging
- Update selector priority based on success rates

### Error Handling
- Use `stepUtils.timing.retryOperation()` for flaky operations
- Implement proper timeout scaling for different environments
- Log detailed information for debugging failures
- Provide graceful fallbacks where possible

## Migration Guidelines

### From Legacy Page Objects
1. Extend `BasePage` instead of custom base classes
2. Implement `getUrl()` and `getSelectors()` methods
3. Remove manual WebDriver management code
4. Update constructor to call `super(driver, context)`

### From Direct WebDriver Usage
1. Replace `new Builder()` with `WebDriverFactory.createDriver()`
2. Use `commonSteps.pages.*` instead of direct page object instantiation
3. Replace manual timing with `stepUtils.timing` methods
4. Remove custom retry logic in favor of built-in utilities

## Performance Considerations

### Timeout Optimization
- Base timeouts improved 17-20% over original values
- Automatic environment detection prevents timeout failures
- Smart retry logic reduces flakiness without extending total execution time

### Parallel Execution
- WebDriverFactory handles session contention automatically
- CommonSteps prevents initialization conflicts
- Per-scenario isolation prevents state bleeding

### Resource Management
- Proper driver cleanup prevents memory leaks
- Initialization guards prevent duplicate resource allocation
- Environment-aware scaling optimizes for execution context

## Troubleshooting Integration

See the [Common Issues Guide](../troubleshooting/common-issues.md) for detailed troubleshooting guidance, including specific sections on the refactored test architecture, WebDriver session management, and current test tagging system.