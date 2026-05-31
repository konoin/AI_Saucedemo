## Name MP-13 - Login with special characters in credentials

## Priority
Medium

## Type
Edge

## Steps

1. 1. Open https://www.saucedemo.com/
2. 2. Enter Username: special!#$%^&*()_+[];'/{}|:"<>?
3. 3. Enter Password: special!#$%^&*()_+[];'/{}|:"<>?
4. 4. Click the Login button

## Expected Result

Application treats special characters as normal input—no injection occurs. If credentials are invalid, a generic authentication failure message is shown. No crashes, unexpected behavior, or leakage of special characters in UI. Input is safely handled and sanitized as required.
