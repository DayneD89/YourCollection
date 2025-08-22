@frontend @core @admin @ui @slow @full
Feature: Frontend UI Feedback Testing
  As an administrator
  I want clear UI feedback for all admin operations
  So that I know when operations succeed or fail

  Background:
    Given I am logged in as admin

  @core @admin @ui @sequential @slow @full
  Scenario: Admin user creation shows proper success feedback
    When I navigate to the user management page
    And I click the "Create New User" button
    And I enter a unique test user email
    And I enter "TestPassword123@" as user password
    And I enter "Test User" as user display name
    And I set user role to "user"
    And I click the "Create User" button
    Then I should see a success message "User created successfully"
    And the created user should appear in the user list
    And the form should be cleared and hidden

  @core @admin @ui @sequential @slow @full
  Scenario: Admin password reset shows proper success feedback
    Given I have created a test user via admin interface
    When I click reset password for the created user
    And I confirm the password reset
    Then I should see a success message that includes "Password reset successfully"
    And I should see the new password displayed in the message

  @core @admin @ui @sequential @slow @full
  Scenario: Admin user deletion shows proper success feedback
    Given I have created a test user via admin interface
    When I delete the created user
    And I confirm the deletion
    Then I should see a success message "User deleted successfully"
    And the deleted user should not appear in the user list