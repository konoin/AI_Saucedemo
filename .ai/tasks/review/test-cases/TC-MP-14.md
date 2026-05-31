## Name MP-14 - Credentials with leading and trailing whitespace

## Priority
Medium

## Type
Edge

## Steps

1. 1. Navigate to https://www.saucedemo.com/
2. 2. In Username field enter: " standard_user " (leading and trailing spaces around correct username).
3. 3. In Password field enter: " secret_sauce " (leading and trailing spaces around correct password).
4. 4. Click Login.

## Expected Result

Recommended behavior: application trims leading/trailing whitespace and authenticates the user. If the application trims, login succeeds and user is redirected to Inventory. If the application does not trim (implementation-defined), login fails with the invalid credentials message. Test should assert whichever behavior is the expected spec — ideally trimming is enforced.
