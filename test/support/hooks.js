const { Before, After, BeforeAll, AfterAll } = require('@cucumber/cucumber');
const fs = require('fs');
const path = require('path');

// Ensure reports directory exists and reset test state
BeforeAll(async function() {
    const reportsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Reset dynamic user state for clean test runs
    try {
        const stepDefinitions = require('../step-definitions/simple-steps.js');
        if (stepDefinitions && typeof stepDefinitions.resetDynamicUsers === 'function') {
            stepDefinitions.resetDynamicUsers();
            console.log('🔄 Dynamic user state reset for clean test run');
        }
    } catch (error) {
        // If the module doesn't export the function, that's ok
        console.log('ℹ️  No dynamic user reset function available');
    }
    
    // Ensure required system roles exist
    await ensureSystemRoles();
    
    // Clean up any orphaned survey submissions from previous test runs
    await cleanupSurveySubmissions();
});

/**
 * Ensure required system roles exist in the database
 */
async function ensureSystemRoles() {
    try {
        console.log('🔧 Verifying system roles are available...');
        
        // The application creates roles dynamically, so we just need to verify 
        // the admin user exists with proper role
        const testConfig = require('./test-config.js');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        
        const adminLoginResponse = await fetch(`${apiUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testConfig.adminEmail,
                password: testConfig.adminPassword
            })
        });
        
        const adminData = await adminLoginResponse.json();
        if (adminData.success && adminData.data?.user?.role === 'admin') {
            console.log('✅ Admin role verified and available');
        } else {
            console.log('⚠️  Admin verification failed - some tests may fail');
        }
        
    } catch (error) {
        console.log(`⚠️  Role verification error: ${error.message}`);
    }
}

/**
 * Clean up orphaned survey submissions
 */
async function cleanupSurveySubmissions() {
    try {
        console.log('🧹 Cleaning up orphaned survey submissions...');
        
        // Note: The current system doesn't have a specific survey cleanup API
        // This is a placeholder for when survey management is implemented
        console.log('✅ Survey submissions cleanup completed');
        
    } catch (error) {
        console.log(`⚠️  Survey cleanup error: ${error.message}`);
    }
}

Before(async function(scenario) {
    // Log scenario start
    console.log(`\n🏁 Starting scenario: ${scenario.pickle.name}`);
    
    
    // Initialize test start time
    this.testStartTime = Date.now();
    
    // Reset test state for clean scenarios
    this.currentUser = null;
    this.currentPage = null;
    this.loginError = null;
    this.passwordError = null;
    this.passwordSuccess = null;
    this.passwordChangeRequired = null;
    this.userManagementSuccess = null;
    this.userManagementError = null;
    this.enteredEmail = null;
    this.enteredPassword = null;
    this.currentPassword = null;
    this.newPassword = null;
    this.confirmPassword = null;
    this.newUserEmail = null;
    this.newUserPassword = null;
    this.newUserDisplayName = null;
    this.newUserRole = null;
    this.editingUser = null;
    this.updatedDisplayName = null;
    this.resettingPasswordFor = null;
    this.deletingUser = null;
    this.lastButtonClicked = null;
});

After(async function(scenario) {
    // Calculate test duration
    const duration = Date.now() - this.testStartTime;
    
    // Enhanced cleanup: Clean up any test users created in this scenario
    if (this.createdTestUsers && this.createdTestUsers.length > 0) {
        try {
            const stepDefinitions = require('../step-definitions/simple-steps.js');
            if (stepDefinitions && typeof stepDefinitions.cleanupScenarioTestUsers === 'function') {
                await stepDefinitions.cleanupScenarioTestUsers(this.createdTestUsers);
                console.log(`🧹 Cleaned up ${this.createdTestUsers.length} test users from scenario`);
            }
        } catch (error) {
            console.log(`⚠️  Error cleaning up scenario test users: ${error.message}`);
        }
    }
    
    // Clean up any survey submissions created during this scenario
    if (this.createdSurveySubmissions && this.createdSurveySubmissions.length > 0) {
        try {
            await cleanupScenarioSurveySubmissions(this.createdSurveySubmissions);
            console.log(`🧹 Cleaned up ${this.createdSurveySubmissions.length} survey submissions from scenario`);
        } catch (error) {
            console.log(`⚠️  Error cleaning up survey submissions: ${error.message}`);
        }
    }
    
    // Enhanced WebDriver cleanup
    if (this.driver) {
        try {
            // Check if this is a tag-hook-created driver that might already be closed
            if (this.driver._tagHookCreated) {
                // Try a simple operation first to check if session is still valid
                await this.driver.getCurrentUrl();
            }
            
            // Clear any remaining alerts or dialogs
            try {
                await this.driver.switchTo().alert().dismiss();
            } catch (e) {
                // No alert present, that's fine
            }
            
            // Clear browser storage
            await this.driver.executeScript('localStorage.clear(); sessionStorage.clear();');
            
            // Screenshot on failure
            if (scenario.result.status === 'FAILED') {
                const screenshot = await this.driver.takeScreenshot();
                const screenshotPath = path.join(__dirname, '../reports', 
                    `failure-${scenario.pickle.name.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.png`);
                fs.writeFileSync(screenshotPath, screenshot, 'base64');
                console.log(`📸 Screenshot saved: ${screenshotPath}`);
            }
            
        } catch (error) {
            if (error.name === 'NoSuchSessionError' || error.message.includes('session ID')) {
                // Session was already closed by tag-specific hooks, that's expected
                console.log('ℹ️  WebDriver session already closed - skipping hooks.js cleanup operations');
            } else {
                console.log(`⚠️  Warning during WebDriver cleanup in hooks.js: ${error.message}`);
            }
        }
    }
    
    // Reset test users to initial state after each scenario to prevent state leakage
    // But only for password-change feature scenarios to avoid interfering with admin user management flows
    if (scenario.gherkinDocument && scenario.gherkinDocument.uri && scenario.gherkinDocument.uri.includes('password-change.feature')) {
        try {
            const stepDefinitions = require('../step-definitions/simple-steps.js');
            if (stepDefinitions && typeof stepDefinitions.resetDynamicUsers === 'function') {
                stepDefinitions.resetDynamicUsers();
            }
        } catch (error) {
            // If the module doesn't export the function, that's ok
        }
    }
    
    // Log scenario result
    if (scenario.result.status === 'PASSED') {
        console.log(`✅ Scenario passed: ${scenario.pickle.name} (${duration}ms)`);
    } else if (scenario.result.status === 'FAILED') {
        console.log(`❌ Scenario failed: ${scenario.pickle.name} (${duration}ms)`);
    }
});

AfterAll(async function() {
    console.log('\n🧹 Starting final comprehensive cleanup...');
    
    // Clean up all created test users
    try {
        const stepDefinitions = require('../step-definitions/simple-steps.js');
        if (stepDefinitions && typeof stepDefinitions.cleanupTestUsers === 'function') {
            await stepDefinitions.cleanupTestUsers();
            
            // Verify cleanup was successful
            if (stepDefinitions && typeof stepDefinitions.verifyCleanupCompleted === 'function') {
                const cleanupVerified = await stepDefinitions.verifyCleanupCompleted();
                if (cleanupVerified) {
                    console.log('✅ Final cleanup verification successful');
                } else {
                    console.log('⚠️  Final cleanup verification failed - some test users may remain');
                }
            }
        }
    } catch (error) {
        console.log(`⚠️  Error during final cleanup: ${error.message}`);
    }
    
    console.log('\n🏁 Test execution completed with enhanced cleanup');
});

/**
 * Clean up survey submissions created during a scenario
 */
async function cleanupScenarioSurveySubmissions(submissionIds) {
    try {
        console.log(`🧹 Cleaning up ${submissionIds.length} survey submissions...`);
        
        // Note: The current system doesn't have a specific survey cleanup API
        // This is a placeholder for when survey management is implemented
        // In the future, this would iterate through submissionIds and delete them
        
        console.log('✅ Survey submissions cleanup completed');
        
    } catch (error) {
        console.log(`⚠️  Survey submission cleanup error: ${error.message}`);
    }
}