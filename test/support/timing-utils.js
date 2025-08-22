const { until, By } = require('selenium-webdriver');

/**
 * Enhanced timing utilities for Phase 4.1 Performance and Reliability improvements
 * Provides consistent, reliable waiting patterns for E2E tests
 */

class TimingUtils {
    constructor(driver, options = {}) {
        this.driver = driver;
        
        // Base timeouts - conservative but improved from original values
        let timeoutMultiplier = 1.0;
        
        // Adjust for CI environments (slower)
        if (process.env.CI === 'true') {
            timeoutMultiplier = 1.5;
        }
        
        // Adjust for parallel execution (slower due to contention)
        if (process.env.PARALLEL === 'true') {
            timeoutMultiplier *= 1.3;
        }
        
        // Apply multiplier to conservative base values
        this.defaultTimeout = Math.round(8000 * timeoutMultiplier);   // 20% improvement from original 10000
        this.shortTimeout = Math.round(2500 * timeoutMultiplier);     // 17% improvement from original 3000
        this.longTimeout = Math.round(25000 * timeoutMultiplier);     // 17% improvement from original 30000
        
        // Removed logging to eliminate spam - initialization is managed by UtilityManager
    }

    /**
     * Smart wait for element with multiple selector fallbacks
     * @param {Array} selectors - Array of CSS selectors to try
     * @param {number} timeout - Maximum wait time
     * @returns {Promise<WebElement>}
     */
    async waitForElementWithFallbacks(selectors, timeout = this.defaultTimeout) {
        let lastError;
        
        // Try each selector quickly first
        for (const selector of selectors) {
            try {
                const locator = selector.startsWith('//') 
                    ? By.xpath(selector)
                    : By.css(selector);
                
                const element = await this.driver.wait(
                    until.elementLocated(locator),
                    2000 // Shorter timeout per selector
                );
                
                if (await element.isDisplayed()) {
                    console.log(`✅ Found element with selector: ${selector}`);
                    return element;
                }
            } catch (error) {
                lastError = error;
                // Continue to next selector immediately
            }
        }
        
        throw new Error(`Could not find element with any of these selectors: ${selectors.join(', ')}. Last error: ${lastError?.message}`);
    }

    /**
     * Wait for element to be clickable with retry logic
     * @param {string} selector - CSS selector or WebElement
     * @param {number} timeout - Maximum wait time
     * @returns {Promise<WebElement>}
     */
    async waitForClickable(selector, timeout = this.defaultTimeout) {
        const element = typeof selector === 'string' 
            ? await this.driver.findElement(By.css(selector))
            : selector;
            
        await this.driver.wait(until.elementIsEnabled(element), timeout);
        await this.driver.wait(until.elementIsVisible(element), timeout);
        
        // Additional check for element to be in viewport
        await this.driver.executeScript(
            "arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", 
            element
        );
        
        // Brief pause to ensure scroll animation completes
        await this.sleep(300);
        
        return element;
    }

    /**
     * Wait for text to appear in any element matching selectors
     * @param {Array} selectors - CSS selectors to check
     * @param {string} expectedText - Text to wait for
     * @param {number} timeout - Maximum wait time
     * @returns {Promise<string>}
     */
    async waitForTextInAnyElement(selectors, expectedText, timeout = this.defaultTimeout) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            for (const selector of selectors) {
                try {
                    const elements = await this.driver.findElements(By.css(selector));
                    
                    for (const element of elements) {
                        const text = await element.getText();
                        if (text.includes(expectedText)) {
                            console.log(`✅ Found expected text "${expectedText}" in element with selector: ${selector}`);
                            return text;
                        }
                    }
                } catch (error) {
                    // Continue searching
                }
            }
            
