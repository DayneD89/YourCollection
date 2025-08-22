@backend @auth @security @extended @slow @full
Feature: Backend JWT Token Expiration
  As a security-conscious system
  I want JWT tokens to expire properly
  So that I can prevent unauthorized access with old tokens

  Background:
    Given the backend API is running
    And I have a test user with valid authentication token

  @smoke @backend @auth @security @slow @full
  Scenario: Current valid token works before expiration
    When I verify the current valid authentication token
    Then the token verification should succeed
    And the token should be confirmed as valid

  @backend @auth @security @slow @full
  Scenario: Expired JWT token is properly rejected
    Given I create a short-lived token that expires in 1 second
    And I wait for the token to expire
    When I verify the expired token
    Then the token verification should fail
    And I should receive authentication failure response
    And the error message should indicate token is expired or invalid

  @backend @auth @security @slow @full
  Scenario: Expired token denied access to protected endpoints
    Given I create a short-lived token that expires in 1 second
    And I wait for the token to expire
    When I try to access protected form schema endpoint with expired token
    Then the request should be denied
    And I should receive access forbidden error
    And the error message should mention invalid token

  @backend @auth @security @error @fast @full
  Scenario: Malformed JWT token is properly rejected
    When I verify a malformed authentication token
    Then the token verification should fail
    And I should receive authentication failure response
    And the error message should indicate token is invalid or malformed

  @backend @auth @security @error @fast @full
  Scenario: Token with wrong secret is properly rejected
    Given I create a token signed with wrong secret
    When I verify the token with wrong secret
    Then the token verification should fail
    And I should receive authentication failure response
    And the error message should indicate token is invalid