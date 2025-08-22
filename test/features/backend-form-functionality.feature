@backend @survey @auth @security @extended @slow @full
Feature: Backend YAML Form Functionality
  As a system that uses YAML-configured forms
  I want to properly handle form schema and submissions
  So that forms work correctly with authentication and validation

  Background:
    Given the backend API is running

  @backend @survey @auth @security @error @fast @full
  Scenario: Unauthenticated access to form schema fails
    When I try to access form schema without authentication
    Then the request should be denied
    And I should receive authentication failure
    And the error message should mention missing or invalid token

  @smoke @backend @survey @auth @fast @full
  Scenario: Authenticated access to form schema succeeds
    Given I have a test user with authentication token
    When I request form schema with authentication
    Then the request should succeed
    And I should receive form schema with title and description
    And the form schema should contain fields array

  @backend @survey @auth @fast @full
  Scenario: Form schema has required structure and validation
    Given I have a test user with authentication token
    When I request form schema with authentication
    Then the form schema should have title, description, and fields
    And all form fields should have required properties name, type, and label
    And the form schema should contain at least one required field

  @backend @survey @auth @security @error @fast @full
  Scenario: Unauthenticated form submission fails
    When I try to submit form data without authentication
    Then the request should be denied
    And I should receive authentication failure
    And the error message should mention missing or invalid token

  @backend @survey @auth @error @fast @full
  Scenario: Form submission validation works correctly
    Given I have a test user with authentication token
    When I submit incomplete form data with authentication
    Then the form submission should fail with validation error
    And the error message should mention validation
    And the validation should no longer be placeholder

  @smoke @backend @survey @auth @slow @full
  Scenario: Valid form submission succeeds with real data storage
    Given I have a test user with authentication token
    When I submit complete valid form data
    Then the form submission should succeed
    And I should receive a submission ID confirming real data storage
    And the response should indicate successful data persistence

  @backend @survey @auth @fast @full
  Scenario: Authenticated user can access sensitive fields configuration
    Given I have a test user with authentication token
    When I request sensitive fields configuration
    Then the request should succeed
    And I should receive sensitive fields data
    And the response should contain field sensitivity information

  @backend @survey @auth @security @error @fast @full
  Scenario: Unauthenticated access to sensitive fields fails
    When I try to access sensitive fields without authentication
    Then the request should be denied
    And I should receive authentication failure
    And the error message should mention missing or invalid token

  @backend @survey @auth @error @fast @full
  Scenario: Empty form submission fails validation
    Given I have a test user with authentication token
    When I submit empty form data
    Then the form submission should fail with validation error
    And I should receive validation errors array
    And the validation should no longer be placeholder