@frontend @auth @extended @integration @full
Feature: User Login
  As a user of the Party Collection application
  I want to be able to log in with my credentials
  So that I can access my account and manage parties

  Background:
    Given I am on the login page

  @smoke @parallel @fast @full
  Scenario: Successful login with valid credentials
    Given I have a test user with strong password "UserPass123@"
    When I enter the test user email as email
    And I enter the test user password as password
    And I click the login button
    Then I should be redirected to the dashboard
    And I should see a welcome message

  @smoke @parallel @fast @full
  Scenario: Successful admin login
    When I enter admin credentials
    And I click the login button
    Then I should be redirected to the dashboard
    And I should see admin navigation options

  @smoke @parallel @fast @full
  Scenario: Failed login with invalid email
    When I enter "invalid@example.com" as email
    And I enter "UserPass123@" as password
    And I click the login button
    Then I should see an error message "Invalid email or password"
    And I should remain on the login page

  @smoke @parallel @fast @full
  Scenario: Failed login with invalid password
    Given I have a test user with strong password "UserPass123@"
    When I enter the test user email as email
    And I enter "wrongpassword" as password
    And I click the login button
    Then I should see an error message "Invalid email or password"
    And I should remain on the login page

  @smoke @parallel @fast @full
  Scenario: Failed login with empty fields
    When I click the login button
    Then I should see validation errors
    And I should remain on the login page

  @core @parallel @fast @full
  Scenario: Password change required for weak password
    Given I have a test user with weak password "weak123"
    When I enter the test user email as email
    And I enter the test user password as password
    And I click the login button
    Then I should be redirected to the password change page
    And I should see a message "Your password needs to be updated to meet security requirements"

  @smoke @parallel @fast @full
  Scenario: User can logout and return to login page
    Given I have a test user with strong password "UserPass123@"
    When I enter the test user email as email
    And I enter the test user password as password
    And I click the login button
    Then I should be redirected to the dashboard
    When I click the logout button
    Then I should be redirected to the login page

  @smoke @parallel @fast @full
  Scenario: Admin can logout and return to login page
    When I enter admin credentials
    And I click the login button
    Then I should be redirected to the dashboard
    And I should see admin navigation options
    When I click the logout button
    Then I should be redirected to the login page

  @core @parallel @fast @full
  Scenario: Loading states work correctly during authentication
    Given I have a test user with strong password "UserPass123@"
    When I enter the test user email as email
    And I enter the test user password as password
    And I click the login button
    Then I should see "Signing in..." loading message briefly
    And I should be redirected to the dashboard
    And I should see a welcome message