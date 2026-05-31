## Name MP-07 - Login attempt with empty password

## Priority
High

## Type
Negative

## Steps

1. Open the SauceDemo login page.
2. Enter a valid username (standard_user) in the Username field.
3. Leave the Password field empty.
4. Click Login.

## Expected Result

Login fails. An error message is displayed stating the password is required (e.g., 'Epic sadface: Password is required'). User remains on the login page and no session is created.
