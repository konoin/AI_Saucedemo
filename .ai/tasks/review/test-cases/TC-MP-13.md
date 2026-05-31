## Name MP-13 - Login with very long credentials

## Priority
Medium

## Type
Edge

## Steps

1. Open the SauceDemo login page.
2. Enter an extremely long username (e.g., 5000 'a' characters).
3. Enter an extremely long password (e.g., 5000 'b' characters).
4. Click Login.

## Expected Result

Application handles input without crashing. Login fails with a clear, user-friendly message (likely invalid credentials). No sensitive errors or stack traces are displayed. Input does not cause performance degradation or client-side crash.
