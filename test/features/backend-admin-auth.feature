@backend @auth @admin @core @fast @full
Feature: Backend Admin Authentication
  As an administrator
  I want to authenticate with the backend API
  So that I can perform administrative operations

  @smoke @backend @auth @admin @fast @full
  Scenario: Admin authentication with strong password succeeds
    Given the backend API is running
    When I authenticate as admin with strong password
    Then the authentication should succeed
    And I should receive a valid admin token
    And the token should not require password change

  @backend @auth @admin @security @fast @full
  Scenario: Admin authentication with weak password triggers change requirement
    Given the backend API is running
    And the admin has a weak password
    When I authenticate as admin with weak password
    Then the authentication should succeed
    But I should be required to change password
    And I should receive password change requirements