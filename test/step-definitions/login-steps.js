const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

const LoginPage = require('../support/page-objects/LoginPage');
const DashboardPage = require('../support/page-objects/DashboardPage');
const PasswordChangePage = require('../support/page-objects/PasswordChangePage');

Before({ tags: '@login or @password-change' }, async function() {
    const options = new chrome.Options();
    
    // Configure Chrome options based on environment
    const isHeadless = process.env.HEADLESS !== 'false';
    const isDebug = process.env.DEBUG === 'true';
    
    if (isHeadless) {
        options.addArguments('--headless=new');  // Use new headless mode
    }
    
    // Essential options
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');
    
    // Additional options for React/Next.js applications
    options.addArguments('--disable-features=VizDisplayCompositor');
    options.addArguments('--disable-background-timer-throttling');
    options.addArguments('--disable-backgrounding-occluded-windows');
    options.addArguments('--disable-renderer-backgrounding');
    options.addArguments('--allow-running-insecure-content');
    options.addArguments('--disable-ipc-flooding-protection');
    
    // Ensure JavaScript execution
    options.addArguments('--enable-javascript');
    options.addArguments('--js-flags=--max-old-space-size=4096');
    
    // Additional options for better parallel execution stability
    options.addArguments('--disable-extensions');
    options.addArguments('--disable-plugins');
    options.addArguments('--disable-images');
    options.addArguments('--disable-default-apps');
    options.addArguments('--disable-background-networking');
    options.addArguments('--disable-sync');
    options.addArguments('--disable-translate');
    options.addArguments('--disable-web-security');
    options.addArguments('--memory-pressure-off');
    options.addArguments('--max_old_space_size=4096');
    
    if (isDebug) {
        options.addArguments('--auto-open-devtools-for-tabs');
    }
    
    // Add retry logic for WebDriver session creation in parallel mode
    let retries = 3;
    while (retries > 0) {
        try {
            this.driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(options)
                .build();
            break; // Success, exit retry loop
        } catch (error) {
            retries--;
            console.log(`⚠️ WebDriver session creation failed, ${retries} retries remaining`);
            if (retries === 0) {
                console.log('❌ Failed to create WebDriver session after all retries');
                throw error;
            }
            // Wait a random amount of time between 1-3 seconds to reduce contention
            const delay = Math.random() * 2000 + 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
        
    // Mark this driver as created by tag hooks so other cleanup doesn't interfere
    this.driver._tagHookCreated = true;
        
    this.loginPage = new LoginPage(this.driver);
    this.dashboardPage = new DashboardPage(this.driver);
    this.passwordChangePage = new PasswordChangePage(this.driver);
    
    // Set implicit wait
    await this.driver.manage().setTimeouts({ implicit: 5000 });
});

After({ tags: '@login or @password-change' }, async function() {
    if (this.driver) {
        try {
            await this.driver.quit();
        } catch (error) {
            if (error.name === 'NoSuchSessionError' || error.message.includes('session ID')) {
                console.log('ℹ️  WebDriver session was already closed');
            } else {
                console.log(`⚠️  Warning during tag-specific WebDriver cleanup: ${error.message}`);
            }
        }
    }
});

// Background steps
Given('I am logged in as {string} with password {string}', async function(email, password) {
    await this.loginPage.navigateTo();
    await this.loginPage.enterEmail(email);
    await this.loginPage.enterPassword(password);
    await this.loginPage.clickLogin();
    await this.dashboardPage.waitForDashboardLoad();
});


Given('a user with email {string} and weak password {string} exists', async function(email, password) {
    // This step assumes the user exists in the test database
    // In a real scenario, you might need to create the user via API call
    console.log(`Assuming user ${email} exists with weak password for testing`);
});

// When steps
When('I enter {string} as current password', async function(password) {
    await this.passwordChangePage.enterCurrentPassword(password);
});

// Then steps (password change specific implementations remain here)