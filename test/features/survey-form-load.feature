@frontend @core @survey @fast @full
Feature: Survey Form Loading
  As a logged-in user
  I want to see the survey form load correctly
  So that I can understand what information is being collected

  @core @survey @parallel @fast @full
  Scenario: Survey form displays correct structure from YAML
    Given I have a test user with strong password "UserPass123@"
    When I login with the test user credentials
    Then I should be redirected to the dashboard
    When I click the "Start Survey" button
    Then I should see the survey form page
    And I should see the form title "Party Collection Survey"
    And I should see the form description "Help us understand your preferences and gather information for our party collection."
    And I should see a text field for "Full Name" with placeholder "Enter your full name"
    And I should see a text field for "Address" with placeholder "Enter your address"
    And I should see a text field for "Phone Number" with placeholder "Enter your phone number"
    And I should see an email field for "Email Address" with placeholder "Enter your email address"
    And I should see a slider field for "How likely are you to support our party?" with range 0 to 10
    And I should see a checkbox for "Subscribe to newsletter?" with description "Receive updates about our party activities"

  @core @survey @parallel @fast @full
  Scenario: Form fields have correct validation requirements
    Given I have a test user with strong password "UserPass123@"
    When I login with the test user credentials
    Then I should be redirected to the dashboard
    When I click the "Start Survey" button
    Then I should see the survey form page
    And the form should display exactly 6 fields as defined in the YAML
    And the required fields should be marked as required
    And the slider should have minimum value 0 and maximum value 10
    And optional fields should not be marked as required