const { By, until } = require('selenium-webdriver');

class PasswordChangePage {
    constructor(driver) {
        this.driver = driver;
        this.url = 'http://localhost:3000/change-password';
        
        // Selectors - use exact IDs from the React component
        this.currentPasswordInput = By.id('currentPassword');
        this.newPasswordInput = By.id('newPassword');
        this.confirmPasswordInput = By.id('confirmPassword');
        this.changePasswordButton = By.css('button[type="submit"]');
        this.successMessage = By.css('.success, .success-message, [data-testid="success"], .alert-success, .text-green-600');
        this.errorMessage = By.css('.text-red-600');
        this.requirementMessage = By.css('.bg-yellow-100, .bg-blue-100, p');
    }

    async navigateTo() {
        await this.driver.get(this.url);
        await this.driver.wait(until.elementLocated(this.changePasswordButton), 10000);
    }

    async enterCurrentPassword(password) {
        const currentPasswordField = await this.driver.wait(until.elementLocated(this.currentPasswordInput), 10000);
        await currentPasswordField.clear();
        await currentPasswordField.sendKeys(password);
    }

    async enterNewPassword(password) {
        const newPasswordField = await this.driver.wait(until.elementLocated(this.newPasswordInput), 10000);
        await newPasswordField.clear();
        await newPasswordField.sendKeys(password);
    }

    async enterConfirmPassword(password) {
        const confirmPasswordField = await this.driver.wait(until.elementLocated(this.confirmPasswordInput), 10000);
        await confirmPasswordField.clear();
        await confirmPasswordField.sendKeys(password);
    }

    async clickChangePassword() {
        const changePasswordBtn = await this.driver.wait(until.elementLocated(this.changePasswordButton), 10000);
        await this.driver.wait(until.elementIsEnabled(changePasswordBtn), 5000);
        await changePasswordBtn.click();
        // Small wait to allow form validation to trigger
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    async getSuccessMessage() {
        try {
            const successElement = await this.driver.wait(until.elementLocated(this.successMessage), 5000);
            return await successElement.getText();
        } catch (error) {
            return null;
        }
    }

    async getErrorMessage() {
        try {
            // Wait longer and be more specific about the error selector
            const errorElement = await this.driver.wait(until.elementLocated(this.errorMessage), 10000);
            const errorText = await errorElement.getText();
            console.log(`🔍 Found password change error message: "${errorText}"`);
            return errorText;
        } catch (error) {
            console.log('⚠️  No error message found on password change page');
            return null;
        }
    }

    async getRequirementMessage() {
        try {
            const requirementElement = await this.driver.wait(until.elementLocated(this.requirementMessage), 5000);
            return await requirementElement.getText();
        } catch (error) {
            return null;
        }
    }

    async getCurrentUrl() {
        return await this.driver.getCurrentUrl();
    }

    async waitForPageLoad() {
        await this.driver.wait(until.elementLocated(this.changePasswordButton), 10000);
    }
}

module.exports = PasswordChangePage;