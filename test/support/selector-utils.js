/**
 * Selector robustness utilities for Phase 4.2 Performance and Reliability improvements
 * Provides reliable, fallback-based element selection strategies
 */

const { By, until } = require('selenium-webdriver');

class SelectorUtils {
    constructor() {
        // Performance monitoring for selector effectiveness
        this.selectorStats = {
            attempts: {},
            successes: {},
            avgTimes: {}
        };
        
        // Common UI element selector patterns
        this.commonPatterns = {
            buttons: [
                'button',
                'input[type="button"]',
                'input[type="submit"]',
                '[role="button"]',
                'a.btn',
                '.button',
                '[data-testid*="button"]'
            ],
            
            inputs: [
                'input',
                'textarea',
                'select',
                '[contenteditable="true"]',
                '[role="textbox"]'
            ],
            
            forms: [
                'form',
                '[role="form"]',
                '.form',
                '[data-testid*="form"]'
            ],
            
            messages: [
                '.message',
                '.alert',
                '.notification',
                '.toast',
                '[role="alert"]',
                '[data-testid*="message"]',
                '.error-message',
                '.success-message',
                '.info-message'
            ],
            
            navigation: [
                'nav',
                '.nav',
                '.navigation',
                '[role="navigation"]',
                '.navbar',
                '.menu'
            ]
        };
    }

    /**
     * Generate robust selector arrays for common UI elements
     * @param {string} elementType - Type of element (button, input, etc.)
     * @param {string} identifier - Text content, placeholder, name, or other identifier
     * @param {Object} options - Additional options for selector generation
     * @returns {Array} Array of CSS selectors to try in order
     */
    generateSelectors(elementType, identifier, options = {}) {
        const selectors = [];
        const basePatterns = this.commonPatterns[elementType] || ['*'];
        
        // Exact text content matches (highest priority)
        if (identifier && typeof identifier === 'string') {
            basePatterns.forEach(pattern => {
                selectors.push(`${pattern}[data-testid="${identifier.toLowerCase().replace(/\s+/g, '-')}"]`);
                selectors.push(`${pattern}:contains("${identifier}")`);
                selectors.push(`${pattern}[aria-label="${identifier}"]`);
                selectors.push(`${pattern}[title="${identifier}"]`);
            });
        }
        
        // Attribute-based matches (medium priority)
        if (identifier) {
            const idLower = identifier.toLowerCase().replace(/\s+/g, '-');
            const idCamel = identifier.replace(/\s+(\w)/g, (_, letter) => letter.toUpperCase()).replace(/\s+/g, '');
            const idUnderscore = identifier.toLowerCase().replace(/\s+/g, '_');
            
            basePatterns.forEach(pattern => {
                selectors.push(`${pattern}[name="${idUnderscore}"]`);
                selectors.push(`${pattern}[name="${idCamel}"]`);
                selectors.push(`${pattern}[id="${idLower}"]`);
                selectors.push(`${pattern}[id="${idCamel}"]`);
                selectors.push(`${pattern}[placeholder*="${identifier}" i]`);
            });
        }
        
        // Class and general attribute matches (lower priority)
        if (identifier) {
            const classIdentifier = identifier.toLowerCase().replace(/\s+/g, '-');
            basePatterns.forEach(pattern => {
                selectors.push(`${pattern}.${classIdentifier}`);
                selectors.push(`${pattern}[class*="${classIdentifier}"]`);
                selectors.push(`${pattern}[data-*="${identifier}" i]`);
            });
        }
        
        // XPath fallbacks for complex text matching
        if (identifier && elementType === 'button') {
            selectors.push(`//button[contains(text(), '${identifier}')]`);
            selectors.push(`//input[@type='button' or @type='submit'][contains(@value, '${identifier}')]`);
            selectors.push(`//*[@role='button'][contains(text(), '${identifier}')]`);
        }
        
        // Generic fallbacks (lowest priority)
        basePatterns.forEach(pattern => {
            selectors.push(pattern);
        });
        
        return [...new Set(selectors)]; // Remove duplicates
    }

