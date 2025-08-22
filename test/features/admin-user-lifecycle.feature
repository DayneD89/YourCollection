@frontend @admin @core @parallel @fast @full
Feature: Admin User Lifecycle Management
  As an admin of the Party Collection application
  I want to create and delete users through the frontend interface
  So that I can manage user accounts

  @core @admin @parallel @fast @full
  Scenario: Admin creates user and deletes user
    Given I am logged in as admin
    Then I should be redirected to the dashboard
    And I should see admin navigation options
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
    # Clean up created user
    When I delete the created user
    And I confirm the deletion
    Then I should see a success message "User deleted successfully"
    And the deleted user should not appear in the user list

  @core @admin @parallel @fast @full
  Scenario: Loading states work during admin operations
    Given I am logged in as admin
    Then I should be redirected to the dashboard
    And I should see admin navigation options
    When I navigate to the user management page
    Then I should not see edit or delete options for my own admin account
    When I click the "Create New User" button
    And I enter a unique test user email
    And I enter "TestUser123@" as user password
    And I enter "Test User" as user display name
    And I set user role to "user"
    And I click the "Create User" button
    Then I should see loading indication during the operation
    And I should receive clear success feedback when complete
    And the created user should appear in the user list
    # Cleanup the test user
    When I delete the created user
    And I confirm the deletion
    Then I should see a success message "User deleted successfully"