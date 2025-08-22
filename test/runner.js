#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const { readConfig } = require('./config-reader');

// Multi-environment support
const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith('--env='));
const environment = envArg ? envArg.split('=')[1] : 'local';

// Environment-specific configurations
function getEnvironmentConfig(env) {
    // Read admin credentials from config file
    const config = readConfig();
    
    const configs = {
        local: {
            timeout: '60000',
            apiUrl: 'http://localhost:3001',
            adminEmail: config.admin.email,
            adminPassword: config.admin.password
        },
        dev: {
            timeout: '120000',
            apiUrl: process.env.DEV_API_URL || 'http://dev-backend-ip:3001',
            adminEmail: config.admin.email,
            adminPassword: config.admin.password
        },
        development: {
            timeout: '120000',
            apiUrl: process.env.DEV_API_URL || 'http://dev-backend-ip:3001',
            adminEmail: config.admin.email,
            adminPassword: config.admin.password
        },
        prod: {
            timeout: '180000',
            tags: '@smoke', // Only run smoke tests in production
            apiUrl: process.env.PROD_API_URL || 'https://api.party-collection.com',
            adminEmail: config.admin.email,
            adminPassword: config.admin.password
        },
        production: {
            timeout: '180000',
            tags: '@smoke', // Only run smoke tests in production
            apiUrl: process.env.PROD_API_URL || 'https://api.party-collection.com',
            adminEmail: config.admin.email,
            adminPassword: config.admin.password
        }
    };
    return configs[env] || configs.local;
}

// Tag validation for new structured hierarchy
function validateTags(tagString) {
    const validationMessages = [];
    
    // Check for deprecated tags
    if (tagString.includes('@quick')) {
        validationMessages.push('⚠️  @quick is deprecated. Use @fast instead.');
    }
    if (tagString.includes('@parallel-safe')) {
        validationMessages.push('⚠️  @parallel-safe is deprecated. Use @parallel instead.');
    }
    if (tagString.includes('@comprehensive')) {
        validationMessages.push('⚠️  @comprehensive is deprecated. Use @extended instead.');
    }
    if (tagString.includes('@login') || tagString.includes('@auth-login')) {
        validationMessages.push('ℹ️  @login and @auth-login are deprecated. Use @auth instead.');
    }
    if (tagString.includes('@authentication')) {
        validationMessages.push('ℹ️  @authentication is deprecated. Use @auth instead.');
    }
    if (tagString.includes('@form-') || tagString.includes('@survey-fields')) {
        validationMessages.push('ℹ️  @form-* and @survey-* tags are deprecated. Use @survey instead.');
    }
    
    // Check for proper hierarchy usage (only if not using complex expressions)
    const isComplexExpression = tagString.includes('AND') || tagString.includes('OR') || tagString.includes('NOT');
    if (!isComplexExpression) {
        const hasExecutionCategory = ['@smoke', '@core', '@extended', '@full'].some(tag => tagString.includes(tag));
        if (!hasExecutionCategory) {
            validationMessages.push('ℹ️  Consider adding an execution category tag (@smoke, @core, @extended, @full).');
        }
        
        const hasParallelAttribute = ['@parallel', '@sequential'].some(tag => tagString.includes(tag));
        if (!hasParallelAttribute) {
            validationMessages.push('ℹ️  Consider adding a parallel execution tag (@parallel or @sequential).');
        }
        
        const hasSpeedAttribute = ['@fast', '@slow'].some(tag => tagString.includes(tag));
        if (!hasSpeedAttribute) {
            validationMessages.push('ℹ️  Consider adding a speed attribute tag (@fast or @slow).');
        }
    }
    
    return validationMessages;
}

// Auto-detect optimal parallel configuration based on CPU cores and test complexity
function getOptimalParallelConfig() {
    const cpuCores = require('os').cpus().length;
    const parallel = process.env.PARALLEL;
    
    if (parallel === 'false') return 1;
    if (parallel && !isNaN(parseInt(parallel))) return parseInt(parallel);
    
    const tags = process.env.TAGS || '';
    
    // Force single process for sequential tests (highest priority)
    if (tags.includes('@sequential')) {
        return 1;
    }
    
    // For smoke tests with parallel execution, use maximum parallelization
    if (tags.includes('@smoke') && tags.includes('@parallel')) {
        return Math.min(cpuCores, 8); // Cap at 8 for smoke tests
    }
    
    // For core tests with parallel execution, use moderate parallelization
    if (tags.includes('@core') && tags.includes('@parallel')) {
        return Math.min(Math.floor(cpuCores * 0.75), 6);
    }
    
    // For extended tests, use conservative parallelization
    if (tags.includes('@extended')) {
        return tags.includes('@parallel') ? Math.min(Math.floor(cpuCores * 0.5), 4) : 1;
    }
    
    // For fast parallel tests, use aggressive parallelization
    if (tags.includes('@fast') && tags.includes('@parallel')) {
        return Math.min(cpuCores, 8);
    }
    
    // For slow tests, use minimal parallelization or sequential
    if (tags.includes('@slow')) {
        return tags.includes('@parallel') ? 2 : 1;
    }
    
    // Default: Use 50% of available cores, max 6 for balanced performance
    return Math.min(Math.floor(cpuCores * 0.5), 6);
}

// Apply environment configuration
const envConfig = getEnvironmentConfig(environment);