    /**
     * Generate selectors for login form elements
     * @returns {Object} Object with selectors for common login elements
     */
    getLoginSelectors() {
        return {
            emailField: [
                'input[type="email"]',
                'input[name="email"]',
                'input[id="email"]',
                'input[autocomplete="username"]',
                'input[autocomplete="email"]',
                'input[placeholder*="email" i]'
            ].concat(this.generateSelectors('inputs', 'email')),
            
            passwordField: [
                'input[type="password"]',
                'input[name="password"]',
                'input[id="password"]',
                'input[autocomplete="current-password"]',
                'input[placeholder*="password" i]'
            ].concat(this.generateSelectors('inputs', 'password')),
            
            loginButton: [
                'button[type="submit"]',
                'input[type="submit"]',
                'button:contains("Sign In")',
                'button:contains("Log In")',
                '[data-testid*="login"]'
            ].concat(this.generateSelectors('buttons', 'Login')),
            
            errorMessage: this.commonPatterns.messages.concat([
                '.login-error',
                '.auth-error',
                '[data-testid*="error"]'
            ])
        };
    }

    /**
     * Generate selectors for dashboard elements
     * @returns {Object} Object with selectors for common dashboard elements
     */
    getDashboardSelectors() {
        return {
            welcomeMessage: [
                'h1:contains("Welcome")',
                'h1:contains("Dashboard")', 
                '.welcome-message',
                '.dashboard-title',
                '[data-testid*="welcome"]',
                '[data-testid*="dashboard"]'
            ],
            
            userManagement: this.generateSelectors('buttons', 'User Management').concat([
                'a[href*="user"]',
                'button:contains("Users")',
                '.user-management',
                '[data-testid*="user"]'
            ]),
            
            surveyForm: this.generateSelectors('buttons', 'Start Survey').concat([
                'a[href*="survey"]',
                'button:contains("Survey")',
                '.survey-link',
                '[data-testid*="survey"]'
            ]),
            
            logoutButton: this.generateSelectors('buttons', 'Logout').concat([
                'button:contains("Sign Out")',
                'a:contains("Logout")',
                '.logout-button',
                '[data-testid*="logout"]'
            ])
        };
    }

    /**
     * Generate selectors for survey form elements
     * @returns {Object} Object with selectors for survey form elements  
     */
    getSurveySelectors() {
        return {
            form: this.commonPatterns.forms.concat([
                '.survey-form',
                '[data-testid*="survey"]'
            ]),
            
            textFields: this.commonPatterns.inputs.concat([
                '.survey-input',
                '.form-input',
                '[data-testid*="field"]'
            ]),
            
            submitButton: this.generateSelectors('buttons', 'Submit').concat([
                'button[type="submit"]',
                '.submit-button',
                '[data-testid*="submit"]'
            ]),
            
            validationMessages: this.commonPatterns.messages.concat([
                '.validation-error',
                '.field-error',
                '[data-testid*="validation"]'
            ])
        };
    }

    /**
     * Generate selectors for admin user management elements
     * @returns {Object} Object with selectors for admin elements
     */
    getAdminSelectors() {
        return {
            createUserButton: this.generateSelectors('buttons', 'Create User').concat([
                'button:contains("New User")',
                'button:contains("Add User")',
                '.create-user-button',
                '[data-testid*="create-user"]'
            ]),
            
            userList: [
                '.user-list',
                '.users-table',
                'table',
                '.list-group',
                '[data-testid*="user-list"]'
            ],
            
            deleteButton: this.generateSelectors('buttons', 'Delete').concat([
                'button:contains("Remove")',
                '.delete-button',
                '.remove-button',
                '[data-testid*="delete"]'
            ]),
            
            resetPasswordButton: this.generateSelectors('buttons', 'Reset Password').concat([
                'button:contains("Reset")',
                '.reset-password-button',
                '[data-testid*="reset"]'
            ])
        };
    }

    /**
     * Get fallback selectors for dynamic content
     * @param {string} contentType - Type of content to find
     * @returns {Array} Array of selectors for dynamic content
     */
    getDynamicContentSelectors(contentType) {
        const selectors = {
            loading: [
                '.loading',
                '.spinner',
                '.loading-spinner',
                '.loading-indicator',
                '[data-loading="true"]',
                '[aria-busy="true"]'
            ],
            
            success: [
                '.success',
                '.alert-success',
                '.notification-success',
                '.toast-success',
                '[data-status="success"]'
            ],
            
            error: [
                '.error',
                '.alert-error',
                '.notification-error',
                '.toast-error',
                '[data-status="error"]'
            ],
            
            modal: [
                '.modal',
                '.dialog',
                '.popup',
                '[role="dialog"]',
                '[aria-modal="true"]'
            ]
        };
        
        return selectors[contentType] || [];
    }

