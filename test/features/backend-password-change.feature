@backend @auth @security @core @fast @full
Feature: Backend Password Change Functionality
  As a user with authentication token
  I want to change my password through the API
  So that I can maintain account security

  Background:
    Given the backend API is running
    And I have a test user with strong password
    And I am authenticated with the test user token

  @backend @auth @security @error @fast @full
  Scenario: Password change with weak new password fails validation
    When I attempt to change password from strong to weak
    Then the password change should fail
    And I should receive validation error
    And I should receive a list of password issues
    And the current password should remain unchanged

  @smoke @backend @auth @security @fast @full
  Scenario: Password change with strong new password succeeds
    When I attempt to change password from strong to new strong password
    Then the password change should succeed
    And I should receive success confirmation
    And I should be able to login with new password