            await this.sleep(500);
        }
        
        throw new Error(`Text "${expectedText}" not found in any elements matching: ${selectors.join(', ')}`);
    }

    /**
     * Enhanced wait for page load with multiple indicators
     * @param {Array} indicators - Array of objects with selector and optional text
     * @param {number} timeout - Maximum wait time
     */
    async waitForPageLoad(indicators = [], timeout = this.longTimeout) {
        // Wait for DOM ready
        await this.driver.wait(async () => {
            const readyState = await this.driver.executeScript('return document.readyState');
            return readyState === 'complete';
        }, timeout);
        
        // Wait for any loading indicators to disappear
        try {
            const loadingSelectors = [
                '.loading', '.spinner', '.loading-spinner', 
                '[data-loading="true"]', '.loading-overlay'
            ];
            
            await this.driver.wait(async () => {
                for (const selector of loadingSelectors) {
                    const elements = await this.driver.findElements(By.css(selector));
                    for (const element of elements) {
                        if (await element.isDisplayed()) {
                            return false; // Still loading
                        }
                    }
                }
                return true; // No loading indicators visible
            }, this.defaultTimeout);
        } catch (error) {
            // Loading indicators might not be present, continue
        }
        
        // Wait for specific page indicators if provided
        if (indicators.length > 0) {
            for (const indicator of indicators) {
                if (indicator.text) {
                    await this.waitForTextInAnyElement([indicator.selector], indicator.text, timeout);
                } else {
                    await this.driver.wait(until.elementLocated(By.css(indicator.selector)), timeout);
                }
            }
        }
        
        // Shorter pause for any animations or async operations
        await this.sleep(100);
        
        console.log('✅ Page load completed with enhanced timing validation');
    }

    /**
     * Smart retry mechanism for flaky operations with improved backoff strategy
     * @param {Function} operation - Async function to retry
     * @param {number} maxRetries - Maximum number of retries
     * @param {number} delay - Delay between retries in ms
     * @returns {Promise<any>}
     */
    async retryOperation(operation, maxRetries = 3, delay = 1000) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await operation();
                if (attempt > 1) {
                    console.log(`✅ Operation succeeded on attempt ${attempt}/${maxRetries}`);
                }
                return result;
            } catch (error) {
                lastError = error;
                console.log(`⚠️ Operation failed on attempt ${attempt}/${maxRetries}: ${error.message}`);
                
                if (attempt < maxRetries) {
                    // Smart backoff: exponential for transient issues, linear for systematic issues
                    const backoffDelay = error.name === 'TimeoutError' ? 
                        delay * Math.pow(1.5, attempt - 1) : // Exponential for timeouts
                        delay;                               // Linear for other errors
                        
                    await this.sleep(backoffDelay);
                }
            }
        }
        
        throw new Error(`Operation failed after ${maxRetries} attempts. Last error: ${lastError.message}`);
    }

    /**
     * Wait for AJAX/network requests to complete
     * @param {number} timeout - Maximum wait time
     */
    async waitForNetworkIdle(timeout = this.defaultTimeout) {
        await this.driver.wait(async () => {
            // Check if jQuery is available and has no active requests
            const jQueryActive = await this.driver.executeScript(`
                if (typeof jQuery !== 'undefined') {
                    return jQuery.active === 0;
                }
                return true;
            `);
            
            // Check for fetch requests (basic implementation)
            const fetchComplete = await this.driver.executeScript(`
                // Simple check - more comprehensive monitoring would require custom implementation
                return true;
            `);
            
            return jQueryActive && fetchComplete;
        }, timeout);
        
        // Additional pause for any response processing
        await this.sleep(300);
        
        console.log('✅ Network requests appear to be idle');
    }

    /**
     * Enhanced sleep with logging
     * @param {number} milliseconds - Time to sleep
     */
    async sleep(milliseconds) {
        if (milliseconds > 1000) {
            console.log(`⏳ Waiting ${milliseconds}ms for operation to complete...`);
        }
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    /**
     * Wait for element with improved error messaging
     * @param {string} selector - CSS selector
     * @param {number} timeout - Maximum wait time
     * @returns {Promise<WebElement>}
     */
    async waitForElement(selector, timeout = this.defaultTimeout) {
        try {
            const element = await this.driver.wait(
                until.elementLocated(By.css(selector)),
                timeout
            );
            
            // Ensure element is visible
            await this.driver.wait(until.elementIsVisible(element), timeout);
            
            return element;
        } catch (error) {
            // Enhanced error message with page context
            const currentUrl = await this.driver.getCurrentUrl();
            const pageTitle = await this.driver.getTitle();
            
            throw new Error(
                `Could not find element with selector '${selector}' within ${timeout}ms. ` +
                `Current page: ${pageTitle} (${currentUrl}). ` +
                `Original error: ${error.message}`
            );
        }
    }
}

module.exports = TimingUtils;