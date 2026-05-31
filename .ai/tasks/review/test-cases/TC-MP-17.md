## Name MP-17 - SQL injection attempt in username/password fields

## Priority
Medium

## Type
Edge

## Steps

1. 1. Open the login page.
2. 2. Enter a common SQL injection payload as username (e.g., "' OR '1'='1").
3. 3. Enter any password and click Login.
4. 4. Observe application behavior and error messages.

## Expected Result

Application does not authenticate using injection payloads. Login fails with invalid-credentials error. No database errors or stack traces are displayed. Input is safely handled (parameterized/escaped) and no security breach occurs.
