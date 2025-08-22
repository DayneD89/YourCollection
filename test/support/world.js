const { setWorldConstructor, setDefaultTimeout } = require('@cucumber/cucumber');

// Set default timeout for all steps (60 seconds)
setDefaultTimeout(60000);

class CustomWorld {
    constructor() {
        this.driver = null;
        this.loginPage = null;
        this.dashboardPage = null;
        this.passwordChangePage = null;
        this.testData = {};
        
        // Enhanced parallel execution isolation
        this.sessionId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.createdTestUsers = [];
        this.testStartTime = null;
        
        // Initialize test configuration early
        this.testConfig = null;
    }

    // Helper methods for test data management
    setTestData(key, value) {
        this.testData[key] = value;
    }

    getTestData(key) {
        return this.testData[key];
    }

    clearTestData() {
        this.testData = {};
    }
    
    // Enhanced session isolation for parallel execution
    getUniqueTestId(prefix = 'e2etest') {
        return `${prefix}-${this.sessionId}`;
    }
    
    // Track resources created in this world instance
    addCreatedResource(resourceType, resource) {
        if (!this[`created${resourceType}`]) {
            this[`created${resourceType}`] = [];
        }
        this[`created${resourceType}`].push(resource);
    }
    
    // Get all resources of a type created in this session
    getCreatedResources(resourceType) {
        return this[`created${resourceType}`] || [];
    }
    
    // Clean up all resources created in this world instance
    async cleanupAllResources() {
        const cleanupPromises = [];
        
        // Cleanup test users
        if (this.createdTestUsers && this.createdTestUsers.length > 0) {
            try {
                const stepDefinitions = require('../step-definitions/simple-steps.js');
                if (stepDefinitions && typeof stepDefinitions.cleanupScenarioTestUsers === 'function') {
                    cleanupPromises.push(stepDefinitions.cleanupScenarioTestUsers(this.createdTestUsers));
                }
            } catch (error) {
                console.log(`⚠️  Error cleaning up world test users: ${error.message}`);
            }
        }
        
        // Wait for all cleanup to complete
        await Promise.all(cleanupPromises);
    }
}

setWorldConstructor(CustomWorld);