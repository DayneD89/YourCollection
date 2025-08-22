@frontend @core @admin @fast @full
Feature: Admin Password Reset
  As an admin
  I want to reset user passwords
  So that I can help users regain access

  @core @admin @sequential @fast @full
  Scenario: Admin can reset a user password
    Given I am logged in as admin
    And a test user exists in the system
    When I reset the test user's password
    Then a new temporary password should be generated
    And I should see the temporary password displayed

  @core @admin @ui @sequential @fast @full
  Scenario: Password reset shows proper feedback
    Given I am logged in as admin
    And a test user exists in the system
    When I reset the test user's password
    Then I should see loading indication during reset
    And I should see success feedback with the new password