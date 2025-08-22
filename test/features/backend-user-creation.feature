@backend @admin @auth @core @fast @full
Feature: Backend User Creation
  As an administrator using the backend API
  I want to create new users
  So that they can access the system

  Background:
    Given the backend API is running
    And I am authenticated as admin

  @smoke @backend @admin @fast @full
  Scenario: Create user with weak password
    When I create a test user with weak password
    Then the user creation should succeed
    And the user should be added to cleanup list
    And the user should be created with correct details

  @backend @admin @fast @full
  Scenario: Create user with strong password
    When I create a test user with strong password
    Then the user creation should succeed
    And the user should be added to cleanup list
    And the user should be created with correct details

  @backend @admin @fast @full
  Scenario: Create admin user
    When I create a test admin user
    Then the admin user creation should succeed
    And the admin user should be added to cleanup list
    And the admin user should be created with correct role