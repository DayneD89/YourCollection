@frontend @auth @core @parallel @fast @full
Feature: Successful Login Scenarios
  As a user
  I want to login successfully
  So that I can access my account

  @smoke @parallel @fast @full
  Scenario: User login with valid credentials
    Given I have a test user with strong password "UserPass123@"
    And I am on the login page
    When I enter the test user email as email
    And I enter the test user password as password
    And I click the login button
    Then I should be redirected to the dashboard
    And I should see a welcome message

  @smoke @parallel @fast @full
  Scenario: Admin login with valid credentials
    Given I am on the login page
    When I enter admin credentials
    And I click the login button
    Then I should be redirected to the dashboard
    And I should see admin navigation options