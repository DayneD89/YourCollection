@frontend @core @auth @fast @full
Feature: Login Error Scenarios
  As a system
  I want to handle login errors correctly
  So that security is maintained

  @core @auth @error @parallel @fast @full
  Scenario: Failed login with invalid email
    Given I am on the login page
    When I enter "invalid@example.com" as email
    And I enter "UserPass123@" as password
    And I click the login button
    Then I should see an error message "Invalid email or password"
    And I should remain on the login page

  @core @auth @error @parallel @fast @full
  Scenario: Failed login with wrong password
    Given I have a test user with strong password "UserPass123@"
    And I am on the login page
    When I enter the test user email as email
    And I enter "wrongpassword" as password
    And I click the login button
    Then I should see an error message "Invalid email or password"
    And I should remain on the login page

  @core @auth @error @parallel @fast @full
  Scenario: Failed login with empty fields
    Given I am on the login page
    When I click the login button
    Then I should see validation errors
    And I should remain on the login page