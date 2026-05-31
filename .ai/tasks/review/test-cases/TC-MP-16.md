## Name MP-16 - Attempt login with SQL/command injection strings

## Priority
High

## Type
Edge Case

## Steps

1. Open the SauceDemo login page
2. Enter username containing SQL injection pattern (e.g., "' OR '1'='1")
3. Enter password containing SQL injection pattern (e.g., "' OR '1'='1")
4. Click the Login button

## Expected Result

Application treats input as data and does not execute commands. Authentication fails with a generic authentication error and no sensitive information or stack traces are exposed. No change in backend data/state.
