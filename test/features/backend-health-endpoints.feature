@backend @core @integration @fast @full
Feature: Backend Health and System Endpoints
  As a system administrator
  I want to check the health of the backend API
  So that I can monitor system status and ensure proper operation

  Background:
    Given the backend API is running

  @smoke @backend @integration @fast @full
  Scenario: Root endpoint provides basic API information
    When I request the root endpoint
    Then I should receive successful response
    And the response should contain API message
    And the response should contain version information
    And the response should indicate status as running

  @smoke @backend @integration @fast @full
  Scenario: Health endpoint returns proper health status
    When I request the health endpoint
    Then I should receive successful response
    And the response should indicate status as healthy
    And the response should contain timestamp
    And the response should contain database status

  @backend @integration @error @fast @full
  Scenario: Non-existent endpoint returns 404 status
    When I request a non-existent endpoint
    Then I should receive not found error
    And the response status should be 404