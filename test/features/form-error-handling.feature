@frontend @core @survey @fast @full
Feature: Form Error Handling and Data Preservation
  As a user interacting with forms
  I want my data preserved during errors and proper validation feedback
  So that I don't lose my input and understand what needs to be corrected

  Background:
    Given I am logged in as a regular user
    And I am on the survey form page

  @core @survey @error @parallel @fast @full
  Scenario: Form field data preservation during errors
    Given the survey form has loaded
    And I have filled out all form fields with valid data
    When a network error occurs during form submission
    Then all my form field data should be preserved
    And I should not need to re-enter any information
    And retrying submission should work with the preserved data

  @core @survey @ui @parallel @fast @full
  Scenario: Real-time field validation feedback
    Given the survey form has loaded
    When I interact with required fields:
      | Field | Test Input | Expected Feedback |
      | Full Name | Empty string | Required field indicator |
      | Address | Empty string | Required field indicator |
      | Party Support | Not set | Required slider indicator |
    Then validation feedback should appear immediately
    And feedback should clear when valid input is provided