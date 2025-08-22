@frontend @auth @core @parallel @fast @full
Feature: Basic User Login
  As a user
  I want to log into the application
  So that I can access protected features

  @smoke @parallel @fast @full
  Scenario: Successful login with valid user credentials
    Given I have a test user account
    When I login with valid credentials
    Then I should be redirected to the dashboard
    And I should see welcome content

  @smoke @parallel @fast @full
  Scenario: Successful admin login
    When I login with admin credentials
    Then I should be redirected to the dashboard
    And I should see admin navigation options

  @core @parallel @fast @full
  Scenario: Login shows loading states
    Given I have a test user account
    When I enter credentials and click login
    Then I should see loading indication
    And I should be redirected after loading completes