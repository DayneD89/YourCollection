@frontend @core @survey @fast @full
Feature: Survey Form Submission
  As a logged-in user
  I want to submit survey data
  So that my information is recorded

  Background:
    Given I am logged in as a regular user
    And I am on the survey form

  @core @survey @sequential @fast @full
  Scenario: Valid form submission works
    When I fill out all required fields with valid data
    And I click the submit button
    Then the form should be submitted successfully
    And I should see confirmation feedback

  @core @survey @parallel @fast @full
  Scenario: Form validates required fields
    When I try to submit without filling required fields
    Then I should see validation errors
    And the form should not be submitted

  @core @survey @parallel @fast @full
  Scenario: Email field validates format
    When I enter an invalid email format
    And I try to submit the form
    Then I should see email validation errors