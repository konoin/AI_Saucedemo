## Name MP-06 - Login attempt with empty username

## Priority
High

## Type
Negative

## Steps

1. Open the SauceDemo login page.
2. Leave the Username field empty.
3. Enter a valid password (secret_sauce) in the Password field.
4. Click Login.

## Expected Result

Login fails. An error message is displayed stating the username is required (e.g., 'Epic sadface: Username is required'). User remains on the login page and no session is created.
