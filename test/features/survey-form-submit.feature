@frontend @core @survey @fast @full
Feature: Survey Form Submission
  As a logged-in user
  I want to submit the complete survey form
  So that my information is collected for party purposes

  @core @survey @sequential @slow @full
  Scenario: Complete form submission works correctly
    Given I have a test user with strong password "UserPass123@"
    When I login with the test user credentials
    Then I should be redirected to the dashboard
    When I click the "Start Survey" button
    Then I should see the survey form page
    When I fill field "Full Name" with value "John Doe"
    And I fill field "Address" with value "123 Main Street"
    And I fill field "Phone Number" with value "555-0123"
    And I fill field "Email Address" with value "john@example.com"
    And I set the slider field to value 8
    And I check the newsletter checkbox
    And I click the submit button
    Then I should see a success message indicating the form was submitted
    And the form should be cleared after successful submission

  @core @survey @parallel @fast @full
  Scenario: Form refresh/clear functionality works
    Given I have a test user with strong password "UserPass123@"
    When I login with the test user credentials
    Then I should be redirected to the dashboard
    When I click the "Start Survey" button
    Then I should see the survey form page
    When I fill field "Full Name" with value "Test User"
    And I fill field "Address" with value "Test Address"
    And I click the refresh button
    Then all form fields should be cleared
    And the form should be ready for new input