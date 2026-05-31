## Name MP-09 - Login attempt with invalid username

## Priority
Medium

## Type
Negative

## Steps

1. 1. Open the login page.
2. 2. Enter an invalid/non-existent username (e.g., invalid_user).
3. 3. Enter a valid password (secret_sauce).
4. 4. Click Login.

## Expected Result

Login fails. Displayed error message: "Epic sadface: Username and password do not match any user in this service" (or equivalent invalid-credentials error). User remains on the login page.
