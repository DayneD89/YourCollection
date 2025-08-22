@frontend @core @admin @security @self-protection
Feature: Admin Self-Account Protection
  As an admin user of the Party Collection application
  I should not be able to edit or delete my own admin account
  So that administrative accounts are protected from accidental self-modification

  Background:
    Given I am logged in as admin
    And I should be redirected to the dashboard
    And I should see admin navigation options

  @core @admin @security @self-protection @fast @full
  Scenario: Admin cannot edit or delete their own account
    When I navigate to the user management page
    Then I should not see edit or delete options for my own admin account

  @core @admin @security @self-protection @extended @full
  Scenario: Admin can manage other users but not their own account
    When I navigate to the user management page
    Then I should not see edit or delete options for my own admin account
    # Create another user to verify admin can still manage others
    When I click the "Create New User" button
    And I enter a unique test user email
    And I enter "TestUser123@" as user password
    And I enter "Test User" as user display name
    And I set user role to "user"
    And I click the "Create User" button
    Then I should see a success message "User created successfully"
    And the created user should appear in the user list
    # Verify admin can manage the other user
    And I should see edit or delete options for the created user
    # Cleanup
    When I delete the created user
    And I confirm the deletion
    Then I should see a success message "User deleted successfully"

  @core @admin @security @self-protection @full
  Scenario: Debug admin self-protection when inconsistent
    When I navigate to the user management page
    Then I should not see edit or delete options for my own admin account
    # This scenario can be run in debug mode to investigate inconsistent behavior
    # Run with: HEADLESS=false DEBUG=true TAGS="@self-protection and @debug" npm test

  @core @admin @security @self-protection @edge-case @fast @full
  Scenario: Admin self-protection persists after page refresh
    When I navigate to the user management page
    Then I should not see edit or delete options for my own admin account
    When I refresh the page
    And I wait for the page to load
    Then I should not see edit or delete options for my own admin account

  @core @admin @security @self-protection @edge-case @extended @full
  Scenario: Admin self-protection after creating another admin user
    When I navigate to the user management page
    Then I should not see edit or delete options for my own admin account
    # Create another admin user to test if it affects current user protection
    When I click the "Create New User" button
    And I enter a unique test user email
    And I enter "AdminUser123@" as user password
    And I enter "Test Admin" as user display name
    And I set user role to "admin"
    And I click the "Create User" button
    Then I should see a success message "User created successfully"
    # Verify original admin still cannot manage their own account
    And I should not see edit or delete options for my own admin account
    # But can manage the new admin user
    And I should see edit or delete options for the created user
    # Cleanup
    When I delete the created user
    And I confirm the deletion
    Then I should see a success message "User deleted successfully"

  @core @admin @security @self-protection @extended @full
  Scenario: Admin self-protection under stress conditions
    When I navigate to the user management page
    Then I should not see edit or delete options for my own admin account
    # Create multiple users quickly and verify protection persists
    When I click the "Create New User" button
    And I enter a unique test user email
    And I enter "TestUser123@" as user password
    And I enter "Test User 1" as user display name
    And I set user role to "user"
    And I click the "Create User" button
    Then I should see a success message "User created successfully"
    And I should not see edit or delete options for my own admin account
    When I click the "Create New User" button
    And I enter a unique test user email
    And I enter "TestUser123@" as user password
    And I enter "Test User 2" as user display name
    And I set user role to "user"
    And I click the "Create User" button
    Then I should see a success message "User created successfully"
    And I should not see edit or delete options for my own admin account
    # Cleanup all created users
    When I delete all created test users
    Then I should see success messages for all deletions
    And I should not see edit or delete options for my own admin account