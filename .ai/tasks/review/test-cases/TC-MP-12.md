## Name MP-12 - Login with very long credentials (extremely long username and/or password)

## Priority
Medium

## Type
Edge Case

## Steps

1. Open the SauceDemo login page
2. Enter a very long username (e.g., 5000 characters)
3. Enter a very long password (e.g., 5000 characters)
4. Click the Login button

## Expected Result

Application handles input gracefully without crashing. One of: input is truncated safely, validation error is shown, or authentication fails with a clear error message. No server error (5xx) or UI breakage should occur. Boundaries/limits should be enforced.
