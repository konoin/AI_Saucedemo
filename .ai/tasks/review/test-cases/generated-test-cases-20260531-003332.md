Assumptions (please confirm or update before test execution)
- System accepts 12-hour time format with seconds: hh:mm:ss am/pm (seconds are required).
- Hour range: 1–12 (leading zero allowed; single-digit hours allowed).
- Minute and second ranges: 0–59 (leading zeros allowed; single-digit allowed but must be numeric).
- Meridiem can be case-insensitive (am/AM/Am/PM/...); space between time and meridiem is optional.
- Leading/trailing whitespace will be trimmed.
- On successful validation the system stores/translates to 24-hour format (expected shown where applicable).
- Invalid formats or out-of-range values show a clear validation error and reject the input.

If any assumption is incorrect (e.g., seconds optional, support for “a.m.”), tell me and I’ll update the tests.

Positive tests
- MP-01 — Valid canonical input
  - Input: "12:32:46 am"
  - Steps: Enter the value and submit.
  - Expected: Accepted. Stored/converted value = "00:32:46".

- MP-02 — Typical PM time
  - Input: "01:05:09 pm"
  - Steps: Enter and submit.
  - Expected: Accepted. Stored = "13:05:09".

- MP-03 — Uppercase meridiem
  - Input: "11:59:59 PM"
  - Steps: Enter and submit.
  - Expected: Accepted. Stored = "23:59:59".

- MP-04 — Single-digit hour (no leading zero)
  - Input: "7:04:03 pm"
  - Steps: Enter and submit.
  - Expected: Accepted. Stored = "19:04:03".

- MP-05 — Mixed-case meridiem
  - Input: "03:02:01 Am"
  - Steps: Enter and submit.
  - Expected: Accepted. Stored = "03:02:01".

- MP-06 — No space before meridiem
  - Input: "09:09:09am"
  - Steps: Enter and submit.
  - Expected: Accepted (space optional). Stored = "09:09:09".

- MP-07 — Leading and trailing whitespace
  - Input: " 12:32:46 am "
  - Steps: Enter and submit.
  - Expected: Accepted after trimming. Stored = "00:32:46".

- MP-08 — Another valid PM with leading zero
  - Input: "08:30:00 PM"
  - Steps: Enter and submit.
  - Expected: Accepted. Stored = "20:30:00".

Negative tests
- MP-09 — Hour out of 12-hour range (>12)
  - Input: "13:00:00 pm"
  - Steps: Enter and submit.
  - Expected: Rejected. Validation error: "Hour must be between 1 and 12."

- MP-10 — Hour '00' invalid in 12-hour format
  - Input: "00:15:30 am"
  - Steps: Enter and submit.
  - Expected: Rejected. Validation error: "Hour must be between 1 and 12."

- MP-11 — Minute out of range (60)
  - Input: "12:60:00 am"
  - Steps: Enter and submit.
  - Expected: Rejected. Validation error: "Minutes must be between 0 and 59."

- MP-12 — Second out of range (60)
  - Input: "11:59:60 pm"
  - Steps: Enter and submit.
  - Expected: Rejected. Validation error: "Seconds must be between 0 and 59." (unless leap-second supported — clarify if so)

- MP-13 — Missing seconds (if seconds are required)
  - Input: "11:30 pm"
  - Steps: Enter and submit.
  - Expected: Rejected. Validation error: "Time must include hours, minutes and seconds."

- MP-14 — Non-numeric time components
  - Input: "ab:cd:ef am"
  - Steps: Enter and submit.
  - Expected: Rejected. Validation error: "Hours, minutes and seconds must be numeric."

- MP-15 — Invalid meridiem token
  - Input: "11:30:30 xm"
  - Steps: Enter and submit.
  - Expected: Rejected. Validation error: "Meridiem must be 'am' or 'pm'."

- MP-16 — Wrong separators
  - Input: "11-30-30 am"
  - Steps: Enter and submit.
  - Expected: Rejected. Validation error: "Time must use ':' as separator."

- MP-17 — Empty input
  - Input: ""
  - Steps: Submit without entering time.
  - Expected: Rejected. Validation error: "Time is required."

- MP-18 — No separators / compact numeric string
  - Input: "123456"
  - Steps: Enter and submit.
  - Expected: Rejected. Validation error: "Invalid time format. Expected hh:mm:ss am/pm."

Edge cases
- MP-19 — Midnight canonical
  - Input: "12:00:00 am"
  - Steps: Enter and submit.
  - Expected: Accepted. Stored/converted value = "00:00:00". (Verify special-case handling for 12 am)

- MP-20 — Noon canonical
  - Input: "12:00:00 pm"
  - Steps: Enter and submit.
  - Expected: Accepted. Stored/converted value = "12:00:00". (Verify special-case handling for 12 pm)

- MP-21 — Last second of day
  - Input: "11:59:59 pm"
  - Steps: Enter and submit.
  - Expected: Accepted. Stored = "23:59:59". (Boundary of 24-hour limit)

- MP-22 — Single-digit minute/second without leading zeros
  - Input: "1:2:3 pm"
  - Steps: Enter and submit.
  - Expected: Accepted and normalized to "13:02:03" (if system supports parsing without leading zeros). If system requires two-digit components, expect rejection — clarify requirement.

- MP-23 — Meridiem with punctuation (local variations)
  - Input: "12:32:46 a.m."
  - Steps: Enter and submit.
  - Expected: If system is strict: Rejected (invalid meridiem). If system supports localized punctuation: Accepted and stored = "00:32:46". (Confirm policy for localized formats)

- MP-24 — Very long/garbage input to test parser robustness
  - Input: "   12:32:46 am<script>alert(1)</script>   "
  - Steps: Enter and submit.
  - Expected: Rejected or sanitized. No code execution; system must treat as invalid input and return validation error. Verify no injection is possible (security check).

Notes / next actions
- Confirm whether seconds are required or optional; update positive/negative tests accordingly.
- Confirm acceptance of punctuation in meridiem (e.g., "a.m."), and whether single-digit minute/second is allowed.
- If system supports multiple input modes (picker vs free-text), repeat relevant tests for each mode (picker should prevent invalid inputs; free-text needs validation).
- Consider adding automated test scripts for normalization and storage checks (verify database stored value, displayed value, and any API payloads).

If you confirm or change any assumptions, I will update the test set and add expected error messages (exact wording) and test data for automated test scripts.