    /**
     * Find element with fallback selectors and performance tracking
     * @param {WebDriver} driver - WebDriver instance
     * @param {Array} selectors - Array of selectors to try
     * @param {number} timeout - Maximum wait time
     * @returns {Promise<WebElement>}
     */
    async findElementWithFallbacks(driver, selectors, timeout = 5000) {
        const startTime = Date.now();
        let attempts = 0;
        
        for (const selector of selectors) {
            attempts++;
            const selectorStartTime = Date.now();
            
            // Track attempts for this selector
            this.selectorStats.attempts[selector] = (this.selectorStats.attempts[selector] || 0) + 1;
            
            try {
                const locator = selector.startsWith('//') 
                    ? By.xpath(selector) 
                    : By.css(selector);
                    
                const element = await driver.wait(
                    until.elementLocated(locator), 
                    Math.min(timeout / selectors.length, 2000)
                );
                
                if (await element.isDisplayed()) {
                    const duration = Date.now() - startTime;
                    const selectorDuration = Date.now() - selectorStartTime;
                    
                    // Track success for this selector
                    this.selectorStats.successes[selector] = (this.selectorStats.successes[selector] || 0) + 1;
                    
                    // Track average time for this selector
                    const prevAvg = this.selectorStats.avgTimes[selector] || 0;
                    const successCount = this.selectorStats.successes[selector];
                    this.selectorStats.avgTimes[selector] = ((prevAvg * (successCount - 1)) + selectorDuration) / successCount;
                    
                    // Track which selectors work most often for future optimization
                    console.log(`✅ Found element with selector ${attempts}/${selectors.length}: ${selector} (${duration}ms)`);
                    
                    // Periodically log selector effectiveness (every 10th success)
                    if (successCount % 10 === 0) {
                        const successRate = (this.selectorStats.successes[selector] / this.selectorStats.attempts[selector] * 100).toFixed(1);
                        console.log(`📊 Selector '${selector}' success rate: ${successRate}% (avg: ${this.selectorStats.avgTimes[selector].toFixed(0)}ms)`);
                    }
                    
                    return element;
                }
            } catch (error) {
                // Continue to next selector
                if (attempts === selectors.length) {
                    console.log(`❌ Failed to find element with selector ${attempts}: ${selector}`);
                }
            }
        }
        
        throw new Error(`Could not find element with any selector after ${Date.now() - startTime}ms: ${selectors.join(', ')}`);
    }

    /**
     * Find multiple elements with fallback selectors
     * @param {WebDriver} driver - WebDriver instance
     * @param {Array} selectors - Array of selectors to try
     * @param {number} timeout - Maximum wait time
     * @returns {Promise<Array<WebElement>>}
     */
    async findElementsWithFallbacks(driver, selectors, timeout = 5000) {
        const startTime = Date.now();
        
        for (const selector of selectors) {
            try {
                const locator = selector.startsWith('//') 
                    ? By.xpath(selector) 
                    : By.css(selector);
                    
                await driver.wait(
                    until.elementLocated(locator), 
                    Math.min(timeout / selectors.length, 2000)
                );
                
                const elements = await driver.findElements(locator);
                if (elements.length > 0) {
                    const duration = Date.now() - startTime;
                    console.log(`✅ Found ${elements.length} elements with selector: ${selector} (${duration}ms)`);
                    return elements;
                }
            } catch (error) {
                // Continue to next selector
            }
        }
        
        console.log(`⚠️ No elements found with selectors: ${selectors.join(', ')}`);
        return [];
    }

    /**
     * Check if element exists without throwing error
     * @param {WebDriver} driver - WebDriver instance
     * @param {Array} selectors - Array of selectors to try
     * @param {number} timeout - Maximum wait time
     * @returns {Promise<boolean>}
     */
    async elementExists(driver, selectors, timeout = 2000) {
        try {
            await this.findElementWithFallbacks(driver, selectors, timeout);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Wait for element to be clickable with fallback selectors
     * @param {WebDriver} driver - WebDriver instance
     * @param {Array} selectors - Array of selectors to try
     * @param {number} timeout - Maximum wait time
     * @returns {Promise<WebElement>}
     */
    async waitForClickableElement(driver, selectors, timeout = 5000) {
        const element = await this.findElementWithFallbacks(driver, selectors, timeout);
        await driver.wait(until.elementIsEnabled(element), timeout);
        return element;
    }
}

module.exports = SelectorUtils;