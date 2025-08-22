@frontend @core @survey @fast @full
Feature: Slider Field Component Validation
  As a user interacting with slider fields
  I want sliders to handle boundary values and interactions correctly
  So that I can provide accurate numeric ratings

  Background:
    Given I am logged in as a regular user
    And I am on the survey form page

  @core @survey @parallel @fast @full
  Scenario: Slider field boundary value testing
    Given the survey form has loaded
    When I interact with the party support slider:
      | Action | Expected Result |
      | Set to minimum (0) | Slider shows 0, form accepts value |
      | Set to maximum (10) | Slider shows 10, form accepts value |
      | Try to drag below 0 | Slider stays at 0 |
      | Try to drag above 10 | Slider stays at 10 |
      | Use keyboard arrows | Slider responds correctly |
    Then all slider interactions should work properly
    And the value should be accurately reflected in form data

  @core @survey @ui @parallel @fast @full
  Scenario: Slider field displays value feedback
    Given the survey form has loaded
    When I move the party support slider to different positions
    Then I should see the current numeric value displayed
    And the value should update in real-time as I drag
    And the visual position should match the numeric value