@frontend @core @auth @fast @full
Feature: Login/Logout Flow
  As a user
  I want to login and logout correctly
  So that I can manage my session

  @core @auth @parallel @fast @full
  Scenario: User can logout after login
    Given I have a test user with strong password "UserPass123@"
    When I login with the test user credentials
    Then I should be redirected to the dashboard
    When I click the logout button
    Then I should be redirected to the login page

  @core @auth @admin @parallel @fast @full
  Scenario: Admin can logout after login
    Given I am on the login page
    When I enter admin credentials
    And I click the login button
    Then I should be redirected to the dashboard
    And I should see admin navigation options
    When I click the logout button
    Then I should be redirected to the login page