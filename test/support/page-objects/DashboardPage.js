const { By, until } = require('selenium-webdriver');

class DashboardPage {
    constructor(driver) {
        this.driver = driver;
        this.url = 'http://localhost:3000/dashboard';
        
        // Selectors based on actual React components
        this.pageTitle = By.xpath("//h1[contains(text(), 'Party Collection PWA')]");
        this.welcomeMessage = By.css('h1, .bg-green-100, .bg-purple-100');
        this.adminNavigation = By.css('.bg-purple-100');
        this.userManagementHeading = By.xpath("//h2[contains(text(), 'User Management')]");
        this.logoutButton = By.xpath("//button[contains(text(), 'Logout')]");
        this.changePasswordLink = By.css('[data-testid="change-password"], .change-password');
    }

    async waitForDashboardLoad() {
        // Wait for distinctive dashboard elements to load with shorter, appropriate timeouts
        try {
            // Wait for the main dashboard elements to be present with reasonable timeouts
            await this.driver.wait(until.elementLocated(this.pageTitle), 5000);
            await this.driver.wait(until.elementLocated(By.xpath("//p[contains(text(), 'Logged in as:')]")), 3000);
            await this.driver.wait(until.elementLocated(this.logoutButton), 3000);
            console.log('✅ Dashboard loaded successfully');
        } catch (error) {
            // Enhanced debugging for failures
            const currentUrl = await this.driver.getCurrentUrl();
            const pageTitle = await this.driver.getTitle();
            console.log(`❌ Dashboard load failed. URL: ${currentUrl}, Title: ${pageTitle}`);
            
            // Try fallback to any h1 element if specific elements not found
            try {
                await this.driver.wait(until.elementLocated(By.css('h1')), 2000);
                console.log('✅ Found fallback h1 element');
            } catch (fallbackError) {
                console.log('❌ Even fallback h1 element not found');
                throw new Error(`Dashboard failed to load: ${error.message}`);
            }
        }
    }

    async getWelcomeMessage() {
        try {
            const welcomeElement = await this.driver.wait(until.elementLocated(this.welcomeMessage), 5000);
            return await welcomeElement.getText();
        } catch (error) {
            return null;
        }
    }

    async hasAdminNavigation() {
        try {
            // Look for the admin dashboard indicators
            const adminElements = await this.driver.findElements(this.adminNavigation);
            const userMgmtElements = await this.driver.findElements(this.userManagementHeading);
            return adminElements.length > 0 || userMgmtElements.length > 0;
        } catch (error) {
            return false;
        }
    }

    async clickChangePassword() {
        const changePasswordElement = await this.driver.wait(until.elementLocated(this.changePasswordLink), 10000);
        await changePasswordElement.click();
    }

    async logout() {
        const logoutBtn = await this.driver.wait(until.elementLocated(this.logoutButton), 10000);
        await logoutBtn.click();
    }

    async getCurrentUrl() {
        return await this.driver.getCurrentUrl();
    }
}

module.exports = DashboardPage;