Assumptions (for test coverage):
- Requirement to validate a 12-hour clock time string in the exact format "hh:mm:ss AM/PM".
- Format rules:
  - Hours: two digits, 01–12.
  - Minutes: two digits, 00–59.
  - Seconds: two digits, 00–59.
  - Single space between seconds and AM/PM.
  - AM/PM is case-insensitive but must be exactly "AM" or "PM" (no dots).
  - No leading or trailing whitespace allowed.
- System under test (SUT): an input field that accepts a time string and a Validate/Submit action which returns Accept or Reject with an error message.

Test cases below include positive, negative, and edge cases covering parsing, validation, and boundary values.

# MP-01

## Title
Valid standard time (lowercase am)

## Objective
Verify that a correctly formatted time "12:25:01 am" is accepted.

## Preconditions
SUT reachable and ready. Input field empty.

## Steps
1. Enter "12:25:01 am" into the time input field.
2. Click Validate/Submit.

## Expected Result
Input is accepted. No validation error. Stored/parsed value corresponds to 00:25:01 (if converted to 24-hour internal representation) or success response.

## Priority
High

# MP-02

## Title
Valid standard time (uppercase AM)

## Objective
Verify that "12:25:01 AM" is accepted (case-insensitive AM/PM).

## Preconditions
SUT reachable and ready.

## Steps
1. Enter "12:25:01 AM".
2. Click Validate/Submit.

## Expected Result
Input is accepted. No validation error.

## Priority
High

# MP-03

## Title
Valid leading-zero hour (01)

## Objective
Verify that "01:05:09 pm" is accepted (hour = 01).

## Preconditions
SUT reachable and ready.

## Steps
1. Enter "01:05:09 pm".
2. Click Validate/Submit.

## Expected Result
Input is accepted and parsed as 13:05:09 (24-hour equivalent).

## Priority
High

# MP-04

## Title
Reject single-digit hour (no leading zero)

## Objective
Verify input without leading zero for hour ("1:05:09 pm") is rejected per format requirement.

## Preconditions
SUT reachable and ready.

## Steps
1. Enter "1:05:09 pm".
2. Click Validate/Submit.

## Expected Result
Validation fails. Error message indicates invalid format (hours must be two digits 01–12). Input rejected.

## Priority
Medium

# MP-05

## Title
Boundary: midnight representation (12:00:00 AM)

## Objective
Validate that "12:00:00 AM" is accepted and treated as midnight (00:00:00).

## Preconditions
SUT reachable and ready.

## Steps
1. Enter "12:00:00 AM".
2. Click Validate/Submit.

## Expected Result
Accepted. Parsed internal value equals 00:00:00 or success response indicating midnight.

## Priority
High

# MP-06

## Title
Boundary: noon representation (12:00:00 PM)

## Objective
Validate that "12:00:00 PM" is accepted and treated as noon (12:00:00).

## Preconditions
SUT reachable and ready.

## Steps
1. Enter "12:00:00 PM".
2. Click Validate/Submit.

## Expected Result
Accepted. Parsed internal value equals 12:00:00 or success response indicating noon.

## Priority
High

# MP-07

## Title
Maximum minute and second values

## Objective
Verify that "11:59:59 pm" (max minutes/seconds within valid range) is accepted.

## Preconditions
SUT reachable and ready.

## Steps
1. Enter "11:59:59 pm".
2. Click Validate/Submit.

## Expected Result
Accepted. Parsed as 23:59:59.

## Priority
High

# MP-08

## Title
Reject hour = 00 (invalid for 12-hour format)

## Objective
Verify that "00:15:30 am" is rejected.

## Preconditions
SUT reachable and ready.

## Steps
1. Enter "00:15:30 am".
2. Click Validate/Submit.

## Expected Result
Validation fails. Error indicates hour must be between 01 and 12. Input rejected.

## Priority
High

# MP-09

## Title
Reject hour > 12

## Objective
Verify that "13:00:00 pm" is rejected.

## Preconditions
SUT reachable and ready.

## Steps
1. Enter "13:00:00 pm".
2. Click Validate/Submit.

## Expected Result
Validation fails. Error indicates hour must be between 01 and 12.

## Priority
High

# MP-10

## Title
Reject minute = 60 (out-of-range)

## Objective
Verify that "10:60:00 am" is rejected because minutes must be 00–59.

## Preconditions
SUT reachable and ready.

## Steps
1. Enter "10:60:00 am".
2. Click Validate/Submit.

## Expected Result
Validation fails. Error indicates minutes out of range.

## Priority
High

# MP-11

## Title
Reject second = 60 (out-of-range)

## Objective
Verify that "10:59:60 am" is rejected because seconds must be 00–59.

## Preconditions
SUT reachable and ready.

## Steps
1. Enter "10:59:60 am".
2. Click Validate/Submit.

## Expected Result
Validation fails. Error indicates seconds out of range.

## Priority
High

# MP-12

## Title
Reject missing seconds

## Objective
Verify that "10:59 am" (no seconds) is rejected when seconds are mandatory.

## Preconditions
SUT reachable and ready.

## Steps
1. Enter "10:59 am".
2. Click Validate/Submit.

## Expected Result
Validation fails. Error indicates expected format hh:mm:ss AM/PM.

## Priority
Medium

# MP-13

## Title
Reject missing AM/PM

## Objective
Verify that "10:59:59" (no AM/PM) is rejected.

