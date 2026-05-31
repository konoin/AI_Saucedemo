## Name MP-09 - Login attempt with invalid username

## Priority
Medium

## Type
Negative

## Steps

1. 1. Navigate to the login page.
2. 2. Enter an invalid username (e.g., invalid_user) into the Username field.
3. 3. Enter a valid password (secret_sauce) into the Password field.
4. 4. Click the Login button.

## Expected Result

Login is rejected. An error message indicates credentials do not match any user (e.g., 'Epic sadface: Username and password do not match any user in this service'). No authenticated session is created.
