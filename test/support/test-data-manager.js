/**
 * Enhanced Test Data Management (Phase 4.3)
 * Provides comprehensive test data generation, validation, and management
 */

const crypto = require('crypto');
const { getAdminCredentials } = require('./test-config');

class TestDataManager {
    constructor() {
        this.testUsers = new Map(); // Track all generated test users
        this.testFormData = new Map(); // Track generated form data
        this.sessionData = new Map(); // Track session-specific data
    }

    /**
     * Generate enhanced test user with validation
     * @param {string} role - User role (admin, user, etc.)
     * @param {Object} options - Additional options for user generation
     * @returns {Object} Generated test user with validation data
     */
    generateTestUser(role = 'user', options = {}) {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(4).toString('hex');
        const uniqueId = `${timestamp}-${random}`;
        
        // Generate realistic test data
        const userTypes = {
            admin: {
                firstName: 'Admin',
                lastName: 'Test',
                password: getAdminCredentials().password,
                permissions: ['create', 'read', 'update', 'delete']
            },
            user: {
                firstName: 'User',
                lastName: 'Test', 
                password: 'UserPass123@',
                permissions: ['read']
            },
            moderator: {
                firstName: 'Moderator',
                lastName: 'Test',
                password: 'ModeratorPass123@',
                permissions: ['read', 'update']
            }
        };

        const userDefaults = userTypes[role] || userTypes.user;
        
        const testUser = {
            id: null, // Will be set when created
            email: options.email || `e2etest-${role}-${uniqueId}@test.local`,
            password: options.password || userDefaults.password,
            firstName: options.firstName || userDefaults.firstName,
            lastName: options.lastName || userDefaults.lastName,
            displayName: `${options.firstName || userDefaults.firstName} ${options.lastName || userDefaults.lastName}`,
            role: role,
            permissions: userDefaults.permissions,
            metadata: {
                generatedAt: new Date().toISOString(),
                sessionId: uniqueId,
                testContext: options.testContext || 'default'
            }
        };

        // Validate generated data
        this.validateTestUser(testUser);
        
        // Track the generated user
        this.testUsers.set(testUser.email, testUser);
        
        console.log(`📝 Generated test user: ${testUser.email} (${role})`);
        return testUser;
    }

    /**
     * Validate test user data
     * @param {Object} testUser - Test user to validate
     * @throws {Error} If validation fails
     */
    validateTestUser(testUser) {
        const validations = [
            { field: 'email', test: (u) => u.email && u.email.includes('@'), message: 'Email must contain @' },
            { field: 'password', test: (u) => u.password && u.password.length >= 8, message: 'Password must be at least 8 characters' },
            { field: 'firstName', test: (u) => u.firstName && u.firstName.trim().length > 0, message: 'First name is required' },
            { field: 'lastName', test: (u) => u.lastName && u.lastName.trim().length > 0, message: 'Last name is required' },
            { field: 'role', test: (u) => ['admin', 'user', 'moderator'].includes(u.role), message: 'Role must be valid' }
        ];

        for (const validation of validations) {
            if (!validation.test(testUser)) {
                throw new Error(`Test user validation failed for ${validation.field}: ${validation.message}`);
            }
        }
    }

    /**
     * Generate comprehensive survey form test data
     * @param {Object} formSchema - YAML form schema
     * @returns {Object} Generated form data matching schema
     */
    generateSurveyData(formSchema = null) {
        // Default form data based on party-survey.yaml structure
        const defaultFormData = {
            full_name: this.generateRealisticName(),
            address: this.generateRealisticAddress(),
            phone: this.generatePhoneNumber(),
            email: this.generateTestEmail(),
            party_support: Math.floor(Math.random() * 11), // 0-10 slider
            newsletter: Math.random() > 0.5 // Boolean checkbox
        };

        // If schema provided, generate data matching schema
        if (formSchema && formSchema.form && formSchema.form.fields) {
            const surveyData = {};
            
            for (const field of formSchema.form.fields) {
                switch (field.type) {
                    case 'text':
                        surveyData[field.name] = this.generateTextFieldData(field);
                        break;
                    case 'email':
                        surveyData[field.name] = this.generateTestEmail();
                        break;
                    case 'slider':
                        surveyData[field.name] = this.generateSliderData(field);
                        break;
                    case 'boolean':
                        surveyData[field.name] = Math.random() > 0.5;
                        break;
                    default:
                        surveyData[field.name] = 'Test Value';
                }
            }
            
            this.testFormData.set('survey', surveyData);
            return surveyData;
        }

        this.testFormData.set('survey', defaultFormData);
        return defaultFormData;
    }

