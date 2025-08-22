@frontend @core @auth @fast @full
Feature: Authentication Context Management
  As a user of the authentication system
  I want reliable authentication state management
  So that my login sessions work correctly and securely

  @core @auth @parallel @fast @full
  Scenario: Authentication token is stored and retrieved correctly
    Given I am on the login page
    When I login with valid user credentials
    Then an authentication token should be stored in localStorage
    And the auth context should show me as authenticated
    And subsequent API calls should include the authentication token

  @core @auth @parallel @fast @full
  Scenario: Authentication context handles API authentication failures
    Given I am logged in as a regular user
    And I am on the dashboard page
    When the server returns a 401 authentication error
    Then I should be automatically logged out
    And I should be redirected to the login page
    And the authentication token should be cleared from localStorage

  @core @auth @parallel @fast @full
  Scenario: Logout clears all authentication data
    Given I am logged in as a regular user
    And I am on the dashboard page
    When I click the logout button
    Then the authentication token should be removed from localStorage
    And the auth context should show me as not authenticated
    And I should be redirected to the login page
    And no user data should remain in memory

  @core @auth @parallel @fast @full
  Scenario: User remains logged in after browser refresh
    Given I am logged in as a regular user
    And I am on the dashboard page
    When I refresh the browser page
    Then I should remain logged in
    And I should still be on the dashboard page
    And my user information should still be available

  @extended @auth @parallel @fast @full
  Scenario: Invalid token is handled gracefully
    Given I have an invalid authentication token in localStorage
    When I visit the application
    Then I should be treated as not authenticated
    And I should be redirected to the login page
    And the invalid token should be cleared from localStorage

  @extended @auth @parallel @slow @full
  Scenario: Multiple tab logout synchronization
    Given I am logged in in multiple browser tabs
    When I logout from one tab
    Then all other tabs should also be logged out
    And all tabs should redirect to the login page

  @extended @auth @admin @sequential @slow @full
  Scenario: User role changes are reflected in context
    Given I am logged in as a regular user
    When an admin changes my role to admin
    And I refresh my session
    Then my role should be updated in the auth context
    And I should see admin functionality become available