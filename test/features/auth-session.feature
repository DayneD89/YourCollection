@frontend @core @auth @fast @full
Feature: Authentication Session Management
  As a user of the application
  I want my authentication session to be properly managed
  So that I have a consistent and secure experience across browser interactions

  Background:
    Given I am on the application

  @core @auth @parallel @fast @full
  Scenario: User remains logged in after browser refresh
    Given I have a test user with strong password "UserPass123@"
    When I login with the test user credentials
    Then I should be redirected to the dashboard
    And I should see a welcome message
    When I refresh the browser page
    Then I should remain logged in and see my dashboard
    And my user information should still be available
    And I should not be redirected to the login page

  @core @auth @parallel @fast @full
  Scenario: Invalid token redirects to login appropriately
    Given I have a test user with strong password "UserPass123@"
    When I login with the test user credentials
    Then I should be redirected to the dashboard
    # Simulate invalid/expired token
    When my authentication token becomes invalid
    And I try to navigate to a protected page
    Then I should be redirected to the login page
    And my session should be cleanly cleared
    And I should see the login form

  @core @auth @parallel @fast @full @report-error
  Scenario: Logout properly clears all session data
    Given I have a test user with strong password "UserPass123@"
    When I login with the test user credentials
    Then I should be redirected to the dashboard
    When I click the logout button
    Then I should be redirected to the login page
    And all authentication data should be cleared from browser storage
    And I should not be able to access protected pages
    When I try to visit the dashboard directly
    Then I should be redirected to the login page

  @core @auth @security @parallel @fast @full
  Scenario: Direct access to protected pages requires authentication
    Given I am not logged in
    When I try to visit the dashboard directly
    Then I should be redirected to the login page
    When I try to visit the survey page directly
    Then I should be redirected to the login page
    When I try to visit the password change page directly
    Then I should be redirected to the login page