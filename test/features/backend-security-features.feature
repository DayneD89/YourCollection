@backend @security @integration @fast @full
Feature: Backend Security Features and Headers
  As a security-conscious API
  I want to implement proper security measures
  So that the system is protected against common attacks

  Background:
    Given the backend API is running

  @backend @security @integration @fast @full
  Scenario: CORS preflight request handled properly
    When I send OPTIONS request to login endpoint
    Then the CORS preflight should be handled properly
    And I should receive successful or no content response
    And CORS headers should be present

  @smoke @backend @security @integration @fast @full
  Scenario: Security headers present in API responses
    When I request the health endpoint
    Then I should receive successful response
    And the response should contain security headers
    And security headers should include content type options or frame options