// Set environment variables for tests
process.env.TEST_ENV = environment;
process.env.NODE_ENV = environment === 'local' ? 'development' : environment;
process.env.NEXT_PUBLIC_API_URL = envConfig.apiUrl;
process.env.ADMIN_EMAIL = envConfig.adminEmail;
process.env.ADMIN_PASSWORD = envConfig.adminPassword;

// Configuration
const config = {
    headless: process.env.HEADLESS !== 'false',
    debug: process.env.DEBUG === 'true',
    parallel: getOptimalParallelConfig(),
    tags: process.env.TAGS || envConfig.tags || '',
    format: process.env.FORMAT || 'progress',
    timeout: process.env.TIMEOUT || envConfig.timeout
};

function printConfig() {
    console.log(`🧪 Party Collection E2E Test Runner - ${environment.toUpperCase()} Environment`);
    console.log('========================================================');
    console.log(`Environment: ${environment}`);
    console.log(`API URL: ${envConfig.apiUrl}`);
    console.log(`Headless: ${config.headless}`);
    console.log(`Debug: ${config.debug}`);
    console.log(`Parallel: ${config.parallel > 1 ? `Yes (${config.parallel} processes)` : 'No'}`);
    console.log(`Timeout: ${config.timeout}ms`);
    console.log(`Tags: ${config.tags || 'All tests'}`);
    console.log(`Format: ${config.format}`);
    
    // Show estimated execution time based on tag selection
    if (config.tags) {
        let estimatedTime = 'Unknown';
        if (config.tags.includes('@smoke')) estimatedTime = '2-3 minutes';
        else if (config.tags.includes('@core')) estimatedTime = '5-8 minutes';
        else if (config.tags.includes('@extended')) estimatedTime = '12-18 minutes';
        else if (config.tags.includes('@full')) estimatedTime = '20-25 minutes';
        console.log(`Estimated Time: ${estimatedTime}`);
    }
    
    console.log('========================================================');
    
    // Validate tags and show helpful messages
    if (config.tags) {
        const validationMessages = validateTags(config.tags);
        if (validationMessages.length > 0) {
            console.log('\n📋 Tag Guidance:');
            validationMessages.forEach(msg => console.log(`  ${msg}`));
        }
        
        // Show quick examples for common test suites
        console.log('\n💡 Quick Test Suite Examples:');
        console.log('  Lightning fast: TAGS="@smoke and @parallel and @fast" npm test');
        console.log('  Core features:  TAGS="@core and @parallel" npm test');
        console.log('  Auth testing:   TAGS="@auth and (@fast or @core)" npm test');
        console.log('  Full regression: TAGS="@full" npm test');
    }
    console.log('');
}

function buildCucumberArgs() {
    const args = [
        '--require', 'test/support/world.js',
        '--require', 'test/support/hooks.js',
        '--require', 'test/step-definitions/simple-steps.js',
        '--require', 'test/step-definitions/survey-steps.js',
        '--require', 'test/step-definitions/form-component-steps.js',
        '--require', 'test/step-definitions/security-and-navigation-steps.js',
        '--require', 'test/step-definitions/login-steps.js',
        '--require', 'test/step-definitions/backend-steps.js',
        '--format', config.format,
        '--format-options', '{"snippetInterface": "async-await"}',
        '--exit'
    ];

    // Add parallel execution if enabled
    // For mixed mode, let the optimal config handle it based on tags
    if (config.parallel > 1) {
        args.push('--parallel', config.parallel.toString());
    }

    // Add tags if specified
    if (config.tags) {
        args.push('--tags', config.tags);
    }

    // Add feature files
    args.push('features/**/*.feature');

    return args;
}

async function runTests() {
    printConfig();

    const cucumberBinary = path.resolve(__dirname, 'node_modules/.bin/cucumber-js');
    const args = buildCucumberArgs();

    console.log('🚀 Starting Cucumber tests...\n');
    
    if (config.debug) {
        console.log(`Command: ${cucumberBinary} ${args.join(' ')}\n`);
    }

    const cucumber = spawn(cucumberBinary, args, {
        stdio: 'inherit',
        env: {
            ...process.env,
            HEADLESS: config.headless.toString(),
            DEBUG: config.debug.toString()
        }
    });

    cucumber.on('close', (code) => {
        if (code === 0) {
            console.log('\n✅ All tests passed!');
        } else {
            console.log(`\n❌ Tests failed with exit code: ${code}`);
        }
        process.exit(code);
    });

    cucumber.on('error', (error) => {
        console.error('❌ Failed to start test runner:', error);
        process.exit(1);
    });
}

// Handle process signals
process.on('SIGINT', () => {
    console.log('\n🛑 Test execution interrupted');
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Test execution terminated');
    process.exit(1);
});

// Production safety check
if (environment === 'production' || environment === 'prod') {
    console.log('🚨 WARNING: You are about to run tests against PRODUCTION environment!');
    console.log('This should only be done with extreme caution and limited test scenarios.');
    console.log('');
    
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.question('Type "CONFIRM_PROD_TESTING" to continue: ', (answer) => {
        rl.close();
        if (answer === 'CONFIRM_PROD_TESTING') {
            runTests().catch((error) => {
                console.error('❌ Unexpected error:', error);
                process.exit(1);
            });
        } else {
            console.log('Production testing cancelled.');
            process.exit(0);
        }
    });
} else {
    // Run the tests
    runTests().catch((error) => {
        console.error('❌ Unexpected error:', error);
        process.exit(1);
    });
}