## Name MP-10 - Login attempt with invalid password

## Priority
High

## Type
Negative

## Steps

1. Open the SauceDemo login page.
2. Enter a valid username (standard_user) in the Username field.
3. Enter an invalid password (e.g., wrong_password) in the Password field.
4. Click Login.

## Expected Result

Login fails. Error message indicates credentials do not match any user (e.g., 'Epic sadface: Username and password do not match any user in this service'). No session is created.
