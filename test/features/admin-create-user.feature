@frontend @core @admin @fast @full
Feature: Admin User Creation
  As an admin
  I want to create new users
  So that I can manage application access

  @smoke @admin @sequential @fast @full
  Scenario: Admin can create a basic user
    Given I am logged in as admin
    When I create a new user with email "test@example.com" and password "TestPass123@"
    Then the user should be created successfully
    And the user should appear in the user list

  @core @admin @sequential @fast @full
  Scenario: Admin can create a user with admin role
    Given I am logged in as admin
    When I create a new user with admin role
    Then the user should be created with admin privileges
    And the user should appear in the user list

  @core @admin @parallel @fast @full
  Scenario: User creation validates required fields
    Given I am logged in as admin
    When I try to create a user without required fields
    Then I should see validation errors
    And no user should be created

  @core @admin @ui @sequential @fast @full
  Scenario: User creation shows loading and success feedback
    Given I am logged in as admin
    When I create a new user
    Then I should see loading indication during creation
    And I should see success feedback when complete