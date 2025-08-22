@frontend @core @survey @fast @full
Feature: Email Field Component Validation
  As a user interacting with email fields
  I want email validation to work correctly for all formats
  So that I can provide valid email addresses

  Background:
    Given I am logged in as a regular user
    And I am on the survey form page

  @core @survey @parallel @fast @full
  Scenario: Email field comprehensive format validation
    Given the survey form has loaded
    When I test various email formats:
      | Email Format | Should Be Valid |
      | user@domain.com | true |
      | user.name@domain.co.uk | true |
      | user+tag@domain.com | true |
      | invalid-email | false |
      | @domain.com | false |
      | user@.com | false |
      | user@domain | false |
    Then each email should be validated correctly
    And appropriate feedback should be shown for invalid formats

  @core @survey @ui @parallel @fast @full
  Scenario: Real-time email field validation feedback
    Given the survey form has loaded
    When I interact with required fields:
      | Field | Test Input | Expected Feedback |
      | Email | Empty string | Required field indicator |
      | Email | Invalid format | Format validation message |
    Then validation feedback should appear immediately
    And feedback should clear when valid input is provided