## Name MP-12 - Login with very long credentials (excessive length input)

## Priority
Medium

## Type
Edge

## Steps

1. 1. Open https://www.saucedemo.com/
2. 2. Enter Username: a string of 5000 'a' characters
3. 3. Enter Password: a string of 5000 'a' characters
4. 4. Click the Login button

## Expected Result

Application handles excessive input gracefully—either shows an appropriate validation/error message or rejects input without server crash. No server error (500) or unhandled exception should be observed; user remains on login page with meaningful feedback.
