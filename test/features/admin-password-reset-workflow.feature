@frontend @admin @extended @sequential @slow @full
Feature: Admin Password Reset Workflow
  As an admin of the Party Collection application
  I want to reset user passwords and verify the reset process works
  So that users can regain access to their accounts

  @extended @admin @sequential @slow @full
  Scenario: Admin resets user password, user must change it
    Given I am logged in as admin
    Then I should be redirected to the dashboard
    And I should see admin navigation options
    When I navigate to the user management page
    Then I should not see edit or delete options for my own admin account
    When I click the "Create New User" button
    And I enter a unique test user email
    And I enter "UserPass123@" as user password
    And I enter "Test User" as user display name
    And I set user role to "user"
    And I click the "Create User" button
    Then I should see a success message "User created successfully"
    And the created user should appear in the user list
    # Now reset the user's password
    When I click reset password for the created user
    And I confirm the password reset
    Then I should see a success message "Password reset successfully"
    And the created user should require password change on next login
    # Test password change requirement
    When I log out of the admin account
    And I am on the login page
    And I login with the created user email
    And I enter the temporary password
    And I click the login button
    Then I should be redirected to the password change page
    And I should see a message "Password change required"
    When I enter the temporary password as current password
    And I enter "NewUserPassword123#" as new password
    And I enter "NewUserPassword123#" as confirm password
    And I click the change password button
    Then I should see a success message "Password changed successfully"
    And I should be redirected to the dashboard
    # Cleanup: Admin logs back in and deletes the test user
    When I click the logout button
    And I am on the login page
    And I enter admin credentials
    And I click the login button
    And I navigate to the user management page
    And I delete the created user
    And I confirm the deletion
    Then I should see a success message "User deleted successfully"
    And the deleted user should not appear in the user list