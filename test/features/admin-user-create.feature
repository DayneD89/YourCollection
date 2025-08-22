@frontend @core @admin @fast @full
Feature: Admin User Creation (Micro-scenario)
  As an admin
  I want to create users quickly
  So that I can manage the system efficiently

  @core @admin @sequential @slow @full
  Scenario: Admin creates user successfully
    Given I am logged in as admin
    When I navigate to the user management page
    Then I should not see edit or delete options for my own admin account
    When I click the "Create New User" button
    And I enter a unique test user email
    And I enter "TestUser123@" as user password
    And I enter "Test User" as user display name
    And I set user role to "user"
    And I click the "Create User" button
    Then I should see a success message "User created successfully"
    And the created user should appear in the user list
    And the user should have role "user"
    # Cleanup immediately
    When I delete the created user
    And I confirm the deletion
    Then I should see a success message "User deleted successfully"