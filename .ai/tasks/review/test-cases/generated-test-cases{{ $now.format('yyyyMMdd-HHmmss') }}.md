# MP-01

## Title
Valid 12-hour time with seconds ("12:18:25 am") is accepted and parsed

## Objective
Verify that the input "12:18:25 am" is accepted as a valid 12-hour clock time and correctly parsed/converted to 24-hour format (expected: 00:18:25).

## Preconditions
- Application UI or API endpoint that accepts time string in 12-hour format is available.
- No prior time value is set (fresh input).

## Steps
1. Open the time input field or call the API with payload containing time = "12:18:25 am".
2. Submit/save the input.

## Expected Result
- Input is accepted.
- No validation error is shown.
- Internal parsed/returned 24-hour value = "00:18:25".
- UI or API response confirms stored/returned value equals "00:18:25".

## Priority
High

---

# MP-02

## Title
Midnight boundary "12:00:00 am" parsed to "00:00:00"

## Objective
Verify "12:00:00 am" (midnight) is parsed to 24-hour "00:00:00".

## Preconditions
- Same as MP-01.

## Steps
1. Enter "12:00:00 am" and submit.

## Expected Result
- Accepted.
- Parsed 24-hour time = "00:00:00".

## Priority
High

---

# MP-03

## Title
Noon boundary "12:00:00 pm" parsed to "12:00:00"

## Objective
Verify "12:00:00 pm" is parsed to 24-hour "12:00:00" (noon).

## Preconditions
- Same as MP-01.

## Steps
1. Enter "12:00:00 pm" and submit.

## Expected Result
- Accepted.
- Parsed 24-hour time = "12:00:00".

## Priority
High

---

# MP-04

## Title
Afternoon time conversion ("01:00:00 pm" -> "13:00:00")

## Objective
Verify "01:00:00 pm" is parsed to "13:00:00".

## Preconditions
- Same as MP-01.

## Steps
1. Enter "01:00:00 pm" and submit.

## Expected Result
- Accepted.
- Parsed 24-hour time = "13:00:00".

## Priority
High

---

# MP-05

## Title
Lowercase/uppercase AM/PM variations accepted

## Objective
Verify that AM/PM casing variations are accepted (e.g., "12:18:25 AM", "12:18:25 am", "12:18:25 Am", "12:18:25 aM").

## Preconditions
- Same as MP-01.

## Steps
1. Enter "12:18:25 AM" and submit; record result.
2. Repeat with "12:18:25 am", "12:18:25 Am", "12:18:25 aM".

## Expected Result
- All variations are accepted and parsed to "00:18:25".
- No case-sensitive validation errors.

## Priority
Medium

---

# MP-06

## Title
Missing seconds when seconds are optional (e.g., "12:18 am")

## Objective
Verify behavior when seconds are omitted. (Two variants: seconds optional vs required.)

## Preconditions
- System specification: if seconds are optional, it should accept inputs without seconds; if required, it should reject. (Assumption: seconds are optional — test both expected behaviors documented.)

## Steps
1. Enter "12:18 am" and submit.
2. Observe validation/parse behavior.

## Expected Result
- If seconds are optional: input accepted, default seconds = "00", parsed value "00:18:00".
- If seconds are required: validation error indicating missing seconds.

## Priority
Medium

---

# MP-07

## Title
No space between time and meridiem ("12:18:25am")

## Objective
Verify whether input without space between time and "am/pm" is accepted.

## Preconditions
- Same as MP-01.

## Steps
1. Enter "12:18:25am" (no space) and submit.

## Expected Result
- Preferred: Accepted and parsed to "00:18:25".
- If spec requires a space: validation error specifying expected format.

## Priority
Medium

---

# MP-08

## Title
Leading/trailing whitespace handling

## Objective
Verify that leading and trailing spaces around the input are trimmed and accepted.

## Preconditions
- Same as MP-01.

## Steps
1. Enter "   12:18:25 am   " with leading/trailing spaces and submit.

## Expected Result
- Input is trimmed and accepted.
- Parsed 24-hour = "00:18:25".
- No validation error.

## Priority
Low

---

# MP-09

## Title
Missing AM/PM indicator

## Objective
Verify validation when AM/PM marker is missing (e.g., "12:18:25").

## Preconditions
- Same as MP-01.

## Steps
1. Enter "12:18:25" and submit.

## Expected Result
- If 12-hour format is mandatory with AM/PM: validation error indicating missing AM/PM.
- If system accepts 24-hour format: parse as "12:18:25" (12:18:25) and indicate acceptance. Expected behavior must match spec.

## Priority
High

---

# MP-10

## Title
Invalid hour value (>12) in 12-hour format ("13:00:00 am")

## Objective
Verify validation rejects hours outside 1-12 for 12-hour format.

## Preconditions
- Same as MP-01.

## Steps
1. Enter "13:00:00 am" and submit.

## Expected Result
- Validation error stating "Invalid hour" or "Hour must be between 1 and 12".
- Input not accepted.

## Priority
High

---

# MP-11

## Title
Hour zero ("00:10:00 am") in 12-hour format

## Objective
Verify validation rejects "00" hour in 12-hour format.

## Preconditions
- Same as MP-01.

## Steps
1. Enter "00:10:00 am" and submit.

## Expected Result
- Validation error indicating invalid hour (00 is not valid in 12-hour format).
- Input not accepted.

## Priority
High

---

# MP-12

## Title
Invalid minutes (>59) ("12:60:00 am")

## Objective
Verify validation rejects minute values outside 0-59.

