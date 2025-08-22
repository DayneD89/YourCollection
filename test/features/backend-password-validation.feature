@backend @auth @security @core @fast @full
Feature: Backend Password Strength Validation
  As a security-conscious system
  I want to validate password strength during login
  So that users are prompted to change weak passwords

  Background:
    Given the backend API is running
    And I have created test users with different password strengths

  @smoke @backend @auth @security @fast @full
  Scenario: Weak password login triggers password change requirement
    When I login with a user that has weak password
    Then the login should succeed
    But I should be required to change password
    And I should receive a list of password issues
    And the password issues should not be empty

  @backend @auth @security @fast @full
  Scenario: Strong password login allows normal access
    When I login with a user that has strong password
    Then the login should succeed
    And I should not be required to change password
    And I should receive a valid authentication token
    And I should be able to access protected resources