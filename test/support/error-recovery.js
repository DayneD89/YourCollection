/**
 * Error Recovery and Reporting System (Phase 3.3)
 * Provides enhanced error recovery, retry logic, and comprehensive reporting
 */

const fs = require('fs');
const path = require('path');

class ErrorRecoveryManager {
    constructor(driver) {
        this.driver = driver;
        this.retryCount = 0;
        this.maxRetries = 2; // Reduced from 3 to 2
        this.errorLog = [];
        this.screenshots = [];
        this.reportsDir = path.join(__dirname, '../reports');
        
        // Ensure reports directory exists
        this.ensureReportsDirectory();
    }

    /**
     * Ensure reports directory exists
     */
    ensureReportsDirectory() {
        if (!fs.existsSync(this.reportsDir)) {
            fs.mkdirSync(this.reportsDir, { recursive: true });
        }
    }

    /**
     * Enhanced error recovery with multiple strategies
     * @param {Function} operation - Operation to retry
     * @param {Object} options - Recovery options
     * @returns {Promise<any>} Result of successful operation
     */
    async executeWithRecovery(operation, options = {}) {
        const {
            maxRetries = this.maxRetries,
            recoveryStrategies = ['refresh', 'navigate', 'reset'],
            operationName = 'unknown',
            skipScreenshot = false
        } = options;

        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Executing ${operationName} (attempt ${attempt}/${maxRetries})`);
                const result = await operation();
                
                if (attempt > 1) {
                    console.log(`✅ ${operationName} succeeded after ${attempt} attempts`);
                    this.logRecoverySuccess(operationName, attempt, lastError);
                }
                
                return result;
                
            } catch (error) {
                lastError = error;
                console.log(`❌ ${operationName} failed on attempt ${attempt}: ${error.message}`);
                
                // Take screenshot on error
                if (!skipScreenshot) {
                    await this.captureErrorScreenshot(operationName, attempt, error);
                }
                
                // Log the error
                this.logError(operationName, attempt, error);
                
                // Don't retry on final attempt
                if (attempt === maxRetries) {
                    break;
                }
                
                // Apply recovery strategy
                await this.applyRecoveryStrategy(recoveryStrategies[attempt - 1] || 'wait', error);
                
                // Progressive delay between retries
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                console.log(`⏳ Waiting ${delay}ms before retry...`);
                await this.sleep(delay);
            }
        }
        
        // All attempts failed
        const finalError = new Error(
            `Operation '${operationName}' failed after ${maxRetries} attempts. ` +
            `Last error: ${lastError.message}`
        );
        
        this.logFinalFailure(operationName, maxRetries, lastError);
        throw finalError;
    }

    /**
     * Apply recovery strategy based on error type
     * @param {string} strategy - Recovery strategy to apply
     * @param {Error} error - The error that occurred
     */
    async applyRecoveryStrategy(strategy, error) {
        console.log(`🔧 Applying recovery strategy: ${strategy}`);
        
        try {
            switch (strategy) {
                case 'refresh':
                    await this.refreshPage();
                    break;
                    
                case 'navigate':
                    await this.navigateToSafePage();
                    break;
                    
                case 'reset':
                    await this.resetBrowserState();
                    break;
                    
                case 'clear-storage':
                    await this.clearBrowserStorage();
                    break;
                    
                case 'dismiss-alerts':
                    await this.dismissAnyAlerts();
                    break;
                    
                case 'wait':
                default:
                    console.log('🕐 Using simple wait strategy');
                    await this.sleep(2000);
                    break;
            }
        } catch (recoveryError) {
            console.log(`⚠️ Recovery strategy '${strategy}' failed: ${recoveryError.message}`);
        }
    }

    /**
     * Refresh the current page
     */
    async refreshPage() {
        try {
            console.log('🔄 Refreshing page for recovery');
            await this.driver.navigate().refresh();
            await this.sleep(2000); // Wait for page load
        } catch (error) {
            console.log(`Failed to refresh page: ${error.message}`);
        }
    }

    /**
     * Navigate to a safe/known page
     */
    async navigateToSafePage() {
        try {
            console.log('🏠 Navigating to safe page for recovery');
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            await this.driver.get(`${baseUrl}/login`);
            await this.sleep(3000); // Wait for navigation
        } catch (error) {
            console.log(`Failed to navigate to safe page: ${error.message}`);
        }
    }

    /**
     * Reset browser state
     */
    async resetBrowserState() {
        try {
            console.log('🔄 Resetting browser state for recovery');
            
            // Clear storage
            await this.clearBrowserStorage();
            
            // Dismiss any alerts
            await this.dismissAnyAlerts();
            
            // Navigate to login page
            await this.navigateToSafePage();
            
        } catch (error) {
            console.log(`Failed to reset browser state: ${error.message}`);
        }
    }

    /**
     * Clear browser storage (localStorage, sessionStorage, cookies)
     */
    async clearBrowserStorage() {
        try {
            console.log('🧹 Clearing browser storage for recovery');
            
            // Clear localStorage and sessionStorage
            await this.driver.executeScript(`
                if (typeof localStorage !== 'undefined') localStorage.clear();
                if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
            `);
            
            // Clear cookies
            await this.driver.manage().deleteAllCookies();
            
        } catch (error) {
            console.log(`Failed to clear browser storage: ${error.message}`);
        }
    }

    /**
     * Dismiss any browser alerts or dialogs
     */
    async dismissAnyAlerts() {
        try {
            const alert = await this.driver.switchTo().alert();
            await alert.dismiss();
            console.log('⚠️ Dismissed browser alert');
        } catch (error) {
            // No alert present, which is normal
        }
    }

    /**
     * Capture screenshot on error with enhanced metadata
     * @param {string} operationName - Name of failed operation
     * @param {number} attempt - Attempt number
     * @param {Error} error - The error that occurred
     */
    async captureErrorScreenshot(operationName, attempt, error) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `error-${operationName}-attempt-${attempt}-${timestamp}.png`;
            const filepath = path.join(this.reportsDir, filename);
            
            const screenshot = await this.driver.takeScreenshot();
            fs.writeFileSync(filepath, screenshot, 'base64');
            
            // Store screenshot info
            const screenshotInfo = {
                filename,
                filepath,
                operationName,
                attempt,
                timestamp: new Date().toISOString(),
                error: error.message,
                url: await this.getPageInfo()
            };
            
            this.screenshots.push(screenshotInfo);
            console.log(`📸 Error screenshot saved: ${filename}`);
            
            return screenshotInfo;
            
        } catch (screenshotError) {
            console.log(`⚠️ Failed to capture error screenshot: ${screenshotError.message}`);
        }
    }

    /**
     * Get current page information for error reporting
     * @returns {Object} Page information
     */
    async getPageInfo() {
        try {
            const url = await this.driver.getCurrentUrl();
            const title = await this.driver.getTitle();
            const windowSize = await this.driver.manage().window().getRect();
            
            return {
                url,
                title,
                windowSize,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                url: 'unknown',
                title: 'unknown',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Log error with detailed context
     * @param {string} operationName - Name of operation that failed
     * @param {number} attempt - Attempt number
     * @param {Error} error - The error that occurred
     */
    logError(operationName, attempt, error) {
        const errorEntry = {
            operationName,
            attempt,
            timestamp: new Date().toISOString(),
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            },
            retryInfo: {
                maxRetries: this.maxRetries,
                willRetry: attempt < this.maxRetries
            }
        };
        
        this.errorLog.push(errorEntry);
    }

    /**
     * Log successful recovery
     * @param {string} operationName - Name of operation that succeeded
     * @param {number} attempts - Number of attempts before success
     * @param {Error} lastError - Last error before success
     */
    logRecoverySuccess(operationName, attempts, lastError) {
        console.log(`🎉 Recovery successful for ${operationName} after ${attempts} attempts`);
        
        const successEntry = {
            operationName,
            attempts,
            timestamp: new Date().toISOString(),
            recovered: true,
            lastError: lastError ? lastError.message : 'unknown'
        };
        
        this.errorLog.push(successEntry);
    }

    /**
     * Log final failure when all recovery attempts exhausted
     * @param {string} operationName - Name of operation
     * @param {number} maxRetries - Maximum retries attempted
     * @param {Error} finalError - Final error before giving up
     */
    logFinalFailure(operationName, maxRetries, finalError) {
        console.log(`💥 Final failure for ${operationName} after ${maxRetries} attempts`);
        
        const failureEntry = {
            operationName,
            maxRetries,
            timestamp: new Date().toISOString(),
            finalFailure: true,
            error: {
                message: finalError.message,
                stack: finalError.stack
            }
        };
        
        this.errorLog.push(failureEntry);
    }

    /**
     * Generate comprehensive error report
     * @returns {Object} Comprehensive error report
     */
    generateErrorReport() {
        const report = {
            summary: {
                totalErrors: this.errorLog.length,
                totalScreenshots: this.screenshots.length,
                recoverySuccesses: this.errorLog.filter(e => e.recovered).length,
                finalFailures: this.errorLog.filter(e => e.finalFailure).length,
                generatedAt: new Date().toISOString()
            },
            errors: this.errorLog,
            screenshots: this.screenshots,
            recommendations: this.generateRecommendations()
        };
        
        // Save report to file
        const reportPath = path.join(this.reportsDir, `error-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`📊 Error report generated: ${reportPath}`);
        return report;
    }

    /**
     * Generate recommendations based on error patterns
     * @returns {Array} Array of recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        
        // Analyze error patterns
        const errorTypes = {};
        this.errorLog.forEach(entry => {
            if (entry.error && entry.error.message) {
                const errorType = this.categorizeError(entry.error.message);
                errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
            }
        });
        
        // Generate recommendations based on patterns
        Object.entries(errorTypes).forEach(([type, count]) => {
            if (count > 2) {
                switch (type) {
                    case 'timing':
                        recommendations.push(`Consider increasing wait times - ${count} timing-related errors detected`);
                        break;
                    case 'element':
                        recommendations.push(`Review element selectors - ${count} element-not-found errors detected`);
                        break;
                    case 'network':
                        recommendations.push(`Improve network error handling - ${count} network errors detected`);
                        break;
                    default:
                        recommendations.push(`Investigate ${type} errors - ${count} occurrences`);
                }
            }
        });
        
        return recommendations;
    }

    /**
     * Categorize error based on message
     * @param {string} errorMessage - Error message to categorize
     * @returns {string} Error category
     */
    categorizeError(errorMessage) {
        const message = errorMessage.toLowerCase();
        
        if (message.includes('timeout') || message.includes('wait')) {
            return 'timing';
        } else if (message.includes('element') || message.includes('selector')) {
            return 'element';
        } else if (message.includes('network') || message.includes('connection')) {
            return 'network';
        } else if (message.includes('session') || message.includes('webdriver')) {
            return 'webdriver';
        } else {
            return 'other';
        }
    }

    /**
     * Sleep utility
     * @param {number} ms - Milliseconds to sleep
     */
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clean up error recovery manager
     */
    cleanup() {
        if (this.errorLog.length > 0 || this.screenshots.length > 0) {
            this.generateErrorReport();
        }
        
        console.log(`🧹 Error recovery manager cleanup - ${this.errorLog.length} errors logged`);
    }
}

module.exports = ErrorRecoveryManager;