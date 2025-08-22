@frontend @core @auth @error @fast @full
Feature: Login Error Handling
  As a user
  I want clear feedback when login fails
  So that I understand what went wrong

  @core @auth @error @parallel @fast @full
  Scenario: Failed login with invalid email
    When I try to login with invalid email "nonexistent@example.com"
    Then I should see an error message
    And I should remain on the login page

  @core @auth @error @parallel @fast @full
  Scenario: Failed login with invalid password
    Given I have a test user account
    When I try to login with incorrect password
    Then I should see an error message
    And I should remain on the login page

  @core @auth @error @parallel @fast @full
  Scenario: Login form validates required fields
    When I try to login with empty fields
    Then I should see validation errors
    And the login button should be disabled or show errors