@frontend @core @security @fast @full
Feature: Route Protection and Security
  As a security-conscious application
  I want to ensure all routes are properly protected
  So that unauthorized users cannot access restricted content

  @core @security @parallel @fast @full
  Scenario: Direct URL access to dashboard without authentication
    Given I am not logged in
    When I try to navigate directly to "/dashboard"
    Then I should be redirected to the login page
    And I should see a login form
    And I should not see dashboard content

  @core @security @parallel @fast @full
  Scenario: Direct URL access to survey form without authentication
    Given I am not logged in
    When I try to navigate directly to "/survey"
    Then I should be redirected to the login page
    And I should see a login form
    And I should not see survey form content

  @core @security @parallel @fast @full
  Scenario: Direct URL access to password change without authentication
    Given I am not logged in
    When I try to navigate directly to "/change-password"
    Then I should be redirected to the login page
    And I should see a login form
    And I should not see password change form

  @extended @security @auth @parallel @slow @full
  Scenario: Token expiration during active session
    Given I am logged in as a regular user
    And I am on the dashboard page
    When my authentication token expires
    And I try to access the survey form without authentication
    Then I should be redirected to the login page
    And I should see a message indicating session expired

  @core @security @admin @parallel @fast @full
  Scenario: Regular user cannot access admin-only functions
    Given I am logged in as a regular user
    And I am on the dashboard page
    Then I should not see admin navigation options
    And I should not see user management options
    And I should not see create user buttons

  @core @security @admin @parallel @fast @full
  Scenario: Admin user can access all functions
    Given I am logged in as admin
    And I am on the dashboard page
    Then I should see admin navigation options
    And I should see user management functionality
    And I should see create user buttons

  @extended @security @parallel @slow @full
  Scenario: URL manipulation attempts are blocked
    Given I am logged in as a regular user
    When I manually change the URL to admin-only paths
    Then I should remain on appropriate user pages
    And I should not see admin functionality
    And no unauthorized API calls should be made