@frontend @core @survey @fast @full
Feature: Survey Form Basic Functionality
  As a logged-in user
  I want to access and use the survey form
  So that I can submit my information

  Background:
    Given I am logged in as a regular user

  @core @survey @parallel @fast @full
  Scenario: Survey form loads from YAML configuration
    When I navigate to the survey form
    Then I should see the form title and description
    And I should see all required form fields
    And the form should be ready for input

  @core @survey @parallel @fast @full
  Scenario: All form fields are present and functional
    Given I am on the survey form
    Then I should see a text field for "Full Name"
    And I should see a text field for "Address"
    And I should see an email field for "Email Address"
    And I should see a slider for party support
    And I should see a newsletter checkbox

  @core @survey @ui @parallel @fast @full
  Scenario: Form fields have proper labels and accessibility
    Given I am on the survey form
    Then all form fields should have proper labels
    And all fields should be accessible via keyboard navigation