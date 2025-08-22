@frontend @admin @core @sequential @fast @full
Feature: Admin Created User Login Verification
  As an admin of the Party Collection application
  I want to verify that created users can actually log in
  So that user creation is functionally complete

  @core @admin @sequential @fast @full
  Scenario: Created user can log in successfully
    Given I am logged in as admin
    Then I should be redirected to the dashboard
    And I should see admin navigation options
    When I navigate to the user management page
    When I click the "Create New User" button
    And I enter a unique test user email
    And I enter "TestUser123@" as user password
    And I enter "Test User" as user display name
    And I set user role to "user"
    And I click the "Create User" button
    Then I should see a success message "User created successfully"
    And the created user should appear in the user list
    # Test that created user can log in
    When I log out of the admin account
    And I am on the login page
    And I login with the created user credentials
    Then I should be redirected to the dashboard
    And I should see a welcome message
    And I should not see admin navigation options
    # Admin logs back in and cleans up
    When I click the logout button
    And I am on the login page
    And I enter admin credentials
    And I click the login button
    And I navigate to the user management page
    And I delete the created user
    And I confirm the deletion
    Then I should see a success message "User deleted successfully"
    And the deleted user should not appear in the user list