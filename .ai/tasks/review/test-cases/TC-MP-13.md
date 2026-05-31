## Name MP-13 - Very long credentials (excessively long username and password)

## Priority
Medium

## Type
Edge

## Steps

1. 1. Open the login page.
2. 2. Enter a very long username (e.g., 5000 characters of 'a').
3. 3. Enter a very long password (e.g., 5000 characters of 'b').
4. 4. Click Login.

## Expected Result

Application safely handles the input without crashing. Login fails with a clear invalid-credentials error (e.g., "Epic sadface: Username and password do not match any user in this service") or a validation error. No stack traces or sensitive information is exposed.
