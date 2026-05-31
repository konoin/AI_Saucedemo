## Name MP-16 - Case sensitivity in username and password

## Priority
Low

## Type
Edge

## Steps

1. 1. Open https://www.saucedemo.com/
2. 2. Enter Username: STANDARD_user (altered case)
3. 3. Enter Password: SECRET_SAUCE (altered case)
4. 4. Click the Login button

## Expected Result

Authentication respects case sensitivity rules. Typically username/password are case-sensitive; login should fail if case doesn't match stored credentials. If case-insensitive behavior is expected by spec, it should succeed. No crashes and a clear message is shown on failure.
