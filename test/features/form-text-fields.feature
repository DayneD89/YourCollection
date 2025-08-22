@frontend @core @survey @fast @full
Feature: Text Field Component Validation
  As a user interacting with text input fields
  I want text fields to handle edge cases correctly
  So that I can provide reliable text data

  Background:
    Given I am logged in as a regular user
    And I am on the survey form page

  @core @survey @parallel @fast @full
  Scenario: Text field handles very long input gracefully
    Given the survey form has loaded
    When I enter a very long text string (500+ characters) in "Full Name"
    Then the field should accept the input
    And the UI should not break or overflow
    And the form should be submittable
    And scrolling should work properly if needed

  @core @survey @parallel @fast @full
  Scenario: Text field handles special characters and unicode
    Given the survey form has loaded
    When I enter special characters "àáâãäåæçèé!@#$%^&*()" in "Full Name"
    Then the field should accept all characters
    And the display should render correctly
    And form submission should preserve the characters

  @core @survey @ui @parallel @fast @full
  Scenario: Form field keyboard navigation and focus management
    Given the survey form has loaded
    When I use keyboard navigation (Tab key) through the form
    Then focus should move logically through all fields
    And each field should show proper focus indicators
    And I should be able to complete the entire form using only keyboard
    And form submission should work with keyboard (Enter key)