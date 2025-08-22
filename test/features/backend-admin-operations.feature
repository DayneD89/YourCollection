@backend @admin @auth @core @fast @full
Feature: Backend Admin-Only Operations
  As an administrator using the backend API
  I want to perform administrative operations
  So that I can manage users and system resources

  Background:
    Given the backend API is running
    And I have created test users
    And I am authenticated as admin

  @smoke @backend @admin @fast @full
  Scenario: Admin can list all users
    When I request the list of users
    Then I should receive a successful response
    And I should see a list of users
    And the user list should include created test users
    And the user count should be at least the number of test users

  @backend @admin @security @fast @full
  Scenario: Admin can reset user password
    When I reset password for a test user
    Then the password reset should succeed
    And I should receive a new temporary password
    And the new password should be provided in response

  @backend @admin @security @error @fast @full
  Scenario: Non-admin user cannot access admin operations
    Given I have a regular user token
    When I attempt to list users with regular user token
    Then the request should be denied
    And I should receive access forbidden error
    And the response should indicate insufficient permissions