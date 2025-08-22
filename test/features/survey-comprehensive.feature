@frontend @survey @extended @integration @full
Feature: Survey Form YAML-Driven Dynamic Forms
  As a logged-in user
  I want to fill out a survey form that is generated from YAML configuration
  So that I can provide information for party campaigning purposes

  Background:
    Given I am on the survey form page as a logged-in user

  @smoke @parallel @fast @full
  Scenario: Survey form loads correctly from YAML configuration
    When the survey form loads
    Then I should see the form title "Party Collection Survey"
    And I should see the form description "Help us understand your preferences and gather information for our party collection."
    And I should see a text field for "Full Name" with placeholder "Enter your full name"
    And I should see a text field for "Address" with placeholder "Enter your address"
    And I should see a text field for "Phone Number" with placeholder "Enter your phone number"
    And I should see an email field for "Email Address" with placeholder "Enter your email address"
    And I should see a slider field for "How likely are you to support our party?" with range 0 to 10
    And I should see a checkbox for "Subscribe to newsletter?" with description "Receive updates about our party activities"

  @smoke @sequential @fast @full
  Scenario: User can fill out and submit the complete survey form
    When the survey form loads
    And I fill in "Full Name" with "John Doe"
    And I fill in "Address" with "123 Main St, Anytown"
    And I fill in "Phone Number" with "555-0123"
    And I fill in "Email Address" with "john.doe@example.com"
    And I set the slider "How likely are you to support our party?" to 8
    And I check the "Subscribe to newsletter?" checkbox
    And I click the submit button
    Then I should see a success message indicating the form was submitted
    And the form should be cleared after successful submission

  @smoke @parallel @fast @full
  Scenario: Form validation works for required fields
    When the survey form loads
    And I click the submit button without filling required fields
    Then I should see validation errors for required fields
    And I should see an error message for "Full Name" field
    And I should see an error message for "Address" field
    And I should see an error message for party support slider

  @core @parallel @fast @full
  Scenario: Email field validates email format
    When the survey form loads
    And I fill in "Full Name" with "Jane Doe"
    And I fill in "Address" with "456 Oak Ave, Somewhere"
    And I fill in "Email Address" with "invalid-email-format"
    And I set the slider "How likely are you to support our party?" to 5
    And I click the submit button
    Then I should see a validation error for invalid email format
    And the form should not be submitted

  @core @parallel @fast @full
  Scenario: User can refresh/clear the form
    When the survey form loads
    And I fill in "Full Name" with "Test User"
    And I fill in "Address" with "Test Address"
    And I click the refresh button
    Then all form fields should be cleared
    And the form should be ready for new input

  @core @parallel @fast @full
  Scenario: Form fields match exactly what is defined in YAML config
    When the survey form loads
    Then the form should display exactly 6 fields as defined in the YAML
    And the required fields should be marked as required
    And the slider should have minimum value 0 and maximum value 10
    And the sensitive field "party_support" should be properly handled
    And optional fields should not be marked as required

  @extended @parallel @fast @full
  Scenario: Appropriate error handling for missing YAML config
    Given the YAML configuration is missing or invalid
    When I try to access the survey form with configuration error
    Then I should see an appropriate error message about configuration issues
    And I should not see a broken or empty form

  @smoke @parallel @fast @full
  Scenario: Unauthenticated users cannot access survey form
    Given I am not logged in
    When I try to access the survey form page
    Then I should see an authentication required message
    And I should be redirected to login or see login prompt

  @extended @parallel @fast @full
  Scenario: Network error handling works correctly
    # Fill out the form completely
    When I fill field "Full Name" with value "John Doe"
    And I fill field "Address" with value "123 Main Street"
    And I fill field "Phone Number" with value "555-0123"
    And I fill field "Email Address" with value "john@example.com"
    And I set the slider field to value 7
    And I check the newsletter checkbox
    # Simulate network error during submission
    When a network error occurs during form submission
    And I click the submit button
    Then I should see appropriate network error message
    And my form data should be preserved for retry
    And the form should remain functional