@frontend @core @admin @fast @full
Feature: Admin User Deletion
  As an admin
  I want to delete users
  So that I can remove unnecessary accounts

  @smoke @admin @sequential @fast @full
  Scenario: Admin can delete a user
    Given I am logged in as admin
    And a test user exists in the system
    When I delete the test user
    Then the user should be removed from the system
    And the user should not appear in the user list

  @core @admin @security @parallel @fast @full
  Scenario: User deletion requires confirmation
    Given I am logged in as admin
    And a test user exists in the system
    When I attempt to delete the test user
    Then I should see a confirmation dialog
    When I cancel the deletion
    Then the user should remain in the system

  @core @admin @ui @sequential @fast @full
  Scenario: User deletion shows proper feedback
    Given I am logged in as admin
    And a test user exists in the system
    When I delete the test user
    Then I should see loading indication during deletion
    And I should see success feedback when complete