@frontend @core @survey @fast @full
Feature: Survey Form Validation
  As a system
  I want to validate form inputs
  So that only valid data is submitted

  @core @survey @parallel @fast @full
  Scenario: Required field validation works correctly
    Given I have a test user with strong password "UserPass123@"
    When I login with the test user credentials
    Then I should be redirected to the dashboard
    When I click the "Start Survey" button
    Then I should see the survey form page
    When I click the submit button without filling required fields
    Then I should see validation errors for required fields
    And I should see an error message for "Full Name" field
    And I should see an error message for "Address" field
    And I should see an error message for party support slider

  @core @survey @parallel @fast @full
  Scenario: Email format validation works correctly
    Given I have a test user with strong password "UserPass123@"
    When I login with the test user credentials
    Then I should be redirected to the dashboard
    When I click the "Start Survey" button
    Then I should see the survey form page
    When I fill field "Full Name" with value "Jane Doe"
    And I fill field "Address" with value "456 Oak Ave, Somewhere"
    And I fill field "Email Address" with value "invalid-email-format"
    And I set the slider field to value 5
    And I click the submit button
    Then I should see a validation error for invalid email format
    And the form should not be submitted