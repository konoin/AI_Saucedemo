## Name MP-09 - Login attempt with invalid username

## Priority
High

## Type
Negative

## Steps

1. Open the SauceDemo login page.
2. Enter an invalid username (e.g., invalid_user) in the Username field.
3. Enter a valid password (secret_sauce) in the Password field.
4. Click Login.

## Expected Result

Login fails. Error message indicates credentials do not match any user (e.g., 'Epic sadface: Username and password do not match any user in this service'). No session is created.