## Preconditions
SUT reachable and ready.

## Steps
1. Enter "10:59:59".
2. Click Validate/Submit.

## Expected Result
Validation fails. Error indicates AM/PM suffix required.

## Priority
High

# MP-14

## Title
Reject no space before AM/PM

## Objective
Verify that "10:59:59am" (no space) is rejected per strict format.

## Preconditions
SUT reachable and ready.

## Steps
1. Enter "10:59:59am".
2. Click Validate/Submit.

## Expected Result
Validation fails. Error indicates expected single space before AM/PM.

## Priority
Medium

# MP-15

## Title
Reject AM/PM with dots (a.m./p.m.)

## Objective
Verify that "10:59:59 a.m." is rejected when dots are not allowed.

## Preconditions
SUT reachable and ready.

## Steps
1. Enter "10:59:59 a.m.".
2. Click Validate/Submit.

## Expected Result
Validation fails. Error indicates invalid AM/PM value (only AM or PM allowed).

## Priority
Low

# MP-16

## Title
Reject leading/trailing whitespace

## Objective
Verify that " 12:25:01 am " (leading/trailing spaces) is rejected if trimming is not performed.

## Preconditions
SUT reachable and ready.

## Steps
1. Enter " 12:25:01 am " (with spaces at both ends).
2. Click Validate/Submit.

## Expected Result
Validation fails (or, if system requirement allows trimming, specifically test that trimming occurs). Under current strict assumption: rejected with error about format/whitespace.

## Priority
Medium

# MP-17

## Title
Reject non-numeric characters in time parts

## Objective
Verify that "1a:05:09 pm" is rejected.

## Preconditions
SUT reachable and ready.

## Steps
1. Enter "1a:05:09 pm".
2. Click Validate/Submit.

## Expected Result
Validation fails. Error indicates invalid numeric values in hour/minute/second.

## Priority
High

# MP-18

## Title
Reject wrong separators

## Objective
Verify that "12-25-01 am" is rejected (must use colons).

## Preconditions
SUT reachable and ready.

## Steps
1. Enter "12-25-01 am".
2. Click Validate/Submit.

## Expected Result
Validation fails. Error indicates invalid format; separators must be ":".

## Priority
Medium

# MP-19

## Title
Reject empty input

## Objective
Verify that empty string is rejected and appropriate validation message shown.

## Preconditions
SUT reachable and ready.

## Steps
1. Leave input blank.
2. Click Validate/Submit.

## Expected Result
Validation fails. Error indicates input required / empty value not allowed.

## Priority
High

# MP-20

## Title
Handle null input (API)

## Objective
For API/automated call, verify that null payload results in appropriate error (400/validation error).

## Preconditions
API reachable; prepare request without time field or with null.

## Steps
1. Call API/submit with null or missing time field.
2. Inspect response status and body.

## Expected Result
Service returns 4xx (e.g., 400) with validation message indicating required time field.

## Priority
High

# MP-21

## Title
Reject 24-hour formatted time

## Objective
Verify that "23:15:00" or "23:15:00 pm" is rejected (hours out-of-range for 12-hour schema).

## Preconditions
SUT reachable and ready.

## Steps
1. Enter "23:15:00".
2. Click Validate/Submit.
3. Enter "23:15:00 pm".
4. Click Validate/Submit.

## Expected Result
Validation fails for both. Error indicates invalid hour for 12-hour format.

## Priority
Medium

# MP-22

## Title
Reject time with timezone appended

## Objective
Verify that "12:25:01 am GMT" is rejected (extra tokens not allowed).

## Preconditions
SUT reachable and ready.

## Steps
1. Enter "12:25:01 am GMT".
2. Click Validate/Submit.

## Expected Result
Validation fails. Error indicates invalid format / unexpected characters after AM/PM.

## Priority
Low

# MP-23

## Title
Reject fullwidth/unicode digits

## Objective
Verify that "１２:２５:０１ am" (fullwidth Unicode digits) is rejected.

## Preconditions
SUT reachable and ready.

## Steps
1. Enter "１２:２５:０１ am".
2. Click Validate/Submit.

## Expected Result
Validation fails. Error indicates invalid characters / digits.

## Priority
Low

# MP-24

## Title
Reject multiple spaces between time and AM/PM

## Objective
Verify that "12:25:01  am" (two spaces) is rejected when exactly one space is required.

## Preconditions
SUT reachable and ready.

## Steps
1. Enter "12:25:01  am".
2. Click Validate/Submit.

## Expected Result
Validation fails. Error indicates format violation (exactly one space required).

## Priority
Low

# MP-25

## Title
Sanity: different valid AM/PM casing combinations

## Objective
Ensure casing variations like "07:07:07 Am", "07:07:07 pM" are accepted (case-insensitive).

## Preconditions
SUT reachable and ready.

## Steps
1. Enter "07:07:07 Am".
2. Click Validate/Submit.
3. Enter "07:07:07 pM".
4. Click Validate/Submit.

## Expected Result
Both inputs accepted. Parsing consistent with AM/PM semantics.

## Priority
Medium

Notes / Recommendations:
- If the requirement allows trimming of whitespace or single-digit hours, adjust the relevant test expected results accordingly and add tests to verify automatic trimming and normalization behavior.
- Include tests for localization if the application supports locale-specific formats (e.g., 24-hour input allowed).
- For API tests, include assertions on status codes and error codes/messages for failed validations.