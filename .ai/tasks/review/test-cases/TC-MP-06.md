## Name MP-06 - Login attempt with empty username

## Priority
High

## Type
Negative

## Steps

1. 1. Open the SauceDemo login page.
2. 2. Leave the username field empty.
3. 3. Enter a valid password (secret_sauce).
4. 4. Click Login.

## Expected Result

Login is blocked. Displayed error message: "Epic sadface: Username is required" (or equivalent required-username error). User remains on the login page and is not authenticated.
