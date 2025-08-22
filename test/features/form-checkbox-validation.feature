@frontend @core @survey @fast @full
Feature: Checkbox Field Component Validation
  As a user interacting with checkbox fields
  I want checkboxes to handle state management correctly
  So that I can provide accurate boolean choices

  Background:
    Given I am logged in as a regular user
    And I am on the survey form page

  @core @survey @parallel @fast @full
  Scenario: Checkbox field state management
    Given the survey form has loaded
    When I interact with the newsletter subscription checkbox:
      | Action | Expected State |
      | Initial load | Unchecked (false) |
      | Click once | Checked (true) |
      | Click twice | Unchecked (false) |
      | Space bar press | Toggles state |
      | Label click | Toggles state |
    Then each interaction should toggle the state correctly
    And the form data should reflect the current state