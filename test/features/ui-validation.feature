@frontend @core @ui @fast @full
Feature: UI Form Validation Testing
  As a user of the application
  I want proper form validation in the frontend
  So that I get clear feedback when I make mistakes

  @core @ui @parallel @fast @full
  Scenario: Admin user creation form validates required fields
    Given I am logged in as admin
    And I navigate to the user management page
    When I click the "Create New User" button
    And I try to submit without filling required fields
    Then I should see validation feedback for missing fields
    And the user should not be created

  @extended @ui @auth @sequential @slow @full
  Scenario: Password change form validates password requirements
    Given I have a test user with weak password "testuser123"
    And the test user is logged in with weak password redirect
    When I try to change password to "123" (too short)
    Then I should see appropriate validation feedback
    When I try to change password to "password" (no special chars)
    Then I should see password strength requirements
    When I enter a valid new password "ValidPassword123@"
    Then the form should accept the strong password

  @core @ui @admin @sequential @slow @full
  Scenario: UI feedback shows when operations are in progress
    Given I am logged in as admin
    And I navigate to the user management page
    When I click the "Create New User" button
    And I fill in valid user details
    And I click the "Create User" button
    Then I should see loading/progress indication during the operation
    And I should receive clear success feedback when complete