## Preconditions
- Same as MP-01.

## Steps
1. Enter "12:60:00 am" and submit.

## Expected Result
- Validation error specifying invalid minute value.
- Input not accepted.

## Priority
High

---

# MP-13

## Title
Invalid seconds (>59) ("12:18:60 am")

## Objective
Verify validation rejects second values outside 0-59.

## Preconditions
- Same as MP-01.

## Steps
1. Enter "12:18:60 am" and submit.

## Expected Result
- Validation error specifying invalid seconds.
- Input not accepted.

## Priority
High

---

# MP-14

## Title
Non-numeric characters in time components ("ab:cd:ef am")

## Objective
Verify validation rejects inputs with non-numeric hour/minute/second components.

## Preconditions
- Same as MP-01.

## Steps
1. Enter "ab:cd:ef am" and submit.

## Expected Result
- Validation error indicating non-numeric time components.
- Input not accepted.

## Priority
High

---

# MP-15

## Title
Incorrect delimiters ("12-18-25 am" / "12.18.25 am")

## Objective
Verify validation rejects or normalizes other delimiters if not allowed.

## Preconditions
- Same as MP-01.

## Steps
1. Enter "12-18-25 am" and submit.
2. Enter "12.18.25 am" and submit.

## Expected Result
- If only ":" is allowed: validation error for incorrect format.
- If normalization allowed: accepted and parsed to "00:18:25".
- Behavior must follow spec.

## Priority
Medium

---

# MP-16

## Title
Multiple spaces between time and AM/PM ("12:18:25   am")

## Objective
Verify input with multiple spaces is trimmed/normalized or rejected per spec.

## Preconditions
- Same as MP-01.

## Steps
1. Enter "12:18:25   am" and submit.

## Expected Result
- Preferred: normalized and accepted; parsed to "00:18:25".
- If spec forbids: validation error indicating format violation.

## Priority
Low

---

# MP-17

## Title
Empty input / null value

## Objective
Verify the system behavior for empty string or null time values.

## Preconditions
- Same as MP-01.

## Steps
1. Submit with time = "" (empty).
2. Submit without the time field (null) via API.

## Expected Result
- If field required: validation error "Time is required".
- If optional: accepted and stored as null/default; UI indicates no time set.

## Priority
High

---

# MP-18

## Title
Leading zeros in hour/minute/second ("01:02:03 am")

## Objective
Verify that time components with leading zeros are accepted and parsed correctly.

## Preconditions
- Same as MP-01.

## Steps
1. Enter "01:02:03 am" and submit.

## Expected Result
- Accepted.
- Parsed 24-hour = "01:02:03".

## Priority
Medium

---

# MP-19

## Title
Input with additional text/suffix ("12:18:25 am PST", "12:18:25 am local")

## Objective
Verify system behavior when timezone or extra suffix text is present.

## Preconditions
- Same as MP-01.

## Steps
1. Enter "12:18:25 am PST" and submit.
2. Enter "12:18:25 am local" and submit.

## Expected Result
- If spec supports timezone suffix: parse time and apply timezone appropriately.
- If not: validation error indicating unexpected characters.
- Behavior must follow spec.

## Priority
Low

---

# MP-20

## Title
24-hour format input acceptance ("00:18:25", "23:45:10")

## Objective
Verify whether 24-hour formatted inputs are accepted when system primarily expects 12-hour format.

## Preconditions
- Same as MP-01.

## Steps
1. Enter "00:18:25" and submit.
2. Enter "23:45:10" and submit.

## Expected Result
- If system supports 24-hour input: accepted and parsed accordingly.
- If not supported: validation error asking for AM/PM or 12-hour format.

## Priority
Medium

---

# MP-21

## Title
Boundary seconds/minutes at zero and 59 ("12:00:00 am", "12:59:59 pm")

## Objective
Verify correct handling of edge seconds/minutes values 0 and 59.

## Preconditions
- Same as MP-01.

## Steps
1. Enter "12:00:00 am" and submit.
2. Enter "12:59:59 pm" and submit.

## Expected Result
- Both accepted and parsed correctly ("00:00:00" and "12:59:59" respectively).

## Priority
High

---

# MP-22

## Title
Very long input string / buffer overflow attempt

## Objective
Verify system handles excessively long input gracefully and is not vulnerable to buffer overflow.

## Preconditions
- Same as MP-01.

## Steps
1. Enter a very long string (e.g., 10,000 characters) into the time field and submit.

## Expected Result
- Input rejected or truncated per spec.
- System remains responsive; no crash.
- Proper validation error returned (e.g., "Invalid time format" or "Input too long").

## Priority
High

---

# MP-23

## Title
Localization/RTL and Unicode characters in input

## Objective
Verify system behavior when Unicode or RTL characters are included (e.g., Arabic digits, non-breaking space).

## Preconditions
- Same as MP-01.

## Steps
1. Enter time using localized digits (e.g., "١٢:١٨:٢٥ am") and submit.
2. Enter time with non-breaking space between time and am.

## Expected Result
- If localization supported: accepted and parsed appropriately.
- If not supported: validation error indicating unsupported characters.

## Priority
Low

---

Notes/Assumptions
- Several tests reference alternate expected behavior when specification does not define a behavior (e.g., whether seconds are required, whether 24-hour format allowed, delimiter normalization). Those tests should be executed against the agreed specification; update expected results accordingly.
- For API tests include both request payload and response verification (status code, error message, parsed value). For UI tests verify displayed value and any validation messages.
- Add backend/DB verification steps where applicable to ensure stored value matches parsed value.