    /**
     * Generate realistic name for testing
     * @returns {string} Realistic full name
     */
    generateRealisticName() {
        const firstNames = ['Alex', 'Taylor', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Avery', 'Jamie'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
        
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        
        return `${firstName} ${lastName}`;
    }

    /**
     * Generate realistic address for testing
     * @returns {string} Realistic address
     */
    generateRealisticAddress() {
        const streetNumbers = [123, 456, 789, 101, 202, 303];
        const streetNames = ['Main St', 'Oak Ave', 'First St', 'Park Rd', 'Church St', 'School St'];
        const cities = ['Springfield', 'Madison', 'Georgetown', 'Franklin', 'Clinton', 'Washington'];
        
        const number = streetNumbers[Math.floor(Math.random() * streetNumbers.length)];
        const street = streetNames[Math.floor(Math.random() * streetNames.length)];
        const city = cities[Math.floor(Math.random() * cities.length)];
        
        return `${number} ${street}, ${city}`;
    }

    /**
     * Generate valid phone number for testing
     * @returns {string} Valid phone number
     */
    generatePhoneNumber() {
        // Generate format: (555) 123-4567
        const areaCode = '555';
        const exchange = Math.floor(Math.random() * 900) + 100;
        const number = Math.floor(Math.random() * 9000) + 1000;
        
        return `(${areaCode}) ${exchange}-${number}`;
    }

    /**
     * Generate test email address
     * @returns {string} Test email address
     */
    generateTestEmail() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `test-${timestamp}-${random}@example.com`;
    }

    /**
     * Generate text field data based on field configuration
     * @param {Object} field - Field configuration from YAML
     * @returns {string} Generated text data
     */
    generateTextFieldData(field) {
        const dataTypes = {
            full_name: () => this.generateRealisticName(),
            name: () => this.generateRealisticName(),
            address: () => this.generateRealisticAddress(),
            phone: () => this.generatePhoneNumber(),
            default: () => `Test ${field.label || field.name || 'Value'}`
        };

        const generator = dataTypes[field.name] || dataTypes.default;
        return generator();
    }

    /**
     * Generate slider data based on field configuration
     * @param {Object} field - Slider field configuration
     * @returns {number} Generated slider value
     */
    generateSliderData(field) {
        const min = field.min || 0;
        const max = field.max || 10;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Generate invalid test data for validation testing
     * @param {string} fieldType - Type of field to generate invalid data for
     * @returns {Object} Invalid test data
     */
    generateInvalidData(fieldType) {
        const invalidData = {
            email: ['invalid-email', 'test@', '@example.com', 'test.example.com'],
            password: ['weak', '123', '', 'no-numbers'],
            phone: ['invalid-phone', '123', 'abc-def-ghij'],
            required: ['', null, undefined, '   ']
        };

        const invalid = invalidData[fieldType] || invalidData.required;
        return invalid[Math.floor(Math.random() * invalid.length)];
    }

    /**
     * Clean up all tracked test data
     */
    cleanup() {
        console.log(`🧹 Cleaning up test data manager - ${this.testUsers.size} users, ${this.testFormData.size} forms tracked`);
        this.testUsers.clear();
        this.testFormData.clear();
        this.sessionData.clear();
    }

    /**
     * Get all tracked test users
     * @returns {Array} Array of tracked test users
     */
    getAllTestUsers() {
        return Array.from(this.testUsers.values());
    }

    /**
     * Get test user by email
     * @param {string} email - Test user email
     * @returns {Object|null} Test user or null if not found
     */
    getTestUser(email) {
        return this.testUsers.get(email) || null;
    }

    /**
     * Update test user data (e.g., after creation)
     * @param {string} email - Test user email
     * @param {Object} updates - Updates to apply
     */
    updateTestUser(email, updates) {
        const user = this.testUsers.get(email);
        if (user) {
            Object.assign(user, updates);
            this.testUsers.set(email, user);
        }
    }

    /**
     * Generate edge case test data for robustness testing
     * @returns {Object} Edge case test data
     */
    generateEdgeCaseData() {
        return {
            veryLongText: 'A'.repeat(1000),
            specialCharacters: '!@#$%^&*()_+-=[]{}|;:,.<>?',
            unicodeText: '测试数据 🌟 ñáéíóú',
            emptyString: '',
            whitespaceOnly: '   ',
            htmlTags: '<script>alert("test")</script>',
            sqlInjection: "'; DROP TABLE users; --",
            maxInteger: Number.MAX_SAFE_INTEGER,
            negativeNumber: -999,
            floatingPoint: 3.14159
        };
    }
}

module.exports = TestDataManager;