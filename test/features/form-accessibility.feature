@frontend @core @survey @fast @full
Feature: Form Accessibility Compliance
  As a user with accessibility needs
  I want form components to meet accessibility standards
  So that I can use the form regardless of my abilities

  Background:
    Given I am logged in as a regular user
    And I am on the survey form page

  @core @survey @ui @parallel @fast @full
  Scenario: Form components meet accessibility requirements
    Given the survey form has loaded
    Then all form fields should have proper labels
    And all fields should be accessible via screen reader
    And error messages should be announced by screen reader
    And keyboard navigation should be logical and complete
    And color contrast should meet accessibility standards