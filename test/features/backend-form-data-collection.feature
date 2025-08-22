@backend @survey @auth @extended @slow @full
Feature: Backend Form Data Collection and Storage
  As a system that collects public information
  I want to handle form submissions properly
  So that data is stored securely and validated correctly

  Background:
    Given the backend API is running
    And I have a test user with authentication token

  @smoke @backend @survey @auth @slow @full
  Scenario: Valid form data submission succeeds
    When I submit valid form data with all required fields
    Then the form submission should succeed
    And I should receive a submission ID
    And the success message should confirm data was stored
    And the form table should be tracked for cleanup

  @backend @survey @error @auth @fast @full
  Scenario: Form submission with missing required fields fails validation
    When I submit form data missing required fields
    Then the form submission should fail with validation error
    And I should receive list of validation errors
    And the error message should mention validation failure

  @backend @survey @error @auth @fast @full
  Scenario: Form submission with invalid data types fails validation
    When I submit form data with invalid data types
    Then the form submission should fail with validation error
    And I should receive type validation errors
    And the response should indicate data type issues

  @backend @survey @admin @auth @fast @full
  Scenario: Admin can retrieve form information
    Given I am authenticated as admin
    When I request form information
    Then I should receive successful response
    And I should get form table name and schema hash
    And I should receive form schema details

  @backend @survey @admin @auth @fast @full
  Scenario: Admin can retrieve form submissions
    Given I am authenticated as admin
    When I request form submissions
    Then I should receive successful response
    And I should get list of submissions
    And I should receive pagination information including total count

  @backend @survey @security @auth @error @fast @full
  Scenario: Non-admin cannot access form information
    When I try to access form information with regular user token
    Then the request should be denied
    And I should receive access forbidden error
    And the response should indicate insufficient permissions

  @backend @survey @security @auth @error @fast @full
  Scenario: Non-admin cannot access form submissions
    When I try to access form submissions with regular user token
    Then the request should be denied
    And I should receive access forbidden error
    And the response should indicate insufficient permissions