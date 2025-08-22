@frontend @auth @extended @sequential @full
Feature: Password Change Workflows (Real Browser)
  As a user with password security requirements
  I want to be able to change my password when required
  So that my account remains secure

  Background:
    Given I have a test user with weak password

  @extended @sequential @slow @full
  Scenario: User with weak password must change it and new password works
    Given I am on the login page
    When I enter the test user email as email
    And I enter the test user password as password
    And I click the login button
    Then I should be redirected to the password change page
    And I should see a message "Your password needs to be updated to meet security requirements"
    When I enter the test user password as current password
    And I enter "Password123#" as new password
    And I enter "Password123#" as confirm password
    And I click the change password button
    Then I should see a success message "Password changed successfully"
    And I should be redirected to the dashboard
    # Verify new password works as ongoing password
    When I click the logout button
    And I am on the login page
    And I enter the test user email as email
    And I enter "Password123#" as password
    And I click the login button
    Then I should be redirected to the dashboard
    And I should see a welcome message

  @core @parallel @fast @full
  Scenario: Password change form validation works correctly
    Given I am on the login page
    When I enter the test user email as email
    And I enter the test user password as password
    And I click the login button
    Then I should be redirected to the password change page
    # Test mismatched passwords
    When I enter the test user password as current password
    And I enter "NewPassword123#" as new password
    And I enter "DifferentPassword123#" as confirm password
    And I click the change password button
    Then I should see an error message "New passwords do not match"
    And I should remain on the password change page
    # Test correct password change
    When I enter the test user password as current password
    And I enter "CorrectNewPassword123#" as new password
    And I enter "CorrectNewPassword123#" as confirm password
    And I click the change password button
    Then I should see a success message "Password changed successfully"
    And I should be redirected to the dashboard