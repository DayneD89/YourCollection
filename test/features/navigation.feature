@frontend @core @ui @fast @full
Feature: Home Page Navigation and Routing
  As a user accessing the application
  I want to be automatically directed to the appropriate page
  So that I have a smooth experience based on my authentication status

  @core @ui @parallel @fast @full
  Scenario: Unauthenticated user is redirected from home page to login
    Given I am not logged in
    When I visit the home page at "/"
    Then I should see a loading message briefly
    And I should be automatically redirected to the login page
    And I should see the login form
    And the URL should be "/login"

  @core @ui @parallel @fast @full
  Scenario: Authenticated regular user is redirected from home page to dashboard
    Given I am logged in as a regular user
    When I visit the home page at "/"
    Then I should see a loading message briefly
    And I should be automatically redirected to the dashboard page
    And I should see the user dashboard
    And the URL should be "/dashboard"

  @core @ui @parallel @fast @full
  Scenario: Authenticated admin user is redirected from home page to dashboard
    Given I am logged in as admin
    When I visit the home page at "/"
    Then I should see a loading message briefly
    And I should be automatically redirected to the dashboard page
    And I should see the admin dashboard
    And the URL should be "/dashboard"

  @core @ui @parallel @fast @full @report-error
  Scenario: Loading state is shown during home page redirect
    Given I am not logged in
    When I visit the home page at "/"
    Then I should see "Loading..." text
    And the loading state should be visible for a brief moment
    And then I should be redirected to the appropriate page

  @core @ui @parallel @fast @full
  Scenario: Authenticated user visiting login page is redirected to dashboard
    Given I am logged in as a regular user
    When I try to visit the login page directly
    Then I should be automatically redirected to the dashboard
    And I should not see the login form

  @extended @ui @parallel @slow @full @report-error
  Scenario: Browser back button works correctly after authentication redirect
    Given I am not logged in
    And I visit the home page and get redirected to login
    When I login successfully and get redirected to dashboard
    And I click the browser back button
    Then I should remain on the dashboard page
    And I should not be sent back to the login page

  @extended @ui @security @parallel @fast @full
  Scenario: Bookmarked protected pages redirect unauthenticated users
    Given I am not logged in
    And I have a bookmark to "/dashboard"
    When I visit the bookmarked URL
    Then I should be redirected to the login page
    And after successful login I should be redirected to the original dashboard URL