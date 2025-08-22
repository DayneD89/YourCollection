#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');
const os = require('os');

// Promisify exec for async/await usage
const execAsync = util.promisify(exec);

class ComprehensiveTestRunner {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '../..');
        this.infraDir = path.join(this.projectRoot, 'infra/local');
        this.backendDir = path.join(this.projectRoot, 'backend');
        this.webappDir = path.join(this.projectRoot, 'frontend');
        this.cpuCores = os.cpus().length;
        
        this.config = {
            serviceStartupTimeout: 60000, // 60 seconds
            testTimeout: 300000, // 5 minutes
            healthCheckInterval: 2000, // 2 seconds
        };
        
        this.testResults = {
            backend: null,
            frontend: null,
            startTime: null,
            endTime: null
        };
    }

    getOptimalParallelConfig() {
        // Use 60% of available cores for comprehensive testing, max 8
        return Math.min(Math.floor(this.cpuCores * 0.6), 8);
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            info: '📋',
            success: '✅',
            error: '❌',
            warning: '⚠️',
            debug: '🔍'
        }[type] || '📋';
        
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async executeCommand(command, cwd = null, description = null) {
        if (description) {
            this.log(`Executing: ${description}`);
        }
        
        this.log(`Running: ${command}${cwd ? ` (in ${cwd})` : ''}`, 'debug');
        
        try {
            const { stdout, stderr } = await execAsync(command, { 
                cwd: cwd || process.cwd(),
                timeout: this.config.testTimeout
            });
            
            if (stderr && !stderr.includes('npm warn')) {
                this.log(`Command stderr: ${stderr}`, 'warning');
            }
            
            return { success: true, stdout, stderr };
        } catch (error) {
            this.log(`Command failed: ${error.message}`, 'error');
            return { success: false, error: error.message, stdout: error.stdout, stderr: error.stderr };
        }
    }

    async checkDirectoryExists(dirPath, description) {
        if (!fs.existsSync(dirPath)) {
            this.log(`Directory not found: ${dirPath} (${description})`, 'error');
            return false;
        }
        this.log(`Directory found: ${description}`, 'success');
        return true;
    }

    async stopServices() {
        this.log('🛑 Stopping all services...');
        
        const stopScriptPath = path.join(this.infraDir, 'scripts/stop-local.sh');
        if (!fs.existsSync(stopScriptPath)) {
            this.log('Stop script not found, attempting manual cleanup', 'warning');
            return true;
        }
        
        const result = await this.executeCommand(
            `bash ${stopScriptPath} --clean`, 
            this.infraDir,
            'Stop services with clean flag'
        );
        
        if (result.success) {
            this.log('Services stopped successfully', 'success');
            // Give extra time for cleanup
            await this.sleep(3000);
            return true;
        } else {
            this.log('Failed to stop services cleanly', 'warning');
            return false;
        }
    }

    async startServices() {
        this.log('🚀 Starting services cleanly...');
        
        const startScriptPath = path.join(this.infraDir, 'scripts/start-local.sh');
        if (!fs.existsSync(startScriptPath)) {
            this.log('Start script not found', 'error');
            return false;
        }
        
        const result = await this.executeCommand(
            `bash ${startScriptPath}`, 
            this.infraDir,
            'Start all services'
        );
        
        if (result.success) {
            this.log('Services started, waiting for readiness...', 'success');
            return await this.waitForServicesReady();
        } else {
            this.log('Failed to start services', 'error');
            return false;
        }
    }

    async waitForServicesReady() {
        this.log('⏳ Waiting for services to be ready...');
        
        const maxAttempts = Math.floor(this.config.serviceStartupTimeout / this.config.healthCheckInterval);
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            attempts++;
            
            // Check backend health
            try {
                const backendResult = await execAsync('curl -f http://localhost:3001/health || echo "Backend not ready"', { timeout: 5000 });
                const frontendResult = await execAsync('curl -f http://localhost:3000 || echo "Frontend not ready"', { timeout: 5000 });
                
                const backendReady = !backendResult.stdout.includes('not ready') && !backendResult.stdout.includes('curl:');
                const frontendReady = !frontendResult.stdout.includes('not ready') && !frontendResult.stdout.includes('curl:');
                
                if (backendReady && frontendReady) {
                    this.log('All services are ready!', 'success');
                    return true;
                }
                
                this.log(`Attempt ${attempts}/${maxAttempts}: Backend ${backendReady ? '✅' : '❌'}, Frontend ${frontendReady ? '✅' : '❌'}`);
                
            } catch (error) {
                this.log(`Health check attempt ${attempts}/${maxAttempts} failed`);
            }
            
            if (attempts < maxAttempts) {
                await this.sleep(this.config.healthCheckInterval);
            }
        }
        
        this.log('Services did not become ready within timeout', 'error');
        return false;
    }

    async runBackendTests() {
        this.log('🔧 Running backend tests...');
        
        if (!await this.checkDirectoryExists(this.backendDir, 'Backend directory')) {
            return false;
        }
        
        const result = await this.executeCommand(
            'npm test', 
            this.backendDir,
            'Execute backend test suite'
        );
        
        this.testResults.backend = {
            success: result.success,
            output: result.stdout,
            error: result.error
        };
        
        if (result.success) {
            this.log('Backend tests passed!', 'success');
            return true;
        } else {
            this.log('Backend tests failed', 'error');
            if (result.stdout) {
                console.log('Backend test output:');
                console.log(result.stdout);
            }
            return false;
        }
    }

    async runFrontendTests() {
        this.log('🌐 Running frontend E2E tests with optimized parallel execution...');
        
        if (!await this.checkDirectoryExists(this.webappDir, 'Webapp directory')) {
            return false;
        }
        
        const parallelWorkers = this.getOptimalParallelConfig();
        this.log(`Using ${parallelWorkers} parallel workers (${this.cpuCores} CPU cores available)`);
        
        // Run tests using the enhanced runner with multi-environment support
        const result = await this.executeCommand(
            `HEADLESS=true PARALLEL=${parallelWorkers} npm test -- --env=local`, 
            this.webappDir,
            `Execute frontend E2E test suite with ${parallelWorkers} parallel workers`
        );
        
        this.testResults.frontend = {
            success: result.success,
            output: result.stdout,
            error: result.error
        };
        
        if (result.success) {
            this.log('Frontend tests passed!', 'success');
            return true;
        } else {
            this.log('Frontend tests failed', 'error');
            if (result.stdout) {
                console.log('Frontend test output:');
                console.log(result.stdout);
            }
            if (result.stderr) {
                console.log('Frontend test errors:');
                console.log(result.stderr);
            }
            return false;
        }
    }

    generateReport() {
        const duration = this.testResults.endTime - this.testResults.startTime;
        const durationMinutes = Math.floor(duration / 60000);
        const durationSeconds = Math.floor((duration % 60000) / 1000);
        
        console.log('\n' + '='.repeat(60));
        console.log('🧪 COMPREHENSIVE TEST RESULTS');
        console.log('='.repeat(60));
        console.log(`⏱️  Total Duration: ${durationMinutes}m ${durationSeconds}s`);
        console.log(`📅 Started: ${new Date(this.testResults.startTime).toISOString()}`);
        console.log(`📅 Finished: ${new Date(this.testResults.endTime).toISOString()}`);
        console.log('');
        
        // Backend results
        console.log('🔧 BACKEND TESTS:');
        if (this.testResults.backend) {
            console.log(`   Status: ${this.testResults.backend.success ? '✅ PASSED' : '❌ FAILED'}`);
            if (!this.testResults.backend.success && this.testResults.backend.error) {
                console.log(`   Error: ${this.testResults.backend.error}`);
            }
        } else {
            console.log('   Status: ⚠️  NOT RUN');
        }
        
        // Frontend results
        console.log('🌐 FRONTEND TESTS:');
        if (this.testResults.frontend) {
            console.log(`   Status: ${this.testResults.frontend.success ? '✅ PASSED' : '❌ FAILED'}`);
            if (!this.testResults.frontend.success && this.testResults.frontend.error) {
                console.log(`   Error: ${this.testResults.frontend.error}`);
            }
        } else {
            console.log('   Status: ⚠️  NOT RUN');
        }
        
        console.log('');
        
        // Overall result
        const backendPassed = this.testResults.backend?.success ?? false;
        const frontendPassed = this.testResults.frontend?.success ?? false;
        const allPassed = backendPassed && frontendPassed;
        
        console.log(`🎯 OVERALL RESULT: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
        console.log('='.repeat(60));
        
        return allPassed;
    }

    async run() {
        this.testResults.startTime = Date.now();
        
        console.log('\n🚀 Starting Comprehensive Test Suite');
        console.log('=====================================');
        
        try {
            // Step 1: Verify directories exist
            const dirsExist = await Promise.all([
                this.checkDirectoryExists(this.infraDir, 'Infrastructure directory'),
                this.checkDirectoryExists(this.backendDir, 'Backend directory'),
                this.checkDirectoryExists(this.webappDir, 'Webapp directory')
            ]);
            
            if (!dirsExist.every(exists => exists)) {
                this.log('Required directories missing, cannot continue', 'error');
                return false;
            }
            
            // Step 2: Stop any running services
            await this.stopServices();
            
            // Step 3: Start services cleanly
            const servicesStarted = await this.startServices();
            if (!servicesStarted) {
                this.log('Failed to start services, aborting tests', 'error');
                return false;
            }
            
            // Step 4: Run backend tests
            const backendPassed = await this.runBackendTests();
            
            // Step 5: Run frontend tests (even if backend failed, for complete picture)
            const frontendPassed = await this.runFrontendTests();
            
            this.testResults.endTime = Date.now();
            
            // Step 6: Generate and show report
            const allPassed = this.generateReport();
            
            return allPassed;
            
        } catch (error) {
            this.log(`Unexpected error during test execution: ${error.message}`, 'error');
            this.testResults.endTime = Date.now();
            this.generateReport();
            return false;
        }
    }
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

// Main execution
if (require.main === module) {
    const runner = new ComprehensiveTestRunner();
    
    runner.run().then((success) => {
        process.exit(success ? 0 : 1);
    }).catch((error) => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = ComprehensiveTestRunner;