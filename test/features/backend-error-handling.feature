@backend @error @security @extended @slow @full
Feature: Backend Error Handling and Edge Cases
  As a robust API system
  I want to handle errors and edge cases gracefully
  So that the system remains stable under adverse conditions

  Background:
    Given the backend API is running

  @backend @error @extended @slow @full
  Scenario: Invalid JSON payload handled gracefully
    When I send invalid JSON to login endpoint
    Then the request should be handled gracefully
    And I should receive client error response
    And the server should not crash or reset connection

  @backend @error @auth @fast @full
  Scenario: Missing required fields in login returns proper error
    When I send login request missing password field
    Then I should receive validation error
    And the response should indicate missing password
    And the error message should mention password field

  @backend @error @security @auth @fast @full
  Scenario: Invalid email format returns security-conscious error
    When I send login request with invalid email format
    Then I should receive authentication failure
    And the response should indicate invalid credentials
    And the error should not reveal email format validation details

  @backend @error @security @fast @full
  Scenario: SQL injection attempt is properly blocked
    When I attempt SQL injection in login email field
    Then the request should be blocked or rejected
    And I should receive client error or authentication failure
    And the system should remain secure

  @backend @error @extended @slow @full
  Scenario: Extremely long input handled gracefully
    When I send extremely long string in login request
    Then the request should be handled without crashing
    And I should receive authentication failure for invalid credentials
    And the server should remain stable