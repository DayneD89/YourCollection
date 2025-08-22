@frontend @extended @error @slow @full
Feature: Error Handling and Resilience
  As a user of the application
  I want graceful error handling when things go wrong
  So that I receive helpful feedback and can continue using the application

  @extended @error @auth @parallel @slow @full
  Scenario: Login form handles API server unavailable
    Given I am on the login page
    And the API server is unavailable
    When I enter valid credentials and click login
    Then I should see a network error message
    And I should remain on the login page
    And the form should remain functional for retry

  @extended @error @survey @parallel @slow @full
  Scenario: Survey form handles network timeout during submission
    Given I am logged in as a regular user
    And I am on the survey form page
    And I have filled out the complete survey form
    When I submit the form and a network timeout occurs
    Then I should see a timeout error message
    And my form data should be preserved
    And I should be able to retry the submission

  @extended @error @auth @parallel @slow @full
  Scenario: Password change handles server connection failure
    Given I am logged in with a weak password requiring change
    And I am on the password change page
    When the server becomes unavailable and I try to change my password
    Then I should see a clear error message about connectivity
    And the form should remain accessible for retry
    And my password data should not be lost

  @extended @error @parallel @slow @full
  Scenario: Invalid server responses are handled gracefully
    Given I am on the login page
    When the server returns malformed JSON responses
    Then I should see a generic error message
    And the application should not crash
    And the form should remain functional

  @extended @error @admin @sequential @slow @full
  Scenario: Server-side validation errors are displayed clearly
    Given I am logged in as admin
    And I am creating a new user
    When I submit user data that fails server validation
    Then I should see specific validation error messages
    And the form fields should highlight the problematic data
    And I should be able to correct and resubmit

  @extended @error @auth @parallel @slow @full
  Scenario: Expired token during form submission shows appropriate error
    Given I am logged in as a regular user
    And my session token has expired
    When I try to submit the survey form
    Then I should see an authentication error message
    And I should be given the option to re-login
    And my form data should be preserved if possible

  @extended @error @parallel @slow @full
  Scenario: API rate limiting is handled gracefully
    Given I am on the login page
    When I exceed the API rate limit with multiple rapid requests
    Then I should see a rate limit error message
    And I should be informed about the wait time
    And the form should automatically become available again

  @extended @error @admin @parallel @slow @full
  Scenario: Admin user list handles partial loading failures
    Given I am logged in as admin
    And I am on the user management page
    When some user data fails to load due to server issues
    Then I should see which data loaded successfully
    And I should see a clear error for failed data
    And I should have an option to retry loading the failed data

  @extended @error @parallel @slow @full
  Scenario: Application recovers from temporary network issues
    Given I am using the application normally
    When I experience a temporary network disconnection
    And the network reconnects
    Then the application should automatically recover
    And I should be able to continue my work
    And any pending operations should be retried if possible