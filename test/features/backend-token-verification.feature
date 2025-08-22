@backend @auth @security @core @fast @full
Feature: Backend Token Verification
  As a system that uses JWT tokens
  I want to verify token validity
  So that I can ensure secure authentication

  Background:
    Given the backend API is running
    And I have a test user with valid authentication token

  @smoke @backend @auth @security @fast @full
  Scenario: Valid token verification succeeds
    When I verify the valid authentication token
    Then the token verification should succeed
    And I should receive successful verification response
    And the token should be confirmed as valid

  @backend @auth @security @error @fast @full
  Scenario: Invalid token verification fails correctly
    When I verify an invalid authentication token
    Then the token verification should fail
    And I should receive authentication failure response
    And the response should indicate token is invalid